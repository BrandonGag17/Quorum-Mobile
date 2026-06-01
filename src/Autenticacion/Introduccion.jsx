import { StyleSheet, Text, View, Image } from 'react-native'
import Button from '../Utilidades/Botones'
import { useNavigation } from '@react-navigation/native'

function Introduccion() {
    const navigation = useNavigation()

    return (
        <View style={styles.inicio}>
            <Image
                source={require('../../assets/img/Logos/IsotipoSinFondo.png')}
                style={styles.logo}
                resizeMode="contain"
            />
            <Text style={styles.titulo}>Quórum</Text>
            <Text style={styles.subtitulo}>Juntarse como nunca antes</Text>

            <Button nombre="Iniciar sesión" onPress={() => navigation.navigate('IniciarSesion')} />
            <Button nombre="Registrarse" onPress={() => navigation.navigate('Registrarse')} />
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
        width: 200,
        height: 200,
        alignSelf: 'center'
    },
    titulo: {
        fontFamily: 'CashMarket',
        color: 'white',
        fontSize: 35,
        textAlign: 'center',
        marginBottom: 10
    },
    subtitulo: {
        fontFamily: 'Utendo',
        color: 'white',
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 10
    }
})

export default Introduccion