import { useState } from 'react'
import { getSession } from '../services/authService'
import { createEvent } from '../services/eventoService'

export default function useCreateEvent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const crearEvento = async ({
    nombre,
    descripcion,
    id_grupo,
    fecha_hora_inicio,
    lugar_text,
    invitados
  }) => {
    setError(null)
    if (loading) return { data: null, error: { message: 'busy' } }

    // basic validations
    if (!nombre || !nombre.trim()) {
      const err = { message: 'El nombre del evento es obligatorio' }
      setError(err.message)
      return { data: null, error: err }
    }

    if (!fecha_hora_inicio) {
      const err = { message: 'La fecha del evento es obligatoria' }
      setError(err.message)
      return { data: null, error: err }
    }

    if (!id_grupo) {
      const err = { message: 'Falta id del grupo' }
      setError(err.message)
      return { data: null, error: err }
    }

    setLoading(true)

    try {
      const { data: { session }, error: sessionError } = await getSession()

      if (sessionError) {
        setError(sessionError.message || 'No se pudo obtener la sesión')
        return { data: null, error: sessionError }
      }

      const user = session?.user

      if (!user) {
        const err = { message: 'No hay sesión activa' }
        setError(err.message)
        return { data: null, error: err }
      }

      const { data, error: createError } = await createEvent({
        nombre,
        descripcion,
        id_grupo,
        id_creador: user.id,
        fecha_hora_inicio,
        lugar_text,
        invitados
      })

      if (createError) {
        setError(createError.message || String(createError))
        return { data: null, error: createError }
      }

      return { data, error: null }
    } catch (err) {
      setError(err?.message || String(err))
      return { data: null, error: err }
    } finally {
      setLoading(false)
    }
  }

  return {
    crearEvento,
    loading,
    error
  }
}
