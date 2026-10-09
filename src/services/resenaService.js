import supabase from './supabaseClient'
import tiposPorGusto from './tiposPorGusto'

/**
 * CONSTANTE DE TESTING: Cambiar a `true` para reducir tiempo de espera a 30 segundos
 * Cambiar a `false` para producción (12 horas)
 */
const TESTING_MODE = true // ← CAMBIAR AQUÍ para testing
const HORAS_ESPERA = TESTING_MODE ? 0.5 / 60 : 12 // 30 seg en testing, 12h en prod

/**
 * Mapea la categoría/tipo de un lugar a un gusto del usuario
 * @param {string|Array} categoria - La categoría del lugar (ej: 'park', 'restaurant', etc) o array de categorías
 * @returns {string|null} - El nombre del gusto (ej: 'Naturaleza y aire libre') o null
 */
export function mapearCategoriaAGusto(categoria) {
  if (!categoria) return null

  // Manejar arrays de categorías (de Geoapify)
  let categoriasAChecar = []
  if (Array.isArray(categoria)) {
    categoriasAChecar = categoria
  } else {
    categoriasAChecar = [String(categoria)]
  }

  // Normalizar todas las categorías
  const categoriasNormalizadas = categoriasAChecar.map(c =>
    String(c).normalize('NFC').trim().toLowerCase()
  )

  // Buscar coincidencia: iteramos por gusto y sus tipos
  for (const [gusto, tipos] of Object.entries(tiposPorGusto)) {
    for (const tipo of tipos) {
      const tipoNormalizado = tipo.normalize('NFC').toLowerCase()
      // Buscar coincidencia exacta o parcial (tipo contiene categoría o viceversa)
      if (
        categoriasNormalizadas.some(cat =>
          tipoNormalizado.includes(cat) || cat.includes(tipoNormalizado)
        )
      ) {
        return gusto
      }
    }
  }

  return null
}

/**
 * Obtiene todas las juntadas pasadas del usuario que aún no han sido reseñadas
 * @param {string} userId - ID del usuario
 * @param {boolean} soloMayores12h - Si true, solo retorna juntadas cuyo inicio fue hace más de 12h (o tiempo de testing)
 * @returns {Promise<{data, error}>}
 */
export async function getJuntadasSinResena(userId, soloMayores12h = true) {
  const now = new Date()
  
  // Construir la query
  let query = supabase
    .from('evento')
    .select(`
      id,
      nombre,
      descripcion,
      fecha_hora_inicio,
      fecha_hora_fin,
      lugar,
      id_lugar,
      lugar(
        id,
        nombre,
        tipo
      ),
      usuario_evento!inner(
        id_usuario,
        asistencia
      ),
      resena_juntada(
        id
      )
    `)
    .eq('usuario_evento.id_usuario', userId)
    .eq('usuario_evento.asistencia', 'voy')
    .lt('fecha_hora_inicio', now.toISOString())
    .order('fecha_hora_inicio', { ascending: false })

  const { data, error } = await query

  if (error) return { data: null, error }

  // Filtrar juntadas sin reseña
  let juntadas = (data || []).filter(
    evento => !evento.resena_juntada || evento.resena_juntada.length === 0
  )

  // Filtrar solo las que tienen más de HORAS_ESPERA de pasadas
  if (soloMayores12h) {
    const tiempoEspera = new Date(now.getTime() - HORAS_ESPERA * 60 * 60 * 1000)
    juntadas = juntadas.filter(evento => {
      const fechaInicio = new Date(evento.fecha_hora_inicio)
      return fechaInicio < tiempoEspera
    })
  }

  return { data: juntadas, error: null }
}

/**
 * Obtiene la próxima juntada que el usuario debe reseñar
 * @param {string} userId - ID del usuario
 * @returns {Promise<{data, error}>}
 */
export async function getProximaJuntadaAResena(userId) {
  const { data, error } = await getJuntadasSinResena(userId, true)

  if (error) return { data: null, error }

  const proxima = data && data.length > 0 ? data[0] : null
  return { data: proxima, error: null }
}

/**
 * Guarda la reseña de una juntada y actualiza los gustos del usuario
 * @param {string} userId - ID del usuario
 * @param {string} eventoId - ID del evento
 * @param {number} calificacion - Calificación de 1 a 5
 * @param {string} comentario - Comentario opcional
 * @returns {Promise<{data, error}>}
 */
export async function guardarResena(userId, eventoId, calificacion, comentario = '') {
  // Validar calificación
  if (!Number.isInteger(calificacion) || calificacion < 1 || calificacion > 5) {
    return {
      data: null,
      error: new Error('La calificación debe ser un número entre 1 y 5'),
    }
  }

  try {
    // 1. Obtener el evento con su lugar para saber la categoría
    const { data: evento, error: eventoError } = await supabase
      .from('evento')
      .select(`
        id,
        nombre,
        lugar(
          id,
          nombre,
          tipo
        )
      `)
      .eq('id', eventoId)
      .single()

    if (eventoError) throw eventoError
    if (!evento) throw new Error('Evento no encontrado')

    // 2. Guardar la reseña
    const { data: resena, error: resenaError } = await supabase
      .from('resena_juntada')
      .upsert(
        {
          id_usuario: userId,
          id_evento: eventoId,
          calificacion,
          comentario: comentario || null,
        },
        {
          onConflict: 'id_usuario,id_evento',
        }
      )
      .select()
      .single()

    if (resenaError) throw resenaError

    // 3. Actualizar gustos del usuario basado en la categoría y calificación
    if (evento.lugar) {
      const gusto = mapearCategoriaAGusto(evento.lugar.tipo)

      if (gusto) {
        // Obtener el ID del gusto por su nombre
        const { data: gustoData, error: gustoError } = await supabase
          .from('gusto')
          .select('id_gusto')
          .eq('nombre', gusto)
          .single()

        if (!gustoError && gustoData) {
          const idGusto = gustoData.id_gusto

          // Decidir si insertar o eliminar basado en la calificación
          if (calificacion >= 4) {
            // Calificación alta: insertar el gusto (o actualizar si ya existe)
            await supabase
              .from('usuario_gusto')
              .upsert(
                {
                  id_usuario: userId,
                  id_gusto: idGusto,
                },
                {
                  onConflict: 'id_usuario,id_gusto',
                }
              )
          } else if (calificacion <= 2) {
            // Calificación baja: eliminar el gusto si existe
            await supabase
              .from('usuario_gusto')
              .delete()
              .eq('id_usuario', userId)
              .eq('id_gusto', idGusto)
          }
          // Si es 3, no hacer nada (neutral)
        }
      }
    }

    return { data: resena, error: null }
  } catch (error) {
    return {
      data: null,
      error,
    }
  }
}

/**
 * Obtiene la reseña de una juntada específica
 * @param {string} userId - ID del usuario
 * @param {string} eventoId - ID del evento
 * @returns {Promise<{data, error}>}
 */
export async function getResena(userId, eventoId) {
  const { data, error } = await supabase
    .from('resena_juntada')
    .select('*')
    .eq('id_usuario', userId)
    .eq('id_evento', eventoId)
    .maybeSingle()

  return { data, error }
}