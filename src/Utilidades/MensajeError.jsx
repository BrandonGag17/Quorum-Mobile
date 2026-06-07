import { StyleSheet, Text, View } from 'react-native'
import { IconXboxXFilled } from '@tabler/icons-react-native';

export default function ErrorMessage({ mensaje }) {
    return (
        <View style={styles.bloqueError}>
            <IconXboxXFilled color={'white'}  size={30}/>
            <View style={styles.bloqueTexto}>
                <Text style={styles.titulo}>ERROR!</Text>
                <Text style={styles.mensaje}>{mensaje}</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    bloqueError: {
        backgroundColor: 'red',
        borderRadius: 10,
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center'
    },
    bloqueTexto: {
        marginLeft: 10
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