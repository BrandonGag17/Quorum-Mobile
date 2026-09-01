import supabase from './supabaseClient'

export async function getUpcomingConfirmedEventsForUser(userId) {
  const now = new Date().toISOString()
  if (!userId) {
    return { data: [], error: null }
  }

  // First get the groups the user belongs to
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
  invitados = [] // array of user ids
}) {
  // create lugar if id_lugar not provided and lugar_text provided
  let lugarId = id_lugar

  if (!lugarId && lugar_text) {
    const { data: lugar, error: lugarError } = await supabase
      .from('lugar')
      .insert({ nombre: lugar_text.trim() })
      .select()
      .single()

    if (lugarError) {
      return { data: null, error: lugarError }
    }

    lugarId = lugar.id
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
    .select()
    .single()

  if (eventoError) {
    return { data: null, error: eventoError }
  }

  // insert usuario_evento rows with text-based attendance states
  const attendees = [
    { id_usuario: id_creador, id_evento: evento.id, asistencia: 'voy' },
    ...((invitados || []).map(id => ({ id_usuario: id, id_evento: evento.id, asistencia: 'pendiente' })))
  ]

  if (attendees.length > 0) {
    const { error: attendeesError } = await supabase
      .from('usuario_evento')
      .insert(attendees)

    if (attendeesError) {
      // Not ideal: event created but attendees insertion failed. Return error and created event.
      return { data: evento, error: attendeesError }
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

  return { data: data ?? [], error: error ?? null }
}

export async function getPastEventsByGroupId(groupId) {
  const now = new Date().toISOString()

  const { data, error } = await supabase
    .from('evento')
    .select(`
      *,
      grupo ( id, nombre )
    `)
    .eq('id_grupo', groupId)
    .eq('estado', 'confirmado')
    .lt('fecha_hora_inicio', now)
    .order('fecha_hora_inicio', { ascending: false })

  return { data: data ?? [], error }
}