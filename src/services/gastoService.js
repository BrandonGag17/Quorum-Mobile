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
