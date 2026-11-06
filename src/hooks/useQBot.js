import { useEffect, useRef, useState } from 'react'
import { consultarQBot } from '../services/qbotService'

export default function useQBot() {
  const [mensaje, setMensaje] = useState('')
  const [resultado, setResultado] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const ocupado = useRef(false)
  const montado = useRef(true)
  const lugaresVistos = useRef([])
  const ultimoPedido = useRef('')
  useEffect(() => {
    montado.current = true
    return () => { montado.current = false }
  }, [])

  async function enviar() {
    if (ocupado.current || !mensaje.trim()) return
    const pedido = mensaje.trim()
    if (ultimoPedido.current !== pedido) {
      lugaresVistos.current = []
      ultimoPedido.current = pedido
    }
    ocupado.current = true
    setLoading(true)
    setError('')
    setResultado(null)
    try {
      const data = await consultarQBot(pedido, lugaresVistos.current)
      lugaresVistos.current = [...new Set([...lugaresVistos.current, ...data.lugares.map((lugar) => lugar.id)])].slice(-30)
      if (montado.current) setResultado({ ...data, pedido })
    } catch (err) {
      if (montado.current) setError(err.message || 'No pudimos buscar lugares.')
    } finally {
      ocupado.current = false
      if (montado.current) setLoading(false)
    }
  }
  return { mensaje, setMensaje, resultado, loading, error, enviar }
}
