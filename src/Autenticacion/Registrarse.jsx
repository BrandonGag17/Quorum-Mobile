import { View, Text, StyleSheet } from 'react-native'
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
        } else {
            navigation.navigate('Inicio')
        }

        setCargando(false)
    }

    return (
        <View style={styles.fondo}>
            <Text style={styles.titulo}>Registrarse</Text>

            <Input label="Email:" placeholder="tu@gmail.com" value={email} onChangeText={setEmail} Icon={IconMailFilled} />

            <Input label="Nombre de usuario:" placeholder="tuusuario123" value={usuario} onChangeText={setUsuario} Icon={IconUserFilled} />

            <Input label="Contraseña:" placeholder="*******" value={password} onChangeText={setPassword} secureTextEntry={true} Icon={IconLockFilled} />

            <View style={styles.checkbox}>
                <Checkbox value={isChecked} onValueChange={setChecked} />
                <Text style={[styles.texto, { color: '#FFFFFF' }]}> Acepto los términos y condiciones</Text>
            </View>

            <Button nombre={cargando ? 'Cargando...' : 'Continuar'} view="Registrarse2" onPress={handleSubmit} disabled={cargando} />

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
        justifyContent: 'center'
    },
    texto: {
        fontFamily: 'Utendo',
        fontSize: 16
    }
})

export default Registrarse