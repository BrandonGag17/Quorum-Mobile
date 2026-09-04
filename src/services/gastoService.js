import supabase from './supabaseClient'

// Campos que necesita la pantalla. "pagador" es un alias para la relación
// entre gasto.id_pagador y usuario.id.
const GASTO_SELECT = `
  id,
  id_evento,
  descripcion,
  monto,
  id_pagador,
  pagador:usuario (
    id,
    username,
    nombre,
    apellido,
    foto_perfil
  )
`

export async function getGastosByEventId(eventId) {
  if (!eventId) {
    return {
      data: [],
      error: {
        message: 'No se recibió el evento para consultar sus gastos',
      },
    }
  }

  const { data, error } = await supabase
    .from('gasto')
    .select(GASTO_SELECT)
    .eq('id_evento', eventId)

  if (error) {
    return { data: [], error }
  }

  // Supabase puede devolver columnas numeric como texto. Convertimos monto a
  // Number una sola vez para que las sumas de la pantalla sean predecibles.
  const gastos = (data || []).map((gasto) => ({
    ...gasto,
    monto: Number(gasto.monto),
  }))

  return {
    data: gastos,
    error: null,
  }
}

export async function getPersonasByEventId(eventId) {
  if (!eventId) {
    return {
      data: [],
      error: {
        message: 'No se recibió el evento para consultar sus integrantes',
      },
    }
  }
  const { data, error } = await supabase
    .from('usuario_evento')
    .select(`
    id_usuario,
    usuario (
      id,
      username,
      nombre,
      apellido,
      foto_perfil
    )
  `)
    .eq('id_evento', eventId)
    .eq('asistencia', 'voy')

  if (error) {
    return { data: [], error }
  }

  const personas = (data || [])
    .map((participacion) => participacion.usuario)
    .filter(Boolean)

  return {
    data: personas,
    error: null,
  }


}

export async function getHistorialGastosByEventId(eventId) {
  // Sin un evento de referencia no podemos saber a qué grupo pertenece el
  // historial que queremos consultar.
  if (!eventId) {
    return {
      data: [],
      error: {
        message: 'No se recibió el evento para consultar el historial',
      },
    }
  }

  // Paso 1: buscamos solamente el id del grupo de la juntada actual. El
  // historial estará formado por otras juntadas pertenecientes a ese grupo.
  const { data: eventoActual, error: errorEvento } = await supabase
    .from('evento')
    .select('id_grupo')
    .eq('id', eventId)
    .single()

  if (errorEvento) {
    return { data: [], error: errorEvento }
  }

  // Es una protección para evitar una segunda consulta sin un grupo válido.
  if (!eventoActual?.id_grupo) {
    return {
      data: [],
      error: {
        message: 'La juntada no tiene un grupo asociado',
      },
    }
  }

  // Paso 2: traemos las demás juntadas del grupo junto con sus gastos.
  // `gasto!inner` excluye los eventos sin gastos, porque no aportan nada al
  // historial. También obtenemos el pagador para poder mostrar sus avatares.
  const { data, error } = await supabase
    .from('evento')
    .select(`
      id,
      nombre,
      fecha_hora_inicio,
      gasto!inner (
        id,
        monto,
        id_pagador,
        pagador:usuario (
          id,
          nombre,
          username,
          foto_perfil
        )
      )
    `)
    .eq('id_grupo', eventoActual.id_grupo)
    .neq('id', eventId)
    .lt('fecha_hora_inicio', new Date().toISOString())
    .order('fecha_hora_inicio', { ascending: false })

  if (error) {
    return { data: [], error }
  }

  // Paso 3: adaptamos la respuesta de Supabase al formato que necesita la
  // tarjeta del historial: gastos numéricos, total y personas sin repetir.
  const historial = (data || []).map((evento) => {
    // Las columnas numeric pueden llegar como texto desde Supabase.
    const gastos = (evento.gasto || []).map((gasto) => ({
      ...gasto,
      monto: Number(gasto.monto),
    }))

    // Sumamos todos los gastos para obtener el monto total de la juntada.
    const total = gastos.reduce(
      (suma, gasto) => suma + gasto.monto,
      0
    )

    // Map usa el id como clave. Si una persona pagó varias veces, la clave se
    // repite y queda una única persona para la lista de avatares.
    const personas = Array.from(
      new Map(
        gastos
          .filter((gasto) => gasto.pagador)
          .map((gasto) => [gasto.pagador.id, gasto.pagador])
      ).values()
    )

    return {
      id: evento.id,
      nombre: evento.nombre,
      fecha_hora_inicio: evento.fecha_hora_inicio,
      gastos,
      total,
      personas,
    }
  })

  return {
    data: historial,
    error: null,
  }
}


export async function createGasto({
  eventId,
  pagadorId,
  descripcion,
  monto,
}) {
  const descripcionLimpia = String(descripcion || '').trim()
  const montoNumerico = Number(monto)

  // Validamos antes de consultar Supabase para que el modal pueda mostrar un
  // mensaje entendible y para no guardar filas incompletas.
  if (!eventId || !pagadorId || !descripcionLimpia) {
    return {
      data: null,
      error: {
        message: 'Completá quién pagó, el nombre del gasto y el monto',
      },
    }
  }

  if (!Number.isFinite(montoNumerico) || montoNumerico <= 0) {
    return {
      data: null,
      error: {
        message: 'Ingresá un monto numérico mayor a 0',
      },
    }
  }

  const { data, error } = await supabase
    .from('gasto')
    .insert({
      id_evento: eventId,
      id_pagador: pagadorId,
      descripcion: descripcionLimpia,
      monto: montoNumerico,
    })
    .select(GASTO_SELECT)
    .single()

  if (error) {
    return { data: null, error }
  }

  return {
    data: {
      ...data,
      monto: Number(data.monto),
    },
    error: null,
  }
}
