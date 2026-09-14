import supabase from './supabaseClient'

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
  if (!eventId) {
    return {
      data: [],
      error: {
        message: 'No se recibió el evento para consultar el historial',
      },
    }
  }

  const { data: eventoActual, error: errorEvento } = await supabase
    .from('evento')
    .select('id_grupo')
    .eq('id', eventId)
    .single()

  if (errorEvento) {
    return { data: [], error: errorEvento }
  }

  if (!eventoActual?.id_grupo) {
    return {
      data: [],
      error: {
        message: 'La juntada no tiene un grupo asociado',
      },
    }
  }

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

  const historial = (data || []).map((evento) => {
    const gastos = (evento.gasto || []).map((gasto) => ({
      ...gasto,
      monto: Number(gasto.monto),
    }))

    const total = gastos.reduce(
      (suma, gasto) => suma + gasto.monto,
      0
    )

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
