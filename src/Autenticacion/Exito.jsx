import { StyleSheet, Text, View, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Button from '../Utilidades/Botones'

function Exito() {
    const navigation = useNavigation()

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.card}>

                <Text style={styles.titulo}>
                    Registro exitoso
                </Text>

                <Image
                    source={require('../../assets/img/Logos/MuñecoQuorum.png')}
                    style={styles.imagen}
                    resizeMode="contain"
                />

                <Text style={styles.descripcion}>
                    ¿Listo para planear las mejores juntadas de tu vida?
                </Text>

                <Button
                    nombre="Ir a la página de inicio"
                    onPress={() => navigation.replace('Inicio')}
                />

            </View>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#15151C',
        justifyContent: 'center',
        alignItems: 'center',
    },

    card: {
        width: '100%',
        maxWidth: 340,
        borderRadius: 40,
        paddingHorizontal: 30,
        paddingVertical: 45,
        alignItems: 'center'
    },

    titulo: {
        color: 'white',
        fontSize: 34,
        fontFamily: 'CashMarket',
        textAlign: 'center',
    },

    imagen: {
        width: 300,
        height: 300,
    },

    descripcion: {
        color: 'white',
        fontSize: 18,
        textAlign: 'center',
        fontFamily: 'Utendo',
        marginBottom: 10,
        lineHeight: 26
    }
})

export default Exito