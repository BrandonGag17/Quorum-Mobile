import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { View, Text, TextInput, TouchableOpacity, Image } from 'react-native'
import supabase from '../supabaseClient'

function LogIn() {
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
        <View>
            <Text>Iniciar sesión</Text>

            <Text>Mail</Text>
            <TextInput
                value={email}
                onChangeText={setEmail}
                keyboardType="email-address"
                autoCapitalize="none"
            />

            <Text>Contraseña</Text>
            <TextInput
                value={password}
                onChangeText={setPassword}
                secureTextEntry
            />

            <TouchableOpacity onPress={handleSubmit} disabled={cargando}>
                <Text>{cargando ? 'Iniciando sesión...' : 'Continuar'}</Text>
            </TouchableOpacity>

            <Text>o</Text>

            <TouchableOpacity onPress={handleGoogle}>
                <Image source={require('../../public/img/Logos/google.webp')} style={{ width: 20, height: 20 }} />
                <Text>Continuar con Google</Text>
            </TouchableOpacity>

            {mensaje ? <Text>{mensaje}</Text> : null}
        </View>
    )
}

export default LogIn