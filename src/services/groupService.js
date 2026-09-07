import supabase from './supabaseClient'

export async function createGroup({ nombre, fotoPerfil = null, creatorId, miembros = [] }) {
  if (!nombre?.trim() || !creatorId || !Array.isArray(miembros)) {
    return { data: null, error: { message: 'Faltan datos válidos para crear el grupo.' } }
  }

  const integrantes = [...new Set([creatorId, ...miembros].filter(Boolean))]
  let grupo

  try {
    const { data, error } = await supabase
      .from('grupo')
      .insert({
        nombre: nombre.trim(),
        foto_perfil: fotoPerfil,
        id_creador: creatorId,
      })
      .select()
      .single()

    if (error) return { data: null, error }
    grupo = data
  } catch (error) {
    return { data: null, error: { message: error?.message || 'No se pudo crear el grupo.' } }
  }

  let miembrosError
  try {
    const { error } = await supabase
      .from('usuario_grupo')
      .insert(integrantes.map(idUsuario => ({
        id_grupo: grupo.id,
        id_usuario: idUsuario,
      })))
    if (!error) return { data: grupo, error: null }
    miembrosError = error
  } catch (error) {
    miembrosError = error
  }

  // Son dos solicitudes: intentamos retirar el grupo recién creado si falla
  // la incorporación de integrantes, y avisamos si no se puede deshacer.
  try {
    const { data: eliminado, error: cleanupError } = await supabase
      .from('grupo')
      .delete()
      .eq('id', grupo.id)
      .eq('id_creador', creatorId)
      .select('id')
      .maybeSingle()

    if (!cleanupError && eliminado) {
      return {
        data: null,
        error: { message: `No se pudieron agregar los integrantes. ${miembrosError?.message || 'Intentá nuevamente.'}` },
      }
    }
  } catch {
    // El resultado parcial se informa abajo también si falla la conexión.
  }

  return {
    data: grupo,
    error: {
      message: `El grupo se creó (ID: ${grupo.id}), pero no se pudo confirmar la incorporación de integrantes ni deshacer la creación. Revisá ese grupo antes de reintentar. ${miembrosError?.message || ''}`,
    },
  }
}

export async function getGroupById(groupId) {
  const { data, error } = await supabase
    .from('grupo')
    .select('*')
    .eq('id', groupId)
    .single()

  return { data, error }
}

export async function getGroupMembers(groupId) {
  const { data, error } = await supabase
    .from('usuario_grupo')
    .select(`
      id_usuario,
      usuario (
        id,
        username,
        foto_perfil
      )
    `)
    .eq('id_grupo', groupId)

  if (error) {
    return { data: [], error }
  }

  return {
    data: data ?? [],
    error: null
  }
}

export async function getGroupMemberCount(groupId) {
  const { count, error } = await supabase
    .from('usuario_grupo')
    .select('id_usuario', {
      count: 'exact',
      head: true
    })
    .eq('id_grupo', groupId)

  return {
    data: count ?? 0,
    error
  }
}

export async function getUserByUsername(username) {
  const normalizedUsername = username
    .replace(/^@/, '')
    .trim()

  if (!normalizedUsername) {
    return {
      data: null,
      error: {
        message: 'Ingresá un username'
      }
    }
  }

  const { data, error } = await supabase
    .from('usuario')
    .select('id, username, foto_perfil')
    .eq('username', normalizedUsername)
    .single()

  return { data, error }
}

export async function addUserToGroup({ groupId, userId }) {
  const { data, error } = await supabase
    .from('usuario_grupo')
    .insert({
      id_grupo: groupId,
      id_usuario: userId
    })
    .select()
    .single()

  return { data, error }
}

export async function removeUserFromGroup({ groupId, userId }) {
  const { data, error } = await supabase
    .from('usuario_grupo')
    .delete()
    .eq('id_grupo', groupId)
    .eq('id_usuario', userId)
    .select()
    .maybeSingle()

  return { data, error }
}

export async function getGroupsForUser(userId) {
  const { data, error } = await supabase
    .from('usuario_grupo')
    .select(
      `
      id_grupo,
      grupo (
        id,
        nombre,
        descripcion,
        foto_perfil
      )
    `
    )
    .eq('id_usuario', userId)

  if (error) {
    return { data: [], error }
  }

  return { data: data ?? [], error: null }
}
