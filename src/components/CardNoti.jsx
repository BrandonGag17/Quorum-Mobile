import React from 'react'
import {
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'

const COLORS = {
  background: '#15151C',
  unread: '#3D1D57',
  text: '#FFFFFF',
  muted: '#A5A2AC',
  green: '#72C4A3',
  avatar: '#5E2D82',
}

function titleFor(notification) {
  const payload = notification?.payload ?? {}
  return payload.evento_nombre || payload.grupo_nombre || payload.sugerencia || 'la juntada'
}

function notificationCopy(notification, actorName) {
  const name = actorName || 'Alguien'
  const title = titleFor(notification)
  const groupName = notification?.payload?.grupo_nombre || 'el grupo'

  switch (notification?.tipo) {
    case 'grupo_agregado':
      return { before: `${name} te añadió al grupo `, emphasis: groupName, after: '.' }
    case 'propuesta_creada':
      return { before: `${name} creó una propuesta de juntada en `, emphasis: groupName, after: '.' }
    case 'evento_creado':
      return { before: `${name} creó el evento `, emphasis: title, after: '.' }
    case 'sugerencia_fecha_hora':
      return { before: `${name} añadió una sugerencia a `, emphasis: title, after: '.' }
    case 'votacion_cerrada':
      return { before: `${name} cerró la votación de `, emphasis: title, after: '.' }
    case 'propuesta_sin_quorum':
      return { before: notification?.descripcion || 'La propuesta finalizó sin alcanzar el quórum.', emphasis: '', after: '' }
    case 'recordatorio_juntada': {
      const days = notification?.recordatorio_dias_antes
      const lead = days === 0 ? 'Hoy tenés una juntada: ' : `En ${days} días tenés una juntada: `
      return { before: lead, emphasis: title, after: '.' }
    }
    case 'juntada_cancelada':
      return { before: `${name} canceló la juntada `, emphasis: title, after: '.' }
    default:
      return { before: notification?.descripcion || 'Tenés una notificación nueva.', emphasis: '', after: '' }
  }
}

function formatTime(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''

  const seconds = Math.max(0, Math.floor((Date.now() - date.getTime()) / 1000))
  if (seconds < 60) return 'ahora'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`
  if (seconds < 7 * 86400) return `${Math.floor(seconds / 86400)}d`
  return date.toLocaleDateString('es-AR', { day: 'numeric', month: 'short' })
}

function Avatar({ actor }) {
  if (actor?.foto_perfil) {
    return <Image source={{ uri: actor.foto_perfil }} style={styles.avatarImage} />
  }

  const initials = actor?.username?.trim()?.slice(0, 1)?.toUpperCase()
  return (
    <View style={styles.avatarFallback}>
      {initials
        ? <Text style={styles.avatarInitial}>{initials}</Text>
        : <Ionicons name="person" size={25} color={COLORS.text} />}
    </View>
  )
}

export default function CardNoti({
  notification,
  actor,
  onPress,
  onActionPress,
  actionLabel = 'Ver notificación',
}) {
  const copy = notificationCopy(notification, actor?.username)
  const unread = !notification?.leida_en

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={`${copy.before}${copy.emphasis}${copy.after}`}
      onPress={onPress}
      style={({ pressed }) => [
        styles.card,
        unread && styles.unreadCard,
        pressed && styles.pressed,
      ]}
    >
      <Avatar actor={actor} />

      <View style={styles.content}>
        <View style={styles.messageRow}>
          <Text style={styles.message}>
            <Text style={styles.messageBefore}>{copy.before}</Text>
            {copy.emphasis ? <Text style={styles.emphasis}>{copy.emphasis}</Text> : null}
            <Text style={styles.messageBefore}>{copy.after}</Text>
            <Text style={styles.time}>{'  '}{formatTime(notification?.creada_en)}</Text>
          </Text>
          {unread ? <View style={styles.unreadDot} /> : null}
        </View>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={actionLabel}
          onPress={event => {
            event.stopPropagation?.()
            if (onActionPress) onActionPress()
            else onPress?.()
          }}
          style={({ pressed }) => [styles.action, pressed && styles.actionPressed]}
        >
          <Text style={styles.actionText}>{actionLabel}</Text>
        </Pressable>
      </View>
    </Pressable>
  )
}

const styles = StyleSheet.create({
  card: {
  flexDirection: 'row',
  alignItems: 'center',
  paddingHorizontal: 18,
  paddingVertical: 14,
  backgroundColor: COLORS.background,
},
avatarImage: {
  width: 50,
  height: 50,
  borderRadius: 14,
  backgroundColor: COLORS.avatar,
},
avatarFallback: {
  width: 50,
  height: 50,
  borderRadius: 14,
  backgroundColor: COLORS.avatar,
  alignItems: 'center',
  justifyContent: 'center',
},
avatarInitial: {
  color: COLORS.text,
  fontSize: 20,
  fontFamily: 'CashMarket',
},
content: {
  flex: 1,
  marginLeft: 12,
  alignItems: 'flex-start',
},
messageRow: {
  flexDirection: 'row',
  alignItems: 'flex-start',
},
message: {
  flexShrink: 1,
  color: COLORS.text,
  fontSize: 14,
  lineHeight: 19,
  fontFamily: 'Utendo',
},
time: {
  color: COLORS.muted,
  fontSize: 11,
  fontFamily: 'Utendo',
},
unreadDot: {
  width: 7,
  height: 7,
  borderRadius: 4,
  marginLeft: 7,
  marginTop: 6,
  backgroundColor: COLORS.green,
},
action: {
  backgroundColor: COLORS.green,
  borderRadius: 8,
  paddingHorizontal: 9,
  paddingVertical: 3,
  marginTop: 6,
},
actionText: {
  color: COLORS.text,
  fontFamily: 'CashMarket',
  fontSize: 12,
},
})
