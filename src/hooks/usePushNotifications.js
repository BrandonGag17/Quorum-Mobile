import { useCallback, useEffect, useRef, useState } from 'react'

import {
  addPushNotificationReceivedListener,
  addPushNotificationResponseListener,
  clearLastPushNotificationResponse,
  getLastPushNotificationResponse,
  getPushPermissionStatus,
  registerForPushNotifications,
  removePushNotificationListener,
  unregisterPushNotifications,
} from '../services/pushNotificationService'

function getNotificationFromResponse(response) {
  const notification = response?.notification
  if (!notification) return null

  return {
    ...notification.request.content.data,
    titulo: notification.request.content.title,
    descripcion: notification.request.content.body,
  }
}

export function usePushNotifications({ onNotificationResponse } = {}) {
  const [permissionStatus, setPermissionStatus] = useState(null)
  const [token, setToken] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastNotification, setLastNotification] = useState(null)
  const responseCallbackRef = useRef(onNotificationResponse)
  const mountedRef = useRef(true)

  useEffect(() => {
    responseCallbackRef.current = onNotificationResponse
  }, [onNotificationResponse])

  useEffect(() => {
    mountedRef.current = true
    let receivedSubscription
    let responseSubscription

    getPushPermissionStatus().then(({ data, error: permissionError }) => {
      if (!mountedRef.current) return
      if (permissionError) {
        setError(permissionError.message || 'No se pudo consultar el permiso de notificaciones.')
        return
      }
      setPermissionStatus(data?.status ?? null)
    })

    receivedSubscription = addPushNotificationReceivedListener(notification => {
      if (mountedRef.current) setLastNotification(notification)
    })

    const handleResponse = response => {
      const notification = getNotificationFromResponse(response)
      if (!notification || !mountedRef.current) return
      setLastNotification(notification)
      responseCallbackRef.current?.(notification, response)
      void clearLastPushNotificationResponse()
    }

    responseSubscription = addPushNotificationResponseListener(handleResponse)
    getLastPushNotificationResponse().then(({ data, error: responseError }) => {
      if (!mountedRef.current) return
      if (responseError) {
        setError(responseError.message || 'No se pudo recuperar la notificación abierta.')
      } else if (data) {
        handleResponse(data)
      }
    })

    return () => {
      mountedRef.current = false
      removePushNotificationListener(receivedSubscription)
      removePushNotificationListener(responseSubscription)
    }
  }, [])

  const register = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const { data, error: registrationError } = await registerForPushNotifications()
      if (registrationError) {
        setError(registrationError.message || 'No se pudo activar las notificaciones push.')
        return { data: null, error: registrationError }
      }

      setToken(data?.token ?? null)
      setPermissionStatus(data?.permissionStatus ?? 'granted')
      return { data, error: null }
    } catch (registrationError) {
      setError(registrationError?.message || 'No se pudo activar las notificaciones push.')
      return { data: null, error: registrationError }
    } finally {
      setLoading(false)
    }
  }, [])

  const unregister = useCallback(async () => {
    if (!token) {
      return { data: null, error: { message: 'Este dispositivo todavía no está registrado.' } }
    }

    setLoading(true)
    setError(null)
    try {
      const { data, error: unregisterError } = await unregisterPushNotifications(token)
      if (unregisterError) {
        setError(unregisterError.message || 'No se pudo desactivar este dispositivo.')
        return { data: null, error: unregisterError }
      }
      setToken(null)
      return { data, error: null }
    } catch (unregisterError) {
      setError(unregisterError?.message || 'No se pudo desactivar este dispositivo.')
      return { data: null, error: unregisterError }
    } finally {
      setLoading(false)
    }
  }, [token])

  return {
    permissionStatus,
    token,
    loading,
    error,
    lastNotification,
    register,
    unregister,
  }
}
