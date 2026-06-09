import { View, Text, StyleSheet, TextInput } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { IconMailFilled, IconLockFilled, IconUserFilled } from '@tabler/icons-react-native'
import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useRoute } from '@react-navigation/native'
import Button from '../Utilidades/Botones'
import Input from '../Utilidades/Input'
import ErrorMessage from '../Utilidades/MensajeError'

function Registrarse2() {
    const navigation = useNavigation()

    const route = useRoute()
    const { email, usuario, password } = route.params

    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(false)

    const handleSubmit = () => {
        setMensaje('')

        if (!nombre.trim()) {
            setMensaje('Ingresá tu nombre')
            return
        }

        if (!apellido.trim()) {
            setMensaje('Ingresá tu apellido')
            return
        }

        navigation.navigate('Registrarse3', {
            email,
            usuario,
            password,
            nombre: nombre.trim(),
            apellido: apellido.trim()
        })
    }

    return (
        <SafeAreaView style={styles.fondo}>
            <Text style={styles.titulo}>Registrarse</Text>

            <Input
                label="Nombre:"
                value={nombre}
                onChangeText={(texto) => {
                    setNombre(texto)
                    setMensaje('')
                }}
            />

            <Input
                label="Apellido:"
                value={apellido}
                onChangeText={(texto) => {
                    setApellido(texto)
                    setMensaje('')
                }}
            />

            {mensaje ? (
                <ErrorMessage mensaje={mensaje} />
            ) : null}

            <Button
                nombre={cargando ? 'Cargando...' : 'Continuar'}
                onPress={handleSubmit}
                disabled={cargando}
            />
        </SafeAreaView>

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
    }
})

export default Registrarse2