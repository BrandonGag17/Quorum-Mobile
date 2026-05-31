import { useEffect, useState } from 'react'
import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useFonts } from 'expo-font'
import { View, ActivityIndicator } from 'react-native'
import supabase from './src/supabaseClient'

import Introduccion from './src/Autenticacion/Introduccion'
import IniciarSesion from './src/Autenticacion/IniciarSesion'
import Registrarse from './src/Autenticacion/Registrarse'
import Registrarse2 from './src/Autenticacion/Registrarse2'
import Registrarse3 from './src/Autenticacion/Registrarse3'
import Inicio from './src/Inicio'

const Stack = createNativeStackNavigator()

export default function App() {
  const [fontsLoaded] = useFonts({
    Utendo: require('./assets/fonts/Utendo-Regular.ttf'),
    CashMarket: require('./assets/fonts/CashMarket-BoldRounded.ttf')
  })

  const [session, setSession] = useState(undefined)

  useEffect(() => {
    async function cargarSesion() {
      const { data: { session } } =
        await supabase.auth.getSession()

      setSession(session)
    }

    cargarSesion()

    const {
      data: { subscription }
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session)
      }
    )

    return () => {
      subscription.unsubscribe()
    }
  }, [])

  if (!fontsLoaded || session === undefined) {
    return (
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center'
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    )
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {session ? (
          <Stack.Screen
            name="Inicio"
            component={Inicio}
          />
        ) : (
          <>
            <Stack.Screen
              name="Introduccion"
              component={Introduccion}
            />

            <Stack.Screen
              name="IniciarSesion"
              component={IniciarSesion}
            />

            <Stack.Screen
              name="Registrarse"
              component={Registrarse}
            />

            <Stack.Screen
              name="Registrarse2"
              component={Registrarse2}
            />

            <Stack.Screen
              name="Registrarse3"
              component={Registrarse3}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  )
}