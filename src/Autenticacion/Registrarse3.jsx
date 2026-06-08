import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useState } from 'react'
import { useNavigation } from '@react-navigation/native'
import { useRoute } from '@react-navigation/native'
import Button from '../Utilidades/Botones'
import Input from '../Utilidades/Input'
import * as ImagePicker from 'expo-image-picker'
import supabase from '../supabaseClient'
import ErrorMessage from '../Utilidades/MensajeError'

function Registrarse3() {
    const navigation = useNavigation()

    const route = useRoute()

    const {
        email,
        usuario,
        password,
        nombre,
        apellido
    } = route.params

    const [fechaNacimiento, setFechaNacimiento] = useState('')
    const [foto, setFoto] = useState(null)
    const [cargando, setCargando] = useState(false)
    const [mensaje, setMensaje] = useState('')

    function formatearFecha(texto) {
        const numeros = texto.replace(/\D/g, '')

        if (numeros.length <= 2) {
            return numeros
        }

        if (numeros.length <= 4) {
            return `${numeros.slice(0, 2)}/${numeros.slice(2)}`
        }

        return `${numeros.slice(0, 2)}/${numeros.slice(2, 4)}/${numeros.slice(4, 8)}`
    }

    async function seleccionarFoto() {
        const resultado =
            await ImagePicker.launchImageLibraryAsync({
                mediaTypes:
                    ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                quality: 1,
                aspect: [1, 1]
            })

        if (!resultado.canceled) {
            setFoto(resultado.assets[0])
        }
    }

    const handleSubmit = async () => {
        try {
            setCargando(true)
            setMensaje('')

            const { data, error } = await supabase.auth.signUp({
                email,
                password
            })

            if (error) {
                setMensaje(error.message)
                return
            }

            if (!data?.user) {
                setMensaje('No se pudo crear la cuenta')
                return
            }

            const user = data.user

            let fotoPerfil = null

            if (foto) {
                const response = await fetch(foto.uri)
                const blob = await response.blob()

                const extension = foto.uri.split('.').pop()

                const nombreArchivo =
                    `${user.id}-${Date.now()}.${extension}`

                const { error: errorStorage } =
                    await supabase.storage
                        .from('avatars')
                        .upload(
                            nombreArchivo,
                            blob
                        )

                if (errorStorage) {
                    setMensaje('No se pudo subir la foto')
                    return
                }

                const { data: fotoData } =
                    supabase.storage
                        .from('avatars')
                        .getPublicUrl(nombreArchivo)

                fotoPerfil = fotoData.publicUrl
            }

            if (!foto) {
                fotoPerfil = 'https://tu-proyecto.supabase.co/storage/v1/object/public/avatars/amiguis.jpg'
            }

            if (
                fechaNacimiento &&
                !/^\d{2}\/\d{2}\/\d{4}$/.test(fechaNacimiento)
            ) {
                setMensaje('Fecha inválida')
                return
            }

            let fechaSQL = null

            if (fechaNacimiento) {
                const [dia, mes, anio] =
                    fechaNacimiento.split('/')

                fechaSQL = `${anio}-${mes}-${dia}`
            }

            const { error: errorUsuario } =
                await supabase
                    .from('usuario')
                    .insert({
                        id: user.id,
                        email,
                        username: usuario,
                        nombre,
                        apellido,
                        fecha_nacimiento: fechaSQL,
                        foto_perfil: fotoPerfil
                    })

            if (errorUsuario) {
                console.log('ERROR USUARIO:', errorUsuario)
                setMensaje(errorUsuario.message)
                return
            }

            navigation.replace('Inicio')

        } catch (error) {
            setMensaje(error.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <SafeAreaView style={styles.fondo}>
            <Text style={styles.titulo}>Registrarse</Text>

            <Input
                label="Fecha de nacimiento (Opcional)"
                placeholder="DD/MM/AAAA"
                value={fechaNacimiento}
                onChangeText={(texto) =>
                    setFechaNacimiento(formatearFecha(texto))
                }
                keyboardType="numeric"
            />
            <TouchableOpacity
                style={styles.contenedorFoto}
                onPress={seleccionarFoto}
            >
                <Image
                    source={
                        foto
                            ? { uri: foto.uri }
                            : require('../../assets/img/amiguis.jpg')
                    }
                    style={styles.fotoPerfil}
                />

                <Text style={styles.cambiarFoto}>
                    {foto ? 'Cambiar foto' : 'Agregar foto'}
                </Text>
            </TouchableOpacity>

            {mensaje ? (
                <ErrorMessage mensaje={mensaje} />
            ) : null}

            <Button
                nombre={cargando ? 'Cargando...' : 'Registrarse'}
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
    },
    contenedorFoto: {
        alignItems: 'center',
        marginBottom: 25,
    },

    fotoPerfil: {
        width: 100,
        height: 100,
        borderRadius: 60,
        marginBottom: 10,
    },

    cambiarFoto: {
        color: '#A846E9',
        fontFamily: 'Utendo',
        fontSize: 16,
    },
})

export default Registrarse3