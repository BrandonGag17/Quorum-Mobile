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

  // Usamos una referencia porque el historial sirve para hacer consultas, pero
  // no necesita provocar un nuevo renderizado cada vez que cambia.
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

    // Al cambiar de grupo empezamos un historial nuevo. Al presionar
    // "volver a recomendar", en cambio, enviamos todos los IDs ya vistos.
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

  // Si la pantalla recibe otro grupo, descartamos tanto los resultados como
  // las selecciones anteriores para que nunca se mezclen propuestas.
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

  // Centralizamos aquí la construcción de la URL para usar exactamente el
  // mismo formato que las recomendaciones personales.
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
