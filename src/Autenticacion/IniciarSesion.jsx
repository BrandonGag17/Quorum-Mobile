import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native'
import { IconMailFilled, IconLockFilled } from '@tabler/icons-react-native'

function IniciarSesion() {
    return (
        <View style={styles.fondo}>
            <Text style={styles.titulo}>Iniciar sesión</Text>

            <View style={styles.iconoTexto}>
                <IconMailFilled color="#FFFFFF" size={28} />
                <Text style={styles.texto}>Email</Text>
            </View>
            <TextInput style={styles.input} placeholder="tu@gmail.com" />
            <View style={styles.iconoTexto}>
                <IconLockFilled color="#FFFFFF" size={28} />
                <Text style={styles.texto}>Contraseña</Text>
            </View>
            <TextInput style={styles.input} placeholder="*******" />

            <TouchableOpacity onPress={() => navigation.navigate('IniciarSesion')}>
                <Text style={styles.botones}>Iniciar sesión</Text>
            </TouchableOpacity>
        </View>
    )
}

const styles = StyleSheet.create({
    fondo: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        justifyContent: 'center'
    },
    titulo: {
        fontFamily: 'CashMarket',
        color: 'white',
        fontSize: 40,
        textAlign: 'center',
        marginBottom: 30
    },
    botones: {
        fontFamily: 'Utendo',
        textAlign: 'center',
        color: 'white',
        fontSize: 25,
        padding: 10,
        margin: 10,
        backgroundColor: '#A846E9',
        borderRadius: 15
    },
    iconoTexto: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
    },
    texto: {
        color: 'white',
        fontFamily: 'Utendo',
        fontSize: 20,
        marginTop: 5
    },
    input: {
        borderRadius: 15,
        borderColor: '#4F4F55',
        borderWidth: 2,
        backgroundColor: '#2A2A2E',
        padding: 15,
        color: 'white',
        marginBottom: 20,
        marginTop: 10
    }
})

export default IniciarSesion