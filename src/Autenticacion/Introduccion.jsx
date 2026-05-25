import { useNavigation } from '@react-navigation/native'
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput } from 'react-native'

function Introduccion() {
    const navigation = useNavigation()

    return (
        <View style={styles.inicio}>
            <Image source={require('../../assets/img/Logos/IsotipoSinFondo.png')} style={styles.logo} />
            <Text style={styles.titulo}>Quórum</Text>
            <Text style={styles.subtitulo}>Juntarse como nunca antes</Text>

            <TouchableOpacity onPress={() => navigation.navigate('IniciarSesion')}>
                <Text style={styles.botones}>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('IniciarSesion')}>
                <Text style={styles.botones}>Registrarse</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    inicio: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        justifyContent: 'center'
    },
    logo: {
        width: 250,
        height: 250,
        resizeMode: 'contain',
        alignSelf: 'center'
    },
    titulo: {
        fontFamily: 'CashMarket',
        color: 'white',
        fontSize: 40,
        textAlign: 'center',
        marginBottom: 10
    },
    subtitulo: {
        fontFamily: 'Utendo',
        color: 'white',
        fontSize: 25,
        textAlign: 'center',
        marginBottom: 10
    },
    botones: {
        fontFamily: 'Utendo',
        textAlign: 'center',
        color: 'white',
        fontSize: 25,
        padding: 10,
        margin: 10,
        backgroundColor: '#A846E9',
        borderRadius: 15
    }
})

export default Introduccion