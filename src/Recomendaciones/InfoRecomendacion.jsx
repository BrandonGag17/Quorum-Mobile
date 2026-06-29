import { StyleSheet, Text, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Navbar from '../Utilidades/Navbar'

export default function Notificaciones() {
    return (
        <SafeAreaView style={styles.fondo}>
            <Navbar pantallaActual="Recomendaciones" />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    fondo: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        paddingBottom: 90
    },
})