import { useCallback, useEffect, useMemo, useState } from 'react'
import { getSession } from '../services/authService'
import { getGroupMemberCount } from '../services/groupService'
import {
  getVotacionByEventId,
  getVotosForSurvey,
  toggleVote
} from '../services/votacionService'

function buildCounts(options, votes) {
  const counts = {}

  options.forEach(option => {
    counts[option.id] = 0
  })

  votes.forEach(vote => {
    counts[vote.id_opcion] = (counts[vote.id_opcion] ?? 0) + 1
  })

  return counts
}

export function useVotacionDetail(eventId) {
  const [survey, setSurvey] = useState(null)
  const [event, setEvent] = useState(null)
  const [groupMemberCount, setGroupMemberCount] = useState(0)
  const [voteCounts, setVoteCounts] = useState({})
  const [myVotes, setMyVotes] = useState([])
  const [currentUserId, setCurrentUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)

  const refreshVotes = useCallback(async (nextSurvey, userId = currentUserId) => {
    if (!nextSurvey?.id) {
      setVoteCounts({})
      setMyVotes([])
      return
    }

    const options = nextSurvey.opcion_encuesta ?? []
    const { data: votes, error: votesError } = await getVotosForSurvey(nextSurvey.id)

    if (votesError) {
      throw votesError
    }

    setVoteCounts(buildCounts(options, votes ?? []))

    if (userId) {
      setMyVotes(
        (votes ?? [])
          .filter(vote => vote.id_usuario === userId)
          .map(vote => vote.id_opcion)
      )
    } else {
      setMyVotes([])
    }
  }, [currentUserId])

  const refresh = useCallback(async () => {
    if (!eventId) {
      setSurvey(null)
      setEvent(null)
      setGroupMemberCount(0)
      setVoteCounts({})
      setMyVotes([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: sessionData, error: sessionError } = await getSession()

      if (sessionError) {
        throw sessionError
      }

      const userId = sessionData?.session?.user?.id ?? null
      setCurrentUserId(userId)

      const { data, error: surveyError } = await getVotacionByEventId(eventId)

      if (surveyError) {
        throw surveyError
      }

      if (!data) {
        setSurvey(null)
        setEvent(null)
        setGroupMemberCount(0)
        setVoteCounts({})
        setMyVotes([])
        return
      }

      setSurvey(data)
      setEvent(data.evento ?? null)

      const groupId = data.evento?.id_grupo
      if (groupId) {
        const { data: countData, error: countError } = await getGroupMemberCount(groupId)

        if (countError) {
          throw countError
        }

        setGroupMemberCount(countData ?? 0)
      } else {
        setGroupMemberCount(0)
      }

      await refreshVotes(data, userId)
    } catch (err) {
      setError(err?.message || 'Ocurrió un error al cargar la votación')
    } finally {
      setLoading(false)
    }
  }, [eventId, refreshVotes])

  useEffect(() => {
    refresh()
  }, [refresh])

  const categories = useMemo(() => {
    const options = survey?.opcion_encuesta ?? []
    return {
      fechas: options.filter(option => option.tipo === 'fecha'),
      lugares: options.filter(option => option.tipo === 'lugar')
    }
  }, [survey])

  const voteOption = useCallback(async (optionId) => {
    if (!survey?.activa) {
      return {
        data: null,
        error: {
          message: 'La votación ya no está activa'
        }
      }
    }

    if (!currentUserId) {
      return {
        data: null,
        error: {
          message: 'No se pudo obtener el usuario actual'
        }
      }
    }

    setActionLoading(true)
    setError(null)

    try {
      const { data, error: voteError } = await toggleVote({
        userId: currentUserId,
        optionId
      })

      if (voteError) {
        throw voteError
      }

      const options = survey?.opcion_encuesta ?? []
      const { data: votes, error: votesError } = await getVotosForSurvey(survey.id)

      if (votesError) {
        throw votesError
      }

      setVoteCounts(buildCounts(options, votes ?? []))
      setMyVotes(
        (votes ?? [])
          .filter(vote => vote.id_usuario === currentUserId)
          .map(vote => vote.id_opcion)
      )

      return { data, error: null }
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el voto')
      return { data: null, error: err }
    } finally {
      setActionLoading(false)
    }
  }, [currentUserId, survey])

  return {
    survey,
    event,
    groupMemberCount,
    voteCounts,
    myVotes,
    loading,
    actionLoading,
    error,
    categories,
    refresh,
    voteOption,
    isCreator: !!(currentUserId && event?.id_creador && currentUserId === event.id_creador)
  }
}
