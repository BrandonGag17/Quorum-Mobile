import supabase from './supabaseClient'

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