import supabase from './supabaseClient'

function parseFechaTextoPropuesta(fechaTexto) {
  if (!fechaTexto || typeof fechaTexto !== 'string') {
    return null
  }

  const [fecha, hora = '00:00'] = fechaTexto.trim().split(' ')
  const [dia, mes, anio] = (fecha || '').split('/')
  const [horas = '0', minutos = '0'] = hora.split(':')

  const fechaDate = new Date(
    Number(anio),
    Number(mes) - 1,
    Number(dia),
    Number(horas),
    Number(minutos)
  )

  if (Number.isNaN(fechaDate.getTime())) {
    return null
  }

  return fechaDate.toISOString()
}

export async function getJuntadaById(eventId) {
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
      lugar,
      grupo (
        id,
        nombre,
        descripcion,
        foto_perfil,
        id_creador
      )
    `)
    .eq('id', eventId)
    .single()

  return { data, error }
}

export async function getJuntadaSurveyByEventId(eventId) {
  const { data, error } = await supabase
    .from('encuesta')
    .select(`
      id,
      id_evento,
      pregunta,
      activa,
      cierre_en,
      opcion_encuesta (
        id,
        descripcion,
        tipo
      )
    `)
    .eq('id_evento', eventId)
    .maybeSingle()

  return { data, error }
}

export async function getJuntadaGoingCount(eventId) {
  const { count, error } = await supabase
    .from('usuario_evento')
    .select('id', { count: 'exact', head: true })
    .eq('id_evento', eventId)
    .eq('asistencia', 'voy')

  return { data: count ?? 0, error }
}

export async function getJuntadaGoingUsers(eventId, limit = 5) {
  const { data, error } = await supabase
    .from('usuario_evento')
    .select(`
      id_usuario,
      respondio_en,
      usuario (
        id,
        username,
        foto_perfil
      )
    `)
    .eq('id_evento', eventId)
    .eq('asistencia', 'voy')
    .order('respondio_en', { ascending: false })
    .limit(limit)

  return { data: data ?? [], error: error ?? null }
}

export async function getJuntadaUserAttendance(eventId, userId) {
  if (!eventId || !userId) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('usuario_evento')
    .select('asistencia')
    .eq('id_evento', eventId)
    .eq('id_usuario', userId)
    .maybeSingle()

  return { data, error }
}

export async function upsertJuntadaAttendance({ eventId, userId, asistencia }) {
  if (!eventId || !userId) {
    return {
      data: null,
      error: {
        message: 'Faltan datos para guardar la asistencia'
      }
    }
  }

  const payload = {
    id_usuario: userId,
    id_evento: eventId,
    asistencia,
    respondio_en: new Date().toISOString()
  }

  const { data, error } = await supabase
    .from('usuario_evento')
    .upsert(payload, {
      onConflict: 'id_usuario,id_evento'
    })
    .select('id_usuario, id_evento, asistencia, respondio_en')
    .single()

  return { data, error }
}

export async function finalizeJuntadaSurvey({ eventId, survey }) {
  if (!eventId || !survey?.id) {
    return {
      data: null,
      error: {
        message: 'Faltan datos para finalizar la encuesta'
      }
    }
  }

  const { data: eventoBase, error: eventoBaseError } = await supabase
    .from('evento')
    .select('id, id_grupo, estado')
    .eq('id', eventId)
    .single()

  if (eventoBaseError) return { data: null, error: eventoBaseError }

  const [{ count: memberCount, error: memberError }, { data: attendance, error: attendanceError }] = await Promise.all([
    supabase.from('usuario_grupo').select('id_usuario', { count: 'exact', head: true }).eq('id_grupo', eventoBase.id_grupo),
    supabase.from('usuario_evento').select('id_usuario').eq('id_evento', eventId).eq('asistencia', 'voy')
  ])

  if (memberError) return { data: null, error: memberError }
  if (attendanceError) return { data: null, error: attendanceError }

  const goingUserIds = [...new Set((attendance ?? []).map(row => row.id_usuario).filter(Boolean))]
  const quorumRequired = Math.ceil((memberCount ?? 0) / 2)
  const quorumReached = quorumRequired > 0 && goingUserIds.length >= quorumRequired

  if (!quorumReached) {
    const { data: encuestaCerrada, error: closeError } = await supabase
      .from('encuesta')
      .update({ activa: false })
      .eq('id', survey.id)
      .select('id, id_evento, pregunta, activa, cierre_en')
      .single()
    if (closeError) return { data: null, error: closeError }
    return { data: { event: null, survey: encuestaCerrada, quorumReached: false, goingCount: goingUserIds.length, quorumRequired, winners: null }, error: null }
  }

  const opciones = survey.opcion_encuesta ?? []

  const idsOpciones = opciones.map(opcion => opcion.id)

  const { data: votos, error: errorVotos } = await supabase
    .from('voto')
    .select('id_opcion')
    .in('id_opcion', idsOpciones)

  if (errorVotos) {
    return {
      data: null,
      error: errorVotos
    }
  }

  const conteo = idsOpciones.reduce((acc, id) => {
    acc[id] = 0
    return acc
  }, {})

  votos?.forEach(voto => {
    conteo[voto.id_opcion] = (conteo[voto.id_opcion] ?? 0) + 1
  })

  const elegirGanador = (tipo) => {
    const opcionesDelTipo = opciones
      .filter(opcion => opcion.tipo === tipo)
      .sort((a, b) => String(a.id).localeCompare(String(b.id), undefined, { numeric: true }))

    let ganador = null
    let maxVotos = 0

    opcionesDelTipo.forEach(opcion => {
      const votosOpcion = conteo[opcion.id] ?? 0

      if (votosOpcion > maxVotos) {
        maxVotos = votosOpcion
        ganador = opcion
      }
    })

    return ganador
  }

  const fechaGanadora = elegirGanador('fecha')
  const lugarGanador = elegirGanador('lugar')

  if (!fechaGanadora || !parseFechaTextoPropuesta(fechaGanadora.descripcion) || !lugarGanador) {
    const { data: encuestaCerrada, error: closeError } = await supabase
      .from('encuesta')
      .update({ activa: false })
      .eq('id', survey.id)
      .eq('activa', true)
      .select('id, id_evento, pregunta, activa, cierre_en')
      .single()
    if (closeError) return { data: null, error: closeError }
    return { data: { event: null, survey: encuestaCerrada, quorumReached: true, optionsComplete: false, goingCount: goingUserIds.length, quorumRequired, winners: null }, error: null }
  }

  const { data: eventoActualizado, error: errorEvento } = await supabase
    .from('evento')
    .update({
      estado: 'confirmado',
      fecha_hora_inicio: fechaGanadora
        ? parseFechaTextoPropuesta(fechaGanadora.descripcion)
        : null,
      lugar: lugarGanador?.descripcion || null
    })
    .eq('id', eventId)
    .eq('estado', 'planificacion')
    .select(`
      id,
      nombre,
      descripcion,
      estado,
      fecha_hora_inicio,
      id_grupo,
      id_creador,
      lugar
    `)
    .single()

  if (errorEvento) {
    return {
      data: null,
      error: errorEvento
    }
  }

  if (!eventoActualizado) {
    return { data: null, error: { message: 'La propuesta ya fue cerrada o el evento ya no está en planificación.' } }
  }

  const { data: encuestaActualizada, error: errorEncuesta } = await supabase
    .from('encuesta')
    .update({ activa: false })
    .eq('id', survey.id)
    .eq('activa', true)
    .select(`
      id,
      id_evento,
      pregunta,
      activa,
      cierre_en
    `)
    .single()

  if (errorEncuesta) {
    return {
      data: {
        event: eventoActualizado,
        survey: null,
        winners: {
          fecha: fechaGanadora?.descripcion ?? null,
          lugar: lugarGanador?.descripcion ?? null
        }
      },
      error: errorEncuesta
    }
  }

  return {
    data: {
      event: eventoActualizado,
      survey: encuestaActualizada,
      winners: {
        fecha: fechaGanadora?.descripcion ?? null,
        lugar: lugarGanador?.descripcion ?? null
      },
      quorumReached: true,
      goingCount: goingUserIds.length,
      quorumRequired
    },
    error: null
  }
}
