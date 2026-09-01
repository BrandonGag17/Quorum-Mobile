import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { getSession } from '../services/authService'
import { getGroupMemberCount } from '../services/groupService'
import {
  finalizeJuntadaSurvey,
  getJuntadaById,
  getJuntadaGoingCount,
  getJuntadaGoingUsers,
  getJuntadaSurveyByEventId,
  getJuntadaUserAttendance,
  upsertJuntadaAttendance
} from '../services/juntadaService'

function formatTimeRemaining(cierreEn) {
  if (!cierreEn) {
    return ''
  }

  const now = new Date()
  const cierre = new Date(cierreEn)
  const diff = cierre.getTime() - now.getTime()

  if (Number.isNaN(cierre.getTime()) || diff <= 0) {
    return 'Finalizada'
  }

  const dias = Math.floor(diff / (1000 * 60 * 60 * 24))
  const horas = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60))
  const minutos = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
  const segundos = Math.floor((diff % (1000 * 60)) / 1000)

  return `${dias} días ${horas} horas ${minutos} minutos ${segundos} segundos`
}

function isSurveyExpired(cierreEn) {
  if (!cierreEn) {
    return false
  }

  const cierre = new Date(cierreEn)

  if (Number.isNaN(cierre.getTime())) {
    return false
  }

  return new Date() >= cierre
}

export function useJuntadaDetail(eventId) {
  const [event, setEvent] = useState(null)
  const [survey, setSurvey] = useState(null)
  const [memberCount, setMemberCount] = useState(0)
  const [goingCount, setGoingCount] = useState(0)
  const [goingUsers, setGoingUsers] = useState([])
  const [myAttendance, setMyAttendance] = useState(null)
  const [userId, setUserId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [error, setError] = useState(null)
  const [nowTick, setNowTick] = useState(Date.now())

  const autoFinalizedRef = useRef(false)

  const refreshAttendanceSummary = useCallback(async (idEvento) => {
    if (!idEvento) {
      setGoingCount(0)
      setGoingUsers([])
      return
    }

    const [countRes, usersRes] = await Promise.all([
      getJuntadaGoingCount(idEvento),
      getJuntadaGoingUsers(idEvento, 5)
    ])

    if (!countRes.error) {
      setGoingCount(countRes.data ?? 0)
    }

    if (!usersRes.error) {
      setGoingUsers(usersRes.data ?? [])
    }
  }, [])

  const refresh = useCallback(async () => {
    if (!eventId) {
      setEvent(null)
      setSurvey(null)
      setMemberCount(0)
      setGoingCount(0)
      setGoingUsers([])
      setMyAttendance(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const { data: sessionData, error: sessionError } = await getSession()

      if (sessionError) {
        setError(sessionError.message)
        setLoading(false)
        return
      }

      const currentUserId = sessionData?.session?.user?.id ?? null
      setUserId(currentUserId)

      const [eventRes, surveyRes] = await Promise.all([
        getJuntadaById(eventId),
        getJuntadaSurveyByEventId(eventId)
      ])

      const nextErrors = []

      if (eventRes.error) {
        nextErrors.push(eventRes.error.message)
      } else {
        setEvent(eventRes.data ?? null)
      }

      if (surveyRes.error) {
        nextErrors.push(surveyRes.error.message)
      } else {
        setSurvey(surveyRes.data ?? null)
      }

      const nextEvent = eventRes.data ?? null
      const nextSurvey = surveyRes.data ?? null

      if (nextEvent?.id_grupo) {
        const memberCountRes = await getGroupMemberCount(nextEvent.id_grupo)

        if (memberCountRes.error) {
          nextErrors.push(memberCountRes.error.message)
        } else {
          setMemberCount(memberCountRes.data ?? 0)
        }
      }

      await refreshAttendanceSummary(eventId)

      if (currentUserId) {
        const { data: attendanceRes, error: attendanceError } = await getJuntadaUserAttendance(
          eventId,
          currentUserId
        )

        if (attendanceError) {
          nextErrors.push(attendanceError.message)
        } else {
          setMyAttendance(attendanceRes?.asistencia ?? null)
        }
      } else {
        setMyAttendance(null)
      }

      if (
        nextSurvey?.activa &&
        isSurveyExpired(nextSurvey.cierre_en) &&
        !autoFinalizedRef.current
      ) {
        const { data: finalizado, error: finalizeError } = await finalizeJuntadaSurvey({
          eventId,
          survey: nextSurvey
        })

        if (finalizeError) {
          nextErrors.push(finalizeError.message)
        }

        if (finalizado?.event) {
          setEvent(finalizado.event)
        }

        if (finalizado?.survey) {
          setSurvey(finalizado.survey)
        } else {
          setSurvey(prev => prev ? { ...prev, activa: false } : prev)
        }

        if (finalizado?.event || finalizado?.survey) {
          autoFinalizedRef.current = true
        }
      }

      if (nextErrors.length > 0) {
        setError(nextErrors.join('\n'))
      }
    } catch (err) {
      setError(err?.message || 'Ocurrió un error al cargar la juntada')
    } finally {
      setLoading(false)
    }
  }, [eventId, refreshAttendanceSummary])

  useEffect(() => {
    autoFinalizedRef.current = false
    refresh()
  }, [refresh])

  useEffect(() => {
    if (!survey?.activa || !survey?.cierre_en) {
      return undefined
    }

    setNowTick(Date.now())

    const interval = setInterval(() => {
      setNowTick(Date.now())
    }, 1000)

    return () => clearInterval(interval)
  }, [survey?.activa, survey?.cierre_en])

  const timeRemaining = useMemo(() => {
    if (!survey?.activa || !survey?.cierre_en) {
      return ''
    }

    const remaining = formatTimeRemaining(survey.cierre_en)
    return remaining
  }, [survey?.activa, survey?.cierre_en, nowTick])

  const changeAttendance = useCallback(async (asistencia) => {
    if (!eventId || !userId) {
      return {
        data: null,
        error: {
          message: 'No se pudo determinar el usuario activo'
        }
      }
    }

    setActionLoading(true)
    setError(null)

    try {
      const { data, error: attendanceError } = await upsertJuntadaAttendance({
        eventId,
        userId,
        asistencia
      })

      if (attendanceError) {
        setError(attendanceError.message || 'No se pudo guardar la asistencia')
        return { data: null, error: attendanceError }
      }

      setMyAttendance(asistencia)
      await refreshAttendanceSummary(eventId)

      return { data, error: null }
    } catch (err) {
      setError(err?.message || 'No se pudo guardar la asistencia')
      return { data: null, error: err }
    } finally {
      setActionLoading(false)
    }
  }, [eventId, userId, refreshAttendanceSummary])

  const finalizeSurvey = useCallback(async () => {
    if (!eventId || !survey) {
      return { data: null, error: { message: 'No hay encuesta para finalizar' } }
    }

    setActionLoading(true)
    setError(null)

    try {
      const { data, error: finalizeError } = await finalizeJuntadaSurvey({
        eventId,
        survey
      })

      if (finalizeError) {
        setError(finalizeError.message || 'No se pudo finalizar la votación')
        return { data: null, error: finalizeError }
      }

      if (data?.event) {
        setEvent(data.event)
      }

      if (data?.survey) {
        setSurvey(data.survey)
      }

      autoFinalizedRef.current = true

      return { data, error: null }
    } catch (err) {
      setError(err?.message || 'No se pudo finalizar la votación')
      return { data: null, error: err }
    } finally {
      setActionLoading(false)
    }
  }, [eventId, survey])

  return {
    event,
    survey,
    memberCount,
    goingCount,
    goingUsers,
    myAttendance,
    userId,
    loading,
    actionLoading,
    error,
    timeRemaining,
    isCreator: !!(event?.id_creador && userId && event.id_creador === userId),
    surveyExpired: isSurveyExpired(survey?.cierre_en),
    refresh,
    changeAttendance,
    finalizeSurvey
  }
}