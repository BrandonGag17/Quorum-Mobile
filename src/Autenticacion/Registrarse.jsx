import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import Checkbox from 'expo-checkbox'
import { IconMailFilled, IconLockFilled, IconUserFilled } from '@tabler/icons-react-native'
import { useState } from 'react'
import Button from '../Utilidades/Botones'
import Input from '../Utilidades/Input'
import supabase from '../supabaseClient'

function Registrarse() {
    const [isChecked, setChecked] = useState(false)
    const [email, setEmail] = useState('')
    const [usuario, setUsuario] = useState('')
    const [password, setPassword] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(false)

    const handleSubmit = async () => {
        setCargando(true)
        setMensaje('')

        const { error } = await supabase.auth.signInWithPassword({ email, password })

        if (error) {
            setMensaje('Error: ' + error.message)
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
            <Text style={styles.titulo}>Registrarse</Text>

            <Input label="Email:" placeholder="tu@gmail.com" value={email} onChangeText={setEmail} Icon={IconMailFilled} keyboardType="email-address" autoCapitalize="none" />

            <Input label="Nombre de usuario:" placeholder="tuusuario123" value={usuario} onChangeText={setUsuario} Icon={IconUserFilled} />

            <Input label="Contraseña:" placeholder="*******" value={password} onChangeText={setPassword} secureTextEntry={true} Icon={IconLockFilled} />

            <View style={styles.checkbox}>
                <Checkbox value={isChecked} onValueChange={setChecked} />
                <Text style={[styles.texto, { color: '#FFFFFF' }]}> Acepto los términos y condiciones</Text>
            </View>

            {mensaje ? (
                <ErrorMessage mensaje="Email o contraseña incorrectos" />
            ) : null}

            <Button nombre={cargando ? 'Cargando...' : 'Continuar'} onPress={() => navigation.navigate('Registrarse2')} disabled={cargando} />

            <View style={styles.separador}>
                <View style={styles.linea} />
                <Text style={styles.textoSeparador}>o</Text>
                <View style={styles.linea} />
            </View>

            <TouchableOpacity style={styles.botonGoogle} onPress={handleGoogle}>
                <Image source={require('../../assets/img/Iconos/Google.png')} style={styles.googleLogo} />
                <Text style={styles.textoGoogle}>Continuar con Google</Text>
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
    checkbox: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 20,
        marginTop: 10,
    },
    texto: {
        fontFamily: 'Utendo',
        fontSize: 16
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
    }
})

export default Registrarse