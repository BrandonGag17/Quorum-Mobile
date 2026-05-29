import { useEffect, useState, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import { StyleSheet, Text, View, Image, TouchableOpacity, Animated } from 'react-native'

function Introduccion() {
    const navigation = useNavigation()
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

            <TouchableOpacity onPress={() => navigation.navigate('IniciarSesion')}>
                <Text style={styles.botones}>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('Registrarse')}>
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
    },
    botones: {
        fontFamily: 'Utendo',
        textAlign: 'center',
        color: 'white',
        fontSize: 22.5,
        padding: 10,
        margin: 10,
        backgroundColor: '#A846E9',
        borderRadius: 15
    }
})

export default Introduccion