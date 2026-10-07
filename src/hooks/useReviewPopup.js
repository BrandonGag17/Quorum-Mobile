import { useCallback, useEffect, useState } from 'react'
import { getProximaJuntadaAResena, guardarResena } from '../services/resenaService'
import { getSession } from '../services/authService'

/**
 * Hook que maneja el popup de reseñas de juntadas
 * Verifica si hay juntadas pasadas hace 12+ horas que no han sido reseñadas
 */
export function useReviewPopup() {
  const [proximaJuntada, setProximaJuntada] = useState(null)
  const [mostrarPopup, setMostrarPopup] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [calificacionActual, setCalificacionActual] = useState(0)
  const [comentarioActual, setComentarioActual] = useState('')

  // Cargar la proxima juntada a reseñar
  const cargarProximaJuntada = useCallback(async () => {
    setLoading(true)
    setError(null)

    try {
      const {
        data: { session },
        error: sessionError,
      } = await getSession()

      if (sessionError || !session?.user?.id) {
        setMostrarPopup(false)
        setLoading(false)
        return
      }

      const { data: juntada, error: juntadaError } = await getProximaJuntadaAResena(
        session.user.id
      )

      if (juntadaError) {
        setError(juntadaError.message)
        setMostrarPopup(false)
      } else if (juntada) {
        setProximaJuntada(juntada)
        setMostrarPopup(true)
        setCalificacionActual(0)
        setComentarioActual('')
      } else {
        setMostrarPopup(false)
      }
    } catch (err) {
      setError(err.message)
      setMostrarPopup(false)
    } finally {
      setLoading(false)
    }
  }, [])

  // Enviar la reseña
  const enviarResena = useCallback(
    async (calificacion, comentario = '') => {
      if (!proximaJuntada) return

      setLoading(true)
      setError(null)

      try {
        const {
          data: { session },
          error: sessionError,
        } = await getSession()

        if (sessionError || !session?.user?.id) {
          throw new Error('No hay sesión activa')
        }

        const { error: resenaError } = await guardarResena(
          session.user.id,
          proximaJuntada.id,
          calificacion,
          comentario
        )

        if (resenaError) {
          throw resenaError
        }

        // Cerrar popup y cargar la siguiente juntada
        setMostrarPopup(false)
        setProximaJuntada(null)
        setCalificacionActual(0)
        setComentarioActual('')

        // Cargar la siguiente juntada (si existe)
        setTimeout(() => cargarProximaJuntada(), 500)
      } catch (err) {
        setError(err.message || 'No pudimos guardar la reseña')
      } finally {
        setLoading(false)
      }
    },
    [proximaJuntada, cargarProximaJuntada]
  )

  // Cerrar el popup sin enviar
  const cerrarPopup = useCallback(() => {
    setMostrarPopup(false)
    setCalificacionActual(0)
    setComentarioActual('')
  }, [])

  // Cargar juntadas al montar el componente
  useEffect(() => {
    cargarProximaJuntada()
  }, [cargarProximaJuntada])

  return {
    proximaJuntada,
    mostrarPopup,
    loading,
    error,
    calificacionActual,
    setCalificacionActual,
    comentarioActual,
    setComentarioActual,
    enviarResena,
    cerrarPopup,
    cargarProximaJuntada,
  }
}
