import { useCallback, useEffect, useState } from 'react'
import { getSession } from '../services/authService'
import { getGroupsForUser } from '../services/groupService'
import { getUpcomingConfirmedEventsForUser } from '../services/eventoService'

export function useHomeSummary() {
  const [groups, setGroups] = useState([])
  const [events, setEvents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

    const {
      data: { session },
      error: sessionError,
    } = await getSession()

    if (sessionError) {
      setError('No se pudo obtener la sesión.')
      setGroups([])
      setEvents([])
      setLoading(false)
      return
    }

    if (!session?.user?.id) {
      setGroups([])
      setEvents([])
      setLoading(false)
      return
    }

    const [groupsRes, eventsRes] = await Promise.all([
      getGroupsForUser(session.user.id),
      getUpcomingConfirmedEventsForUser(session.user.id),
    ])

    if (groupsRes.error) {
      setError(groupsRes.error.message)
      setGroups([])
    } else {
      setGroups(groupsRes.data ?? [])
    }

    if (eventsRes.error) {
      setError(eventsRes.error.message)
      setEvents([])
    } else {
      setEvents(eventsRes.data ?? [])
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    groups,
    events,
    loading,
    error,
    refresh,
  }
}