import { useCallback, useEffect, useState } from 'react'
import { getCurrentUserProfile } from '../services/userService'

export function useUserProfile() {
  const [profile, setProfile] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const refresh = useCallback(async () => {
    setLoading(true)
    setError('')

    const { data, error: profileError } = await getCurrentUserProfile()

    if (profileError) {
      setError('No se pudo cargar el perfil.')
      setProfile(null)
    } else {
      setProfile(data)
    }

    setLoading(false)
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  return {
    profile,
    loading,
    error,
    refresh,
  }
}