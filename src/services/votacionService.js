import supabase from './supabaseClient'

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

export async function getVotosForSurvey(surveyId) {
  if (!surveyId) {
    return { data: [], error: null }
  }

  const { data: options, error: optionsError } = await supabase
    .from('opcion_encuesta')
    .select('id')
    .eq('id_encuesta', surveyId)

  if (optionsError) {
    return { data: [], error: optionsError }
  }

  const optionIds = (options ?? []).map(option => option.id).filter(Boolean)

  if (optionIds.length === 0) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('voto')
    .select('id_usuario, id_opcion')
    .in('id_opcion', optionIds)

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
