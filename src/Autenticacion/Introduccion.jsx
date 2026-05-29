import { useEffect, useState, useRef } from 'react'
import { StyleSheet, Text, View, Image, Animated } from 'react-native'
import Button from '../Utilidades/Botones'

function Introduccion() {
    const [isLoading, setIsLoading] = useState(true)
    const fadeAnim = useRef(new Animated.Value(0)).current

    useEffect(() => {
        Animated.timing(fadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
        }).start()

        const timer = setTimeout(() => {
            setIsLoading(false)
        }, 3000)

        return () => clearTimeout(timer)
    }, [])

    if (isLoading) {
        return (
            <View style={styles.inicio}>
                <Animated.Image
                    source={require('../../assets/img/Logos/IsotipoSinFondo.png')}
                    style={[styles.logo, { opacity: fadeAnim }]}
                />
            </View>
        )
    }

    return (
        <View style={styles.inicio}>
            <Image source={require('../../assets/img/Logos/IsotipoSinFondo.png')} style={styles.logo} />
            <Text style={styles.titulo}>Quórum</Text>
            <Text style={styles.subtitulo}>Juntarse como nunca antes</Text>

            <Button nombre="Iniciar sesión" view="IniciarSesion" />
            <Button nombre="Registrarse" view="Registrarse" />
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
        resizeMode: 'contain',
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