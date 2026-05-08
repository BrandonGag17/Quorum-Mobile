import { useNavigation } from '@react-navigation/native'
import { View, Text, Image, TouchableOpacity } from 'react-native'

function Index() {
    const navigation = useNavigation()

    return (
        <View>
            <Image source={require('../../public/img/Logos/Isologo.png')} />
            <Text>Quórum</Text>
            <Text>Juntarse como nunca antes</Text>

            <TouchableOpacity onPress={() => navigation.navigate('LogIn')}>
                <Text>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('SignUp')}>
                <Text>Registrarse</Text>
            </TouchableOpacity>
        </View>
    )
}

export default Index    