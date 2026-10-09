const HOME_TAB = 'Inicio'

const ROUTES_BY_TYPE = {
  grupo_agregado: { screen: 'Grupo', idKey: 'group' },
  propuesta_creada: { screen: 'VotacionJuntada', idKey: 'event' },
  sugerencia_fecha_hora: { screen: 'VotacionJuntada', idKey: 'event' },
  votacion_cerrada: { screen: 'VotacionJuntada', idKey: 'event' },
  evento_creado: { screen: 'Juntada', idKey: 'event' },
  recordatorio_juntada: { screen: 'Juntada', idKey: 'event' },
  juntada_cancelada: { screen: 'Juntada', idKey: 'event' },
}

function isIdentifier(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function getNotificationType(notification) {
  return notification?.tipo ?? notification?.notification_type ?? null
}

function getPayload(notification) {
  return notification?.payload && typeof notification.payload === 'object'
    ? notification.payload
    : notification
}

export function getNotificationNavigationTarget(notification) {
  const route = ROUTES_BY_TYPE[getNotificationType(notification)]
  if (!route) return null

  const payload = getPayload(notification)
  if (route.idKey === 'group') {
    const groupId = notification?.id_grupo ?? payload?.grupo_id ?? payload?.idGrupo
    return isIdentifier(groupId)
      ? { tab: HOME_TAB, screen: route.screen, params: { idGrupo: groupId } }
      : null
  }

  const eventId = notification?.id_evento ?? payload?.evento_id ?? payload?.idEvento
  return isIdentifier(eventId)
    ? { tab: HOME_TAB, screen: route.screen, params: { idEvento: eventId } }
    : null
}

export function navigateFromNotification(navigation, notification) {
  const target = getNotificationNavigationTarget(notification)
  if (!target || typeof navigation?.navigate !== 'function') return false

  navigation.navigate(target.tab, {
    screen: target.screen,
    params: target.params,
  })
  return true
}