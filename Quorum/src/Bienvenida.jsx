import { useNavigation } from '@react-navigation/native'
import { View, Text, TouchableOpacity } from 'react-native'

function Bienvenida() {
    const navigation = useNavigation()

    return (
        <View>
            <Text>Isologo</Text>
            <Text>Quórum</Text>
            <Text>Juntarse como nunca antes</Text>

            <TouchableOpacity onPress={() => navigation.navigate('LogIn')}>
                <Text>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('LogIn')}>
                <Text>Registrarse</Text>
            </TouchableOpacity>
        </View>
    )
}

export default Bienvenida    