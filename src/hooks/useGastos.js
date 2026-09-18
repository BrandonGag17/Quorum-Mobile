import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createGasto,
  getGastosByEventId,
  getHistorialGastosByEventId,
  getPersonasByEventId,
} from '../services/gastoService'

export default function useGastos(eventId) {
  const [gastos, setGastos] = useState([])
  const [historial, setHistorial] = useState([])
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cargarGastos = useCallback(async () => {
    if (!eventId) {
      setGastos([])
      setHistorial([])
      setPersonas([])
      setError('No se recibió el evento para cargar sus gastos')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      const [
        respuestaGastos, respuestaPersonas, respuestaHistorial,
      ] = await Promise.all([getGastosByEventId(eventId), getPersonasByEventId(eventId), getHistorialGastosByEventId(eventId),
      ])

      if (
        respuestaGastos.error ||
        respuestaPersonas.error ||
        respuestaHistorial.error
      ) {
        setGastos([])
        setPersonas([])
        setHistorial([])

        setError(
          respuestaGastos.error?.message ||
          respuestaPersonas.error?.message ||
          respuestaHistorial.error?.message ||
          'No se pudieron cargar los gastos'
        )

        return
      }

      setGastos(respuestaGastos.data)
      setPersonas(respuestaPersonas.data)
      setHistorial(respuestaHistorial.data)
    } catch (err) {
      setGastos([])
      setPersonas([])
      setHistorial([])
      setError(err?.message || 'No se pudieron cargar los gastos')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    cargarGastos()
  }, [cargarGastos])

  const totalGastado = useMemo(() => {
    return gastos.reduce(
      (total, gasto) => total + Number(gasto.monto || 0),
      0
    )
  }, [gastos])

  const gastosPorPersona = useMemo(() => {
    return personas.map((persona) => {
      const gastosDeLaPersona = gastos.filter(
        (gasto) => gasto.id_pagador === persona.id
      )

      const total = gastosDeLaPersona.reduce(
        (suma, gasto) => suma + Number(gasto.monto || 0),
        0
      )

      return {
        persona,
        gastos: gastosDeLaPersona,
        total,
      }
    })
  }, [gastos, personas])

  const agregarGasto = useCallback(async ({
    pagadorId,
    descripcion,
    monto,
  }) => {
    setGuardando(true)
    setError('')

    try {
      const { data, error: errorCreacion } = await createGasto({
        eventId,
        pagadorId,
        descripcion,
        monto,
      })

      if (errorCreacion) {
        setError(errorCreacion.message || 'No se pudo guardar el gasto')
        return { data: null, error: errorCreacion }
      }

      setGastos((gastosActuales) => [...gastosActuales, data])

      return { data, error: null }
    } catch (err) {
      setError(err?.message || 'No se pudo guardar el gasto')
      return { data: null, error: err }
    } finally {
      setGuardando(false)
    }
  }, [eventId])

  return {
    gastos,
    gastosPorPersona,
    historial,
    personas,
    totalGastado,
    loading,
    guardando,
    error,
    agregarGasto,
    recargar: cargarGastos,
    limpiarError: () => setError(''),
  }
}
