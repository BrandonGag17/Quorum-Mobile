import supabase from './supabaseClient'
import { Platform } from 'react-native'
import * as Linking from 'expo-linking'
import * as WebBrowser from 'expo-web-browser'

WebBrowser.maybeCompleteAuthSession()

const intercambiosOAuthEnCurso = new Map()

export async function completeGoogleOAuth(url) {
    const callback = Linking.parse(url)
    const code = callback.queryParams?.code
    const callbackError = callback.queryParams?.error_description || callback.queryParams?.error

    if (callbackError) {
        return { data: null, error: new Error(String(callbackError)) }
    }

    if (!code || Array.isArray(code)) {
        return { data: null, error: new Error('Google no devolvió un código de autenticación válido.') }
    }

    // El navegador y el listener global pueden recibir el mismo callback en Android.
    // Reutilizar la misma promesa evita canjear el código dos veces.
    if (!intercambiosOAuthEnCurso.has(code)) {
        intercambiosOAuthEnCurso.set(code, supabase.auth.exchangeCodeForSession(code))
    }

    return intercambiosOAuthEnCurso.get(code)
}

export async function signInWithEmail(email, password) {
    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    return { data, error }
}

export async function signUp({ email, password, username }) {
    const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                username,
            },
        },
    })

    return { data, error }
}

export async function signOut() {
    const { error } = await supabase.auth.signOut()
    return { error }
}

export async function getSession() {
    const { data, error } = await supabase.auth.getSession()
    return { data, error }
}

export async function getCurrentUser() {
    const { data, error } = await supabase.auth.getUser()
    return { data: data?.user ?? null, error }
}

export function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
}

export async function signInWithGoogle({ calendar = false } = {}) {
    const redirectTo = Platform.OS === 'web'
        ? window.location.origin
        : Linking.createURL('auth/callback')

    const options = {
        redirectTo,
        ...(calendar && {
            scopes: 'https://www.googleapis.com/auth/calendar.readonly',
            queryParams: {
                access_type: 'offline',
                prompt: 'consent',
            },
        }),
    }

    if (Platform.OS === 'web') {
        const { data, error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options,
        })

        return { data: { ...data, redirecting: !error }, error }
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            ...options,
            skipBrowserRedirect: true,
        },
    })

    if (error || !data?.url) {
        return { data, error: error || new Error('No se pudo iniciar la autenticación con Google.') }
    }

    const result = await WebBrowser.openAuthSessionAsync(data.url, redirectTo)

    if (result.type === 'cancel' || result.type === 'dismiss') {
        return { data: null, error: new Error('Se canceló el inicio de sesión con Google.') }
    }

    if (result.type !== 'success' || !result.url) {
        return { data: null, error: new Error('No se recibió el retorno de Google.') }
    }

    return completeGoogleOAuth(result.url)
}
