import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useFonts } from 'expo-font'

import PantallaCarga from './src/Autenticacion/PantallaCarga'
import Introduccion from './src/Autenticacion/Introduccion'
import IniciarSesion from './src/Autenticacion/IniciarSesion'
import Registrarse from './src/Autenticacion/Registrarse'
import Registrarse2 from './src/Autenticacion/Registrarse2'
import Registrarse3 from './src/Autenticacion/Registrarse3'
import Inicio from './src/Inicio'
import Recomendaciones from './src/Recomendaciones'
import Notificaciones from './src/Notificaciones'
import Configuracion from './src/Configuracion'

const Stack = createNativeStackNavigator()

export default function App() {
  const [fontsLoaded] = useFonts({
    Utendo: require('./assets/fonts/Utendo-Regular.ttf'),
    CashMarket: require('./assets/fonts/CashMarket-BoldRounded.ttf')
  })

  if (!fontsLoaded) return null

  return (
    <NavigationContainer>
      <Stack.Navigator
        initialRouteName="PantallaCarga"
        screenOptions={{ headerShown: false }}
      >
        <Stack.Screen
          name="PantallaCarga"
          component={PantallaCarga}
        />

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
      </Stack.Navigator>
    </NavigationContainer>
  )
}