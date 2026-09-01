import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  obtenerCategoriaPrincipal,
  obtenerInfoRecomendacion,
  obtenerUrlGoogleMaps,
} from '../services/recomendacionService'

export default function useRecommendationDetail(initialPlace) {
  const [lugar, setLugar] = useState(initialPlace || null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    if (!initialPlace) {
      setLugar(null)
      setLoading(false)
      setError('')
      return
    }

    setLoading(true)
    setError('')

    try {
      const data = await obtenerInfoRecomendacion(initialPlace)
      setLugar(data)
    } catch (err) {
      setLugar(initialPlace)
      setError(err?.message || 'No se pudo cargar la información del lugar')
    } finally {
      setLoading(false)
    }
  }, [initialPlace])

  useEffect(() => {
    refresh()
  }, [refresh])

  const categoria = useMemo(() => {
    return obtenerCategoriaPrincipal(lugar?.categoria)
  }, [lugar?.categoria])

  const googleMapsUrl = useMemo(() => {
    return obtenerUrlGoogleMaps(lugar)
  }, [lugar])

  return {
    lugar,
    categoria,
    googleMapsUrl,
    loading,
    error,
    refresh,
  }
}