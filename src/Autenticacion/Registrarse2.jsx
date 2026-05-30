import { View, Text, StyleSheet, TextInput } from 'react-native'
import { IconMailFilled, IconLockFilled, IconUserFilled } from '@tabler/icons-react-native'
import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import Button from '../Utilidades/Botones'
import Input from '../Utilidades/Input'

function Registrarse2() {
    const navigation = useNavigation()

    const [nombre, setNombre] = useState('')
    const [apellido, setApellido] = useState('')

    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(false)

    const handleSubmit = async () => {
        setCargando(true)
        setMensaje('')

        try {
            //completar con backend

            navigation.navigate('Registrarse3')
        } catch (error) {
            setMensaje(error.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <View style={styles.fondo}>
            <Text style={styles.titulo}>Registrarse</Text>

            <Input label="Nombre:" value={nombre} onChangeText={setNombre} /* Icon={IconMailFilled} *//>

            <Input label="Apellido:" value={apellido} onChangeText={setApellido} /*Icon={IconUserFilled}*/ />

            <Button nombre={cargando ? 'Cargando...' : 'Continuar'} onPress={handleSubmit} disabled={cargando}/>
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
    }
})

export default Registrarse2