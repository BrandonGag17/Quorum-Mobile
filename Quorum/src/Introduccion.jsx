import { useNavigation } from '@react-navigation/native'
import { StyleSheet, View, Text, Image } from 'react-native'

export default function Navbar() {
    const navigation = useNavigation()

    return (
        <View style={styles.carga}>
            <Text style={styles.titulo}>Quórum</Text>

            <TouchableOpacity onPress={() => navigation.navigate('LogIn')}>
                <Text>Iniciar sesión</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => navigation.navigate('LogIn')}>
                <Text>Registrarse</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    titulo: {
        fontFamily: 'CashMarket',
    }
})