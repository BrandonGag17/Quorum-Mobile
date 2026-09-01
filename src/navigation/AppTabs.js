import { createBottomTabNavigator } from '@react-navigation/bottom-tabs'
import {
  IconHomeFilled,
  IconCompassFilled,
  IconSettingsFilled,
  IconBellFilled,
} from '@tabler/icons-react-native'

import HomeStack from './HomeStack'

import Recomendaciones from '../screens/Recomendaciones/Recomendaciones'
import Notificaciones from '../screens/Notificaciones/Notificaciones.jsx'
import Configuracion from '../screens/Configuracion/Configuracion.jsx'

const Tab = createBottomTabNavigator()

export default function AppTabs() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,

        tabBarStyle: {
          position: 'absolute',

          left: 16,
          right: 16,
          bottom: 16,

          height: 70,

          backgroundColor: '#1e1e25',

          borderRadius: 22,
          borderWidth: 1,
          borderColor: '#292933',

          paddingTop: 8,
          paddingBottom: 8,

          elevation: 8,

          shadowColor: '#000',
          shadowOffset: {
            width: 0,
            height: 4,
          },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        },
        
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#6F7078',

        tabBarLabelStyle: {
          fontSize: 12,
          fontFamily: 'Utendo',
          marginTop: 4,
        },

        tabBarIconStyle: {
          marginBottom: -2,
        },

        tabBarIcon: ({ color, size, focused }) => {
          const iconSize = focused ? 25 : 23

          if (route.name === 'Inicio') {
            return (
              <IconHomeFilled
                color={color}
                size={iconSize}
              />
            )
          }

          if (route.name === 'Recomendaciones') {
            return (
              <IconCompassFilled
                color={color}
                size={iconSize}
              />
            )
          }

          if (route.name === 'Notificaciones') {
            return (
              <IconBellFilled
                color={color}
                size={iconSize}
              />
            )
          }

          if (route.name === 'Configuracion') {
            return (
              <IconSettingsFilled
                color={color}
                size={iconSize}
              />
            )
          }
        },
      })}
    >
      <Tab.Screen
        name="Inicio"
        component={HomeStack}
        options={{
          title: 'Inicio',
        }}
      />

      <Tab.Screen
        name="Recomendaciones"
        component={Recomendaciones}
        options={{
          title: 'Explorar',
        }}
      />

      <Tab.Screen
        name="Notificaciones"
        component={Notificaciones}
        options={{
          title: 'Notificaciones',
        }}
      />

      <Tab.Screen
        name="Configuracion"
        component={Configuracion}
        options={{
          title: 'Ajustes',
        }}
      />
    </Tab.Navigator>
  )
}