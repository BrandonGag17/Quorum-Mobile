import { View, Text, StyleSheet, TextInput, TouchableOpacity } from 'react-native'
import { IconMailFilled, IconLockFilled } from '@tabler/icons-react-native'
import { useNavigation } from '@react-navigation/native'
import { useState } from 'react'
import Button from '../Utilidades/Botones'
import supabase from '../supabaseClient'

function IniciarSesion() {
    const navigation = useNavigation()
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(false)

    const handleSubmit = async () => {
        setCargando(true)
        setMensaje('')

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setMensaje('Error: ' + error.message)
        } else {
            navigation.navigate('Inicio')
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

            <View style={styles.iconoTexto}>
                <IconMailFilled color="#FFFFFF" size={28} />
                <Text style={styles.texto}>Email</Text>
            </View>
            <TextInput style={styles.input} placeholder="tu@gmail.com" value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" />
            <View style={styles.iconoTexto}>
                <IconLockFilled color="#FFFFFF" size={28} />
                <Text style={styles.texto}>Contraseña</Text>
            </View>
            <TextInput style={styles.input} placeholder="*******" value={password} onChangeText={setPassword} secureTextEntry />

            <Button nombre={cargando ? 'Cargando...' : 'Iniciar sesión'} view="Inicio" onPress={handleSubmit} disabled={cargando} />

            <TouchableOpacity onPress={handleGoogle}>
                <Text style={styles.botonGoogle}>Continuar con Google</Text>
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
    input: {
        borderRadius: 15,
        borderColor: '#4F4F55',
        borderWidth: 2,
        backgroundColor: '#2A2A2E',
        padding: 15,
        color: 'white',
        marginBottom: 20,
        marginTop: 10
    },
    botonGoogle: {
        fontFamily: 'Utendo',
        textAlign: 'center',
        color: 'black',
        fontSize: 22.5,
        padding: 10,
        margin: 10,
        backgroundColor: '#ffffff',
        borderRadius: 15
    }
})

export default IniciarSesion