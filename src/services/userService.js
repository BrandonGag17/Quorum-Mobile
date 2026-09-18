import supabase from './supabaseClient'

export function normalizeDateToISO(value) {
  if (!value) return null

  const raw = String(value).trim()

  if (!raw) return null

  const match = raw.match(/^\d{2}\/\d{2}\/\d{4}$/)
  if (match) {
    const [dia, mes, anio] = raw.split('/')
    const date = new Date(Number(anio), Number(mes) - 1, Number(dia))
    if (
      date.getFullYear() !== Number(anio) ||
      date.getMonth() !== Number(mes) - 1 ||
      date.getDate() !== Number(dia)
    ) {
      return null
    }
    return `${anio}-${mes}-${dia}`
  }

  const date = new Date(raw)
  if (Number.isNaN(date.getTime())) {
    return null
  }

  return date.toISOString().split('T')[0]
}

export async function checkUsernameAvailable(username) {
  const normalized = username?.trim()

  if (!normalized) {
    return { available: false, error: { message: 'Ingresá un nombre de usuario' } }
  }

  const { data, error } = await supabase
    .from('usuario')
    .select('id')
    .eq('username', normalized)
    .maybeSingle()

  if (error) {
    return { available: false, error }
  }

  return { available: !data, error: null }
}

export async function checkEmailAvailable(email) {
  const normalized = email?.trim()

  if (!normalized) {
    return { available: false, error: { message: 'Ingresá un email' } }
  }

  const { data, error } = await supabase
    .from('usuario')
    .select('id')
    .eq('email', normalized)
    .maybeSingle()

  if (error) {
    return { available: false, error }
  }

  return { available: !data, error: null }
}

export async function createUserProfile({
  id,
  username,
  email,
  nombre,
  apellido,
  fecha_nacimiento,
  localidad,
  foto_perfil,
}) {
  const normalizedDate = normalizeDateToISO(fecha_nacimiento)

  const { data, error } = await supabase
    .from('usuario')
    .insert({
      id,
      username,
      email,
      nombre,
      apellido,
      fecha_nacimiento: normalizedDate,
      localidad,
      foto_perfil,
    })
    .select('id, username, email, nombre, apellido, fecha_nacimiento, localidad, foto_perfil')
    .single()

  return { data, error }
}

export async function saveUserGustos({ userId, gustos = [] }) {
  if (!userId || !gustos.length) {
    return { data: [], error: null }
  }

  const { data: gustosRows, error: gustosError } = await supabase
    .from('gusto')
    .select('id_gusto')
    .in('id_gusto', gustos)

  if (gustosError) {
    return { data: [], error: gustosError }
  }

  const registros = [...new Set((gustosRows || []).map((gusto) => gusto.id_gusto))].map((idGusto) => ({
    id_usuario: userId,
    id_gusto: idGusto,
  }))

  if (!registros.length) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('usuario_gusto')
    .insert(registros)
    .select('id_usuario, id_gusto')

  return { data, error }
}

export async function getCurrentUserProfile() {
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession()

  if (sessionError) {
    return { data: null, error: sessionError }
  }

  if (!session?.user?.id) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('usuario')
    .select(`
      username,
      nombre,
      apellido,
      foto_perfil
    `)
    .eq('id', session.user.id)
    .single()

  return { data, error }
}

export async function getUserById(userId) {
  if (!userId) {
    return { data: null, error: null }
  }

  const { data, error } = await supabase
    .from('usuario')
    .select('id, username, foto_perfil')
    .eq('id', userId)
    .single()

  return { data, error }
}

export async function searchUsers(query, { excludeIds = [], limit = 6 } = {}) {
  const normalizedQuery = String(query || '').replace(/^@/, '').trim()
  if (!normalizedQuery) {
    return { data: [], error: null }
  }

  const escapedQuery = normalizedQuery.replace(/[\\%_]/g, '\\$&')
  const likeValue = `${escapedQuery}%`
  const fields = 'id,username,foto_perfil,nombre,apellido'
  const [usernamesRes, nombresRes, apellidosRes] = await Promise.all([
    supabase.from('usuario').select(fields).ilike('username', likeValue).limit(limit),
    supabase.from('usuario').select(fields).ilike('nombre', likeValue).limit(limit),
    supabase.from('usuario').select(fields).ilike('apellido', likeValue).limit(limit),
  ])

  const error = usernamesRes.error || nombresRes.error || apellidosRes.error
  if (error) {
    return { data: [], error }
  }

  const excluded = new Set(excludeIds)
  const usersById = new Map()
  for (const user of [
    ...(usernamesRes.data || []),
    ...(nombresRes.data || []),
    ...(apellidosRes.data || []),
  ]) {
    if (user && !excluded.has(user.id) && !usersById.has(user.id)) {
      usersById.set(user.id, user)
    }
  }

  return { data: [...usersById.values()], error: null }
}

export async function getGustos() {
  const { data, error } = await supabase
    .from('gusto')
    .select('id_gusto, nombre')
    .order('id_gusto')

  return { data: data || [], error }
}
