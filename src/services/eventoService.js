import supabase from './supabaseClient'

const EVENT_LIST_LIMIT = 25

export async function getUpcomingConfirmedEventsForUser(userId) {
  const now = new Date().toISOString()
  if (!userId) {
    return { data: [], error: null }
  }

  const { data: userGroups, error: ugError } = await supabase
    .from('usuario_grupo')
    .select('id_grupo')
    .eq('id_usuario', userId)

  if (ugError) {
    return { data: [], error: ugError }
  }

  const groupIds = (userGroups ?? []).map(g => g.id_grupo).filter(Boolean)

  if (groupIds.length === 0) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('evento')
    .select(`
      id,
      nombre,
      fecha_hora_inicio,
      id_grupo,
      grupo ( id, nombre )
    `)
    .in('id_grupo', groupIds)
    .eq('estado', 'confirmado')
    .gte('fecha_hora_inicio', now)
    .order('fecha_hora_inicio', { ascending: true })
    .limit(EVENT_LIST_LIMIT)

  return { data: data ?? [], error: error ?? null }
}

export async function createEvent({
  nombre,
  descripcion = null,
  id_grupo,
  id_creador,
  fecha_hora_inicio,
  id_lugar = null,
  lugar_text = null,
  invitados = []
}) {
  if (!nombre?.trim() || !id_grupo || !id_creador || !fecha_hora_inicio || Number.isNaN(new Date(fecha_hora_inicio).getTime())) {
    return { data: null, error: { message: 'Los datos del evento no son válidos.' } }
  }
  let lugarId = id_lugar
  let createdLugarId = null

  if (!lugarId && lugar_text) {
    const { data: lugar, error: lugarError } = await supabase
      .from('lugar')
      .insert({ nombre: lugar_text.trim() })
      .select('id')
      .single()

    if (lugarError) {
      return { data: null, error: lugarError }
    }

    lugarId = lugar.id
    createdLugarId = lugar.id
  }

  const { data: evento, error: eventoError } = await supabase
    .from('evento')
    .insert({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      id_grupo,
      id_creador,
      estado: 'confirmado',
      fecha_hora_inicio: new Date(fecha_hora_inicio).toISOString(),
      id_lugar: lugarId,
      lugar: lugar_text || null
    })
    .select('id, nombre, descripcion, id_grupo, id_creador, estado, fecha_hora_inicio, id_lugar, lugar')
    .single()

  if (eventoError) {
    if (createdLugarId) {
      await supabase.from('lugar').delete().eq('id', createdLugarId)
    }
    return { data: null, error: eventoError }
  }

  const attendees = [
    { id_usuario: id_creador, id_evento: evento.id, asistencia: 'voy' },
    ...([...new Set(invitados || [])].filter(id => id && id !== id_creador).map(id => ({ id_usuario: id, id_evento: evento.id, asistencia: 'pendiente' })))
  ]

  if (attendees.length > 0) {
    const { error: attendeesError } = await supabase
      .from('usuario_evento')
      .insert(attendees)

    if (attendeesError) {
      const { error: attendeesCleanupError } = await supabase
        .from('usuario_evento')
        .delete()
        .eq('id_evento', evento.id)

      const { error: eventCleanupError } = await supabase
        .from('evento')
        .delete()
        .eq('id', evento.id)
        .eq('id_creador', id_creador)

      if (createdLugarId) {
        await supabase.from('lugar').delete().eq('id', createdLugarId)
      }

      const cleanupError = attendeesCleanupError || eventCleanupError
      return {
        data: null,
        error: {
          message: cleanupError
            ? `No se pudo agregar asistentes ni deshacer el evento: ${attendeesError.message}`
            : `No se pudo agregar asistentes; el evento fue eliminado: ${attendeesError.message}`,
          cause: attendeesError,
        },
      }
    }
  }

  return { data: evento, error: null }
}

export async function getConfirmedEventsByGroupId(groupId) {
  const now = new Date().toISOString()
  const { data, error } = await supabase
    .from('evento')
    .select(`
      id,
      nombre,
      fecha_hora_inicio,
      id_grupo,
      grupo ( id, nombre )
    `)
    .eq('id_grupo', groupId)
    .eq('estado', 'confirmado')
    .gte('fecha_hora_inicio', now)
    .order('fecha_hora_inicio', { ascending: true })
    .limit(EVENT_LIST_LIMIT)

  return { data: data ?? [], error: error ?? null }
}

export async function getPastEventsByGroupId(groupId) {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('evento')
    .select(`
      id,
      nombre,
      descripcion,
      estado,
      fecha_hora_inicio,
      id_grupo,
      id_creador,
      id_lugar,
      lugar,
      grupo ( id, nombre )
    `)
    .eq('id_grupo', groupId)
    .eq('estado', 'confirmado')
    .lt('fecha_hora_inicio', now)
    .order('fecha_hora_inicio', { ascending: false })
    .limit(EVENT_LIST_LIMIT)

  return { data: data ?? [], error }
}