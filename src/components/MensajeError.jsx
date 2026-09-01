import { StyleSheet, Text, View } from 'react-native'
import { IconXboxXFilled } from '@tabler/icons-react-native';

export default function ErrorMessage({ mensaje }) {
    return (
        <View style={styles.bloqueError}>
            <IconXboxXFilled color={'white'} size={30} />
            <View style={styles.bloqueTexto}>
                <Text style={styles.titulo}>ERROR!</Text>
                <Text style={styles.mensaje}>{mensaje}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    bloqueError: {
        backgroundColor: '#3A1C22',
        borderColor: '#D84B5A',
        borderWidth: 1.5,
        borderRadius: 10,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 10
    },
    bloqueTexto: {
        marginLeft: 10,
        flex: 1
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