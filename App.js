import { NavigationContainer } from '@react-navigation/native'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'

import { getSession, onAuthStateChange } from './src/services/authService'
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

  if (!fontsLoaded || !sessionReady) {
    return null
  }

  return (
    // El proveedor permite que las pantallas dentro de la navegacion lean el tema.
    <ThemeProvider>
      <NavigationContainer>
        {isLoggedIn ? <AppTabs /> : <AuthStack />}
      </NavigationContainer>
    </ThemeProvider>
  )
}