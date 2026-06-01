import { StyleSheet, Text, View } from 'react-native'
import Navbar from './Utilidades/Navbar'

export default function Notificaciones() {
    return (
        <View style={styles.fondo}>
            <Navbar pantallaActual="Notificaciones" />
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
})