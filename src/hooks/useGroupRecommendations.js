import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  obtenerRecomendacionesGrupo,
  obtenerUrlGoogleMaps,
} from '../services/recomendacionService'

export default function useGroupRecommendations(groupId) {
  const [lugares, setLugares] = useState([])
  const [lugaresSeleccionados, setLugaresSeleccionados] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const idsMostradosRef = useRef(new Set())

  const cargarRecomendaciones = useCallback(async ({ reiniciar = false } = {}) => {
    if (!groupId) {
      setLugares([])
      setError('No se recibió el grupo para generar recomendaciones')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    if (reiniciar) {
      idsMostradosRef.current = new Set()
    }

    try {
      const recomendaciones = await obtenerRecomendacionesGrupo({
        groupId,
        limit: 5,
        excluirIds: [...idsMostradosRef.current],
      })

      setLugares(recomendaciones)

      recomendaciones.forEach((lugar) => {
        idsMostradosRef.current.add(String(lugar.id))
      })
    } catch (err) {
      setLugares([])
      setError(
        err?.message ||
        'No se pudieron cargar las recomendaciones del grupo'
      )
    } finally {
      setLoading(false)
    }
  }, [groupId])

  useEffect(() => {
    setLugaresSeleccionados([])
    cargarRecomendaciones({ reiniciar: true })
  }, [cargarRecomendaciones])

  const idsSeleccionados = useMemo(
    () => new Set(lugaresSeleccionados.map((lugar) => String(lugar.id))),
    [lugaresSeleccionados]
  )

  function estaSeleccionado(lugar) {
    return idsSeleccionados.has(String(lugar.id))
  }

  function alternarSeleccion(lugar) {
    setLugaresSeleccionados((seleccionActual) => {
      const yaSeleccionado = seleccionActual.some(
        (seleccionado) => String(seleccionado.id) === String(lugar.id)
      )

      if (yaSeleccionado) {
        return seleccionActual.filter(
          (seleccionado) => String(seleccionado.id) !== String(lugar.id)
        )
      }

      return [...seleccionActual, lugar]
    })
  }

  const getGoogleMapsUrl = useCallback((lugar) => {
    return obtenerUrlGoogleMaps(lugar)
  }, [])

  return {
    lugares,
    lugaresSeleccionados,
    cantidadSeleccionados: lugaresSeleccionados.length,
    loading,
    error,
    estaSeleccionado,
    alternarSeleccion,
    getGoogleMapsUrl,
    volverARecomendar: cargarRecomendaciones,
    reintentar: cargarRecomendaciones,
  }
}
