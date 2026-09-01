import { useCallback, useEffect, useMemo, useState } from 'react'
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

      const data = await obtenerRecomendacionesUsuario({
        userId: session?.user?.id,
      })

      setLugares(data)
    } catch (err) {
      setLugares([])
      setError(err?.message || 'No se pudieron cargar recomendaciones')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

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
  }
}