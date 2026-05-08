import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'

import Bienvenida from './src/Bienvenida'
// import SignUp from './src/SignUp'
import LogIn from './src/LogIn'
// import Inicio from './src/Inicio'
// import Configuracion from './src/Configuracion'
import InicioGrupo from './src/InicioGrupo'
// import ProponerJuntada from './src/ProponerJuntada'
// import DetallePerfil from './src/DetallePerfil'

const Stack = createNativeStackNavigator()

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Bienvenida">
        <Stack.Screen name="Bienvenida" component={Bienvenida} />
        {/* <Stack.Screen name="SignUp" component={SignUp} /> */}
        <Stack.Screen name="LogIn" component={LogIn} />
        {/* <Stack.Screen name="Inicio" component={Inicio} /> */}
        {/* <Stack.Screen name="Configuracion" component={Configuracion} /> */}
        <Stack.Screen name="InicioGrupo" component={InicioGrupo} />
        {/* <Stack.Screen name="ProponerJuntada" component={ProponerJuntada} /> */}
        {/* <Stack.Screen name="DetallePerfil" component={DetallePerfil} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  )
}