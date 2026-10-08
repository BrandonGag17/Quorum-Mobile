import Constants from 'expo-constants'
import * as Notifications from 'expo-notifications'
import { Platform } from 'react-native'

import supabase from './supabaseClient'

const NOTIFICATION_CHANNEL_ID = 'default'

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  })
}

function getProjectId() {
  return (
    Constants.expoConfig?.extra?.eas?.projectId ??
    Constants.easConfig?.projectId ??
    null
  )
}

async function getAuthenticatedUserId() {
  const { data, error } = await supabase.auth.getUser()
  if (error) return { userId: null, error }
  if (!data?.user?.id) {
    return {
      userId: null,
      error: { message: 'Iniciá sesión para activar las notificaciones push.' },
    }
  }
  return { userId: data.user.id, error: null }
}

export async function getPushPermissionStatus() {
  if (Platform.OS === 'web') {
    return {
      data: { status: 'unsupported', granted: false },
      error: null,
    }
  }

  try {
    const data = await Notifications.getPermissionsAsync()
    return { data, error: null }
  } catch (error) {
    return { data: null, error }
  }
}

export async function registerForPushNotifications() {
  if (Platform.OS === 'web') {
    return {
      data: null,
      error: { message: 'Las notificaciones push no están configuradas para web.' },
    }
  }

  const { userId, error: userError } = await getAuthenticatedUserId()
  if (userError) return { data: null, error: userError }

  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync(NOTIFICATION_CHANNEL_ID, {
        name: 'Notificaciones de Quórum',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#8B5CF6',
      })
    }

    let permissions = await Notifications.getPermissionsAsync()
    if (!permissions.granted) {
      permissions = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: false,
          allowSound: true,
        },
      })
    }

    const provisionallyGranted =
      Platform.OS === 'ios' &&
      permissions.ios?.status === Notifications.IosAuthorizationStatus.PROVISIONAL
    if (!permissions.granted && !provisionallyGranted) {
      return {
        data: null,
        error: { message: 'No se otorgó permiso para recibir notificaciones.' },
      }
    }

    const projectId = getProjectId()
    if (!projectId) {
      return {
        data: null,
        error: {
          message: 'Falta configurar extra.eas.projectId en la configuración de Expo.',
        },
      }
    }

    const expoPushToken = await Notifications.getExpoPushTokenAsync({ projectId })
    const platform = Platform.OS
    if (!['ios', 'android'].includes(platform)) {
      return {
        data: null,
        error: { message: 'La plataforma de este dispositivo no es compatible.' },
      }
    }

    const { data: deviceId, error: registrationError } = await supabase.rpc(
      'registrar_dispositivo_push',
      {
        p_token: expoPushToken.data,
        p_plataforma: platform,
        p_nombre_dispositivo: null,
      }
    )

    if (registrationError) {
      return { data: null, error: registrationError }
    }

    return {
      data: {
        token: expoPushToken.data,
        deviceId,
        permissionStatus: permissions.status,
      },
      error: null,
    }
  } catch (error) {
    return {
      data: null,
      error: { message: error?.message || 'No se pudo registrar el dispositivo para push.' },
    }
  }
}

export async function unregisterPushNotifications(token) {
  if (typeof token !== 'string' || !token.trim()) {
    return { data: null, error: { message: 'No hay un token de este dispositivo para desactivar.' } }
  }

  const { userId, error: userError } = await getAuthenticatedUserId()
  if (userError) return { data: null, error: userError }

  const { data, error } = await supabase
    .from('dispositivo_push')
    .update({ activo: false })
    .eq('id_usuario', userId)
    .eq('token', token)
    .select('id')
    .maybeSingle()

  return { data: data ?? null, error: error ?? null }
}

export function addPushNotificationReceivedListener(listener) {
  if (Platform.OS === 'web') return { remove() {} }
  return Notifications.addNotificationReceivedListener(listener)
}

export function addPushNotificationResponseListener(listener) {
  if (Platform.OS === 'web') return { remove() {} }
  return Notifications.addNotificationResponseReceivedListener(listener)
}

export async function getLastPushNotificationResponse() {
  if (Platform.OS === 'web') return { data: null, error: null }
  try {
    return {
      data: await Notifications.getLastNotificationResponseAsync(),
      error: null,
    }
  } catch (error) {
    return { data: null, error }
  }
}

export async function clearLastPushNotificationResponse() {
  if (Platform.OS === 'web') return { error: null }
  if (typeof Notifications.clearLastNotificationResponseAsync !== 'function') {
    return { error: null }
  }

  try {
    await Notifications.clearLastNotificationResponseAsync()
    return { error: null }
  } catch (error) {
    return { error }
  }
}

export function removePushNotificationListener(subscription) {
  subscription?.remove?.()
}
