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

  const opciones = survey.opcion_encuesta ?? []

  if (opciones.length === 0) {
    return {
      data: null,
      error: null
    }
  }

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
    const opcionesDelTipo = opciones.filter(opcion => opcion.tipo === tipo)

    let ganador = null
    let maxVotos = -1

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

  const { data: encuestaActualizada, error: errorEncuesta } = await supabase
    .from('encuesta')
    .update({ activa: false })
    .eq('id', survey.id)
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
      }
    },
    error: null
  }
}