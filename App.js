import { NavigationContainer } from '@react-navigation/native'
import { createNativeStackNavigator } from '@react-navigation/native-stack'
import { useFonts } from 'expo-font';

import Bienvenida from './src/Bienvenida'
import LogIn from './src/LogIn'
import Inicio from './src/Inicio'

const Stack = createNativeStackNavigator()

export default function App() {
  const [fontsLoaded] = useFonts({
    'Utendo': require('./assets/fonts/Utendo-Regular.ttf'),
    'CashMarket': require('./assets/fonts/CashMarket-BoldRounded.ttf')
  });

  if (!fontsLoaded) return null;

  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Bienvenida">
        <Stack.Screen name="Bienvenida" component={Bienvenida} />
        <Stack.Screen name="LogIn" component={LogIn} />
        <Stack.Screen name="Inicio" component={Inicio} />
      </Stack.Navigator>
    </NavigationContainer>
  )
}