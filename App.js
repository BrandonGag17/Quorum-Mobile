import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useFonts } from 'expo-font';

import Introduccion from './src/Autenticacion/Introduccion'
import IniciarSesion from './src/Autenticacion/IniciarSesion'

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
        <Stack.Screen name="IniciarSesion" component={IniciarSesion} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}