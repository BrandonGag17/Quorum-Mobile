import { StyleSheet, Text, View } from 'react-native'
import Navbar from './Utilidades/Navbar'

export default function Recomendaciones() {
    return (
        <View style={styles.fondo}>
            <Navbar pantallaActual="Recomendaciones" />
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