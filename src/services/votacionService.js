import supabase from './supabaseClient'

function isValidDateSuggestion(value) {
  const parsedDate = new Date(value)
  if (!Number.isNaN(parsedDate.getTime())) {
    return true
  }

  const match = value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})(?:\s+(\d{1,2}):(\d{2}))?$/)
  if (!match) {
    return false
  }

  const [, day, month, year, hours = '00', minutes = '00'] = match
  const date = new Date(
    Number(year),
    Number(month) - 1,
    Number(day),
    Number(hours),
    Number(minutes)
  )

  return (
    date.getFullYear() === Number(year) &&
    date.getMonth() === Number(month) - 1 &&
    date.getDate() === Number(day) &&
    date.getHours() === Number(hours) &&
    date.getMinutes() === Number(minutes)
  )
}

export async function getVotacionByEventId(eventId) {
  const { data, error } = await supabase
    .from('encuesta')
    .select(`
      id,
      id_evento,
      pregunta,
      activa,
      cierre_en,
      evento!inner (
        id,
        id_grupo,
        nombre,
        descripcion,
        estado,
        fecha_hora_inicio,
        lugar,
        grupo (
          id,
          nombre,
          descripcion,
          foto_perfil
        )
      ),
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

export async function getVotosForSurvey(surveyId, optionIds) {
  if (!surveyId) {
    return { data: [], error: null }
  }

  let resolvedOptionIds = optionIds
  if (!resolvedOptionIds) {
    const { data: options, error: optionsError } = await supabase
      .from('opcion_encuesta')
      .select('id')
      .eq('id_encuesta', surveyId)
    if (optionsError) {
      return { data: [], error: optionsError }
    }
    resolvedOptionIds = (options ?? []).map(option => option.id).filter(Boolean)
  }
  if (resolvedOptionIds.length === 0) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('voto')
    .select('id_usuario, id_opcion')
    .in('id_opcion', resolvedOptionIds)

  return { data: data ?? [], error: error ?? null }
}

export async function toggleVote({ userId, optionId }) {
  if (!userId || !optionId) {
    return {
      data: null,
      error: {
        message: 'Faltan datos para votar'
      }
    }
  }

  const { data: existingVote, error: existingError } = await supabase
    .from('voto')
    .select('id, id_usuario, id_opcion')
    .eq('id_usuario', userId)
    .eq('id_opcion', optionId)
    .maybeSingle()

  if (existingError) {
    return { data: null, error: existingError }
  }

  if (existingVote) {
    const { data, error } = await supabase
      .from('voto')
      .delete()
      .eq('id', existingVote.id)
      .select('id')
      .maybeSingle()

    return { data, error }
  }

  const { data, error } = await supabase
    .from('voto')
    .insert({
      id_usuario: userId,
      id_opcion: optionId
    })
    .select('id, id_usuario, id_opcion')
    .single()

  return { data, error }
}

export async function addSurveySuggestion({
  surveyId,
  userId,
  tipo,
  descripcion
}) {
  const normalizedType = tipo?.trim().toLowerCase()
  const normalizedDescription = descripcion?.trim()

  if (!surveyId || !userId || !normalizedDescription) {
    return {
      data: null,
      error: {
        message: 'Faltan datos para sugerir una opción'
      }
    }
  }

  if (!['fecha', 'lugar'].includes(normalizedType)) {
    return {
      data: null,
      error: {
        message: 'El tipo de sugerencia no es válido'
      }
    }
  }

  if (normalizedType === 'fecha' && !isValidDateSuggestion(normalizedDescription)) {
    return {
      data: null,
      error: {
        message: 'La fecha sugerida no es válida'
      }
    }
  }

  const { data: survey, error: surveyError } = await supabase
    .from('encuesta')
    .select(`
      id,
      activa,
      evento!inner (
        id,
        id_grupo
      )
    `)
    .eq('id', surveyId)
    .maybeSingle()

  if (surveyError) {
    return { data: null, error: surveyError }
  }

  if (!survey) {
    return {
      data: null,
      error: {
        message: 'No se encontró la votación'
      }
    }
  }

  if (!survey.activa) {
    return {
      data: null,
      error: {
        message: 'La votación ya no está activa'
      }
    }
  }

  const { data: membership, error: membershipError } = await supabase
    .from('usuario_grupo')
    .select('id')
    .eq('id_usuario', userId)
    .eq('id_grupo', survey.evento.id_grupo)
    .maybeSingle()

  if (membershipError) {
    return { data: null, error: membershipError }
  }

  if (!membership) {
    return {
      data: null,
      error: {
        message: 'No tenés permiso para sugerir opciones en este grupo'
      }
    }
  }

  const { data: existingOption, error: existingError } = await supabase
    .from('opcion_encuesta')
    .select('id, id_encuesta, descripcion, tipo')
    .eq('id_encuesta', surveyId)
    .eq('tipo', normalizedType)
    .eq('descripcion', normalizedDescription)
    .maybeSingle()

  if (existingError) {
    return { data: null, error: existingError }
  }

  if (existingOption) {
    return {
      data: existingOption,
      error: {
        message: 'Esa opción ya fue sugerida'
      }
    }
  }

  const { data, error } = await supabase
    .from('opcion_encuesta')
    .insert({
      id_encuesta: surveyId,
      descripcion: normalizedDescription,
      tipo: normalizedType
    })
    .select('id, id_encuesta, descripcion, tipo')
    .single()

  return { data, error }
}
