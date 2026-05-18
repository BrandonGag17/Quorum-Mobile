import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useFonts } from 'expo-font';

import Introduccion from './src/Introduccion'
// import SignUp from './src/SignUp'
import LogIn from './src/LogIn'
// import Inicio from './src/Inicio'
// import Configuracion from './src/Configuracion'
import Inicio from './src/Inicio'
// import ProponerJuntada from './src/ProponerJuntada'
// import DetallePerfil from './src/DetallePerfil'

const Stack = createNativeStackNavigator()

export default function App() {
  const [fontsLoaded] = useFonts({
    'Utendo': require('./assets/fonts/Utendo-Regular.ttf'),
    'CashMarket': require('./assets/fonts/CashMarket-BoldRounded.ttf')
  });

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Introduccion">
        <Stack.Screen name="Introduccion" component={Introduccion} />
        {/* <Stack.Screen name="SignUp" component={SignUp} /> */}
        <Stack.Screen name="LogIn" component={LogIn} />
        {/* <Stack.Screen name="Inicio" component={Inicio} /> */}
        {/* <Stack.Screen name="Configuracion" component={Configuracion} /> */}
        <Stack.Screen name="Inicio" component={Inicio} />
        {/* <Stack.Screen name="ProponerJuntada" component={ProponerJuntada} /> */}
        {/* <Stack.Screen name="DetallePerfil" component={DetallePerfil} /> */}
      </Stack.Navigator>
    </NavigationContainer>
  )
}