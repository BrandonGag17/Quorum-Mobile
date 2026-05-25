import { useNavigation } from '@react-navigation/native'
import { StyleSheet, Text, View, Image, TouchableOpacity, TextInput } from 'react-native'
import Navbar from './Navbar.jsx'

function Bienvenida() {
    const navigation = useNavigation()

    return (
        <View style={styles.inicio}>
            <TextInput style={styles.input} placeholder="Busca un grupo o juntada..." />
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
        backgroundColor: '#15151C',
        padding: 20
    },
    input: {
        backgroundColor: 'white',
        padding: 10,
        borderRadius: 10
    }
})

export default Bienvenida    