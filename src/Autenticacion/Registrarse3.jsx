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

const FOTO_DEFAULT = 'https://fusjhtyvjkshuzxofeqj.supabase.co/storage/v1/object/public/avatars/PlaceholderPerfil.png'

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

    const [textoBusqueda, setTextoBusqueda] = useState('')
    const [localidadSeleccionada, setLocalidadSeleccionada] = useState(null)
    const [resultados, setResultados] = useState([])
    const [buscando, setBuscando] = useState(false)

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
            setMensaje('')
        }
    }

    async function buscarLocalidades(texto) {
        setTextoBusqueda(texto)
        setLocalidadSeleccionada(null)

        if (texto.length < 3) {
            setResultados([])
            return
        }

        try {
            setBuscando(true)
            const response = await fetch(
                `https://apis.datos.gob.ar/georef/api/localidades?nombre=${encodeURIComponent(texto)}&campos=nombre,provincia,centroide&max=8`
            )
            const data = await response.json()
            setResultados(data.localidades)
        } catch {
            setResultados([])
        } finally {
            setBuscando(false)
        }
    }

    function seleccionarLocalidad(item) {

        setLocalidadSeleccionada(item)

        setTextoBusqueda(
            `${item.nombre}, ${item.provincia.nombre}`
        )

        setResultados([])
    }

    const handleSubmit = async () => {
        try {
            setCargando(true)
            setMensaje('')

            if (
                fechaNacimiento &&
                !/^\d{2}\/\d{2}\/\d{4}$/.test(fechaNacimiento)
            ) {
                setMensaje('Fecha inválida')
                return
            }

            if (fechaNacimiento) {
                const [dia, mes, anio] =
                    fechaNacimiento.split('/')

                const fecha = new Date(
                    anio,
                    mes - 1,
                    dia
                )

                if (
                    fecha.getDate() !== Number(dia) ||
                    fecha.getMonth() !== Number(mes) - 1 ||
                    fecha.getFullYear() !== Number(anio)
                ) {
                    setMensaje('Fecha inválida')
                    return
                }
            }

            if (textoBusqueda && !localidadSeleccionada) {

                setMensaje(
                    "Seleccioná una localidad de la lista."
                )

                return
            }

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

            let fotoPerfil = FOTO_DEFAULT

            if (foto) {
                const response = await fetch(foto.uri)
                const blob = await response.blob()

                const extension = foto.uri.split('.').pop() || 'jpg'

                const nombreArchivo =
                    `${user.id}-${Date.now()}.${extension}`

                const { error: errorStorage } =
                    await supabase.storage
                        .from('avatars')
                        .upload(nombreArchivo, blob)

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
                        foto_perfil: fotoPerfil,
                        localidad: localidadSeleccionada
                            ? localidadSeleccionada
                            : null
                    })

            if (errorUsuario) {
                console.log('ERROR USUARIO:', errorUsuario)
                setMensaje(errorUsuario.message)
                return
            }

            navigation.replace('Exito')

        } catch (error) {
            setMensaje(error.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <SafeAreaView style={styles.fondo}>
            <Text style={styles.titulo}>Registrarse</Text>

            <View style={styles.contenedorBusqueda}>
                <Input
                    label="Localidad (Opcional)"
                    placeholder="Escribí tu localidad"
                    value={textoBusqueda}
                    onChangeText={buscarLocalidades}
                />

                {resultados.length > 0 && (
                    <View style={styles.listaLocalidades}>
                        {resultados.map((item, index) => (
                            <TouchableOpacity
                                key={index}
                                style={styles.itemLocalidad}
                                onPress={() => seleccionarLocalidad(item)}
                            >
                                <Text style={styles.nombreLocalidad}>
                                    {item.nombre}
                                </Text>

                                <Text style={styles.provincia}>
                                    {item.provincia.nombre}
                                </Text>
                            </TouchableOpacity>
                        ))}
                    </View>
                )}
            </View>

            <Input
                label="Fecha de nacimiento (Opcional)"
                placeholder="DD/MM/AAAA"
                value={fechaNacimiento}
                onChangeText={(texto) => {
                    setFechaNacimiento(formatearFecha(texto))
                    setMensaje('')
                }}
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
                            : require('../../assets/img/Placeholders/PlaceholderPerfil.png')
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
    contenedorBusqueda: {
        position: "relative",
        zIndex: 100
    },

    listaLocalidades: {
        position: "absolute",

        top: 88, // ajustar según la altura de tu Input

        left: 0,
        right: 0,

        backgroundColor: "#252530",

        borderRadius: 15,

        overflow: "hidden",

        elevation: 15,
        zIndex: 999,

        shadowColor: "#000",
        shadowOpacity: 0.35,
        shadowRadius: 10,
        shadowOffset: {
            width: 0,
            height: 5
        },

        maxHeight: 260
    },

    itemLocalidad: {

        padding: 15,
        borderBottomWidth: 1,
        borderBottomColor: "#333"

    },

    nombreLocalidad: {

        color: "white",
        fontFamily: "CashMarket",
        fontSize: 17

    },

    provincia: {

        color: "#9F9F9F",
        fontFamily: "Utendo"

    },
})

export default Registrarse3