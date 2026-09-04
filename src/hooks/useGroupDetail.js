import { useEffect, useState, useCallback } from 'react'
import {
  getGroupById,
  getGroupMemberCount
} from '../services/groupService'
import {
  getConfirmedEventsByGroupId,
  getPastEventsByGroupId
} from '../services/eventoService'
import {
  getProposalsByGroupId
} from '../services/propuestaService'

export function useGroupDetail(groupId) {
  const [group, setGroup] = useState(null)
  const [memberCount, setMemberCount] = useState(0)
  const [upcomingEvents, setUpcomingEvents] = useState([])
  const [pastEvents, setPastEvents] = useState([])
  const [proposals, setProposals] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const refresh = useCallback(async () => {
    if (!groupId) {
      setGroup(null)
      setMemberCount(0)
      setUpcomingEvents([])
      setPastEvents([])
      setProposals([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const [
        groupRes,
        countRes,
        upcomingRes,
        pastRes,
        proposalsRes
      ] = await Promise.all([
        getGroupById(groupId),
        getGroupMemberCount(groupId),
        getConfirmedEventsByGroupId(groupId),
        getPastEventsByGroupId(groupId),
        getProposalsByGroupId(groupId)
      ])

      const errors = []

      if (groupRes.error) {
        errors.push(groupRes.error.message)
      } else {
        setGroup(groupRes.data ?? null)
      }

      if (countRes.error) {
        errors.push(countRes.error.message)
      } else {
        setMemberCount(countRes.data ?? 0)
      }

      if (upcomingRes.error) {
        errors.push(upcomingRes.error.message)
      } else {
        setUpcomingEvents(upcomingRes.data ?? [])
      }

      if (pastRes.error) {
        errors.push(pastRes.error.message)
      } else {
        setPastEvents(pastRes.data ?? [])
      }

      if (proposalsRes.error) {
        errors.push(proposalsRes.error.message)
      } else {
        setProposals(proposalsRes.data ?? [])
      }

      if (errors.length > 0) {
        setError(errors.join('\n'))
      }
    } catch (err) {
      setError(
        err?.message ||
        'Ocurrió un error al cargar el grupo'
      )
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    group,
    memberCount,
    upcomingEvents,
    pastEvents,
    proposals,
    loading,
    error,
    refresh
  }
}