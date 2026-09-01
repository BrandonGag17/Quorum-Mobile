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

        const { data, error: sessionError } = await getSession()

        if (sessionError) {
            setError(sessionError.message)
            setSession(null)
        } else {
            setSession(data?.session ?? null)
        }

        setLoading(false)
    }, [])

    useEffect(() => {
        refreshSession()
    }, [refreshSession])

    const login = useCallback(async (email, password) => {
        setLoading(true)
        setError(null)

        const { data, error: loginError } = await signInWithEmail(email, password)

        if (loginError) {
            setError(loginError.message)
            setLoading(false)
            return { success: false, error: loginError.message }
        }

        setSession(data?.session ?? null)
        setLoading(false)
        return { success: true, session: data?.session }
    }, [])

    const logout = useCallback(async () => {
        setLoading(true)
        setError(null)

        const { error: logoutError } = await signOut()

        if (logoutError) {
            setError(logoutError.message)
            setLoading(false)
            return { success: false, error: logoutError.message }
        }

        setSession(null)
        setLoading(false)
        return { success: true }
    }, [])

    return {
        session,
        loading,
        error,
        login,
        logout,
        refreshSession,
    }
}