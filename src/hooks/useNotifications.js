import { useCallback, useEffect, useRef, useState } from 'react'

import supabase from '../services/supabaseClient'
import {
  getNotifications,
  getUnreadNotificationCount,
  markAllNotificationsAsRead,
  markNotificationAsRead,
  subscribeToNotificationChanges,
  unsubscribeFromNotificationChanges,
} from '../services/notificationService'

const PAGE_SIZE = 30

export function useNotifications() {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState(null)
  const requestRef = useRef(0)
  const channelRef = useRef(null)
  const currentUserIdRef = useRef(undefined)
  const notificationIdsRef = useRef(new Set())
  const nextOffsetRef = useRef(0)

  const refresh = useCallback(async ({ showLoading = true } = {}) => {
    const requestId = ++requestRef.current
    if (showLoading) setLoading(true)
    setRefreshing(true)
    setError(null)

    try {
      const [notificationResult, countResult] = await Promise.all([
        getNotifications({ limit: PAGE_SIZE, offset: 0 }),
        getUnreadNotificationCount(),
      ])

      if (requestId !== requestRef.current) return { error: null }
      if (notificationResult.error) throw notificationResult.error
      if (countResult.error) throw countResult.error

      const nextNotifications = notificationResult.data ?? []
      notificationIdsRef.current = new Set(nextNotifications.map(notification => notification.id))
      nextOffsetRef.current = nextNotifications.length
      setNotifications(nextNotifications)
      setUnreadCount(countResult.data ?? 0)
      setHasMore(nextNotifications.length === PAGE_SIZE)
      return { error: null }
    } catch (requestError) {
      if (requestId === requestRef.current) {
        setError(requestError?.message || 'No se pudieron cargar las notificaciones.')
      }
      return { error: requestError }
    } finally {
      if (requestId === requestRef.current) {
        setLoading(false)
        setRefreshing(false)
      }
    }
  }, [])

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore || loading) return { error: null }
    setLoadingMore(true)
    setError(null)

    try {
      const { data, error: requestError } = await getNotifications({
        limit: PAGE_SIZE,
        offset: nextOffsetRef.current,
      })
      if (requestError) throw requestError

      const nextPage = data ?? []
      nextOffsetRef.current += nextPage.length
      setNotifications(current => {
        const existingIds = new Set(current.map(notification => notification.id))
        const uniquePage = nextPage.filter(notification => !existingIds.has(notification.id))
        uniquePage.forEach(notification => notificationIdsRef.current.add(notification.id))
        return [...current, ...uniquePage]
      })
      setHasMore(nextPage.length === PAGE_SIZE)
      return { error: null }
    } catch (requestError) {
      setError(requestError?.message || 'No se pudieron cargar más notificaciones.')
      return { error: requestError }
    } finally {
      setLoadingMore(false)
    }
  }, [hasMore, loading, loadingMore])

  const markAsRead = useCallback(async (notificationId) => {
    const { data, error: updateError } = await markNotificationAsRead(notificationId)
    if (updateError) {
      setError(updateError.message || 'No se pudo marcar la notificación como leída.')
      return { data: null, error: updateError }
    }

    if (data) {
      setNotifications(current => current.map(notification =>
        notification.id === data.id
          ? { ...notification, leida_en: data.leida_en }
          : notification
      ))
      const { data: count, error: countError } = await getUnreadNotificationCount()
      if (countError) {
        setError(countError.message || 'No se pudo actualizar el contador de notificaciones.')
      } else {
        setUnreadCount(count)
      }
    }
    return { data, error: null }
  }, [])

  const markAllAsRead = useCallback(async () => {
    const { data, error: updateError } = await markAllNotificationsAsRead()
    if (updateError) {
      setError(updateError.message || 'No se pudieron marcar las notificaciones como leídas.')
      return { data: null, error: updateError }
    }

    const readAt = new Date().toISOString()
    const updatedIds = new Set((data ?? []).map(row => row.id))
    setNotifications(current => current.map(notification =>
      updatedIds.has(notification.id)
        ? { ...notification, leida_en: readAt }
        : notification
    ))
    setUnreadCount(0)
    return { data, error: null }
  }, [])

  useEffect(() => {
    let active = true
    let authSubscription
    let subscriptionGeneration = 0

    const startForUser = async (userId) => {
      if (!active || userId === currentUserIdRef.current) return
      currentUserIdRef.current = userId
      const generation = ++subscriptionGeneration
      requestRef.current += 1

      if (channelRef.current) {
        await unsubscribeFromNotificationChanges(channelRef.current)
        channelRef.current = null
      }

      if (!active || generation !== subscriptionGeneration) return
      setNotifications([])
      notificationIdsRef.current = new Set()
      nextOffsetRef.current = 0
      setUnreadCount(0)
      setHasMore(true)
      setError(null)

      if (!userId) {
        setLoading(false)
        setRefreshing(false)
        return
      }

      await refresh()
      if (!active || generation !== subscriptionGeneration) return

      const { data: channel, error: subscribeError } = await subscribeToNotificationChanges(
        async (change) => {
          if (!active || generation !== subscriptionGeneration) return
          const changedNotification = change.new ?? change.old

          if (change.eventType === 'INSERT' && change.new) {
            if (notificationIdsRef.current.has(change.new.id)) return
            notificationIdsRef.current.add(change.new.id)
            setNotifications(current => [
              change.new,
              ...current.filter(notification => notification.id !== change.new.id),
            ])
            setUnreadCount(count => count + (change.new.leida_en ? 0 : 1))
          } else if (change.eventType === 'UPDATE' && change.new) {
            setNotifications(current => current.map(notification =>
              notification.id === change.new.id ? change.new : notification
            ))
            getUnreadNotificationCount().then(({ data, error: countError }) => {
              if (!active) return
              if (countError) {
                setError(countError.message || 'No se pudo actualizar el contador de notificaciones.')
              } else {
                setUnreadCount(data)
              }
            })
          } else if (change.eventType === 'DELETE' && changedNotification?.id) {
            notificationIdsRef.current.delete(changedNotification.id)
            setNotifications(current => current.filter(notification =>
              notification.id !== changedNotification.id
            ))
            if (!changedNotification.leida_en) {
              setUnreadCount(count => Math.max(0, count - 1))
            }
          }
        },
        (status, statusError) => {
          if (active && status === 'CHANNEL_ERROR') {
            setError(statusError?.message || 'No se pudo conectar a las notificaciones en tiempo real.')
          }
        }
      )

      if (!active || generation !== subscriptionGeneration) {
        if (channel) await unsubscribeFromNotificationChanges(channel)
        return
      }
      if (subscribeError) {
        setError(subscribeError.message || 'No se pudo activar las notificaciones en tiempo real.')
      } else {
        channelRef.current = channel
      }
    }

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      const nextUserId = session?.user?.id ?? null
      if (nextUserId !== currentUserIdRef.current) {
        void startForUser(nextUserId)
      }
    })
    authSubscription = authListener?.subscription

    supabase.auth.getSession().then(({ data, error: sessionError }) => {
      if (!active) return
      if (sessionError) {
        setError(sessionError.message || 'No se pudo comprobar la sesión.')
        setLoading(false)
        return
      }
      void startForUser(data?.session?.user?.id ?? null)
    }).catch(sessionError => {
      if (active) {
        setError(sessionError?.message || 'No se pudo comprobar la sesión.')
        setLoading(false)
      }
    })

    return () => {
      active = false
      requestRef.current += 1
      subscriptionGeneration += 1
      authSubscription?.unsubscribe?.()
      if (channelRef.current) {
        void unsubscribeFromNotificationChanges(channelRef.current)
        channelRef.current = null
      }
    }
  }, [refresh])

  return {
    notifications,
    unreadCount,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    markAsRead,
    markAllAsRead,
  }
}