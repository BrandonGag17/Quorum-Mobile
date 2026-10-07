import { useCallback, useEffect, useMemo, useState } from 'react'
import { useFocusEffect } from '@react-navigation/native'
import { getSession } from '../services/authService'
import {
  obtenerRecomendacionesUsuario,
  obtenerUrlGoogleMaps,
} from '../services/recomendacionService'

export default function useRecommendations() {
  const [lugares, setLugares] = useState([])
  const [busqueda, setBusqueda] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [userId, setUserId] = useState(null)

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

    try {
      const {
        data: { session },
        error: sessionError,
      } = await getSession()

      if (sessionError) {
        setLugares([])
        setError(sessionError.message || 'No se pudo obtener la sesión')
        setLoading(false)
        return
      }

      if (!session?.user?.id) {
        setLugares([])
        setError('No hay sesión activa')
        setLoading(false)
        return
      }

      setUserId(session.user.id)

      const data = await obtenerRecomendacionesUsuario({
        userId: session.user.id,
      })

      setLugares(data || [])
      setError('')
    } catch (err) {
      setLugares([])
      setError(err?.message || 'No se pudieron cargar recomendaciones')
      console.error('[useRecommendations] Error:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Cargar recomendaciones cuando se enfoca la pantalla
  useFocusEffect(
    useCallback(() => {
      refresh()
    }, [refresh])
  )

  const lugaresFiltrados = useMemo(() => {
    const query = busqueda.trim().toLowerCase()

    if (!query) {
      return lugares
    }

    return lugares.filter((lugar) => {
      const nombre = (lugar.nombre || '').toLowerCase()
      const direccion = (lugar.direccion || '').toLowerCase()
      return nombre.includes(query) || direccion.includes(query)
    })
  }, [lugares, busqueda])

  const getGoogleMapsUrl = useCallback((lugar) => {
    return obtenerUrlGoogleMaps(lugar)
  }, [])

  return {
    lugares,
    lugaresFiltrados,
    busqueda,
    setBusqueda,
    loading,
    error,
    refresh,
    getGoogleMapsUrl,
    userId,
  }
}