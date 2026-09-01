import supabase from './supabaseClient'

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

export async function onAuthStateChange(callback) {
    return supabase.auth.onAuthStateChange(callback)
}

export async function signInWithGoogle() {
    const { data, error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
            redirectTo: 'https://quorum.app',
        },
    })

    return { data, error }
}