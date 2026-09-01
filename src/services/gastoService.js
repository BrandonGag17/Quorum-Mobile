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

  // Un gasto conoce el evento, pero los integrantes pertenecen al grupo.
  // Primero averiguamos a qué grupo corresponde la juntada.
  const { data: evento, error: errorEvento } = await supabase
    .from('evento')
    .select('id_grupo')
    .eq('id', eventId)
    .single()

  if (errorEvento) {
    return { data: [], error: errorEvento }
  }

  if (!evento?.id_grupo) {
    return {
      data: [],
      error: {
        message: 'La juntada no tiene un grupo asociado',
      },
    }
  }

  // Después traemos los perfiles que se mostrarán en el selector de pagador.
  const { data, error } = await supabase
    .from('usuario_grupo')
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
    .eq('id_grupo', evento.id_grupo)

  if (error) {
    return { data: [], error }
  }

  const personas = (data || [])
    .map((membresia) => membresia.usuario)
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
        message: 'Ingresá un monto mayor a cero',
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
