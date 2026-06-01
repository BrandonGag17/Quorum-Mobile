import { useEffect } from 'react'
import { View, StyleSheet, Animated } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import supabase from '../supabaseClient'

function PantallaCarga() {
    const navigation = useNavigation()

    useEffect(() => {
        async function verificarSesion() {

            await new Promise(resolve =>
                setTimeout(resolve, 2000)
            )

            const { data: { session } } =
                await supabase.auth.getSession()

            if (session) {
                navigation.replace('Inicio')
            } else {
                navigation.replace('Introduccion')
            }
        }

        verificarSesion()
    }, [])

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

const styles = StyleSheet.create({
    inicio: {
        flex: 1,
        backgroundColor: '#15151C',
        justifyContent: 'center',
        alignItems: 'center'
    },
    logo: {
        width: 200,
        height: 200
    }
})

export default PantallaCarga