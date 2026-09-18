import supabase from './supabaseClient'

const PROPOSAL_LIST_LIMIT = 25

export async function getProposalsByGroupId(groupId) {
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
                id_creador,
                estado
            ),
            opcion_encuesta (
                id,
                id_encuesta,
                descripcion,
                tipo
            )
        `)
    .eq('evento.id_grupo', groupId)
    .order('id', { ascending: true })
    .limit(PROPOSAL_LIST_LIMIT)

  return { data, error }
}

export async function createProposalJuntada({
  idGrupo,
  idCreador,
  nombre,
  descripcion,
  opcionesFechas,
  opcionesLugares,
  fechaCierre
}) {
  if (!idGrupo || !idCreador || !nombre?.trim() || !Array.isArray(opcionesFechas) || !Array.isArray(opcionesLugares) || !fechaCierre || Number.isNaN(new Date(fechaCierre).getTime())) {
    return { data: null, error: { message: 'Los datos de la propuesta no son válidos.' } }
  }
  const {
    data: evento,
    error: errorEvento
  } = await supabase
    .from('evento')
    .insert({
      nombre: nombre.trim(),
      descripcion: descripcion?.trim() || null,
      id_grupo: idGrupo,
      id_creador: idCreador,
      estado: 'planificacion'
    })
    .select('id, nombre, descripcion, id_grupo, id_creador, estado')
    .single()

  if (errorEvento) {
    return {
      data: null,
      error: errorEvento
    }
  }

  const {
    data: encuesta,
    error: errorEncuesta
  } = await supabase
    .from('encuesta')
    .insert({
      pregunta: nombre.trim(),
      id_evento: evento.id,
      activa: true,
      cierre_en: new Date(fechaCierre).toISOString()
    })
    .select('id, id_evento, pregunta, activa, cierre_en')
    .single()

  if (errorEncuesta) {
    await supabase.from('evento').delete().eq('id', evento.id).eq('id_creador', idCreador)
    return {
      data: null,
      error: errorEncuesta
    }
  }

  const opciones = [
    ...[...new Set(opcionesFechas.map(String).map(value => value.trim()).filter(Boolean))].map(fecha => ({
      id_encuesta: encuesta.id,
      descripcion: fecha,
      tipo: 'fecha'
    })),

    ...[...new Set(opcionesLugares.map(String).map(value => value.trim()).filter(Boolean))].map(lugar => ({
      id_encuesta: encuesta.id,
      descripcion: lugar,
      tipo: 'lugar'
    }))
  ]

  if (opciones.length > 0) {

    const {
      error: errorOpciones
    } = await supabase
      .from('opcion_encuesta')
      .insert(opciones)

    if (errorOpciones) {
      await supabase
        .from('opcion_encuesta')
        .delete()
        .eq('id_encuesta', encuesta.id)
      await supabase.from('encuesta').delete().eq('id', encuesta.id).eq('id_evento', evento.id)
      await supabase.from('evento').delete().eq('id', evento.id).eq('id_creador', idCreador)
      return {
        data: null,
        error: errorOpciones
      }
    }
  }

  return {
    data: {
      evento,
      encuesta,
      opciones
    },
    error: null
  }
}