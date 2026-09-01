import supabase from './supabaseClient'

export function normalizeDateToISO(value) {
  if (!value) return null

  const raw = String(value).trim()

  if (!raw) return null

  const match = raw.match(/^\d{2}\/\d{2}\/\d{4}$/)
  if (match) {
    const [dia, mes, anio] = raw.split('/')
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
    .select()
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

  const registros = (gustosRows || []).map((gusto) => ({
    id_usuario: userId,
    id_gusto: gusto.id_gusto,
  }))

  if (!registros.length) {
    return { data: [], error: null }
  }

  const { data, error } = await supabase
    .from('usuario_gusto')
    .insert(registros)
    .select()

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