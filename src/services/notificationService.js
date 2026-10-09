import supabase from './supabaseClient'

const NOTIFICATION_FIELDS = `
  id,
  destinatario_id,
  origen_id,
  id_grupo,
  id_evento,
  id_encuesta,
  id_opcion_encuesta,
  tipo,
  titulo,
  descripcion,
  payload,
  creada_en,
  leida_en,
  recordatorio_dias_antes
`

const DEFAULT_PAGE_SIZE = 30
const MAX_PAGE_SIZE = 100

async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) return { userId: null, error }
  if (!data?.user?.id) {
    return {
      userId: null,
      error: { message: 'Iniciá sesión para consultar tus notificaciones.' },
    }
  }
  return { userId: data.user.id, error: null }
}

function normalizePagination(limit, offset) {
  const safeLimit = Number.isInteger(limit)
    ? Math.min(Math.max(limit, 1), MAX_PAGE_SIZE)
    : DEFAULT_PAGE_SIZE
  const safeOffset = Number.isInteger(offset) ? Math.max(offset, 0) : 0
  return { safeLimit, safeOffset }
}

export async function getNotifications({ limit = DEFAULT_PAGE_SIZE, offset = 0 } = {}) {
  const { userId, error: userError } = await getAuthenticatedUserId()
  if (userError) return { data: [], error: userError }

  const { safeLimit, safeOffset } = normalizePagination(limit, offset)
  const { data, error } = await supabase
    .from('notificacion')
    .select(NOTIFICATION_FIELDS)
    .eq('destinatario_id', userId)
    .order('creada_en', { ascending: false })
    .order('id', { ascending: false })
    .range(safeOffset, safeOffset + safeLimit - 1)

  return { data: data ?? [], error: error ?? null }
}

export async function getUnreadNotificationCount() {
  const { userId, error: userError } = await getAuthenticatedUserId()
  if (userError) return { data: 0, error: userError }

  const { count, error } = await supabase
    .from('notificacion')
    .select('id', { count: 'exact', head: true })
    .eq('destinatario_id', userId)
    .is('leida_en', null)

  return { data: count ?? 0, error: error ?? null }
}

export async function getNotificationActors(userIds = []) {
  const ids = [...new Set(userIds.filter(id => typeof id === 'string' && id))]
  if (ids.length === 0) return { data: {}, error: null }

  const { data, error } = await supabase
    .from('usuario')
    .select('id, username, foto_perfil')
    .in('id', ids)

  if (error) return { data: {}, error }
  return {
    data: Object.fromEntries((data ?? []).map(user => [user.id, user])),
    error: null,
  }
}

export async function markNotificationAsRead(notificationId) {
  if (typeof notificationId !== 'string' || !notificationId.trim()) {
    return { data: null, error: { message: 'La notificación indicada no es válida.' } }
  }

  const { userId, error: userError } = await getAuthenticatedUserId()
  if (userError) return { data: null, error: userError }

  const { data, error } = await supabase
    .from('notificacion')
    .update({ leida_en: new Date().toISOString() })
    .eq('id', notificationId)
    .eq('destinatario_id', userId)
    .is('leida_en', null)
    .select('id, leida_en')
    .maybeSingle()

  return { data: data ?? null, error: error ?? null }
}

export async function markAllNotificationsAsRead() {
  const { userId, error: userError } = await getAuthenticatedUserId()
  if (userError) return { data: null, error: userError }

  const { data, error } = await supabase
    .from('notificacion')
    .update({ leida_en: new Date().toISOString() })
    .eq('destinatario_id', userId)
    .is('leida_en', null)
    .select('id')

  return { data: data ?? [], error: error ?? null }
}

export async function subscribeToNotificationChanges(onChange, onStatusChange) {
  if (typeof onChange !== 'function') {
    return { data: null, error: { message: 'Falta el callback de notificaciones.' } }
  }

  const { userId, error: userError } = await getAuthenticatedUserId()
  if (userError) return { data: null, error: userError }

  const channel = supabase
    .channel(`notificaciones:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'notificacion',
        filter: `destinatario_id=eq.${userId}`,
      },
      onChange
    )
    .subscribe((status, error) => {
      onStatusChange?.(status, error ?? null)
    })

  return { data: channel, error: null }
}

export function unsubscribeFromNotificationChanges(channel) {
  if (!channel) return Promise.resolve('ok')
  return supabase.removeChannel(channel)
}