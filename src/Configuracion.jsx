import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Navbar from './Utilidades/Navbar'
import supabase from './supabaseClient'

export default function Configuracion() {
    const navigation = useNavigation()

    return (
        <View style={styles.fondo}>
            <TouchableOpacity
                onPress={async () => {
                    await supabase.auth.signOut()
                    navigation.replace('Introduccion')
                }}
            >
                <Text style={styles.test}>Cerrar sesión</Text>
            </TouchableOpacity>

            <Navbar pantallaActual="Configuracion" />
        </View>
    )
}

const styles = StyleSheet.create({
    fondo: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        paddingBottom: 90
    },
    test: {
        color: 'white'
    }
})