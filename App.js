import { NavigationContainer } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import * as Linking from 'expo-linking'
import { useEffect, useState } from 'react'
import supabase from './src/services/supabaseClient'

import { completeGoogleOAuth, getSession, onAuthStateChange } from './src/services/authService'
import AuthStack from './src/navigation/AuthStack'
import AppTabs from './src/navigation/AppTabs'
import { ThemeProvider } from './src/context/ThemeContext'

SplashScreen.preventAutoHideAsync()

export default function App() {
  const [sessionReady, setSessionReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [registrationDraft, setRegistrationDraft] = useState(null)

  const resolveSession = async (session) => {
    const user = session?.user
    if (!user?.id) {
      setIsLoggedIn(false)
      setRegistrationDraft(null)
      return
    }

    const { data: profile, error: profileError } = await supabase
      .from('usuario')
      .select('id')
      .eq('id', user.id)
      .maybeSingle()

    if (profileError) {
      // Preserve access for existing sessions when the profile lookup is temporarily unavailable.
      setIsLoggedIn(true)
      setRegistrationDraft(null)
      return
    }

    const hasProfile = Boolean(profile?.id)
    setIsLoggedIn(hasProfile)
    const isGoogleUser = user.app_metadata?.provider === 'google'
      || user.identities?.some((identity) => identity.provider === 'google')
    setRegistrationDraft(!hasProfile && isGoogleUser
      ? { oauthUserId: user.id, email: user.email || '' }
      : null)
  }

  const [fontsLoaded] = useFonts({
    Utendo: require('./assets/fonts/Utendo-Regular.ttf'),
    CashMarket: require('./assets/fonts/CashMarket-BoldRounded.ttf'),
  })

  useEffect(() => {
    async function iniciar() {
      if (!fontsLoaded) return

      try {
        const {
          data: { session },
        } = await getSession()

        await resolveSession(session)
      } finally {
        setSessionReady(true)
        await SplashScreen.hideAsync()
      }
    }

    iniciar()
  }, [fontsLoaded])

  useEffect(() => {
    const { data: authListener } = onAuthStateChange((_event, session) => {
      // Defer database reads until Supabase has released its auth callback lock.
      setTimeout(() => { void resolveSession(session) }, 0)
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  useEffect(() => {
    const completarCallbackDeGoogle = async (url) => {
      if (!url?.includes('auth/callback')) return

      const { error } = await completeGoogleOAuth(url)
      if (error) {
        console.warn('No se pudo completar el callback de Google:', error.message)
      }
    }

    Linking.getInitialURL().then(completarCallbackDeGoogle)
    const subscription = Linking.addEventListener('url', ({ url }) => {
      completarCallbackDeGoogle(url)
    })

    return () => subscription.remove()
  }, [])

  if (!fontsLoaded || !sessionReady) {
    return null
  }

  return (
    <ThemeProvider>
      <NavigationContainer>
        {isLoggedIn ? <AppTabs /> : <AuthStack registrationDraft={registrationDraft} />}
      </NavigationContainer>
    </ThemeProvider>
  )
}
