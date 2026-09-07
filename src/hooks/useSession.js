import { useEffect, useState, useCallback } from 'react'
import {
    getSession,
    signInWithEmail,
    signOut,
} from '../services/authService'

export function useSession() {
    const [session, setSession] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)

    const refreshSession = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const { data, error: sessionError } = await getSession()

            if (sessionError) {
                setError(sessionError.message)
                setSession(null)
                return
            }

            setSession(data?.session ?? null)
        } catch (err) {
            setError(
                err?.message || 'No se pudo recuperar la sesión.'
            )
            setSession(null)
        } finally {
            setLoading(false)
        }
    }, [])

    useEffect(() => {
        refreshSession()
    }, [refreshSession])

    const login = useCallback(async (email, password) => {
        setLoading(true)
        setError(null)

        try {
            const { data, error: loginError } =
                await signInWithEmail(email, password)

            if (loginError) {
                setError(loginError.message)
                return { success: false, error: loginError.message }
            }

            setSession(data?.session ?? null)
            return { success: true, session: data?.session }
        } catch (err) {
            const message =
                err?.message || 'No se pudo iniciar sesión. Intentá nuevamente.'

            setError(message)
            return { success: false, error: message }
        } finally {
            setLoading(false)
        }
    }, [])

    const logout = useCallback(async () => {
        setLoading(true)
        setError(null)

        try {
            const { error: logoutError } = await signOut()

            if (logoutError) {
                setError(logoutError.message)
                return { success: false, error: logoutError.message }
            }

            setSession(null)
            return { success: true }
        } catch (err) {
            const message =
                err?.message || 'No se pudo cerrar sesión. Intentá nuevamente.'

            setError(message)
            return { success: false, error: message }
        } finally {
            setLoading(false)
        }
    }, [])
    const clearError = useCallback(() => {
        setError(null)
    }, [])
    return {
        session,
        loading,
        error,
        login,
        logout,
        refreshSession,
        clearError,
    }
}