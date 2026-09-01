import { createNativeStackNavigator } from '@react-navigation/native-stack'

import Introduccion from '../screens/Autenticacion/Introduccion'
import IniciarSesion from '../screens/Autenticacion/IniciarSesion'
import Registrarse1 from '../screens/Autenticacion/Registrarse1'
import Registrarse2 from '../screens/Autenticacion/Registrarse2'
import Registrarse3 from '../screens/Autenticacion/Registrarse3'
import Registrarse4 from '../screens/Autenticacion/Registrarse4'
import Exito from '../screens/Autenticacion/Exito'

const Stack = createNativeStackNavigator()

export default function AuthStack() {
  return (
    <Stack.Navigator
      initialRouteName="Introduccion"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Introduccion" component={Introduccion} />
      <Stack.Screen name="IniciarSesion" component={IniciarSesion} />
      <Stack.Screen name="Registrarse1" component={Registrarse1} />
      <Stack.Screen name="Registrarse2" component={Registrarse2} />
      <Stack.Screen name="Registrarse3" component={Registrarse3} />
      <Stack.Screen name="Registrarse4" component={Registrarse4} />
      <Stack.Screen name="Exito" component={Exito} />
    </Stack.Navigator>
  )
}