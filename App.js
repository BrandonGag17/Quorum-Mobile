import { NavigationContainer } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'

import supabase from './src/services/supabaseClient'
import AuthStack from './src/navigation/AuthStack'
import AppTabs from './src/navigation/AppTabs'

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
        } = await supabase.auth.getSession()

        setIsLoggedIn(Boolean(session))
      } finally {
        setSessionReady(true)
        await SplashScreen.hideAsync()
      }
    }

    iniciar()
  }, [fontsLoaded])

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      setIsLoggedIn(Boolean(session))
    })

    return () => {
      authListener?.subscription?.unsubscribe()
    }
  }, [])

  if (!fontsLoaded || !sessionReady) {
    return null
  }

  return (
    <NavigationContainer>
      {isLoggedIn ? <AppTabs /> : <AuthStack />}
    </NavigationContainer>
  )
}