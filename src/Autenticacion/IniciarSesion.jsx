import { View, Text, StyleSheet, TextInput, TouchableOpacity, Image } from 'react-native'
import { IconMailFilled, IconLockFilled } from '@tabler/icons-react-native'
import { useNavigation } from '@react-navigation/native'
import { useState } from 'react'
import Button from '../Utilidades/Botones'
import Input from '../Utilidades/Input'
import supabase from '../supabaseClient'
import ErrorMessage from '../Utilidades/MensajeError'

function IniciarSesion() {
    const navigation = useNavigation()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(false)

    const handleSubmit = async () => {
        setCargando(true)
        setMensaje('')

        const { error } = await supabase.auth.signInWithPassword({
            email,
            password
        })

        if (error) {
            setMensaje('Error: ' + error.message)
        } else {
            navigation.replace('Inicio')
        }

        setCargando(false)
    }

    const handleGoogle = async () => {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: 'http://localhost:5173/inicio' }
        })
        if (error) setMensaje('Error: ' + error.message)
    }

    return (
        <View style={styles.fondo}>
            <Text style={styles.titulo}>Iniciar sesión</Text>

            <Input label="Email:" placeholder="tu@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" Icon={IconMailFilled} />
            <Input label="Contraseña:" placeholder="********" value={password} onChangeText={setPassword} secureTextEntry Icon={IconLockFilled} />
            <Text style={styles.olvido}>¿Olvidaste tu contraseña?</Text>

            {mensaje ? (
                <ErrorMessage mensaje="Email o contraseña incorrectos" />
            ) : null}

            <Button nombre={cargando ? 'Cargando...' : 'Iniciar sesión'} onPress={handleSubmit} disabled={cargando} />

            <View style={styles.separador}>
                <View style={styles.linea} />
                <Text style={styles.textoSeparador}>o</Text>
                <View style={styles.linea} />
            </View>

            <TouchableOpacity style={styles.botonGoogle} onPress={handleGoogle}>
                <Image source={require('../../assets/img/Iconos/Google.png')} style={styles.googleLogo} resizeMode="contain" />
                <Text style={styles.textoGoogle}>Continuar con Google</Text>
            </TouchableOpacity>

            {mensaje ? <Text>{mensaje}</Text> : null}
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
    botonGoogle: {
        padding: 10,
        margin: 10,
        backgroundColor: '#ffffff',
        borderRadius: 15,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleLogo: {
        width: 28,
        height: 28,
        marginRight: 15
    },
    textoGoogle: {
        fontFamily: 'Utendo',
        textAlign: 'center',
        color: 'black',
        fontSize: 22.5,
    },
    separador: {
        flexDirection: 'row',
        alignItems: 'center',
        marginVertical: 10,
    },
    linea: {
        flex: 1,
        height: 1,
        backgroundColor: '#4F4F55',
    },
    textoSeparador: {
        color: '#A0A0A0',
        marginHorizontal: 15,
        fontFamily: 'Utendo',
        fontSize: 16,
    },
    olvido: {
        alignItems: 'flex-end',
        color: '#A846E9',
        textDecorationLine: 'underline',
        textAlign: 'right',
        marginBottom: 20
    }
})

export default IniciarSesion