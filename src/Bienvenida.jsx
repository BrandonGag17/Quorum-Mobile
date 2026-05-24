import { useNavigation } from '@react-navigation/native'
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native'
import Navbar from './Navbar.jsx'

function Bienvenida() {
    const navigation = useNavigation()

    return (
        <View style={styles.inicio}>
            <Text>Isologo</Text>
            <Text>Quórum</Text>
            <Text>Juntarse como nunca antes</Text>

            <TouchableOpacity onPress={() => navigation.navigate('LogIn')}>
                <Text>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('LogIn')}>
                <Text>Registrarse</Text>
            </TouchableOpacity>

            <Navbar />
        </View>
    )
}

const styles = StyleSheet.create({
    inicio: {
        flex: 1,
        backgroundColor: '#0D0E2A',
    }
})

export default Bienvenida    