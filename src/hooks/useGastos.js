import { useCallback, useEffect, useMemo, useState } from 'react'
import {
  createGasto,
  getGastosByEventId,
  getPersonasByEventId,
} from '../services/gastoService'

export default function useGastos(eventId) {
  const [gastos, setGastos] = useState([])
  const [personas, setPersonas] = useState([])
  const [loading, setLoading] = useState(true)
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState('')

  const cargarGastos = useCallback(async () => {
    if (!eventId) {
      setGastos([])
      setPersonas([])
      setError('No se recibió el evento para cargar sus gastos')
      setLoading(false)
      return
    }

    setLoading(true)
    setError('')

    try {
      // Gastos y personas no dependen entre sí, así que pueden consultarse al
      // mismo tiempo para reducir la espera de la pantalla.
      const [respuestaGastos, respuestaPersonas] = await Promise.all([
        getGastosByEventId(eventId),
        getPersonasByEventId(eventId),
      ])

      if (respuestaGastos.error || respuestaPersonas.error) {
        setGastos([])
        setPersonas([])
        setError(
          respuestaGastos.error?.message ||
          respuestaPersonas.error?.message ||
          'No se pudieron cargar los gastos'
        )
        return
      }

      setGastos(respuestaGastos.data)
      setPersonas(respuestaPersonas.data)
    } catch (err) {
      setGastos([])
      setPersonas([])
      setError(err?.message || 'No se pudieron cargar los gastos')
    } finally {
      setLoading(false)
    }
  }, [eventId])

  useEffect(() => {
    cargarGastos()
  }, [cargarGastos])

  // Se recalcula solamente cuando cambia la lista. No guardamos el total como
  // otro estado porque siempre puede derivarse de los gastos existentes.
  const totalGastado = useMemo(() => {
    return gastos.reduce(
      (total, gasto) => total + Number(gasto.monto || 0),
      0
    )
  }, [gastos])

  // Conservamos cada gasto individual en Supabase, pero para la pantalla los
  // agrupamos por persona. Así cada asistente aparece una sola vez con su total
  // y todavía podemos mostrar el detalle de todo lo que pagó.
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

      // El servicio devuelve la fila recién creada, por eso podemos agregarla
      // localmente y actualizar el total sin hacer otra consulta a Supabase.
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
