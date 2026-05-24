import { useNavigation } from '@react-navigation/native'
import { StyleSheet, View, Text, Image, TouchableOpacity } from 'react-native'
import CustomButton from '../src/BotonesLogInOut'

export default function Navbar() {
    const navigation = useNavigation()

    return (
        <View style={styles.carga}>
            <Image source={require('../assets/img/Logos/IsotipoSinFondo.png')}/>
            <Text style={styles.titulo}>Quórum</Text>
            <Text style={styles.subtitulo}>Juntarse como nunca antes</Text>

            <View style={{ gap: 12, width: '70%' }}>
                <CustomButton text="Iniciar sesión" onPress={() => navigation.navigate('LogIn')} />
                <CustomButton text="Registrarse" onPress={() => navigation.navigate('LogUp')} />
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    titulo: {
        fontFamily: 'CashMarket',
        fontSize: 40,
        flex: 1
    },
    subtitulo: {
        fontFamily: 'Utendo',
        marginTop: 10,
        marginBottom: 10,
        fontSize: 20
    },
    carga: {
        alignItems: 'center',
        justifyContent: 'center'
    }
})