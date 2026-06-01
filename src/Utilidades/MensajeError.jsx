import { StyleSheet, Text, View } from 'react-native'

export default function ErrorMessage({ mensaje }) {
    return (
        <View style={styles.bloqueError}>
            <Text style={styles.titulo}>ERROR!</Text>
            <Text style={styles.mensaje}>{mensaje}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    bloqueError: {
        backgroundColor: 'red',
        borderRadius: 10,
        padding: 10
    },
    titulo: {
        color: 'white',
        marginBottom: 5,
        fontFamily: 'CashMarket'
    },
    mensaje: {
        color: 'white',
        fontFamily: 'Utendo'
    }
})