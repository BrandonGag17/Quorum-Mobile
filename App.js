import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useFonts } from 'expo-font'
import * as SplashScreen from 'expo-splash-screen'
import { useEffect, useState } from 'react'
import supabase from './src/services/supabaseClient'

import Introduccion from './src/Autenticacion/Introduccion'
import IniciarSesion from './src/Autenticacion/IniciarSesion'
import Registrarse from './src/Autenticacion/Registrarse'
import Registrarse2 from './src/Autenticacion/Registrarse2'
import Registrarse3 from './src/Autenticacion/Registrarse3'
import Exito from './src/Autenticacion/Exito'
import Inicio from './src/Inicio'
import Recomendaciones from './src/Recomendaciones'
import Notificaciones from './src/Notificaciones'
import Configuracion from './src/Configuracion'
import Grupo from './src/Grupo/Grupo'
import Juntada from './src/Juntada/Juntada'
import ProponerJuntada from './src/Juntada/ProponerJuntada'
import CrearGrupo from './src/Grupo/CrearGrupo'
import InfoGrupo from './src/Grupo/InfoGrupo'
import VotacionJuntada from './src/Juntada/VotacionJuntada'
import InfoRecomendacion from './src/Recomendaciones/InfoRecomendacion'
import CrearEvento from './src/Juntada/CrearEvento'

const Stack = createNativeStackNavigator()
SplashScreen.preventAutoHideAsync()

export default function App() {
  const [cargando, setCargando] = useState(true)
  const [logueado, setLogueado] = useState(false)

  const [fontsLoaded] = useFonts({
    Utendo: require('./assets/fonts/Utendo-Regular.ttf'),
    CashMarket: require('./assets/fonts/CashMarket-BoldRounded.ttf')
  })

  useEffect(() => {
    async function iniciar() {
      if (!fontsLoaded) return

      try {
        const {
          data: { session }
        } = await supabase.auth.getSession()

        setLogueado(!!session)
      } finally {
        setCargando(false)
        await SplashScreen.hideAsync()
      }
    }

    iniciar()
  }, [fontsLoaded])

  if (cargando) {
    return null
  }

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName={logueado ? "Inicio" : "Introduccion"}
        screenOptions={{ headerShown: false }}
      >

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

        <Stack.Screen
          name="Exito"
          component={Exito}
        />

        <Stack.Screen
          name="Inicio"
          component={Inicio}
        />

        <Stack.Screen
          name="Recomendaciones"
          component={Recomendaciones}
        />

        <Stack.Screen
          name="Notificaciones"
          component={Notificaciones}
        />

        <Stack.Screen
          name="Configuracion"
          component={Configuracion}
        />

        <Stack.Screen
          name="Grupo"
          component={Grupo}
        />

        <Stack.Screen
          name="Juntada"
          component={Juntada}
        />


        <Stack.Screen
          name="ProponerJuntada"
          component={ProponerJuntada}
        />

        <Stack.Screen
          name="InfoGrupo"
          component={InfoGrupo}
        />

        <Stack.Screen
          name="CrearGrupo"
          component={CrearGrupo}
        />

        <Stack.Screen
          name="VotacionJuntada"
          component={VotacionJuntada}
        />

        <Stack.Screen
          name="InfoRecomendacion"
          component={InfoRecomendacion}
        />

        <Stack.Screen
          name="CrearEvento"
          component={CrearEvento}
        />
      </Stack.Navigator>
    </NavigationContainer>
  )
}