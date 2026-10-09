import { NavigationContainer } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import * as Linking from 'expo-linking'
import { useEffect, useState } from 'react'

import { completeGoogleOAuth, getSession, onAuthStateChange } from './src/services/authService'
import AuthStack from './src/navigation/AuthStack'
import AppTabs from './src/navigation/AppTabs'
import { ThemeProvider } from './src/context/ThemeContext'

SplashScreen.preventAutoHideAsync()

export default function App() {
  const [sessionReady, setSessionReady] = useState(false)
  const [isLoggedIn, setIsLoggedIn] = useState(false)

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

        setIsLoggedIn(Boolean(session))
      } finally {
        setSessionReady(true)
        await SplashScreen.hideAsync()
      }
    }

    iniciar()
  }, [fontsLoaded])

  useEffect(() => {
    const { data: authListener } = onAuthStateChange((event, session) => {
      setIsLoggedIn(Boolean(session))
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
        {isLoggedIn ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>
    </ThemeProvider>
  )
}
