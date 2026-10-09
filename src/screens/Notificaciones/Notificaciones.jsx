import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react'
import {
  ActivityIndicator,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useFocusEffect } from '@react-navigation/native'

import CardNoti from '../../components/CardNoti'
import ErrorMessage from '../../components/MensajeError'
import Loading from '../../components/Loading'
import { ThemeContext } from '../../context/ThemeContext'
import { useNotifications } from '../../hooks/useNotifications'
import { getNotificationActors } from '../../services/notificationService'
import { navigateFromNotification } from '../../utils/notificationNavigation'

const ACTION_LABELS = {
  grupo_agregado: 'Ir al grupo',
  propuesta_creada: 'Ir a la propuesta',
  evento_creado: 'Ir al evento',
  sugerencia_fecha_hora: 'Ir a la propuesta',
  votacion_cerrada: 'Ver propuesta',
  recordatorio_juntada: 'Ir a la juntada',
  juntada_cancelada: 'Ver juntada',
}

function startOfDay(value) {
  const date = new Date(value)
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime()
}

function getSectionTitle(createdAt) {
  const daysAgo = Math.floor((startOfDay(Date.now()) - startOfDay(createdAt)) / 86400000)
  if (daysAgo <= 0) return 'Hoy'
  if (daysAgo === 1) return 'Ayer'
  if (daysAgo < 7) return 'Últimos 7 días'
  return 'Anteriores'
}

function groupIntoSections(notifications) {
  const groups = new Map()
  notifications.forEach(notification => {
    const title = getSectionTitle(notification.creada_en)
    if (!groups.has(title)) groups.set(title, [])
    groups.get(title).push(notification)
  })

  const order = ['Hoy', 'Ayer', 'Últimos 7 días', 'Anteriores']
  return order
    .filter(title => groups.has(title))
    .map(title => ({ title, data: groups.get(title) }))
}

export default function Notificaciones({ navigation }) {
  const { colors, isDarkMode } = useContext(ThemeContext)
  const [actors, setActors] = useState({})
  const [actorsError, setActorsError] = useState(null)
  const [actionError, setActionError] = useState(null)
  const {
    notifications,
    loading,
    refreshing,
    loadingMore,
    hasMore,
    error,
    refresh,
    loadMore,
    markAsRead,
  } = useNotifications()

  const backgroundColor = colors?.background || '#15151C'
  const textColor = colors?.text || '#FFFFFF'
  const cardBackgroundColor = isDarkMode === false ? '#FFFFFF' : '#15151C'
  const sections = useMemo(() => groupIntoSections(notifications), [notifications])

  useFocusEffect(
    useCallback(() => {
      void refresh({ showLoading: false })
    }, [refresh])
  )

  useEffect(() => {
    let active = true
    const actorIds = [...new Set(
      notifications.map(notification => notification.origen_id).filter(Boolean)
    )]

    if (actorIds.length === 0) {
      setActors({})
      setActorsError(null)
      return undefined
    }

    getNotificationActors(actorIds).then(({ data, error: requestError }) => {
      if (!active) return
      if (requestError) {
        setActorsError(requestError.message || 'No se pudieron cargar los perfiles de quienes notificaron.')
        return
      }
      setActors(data ?? {})
      setActorsError(null)
    }).catch(requestError => {
      if (active) {
        setActorsError(requestError?.message || 'No se pudieron cargar los perfiles de quienes notificaron.')
      }
    })

    return () => {
      active = false
    }
  }, [notifications])

  const openNotification = useCallback(async (notification) => {
    setActionError(null)
    try {
      if (!notification?.leida_en) {
        await markAsRead(notification.id)
      }
      if (!navigateFromNotification(navigation, notification)) {
        setActionError('No se pudo abrir el contenido de esta notificación.')
      }
    } catch (requestError) {
      setActionError(requestError?.message || 'No se pudo abrir la notificación.')
    }
  }, [markAsRead, navigation])

  const renderItem = useCallback(({ item }) => (
    <CardNoti
      notification={item}
      actor={actors[item.origen_id]}
      actionLabel={ACTION_LABELS[item.tipo] || 'Ver notificación'}
      onPress={() => openNotification(item)}
      onActionPress={() => openNotification(item)}
    />
  ), [actors, openNotification])

  if (loading && notifications.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Loading />
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor }]} edges={['top']}>
      <SectionList
        sections={sections}
        keyExtractor={item => item.id}
        renderItem={renderItem}
        renderSectionHeader={({ section }) => (
          <View style={[styles.sectionHeader, { backgroundColor }]}>
            <Text style={[styles.sectionTitle, { color: textColor }]}>{section.title}</Text>
          </View>
        )}
        ListHeaderComponent={(
          <View style={[styles.header, { backgroundColor }]}>
            <Text style={[styles.title, { color: textColor }]}>Notificaciones</Text>
          </View>
        )}
        ListEmptyComponent={(
          <View style={styles.emptyContainer}>
            {error
              ? <ErrorMessage mensaje={error} />
              : (
                <>
                  <Text style={[styles.emptyTitle, { color: textColor }]}>Todavía no tenés notificaciones</Text>
                  <Text style={[styles.emptyText, { color: textColor }]}>
                    Cuando haya novedades de tus grupos o juntadas, las vas a ver acá.
                  </Text>
                </>
              )}
        </View>
        )}
        ListFooterComponent={(
          <View style={styles.footer}>
            {error && notifications.length > 0
              ? <ErrorMessage mensaje={error} />
              : null}
            {actionError ? <ErrorMessage mensaje={actionError} /> : null}
            {actorsError ? <ErrorMessage mensaje={actorsError} /> : null}
            {loadingMore
              ? <ActivityIndicator color="#A846E9" style={styles.moreLoading} />
              : null}
            {!loadingMore && hasMore && notifications.length > 0
              ? <Text style={[styles.moreText, { color: textColor }]}>Deslizá para ver más</Text>
              : null}
          </View>
        )}
        style={styles.list}
        contentContainerStyle={[
          styles.listContent,
          notifications.length === 0 && styles.emptyListContent,
          { backgroundColor: cardBackgroundColor },
        ]}
        stickySectionHeadersEnabled={false}
        refreshing={refreshing}
        onRefresh={() => refresh({ showLoading: false })}
        onEndReached={() => {
          if (hasMore && !loadingMore) void loadMore()
        }}
        onEndReachedThreshold={0.35}
        keyboardShouldPersistTaps="handled"
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  panel: {
    flex: 1,
    borderRadius: 36,
    overflow: 'hidden',
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: 105,
  },
  header: {
    paddingHorizontal: 18,
    paddingTop: 28,
    paddingBottom: 6,
  },
  title: {
    fontSize: 30,
    lineHeight: 36,
    fontFamily: 'CashMarket',
  },
  sectionHeader: {
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 15,
    lineHeight: 20,
    fontFamily: 'CashMarket',
  },
  emptyListContent: {
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
    paddingBottom: 100,
  },
  emptyTitle: {
    fontFamily: 'CashMarket',
    fontSize: 20,
    textAlign: 'center',
  },
  emptyText: {
    fontFamily: 'Utendo',
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.72,
    textAlign: 'center',
    marginTop: 8,
  },
  footer: {
    paddingHorizontal: 20,
    paddingVertical: 14,
  },
  moreLoading: {
    marginVertical: 12,
  },
  moreText: {
    fontFamily: 'Utendo',
    fontSize: 13,
    opacity: 0.6,
    textAlign: 'center',
    paddingVertical: 10,
  },
  loadingContainer: {
    flex: 1,
  },
})