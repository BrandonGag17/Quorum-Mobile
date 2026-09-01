import supabase from './supabaseClient'

export async function getProposalsByGroupId(groupId) {
  const { data, error } = await supabase
    .from('encuesta')
    .select(`
            *,
            evento!inner (
                id,
                id_grupo,
                nombre,
                descripcion,
                id_creador,
                estado
            ),
            opcion_encuesta (*)
        `)
    .eq('evento.id_grupo', groupId)
    .order('id', { ascending: true })

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
    .select()
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
    .select()
    .single()

  if (errorEncuesta) {
    return {
      data: null,
      error: errorEncuesta
    }
  }

  const opciones = [
    ...opcionesFechas.map(fecha => ({
      id_encuesta: encuesta.id,
      descripcion: fecha,
      tipo: 'fecha'
    })),

    ...opcionesLugares.map(lugar => ({
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