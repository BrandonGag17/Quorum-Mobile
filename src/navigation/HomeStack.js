import { createNativeStackNavigator } from '@react-navigation/native-stack'
import Home from '../screens/Home/Home'
import Grupo from '../screens/Home/Grupo'
import InfoGrupo from '../screens/Home/InfoGrupo'
import ProponerJuntada from '../screens/Home/ProponerJuntada'
import CrearEvento from '../screens/Home/CrearEvento'
import Juntada from '../screens/Home/Juntada'
import VotacionJuntada from '../screens/Home/VotacionJuntada'
import RecomendacionesGrupo from '../screens/Recomendaciones/RecomendacionesGrupo'
import DivisionGastos from '../screens/Home/DivisionGastos'

const Stack = createNativeStackNavigator()

export default function HomeStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Home" component={Home} />
      <Stack.Screen name="Grupo" component={Grupo} />
      <Stack.Screen name="InfoGrupo" component={InfoGrupo} />
      <Stack.Screen name="ProponerJuntada" component={ProponerJuntada} />
      <Stack.Screen name="RecomendacionesGrupo" component={RecomendacionesGrupo} />
      <Stack.Screen name="VotacionJuntada" component={VotacionJuntada} />
      <Stack.Screen name="CrearEvento" component={CrearEvento} />
      <Stack.Screen name="Juntada" component={Juntada} />
      <Stack.Screen name="DivisionGastos" component={DivisionGastos} />
    </Stack.Navigator>
  )
}
