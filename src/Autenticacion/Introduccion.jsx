import { useEffect, useState, useRef } from 'react'
import { StyleSheet, Text, View, Image, Animated } from 'react-native'
import Button from '../Utilidades/Botones'
import { useNavigation } from '@react-navigation/native'

function Introduccion() {
    const [isLoading, setIsLoading] = useState(true)
    const fadeAnim = useRef(new Animated.Value(0)).current
    const navigation = useNavigation()

    useEffect(() => {
        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 2000)

        return () => clearTimeout(timer)
    }, [])

    if (isLoading) {
        return (
            <View style={styles.inicio}>
                <Animated.Image
                    source={require('../../assets/img/Logos/IsotipoSinFondo.png')}
                    style={styles.logo}
                    resizeMode="contain"
                />
            </View>
        )
    }

    return (
        <View style={styles.inicio}>
            <Image source={require('../../assets/img/Logos/IsotipoSinFondo.png')} style={styles.logo} resizeMode="contain" />
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