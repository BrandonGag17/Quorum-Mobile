import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import {
    IconHomeFilled,
    IconCompassFilled,
    IconSettingsFilled,
    IconBellFilled
} from '@tabler/icons-react-native'

export default function Navbar({ pantallaActual }) {
    const navigation = useNavigation()

    return (
        <View style={styles.navbar}>

            <TouchableOpacity
                style={[
                    styles.navItem,
                    pantallaActual === 'Inicio' && styles.activo
                ]}
                onPress={() => navigation.navigate('Inicio')}
            >
                <IconHomeFilled color="#FFFFFF" size={30} />
                <Text style={styles.navText}>Inicio</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.navItem,
                    pantallaActual === 'Recomendaciones' && styles.activo
                ]}
                onPress={() => navigation.navigate('Recomendaciones')}
            >
                <IconCompassFilled color="#FFFFFF" size={30} />
                <Text style={styles.navText}>Explorar</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.navItem,
                    pantallaActual === 'Notificaciones' && styles.activo
                ]}
                onPress={() => navigation.navigate('Notificaciones')}
            >
                <IconBellFilled color="#FFFFFF" size={30} />
                <Text style={styles.navText}>Notificaciones</Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={[
                    styles.navItem,
                    pantallaActual === 'Configuracion' && styles.activo
                ]}
                onPress={() => navigation.navigate('Configuracion')}
            >
                <IconSettingsFilled color="#FFFFFF" size={30} />
                <Text style={styles.navText}>Ajustes</Text>
            </TouchableOpacity>

        </View>
    )
}

const styles = StyleSheet.create({
    navbar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 80,
        paddingHorizontal: 10,
        backgroundColor: '#15151C',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
    },

    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
        marginHorizontal: 3,
        height: 55,
        borderRadius: 15,
    },

    activo: {
        backgroundColor: '#4D1568',
    },

    navText: {
        color: '#FFFFFF',
        fontSize: 12,
        textAlign: 'center',
        fontFamily: 'Utendo',
    }
})