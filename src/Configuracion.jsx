import { StyleSheet, Text, View, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import Navbar from './Utilidades/Navbar'
import supabase from './supabaseClient'

export default function Configuracion() {
    const navigation = useNavigation()
    let currentDate = new Date();

    return (
        <View style={styles.fondo}>
            <TouchableOpacity
                onPress={async () => {
                    await supabase.auth.signOut()
                    navigation.replace('Introduccion')
                }}
            >
                <Text style={styles.botones}>Cerrar sesión</Text>
            </TouchableOpacity>

            <Text style={styles.textoCopyVersion}>Copyright &copy; {currentDate.getFullYear()} - Quórum</Text>
            <Text style={styles.textoCopyVersion}>Versión Demo 0.0.0</Text>

            <Navbar pantallaActual="Configuracion" />
        </View>
    )
}

const styles = StyleSheet.create({
    fondo: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        paddingBottom: 90,
        justifyContent: 'center'
    },
    botones: {
        fontFamily: 'Utendo',
        textAlign: 'center',
        color: 'white',
        fontSize: 20,
        padding: 8,
        margin: 10,
        backgroundColor: '#e91010',
        borderRadius: 15,
        marginBottom: 20
    },
    textoCopyVersion: {
        color: 'white',
        textAlign: 'center',
        fontFamily: 'Utendo',
        marginBottom: 10
    }
})