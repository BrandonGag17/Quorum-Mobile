import { View, Text, StyleSheet } from 'react-native'
import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import Button from '../Utilidades/Botones'
import Input from '../Utilidades/Input'

function Registrarse3() {
    const navigation = useNavigation()

    const [fechaNacimiento, setFechaNacimiento] = useState('')
    const [direccion, setDireccion] = useState('')

    const [cargando, setCargando] = useState(false)
    const [mensaje, setMensaje] = useState('')

    const handleSubmit = async () => {
        setCargando(true)
        setMensaje('')

        try {
            // backend después
        } catch (error) {
            setMensaje(error.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <View style={styles.fondo}>
            <Text style={styles.titulo}>Registrarse</Text>

            <Input label="Fecha de cumpleaños (Opcional)" placeholder="DD/MM/AAAA" value={fechaNacimiento} onChangeText={setFechaNacimiento}/>

            <Input label="Dirección (Opcional)" placeholder="Tu dirección" value={direccion} onChangeText={setDireccion}/>

            <Button nombre={cargando ? 'Cargando...' : 'Registrarse'} onPress={handleSubmit} disabled={cargando}/>
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

export default Registrarse3