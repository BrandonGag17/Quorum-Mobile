import { useState } from 'react'
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    FlatList,
    Alert,
    StyleSheet,
    Image
} from 'react-native'
import Input from '../Utilidades/Input'
import * as ImagePicker from 'expo-image-picker'
import supabase from '../supabaseClient'
import ErrorMessage from '../Utilidades/MensajeError'
import InputApp from '../Utilidades/InputApp'
import ButtonApp from '../Utilidades/BotonesApp'

const FOTO_DEFAULT =
    'https://fusjhtyvjkshuzxofeqj.supabase.co/storage/v1/object/public/avatars/PlaceholderGrupo.png'

function CrearGrupo({ onGrupoCreado }) {
    const [nombreGrupo, setNombreGrupo] = useState('')
    const [foto, setFoto] = useState(null)
    const [miembroUsername, setMiembroUsername] = useState('')
    const [miembros, setMiembros] = useState([])
    const [mensaje, setMensaje] = useState('')
    const [cargando, setCargando] = useState(false)

    async function seleccionarFoto() {
        const resultado = await ImagePicker.launchImageLibraryAsync({
            mediaTypes: ImagePicker.MediaTypeOptions.Images,
            allowsEditing: true,
            quality: 1,
        })

        if (!resultado.canceled) {
            setFoto(resultado.assets[0])
        }
    }

    async function agregarMiembro() {
        if (!miembroUsername.trim()) {
            setMensaje('Ingresá un usuario')
            return
        }

        const {
            data: usuarioEncontrado
        } = await supabase
            .from('usuario')
            .select(`
            id,
            username,
            foto_perfil
        `)
            .eq(
                'username',
                miembroUsername.trim()
            )
            .single()

        if (!usuarioEncontrado) {
            setMensaje('El usuario no existe')
            return
        }

        const {
            data: { user }
        } = await supabase.auth.getUser()

        if (usuarioEncontrado.id === user.id) {
            setMensaje('No podés agregarte a vos mismo')
            return
        }

        if (
            miembros.some(
                miembro =>
                    miembro.id === usuarioEncontrado.id
            )
        ) {
            setMensaje('Ese usuario ya fue agregado')
            return
        }

        setMensaje('')
        setMiembros([
            ...miembros,
            usuarioEncontrado
        ])

        setMiembroUsername('')
    }

    async function manejarSubmit() {
        if (cargando) return

        setCargando(true)
        try {
            setMensaje('')

            if (!nombreGrupo.trim()) {
                setMensaje(
                    'Ingresá un nombre para el grupo'
                )
                return
            }

            if (nombreGrupo.trim().length < 3) {
                setMensaje(
                    'El nombre debe tener al menos 3 caracteres'
                )
                return
            }

            if (miembros.length === 0) {
                setMensaje(
                    'Agregá al menos un integrante para crear el grupo'
                )
                return
            }

            const {
                data: { user }
            } = await supabase.auth.getUser()

            if (!user) {
                setMensaje(
                    'No se pudo obtener el usuario'
                )
                return
            }

            let fotoPerfil = FOTO_DEFAULT

            if (foto) {
                const response =
                    await fetch(foto.uri)

                const blob =
                    await response.blob()

                const extension =
                    foto.uri.split('.').pop() || 'jpg'

                const nombreArchivo =
                    `${user.id}-${Date.now()}.${extension}`

                const {
                    error: errorStorage
                } = await supabase.storage
                    .from('avatars')
                    .upload(
                        nombreArchivo,
                        blob
                    )

                if (errorStorage) {
                    setMensaje(
                        'No se pudo subir la imagen'
                    )
                    return
                }

                const { data } =
                    supabase.storage
                        .from('avatars')
                        .getPublicUrl(
                            nombreArchivo
                        )

                fotoPerfil =
                    data.publicUrl
            }

            if (foto) {
                const response =
                    await fetch(foto.uri)

                const blob =
                    await response.blob()

                const extension =
                    foto.uri.split('.').pop()

                const nombreArchivo =
                    `${user.id}-${Date.now()}.${extension}`

                const {
                    error: errorStorage
                } = await supabase.storage
                    .from('avatars')
                    .upload(
                        nombreArchivo,
                        blob
                    )

                if (errorStorage) {
                    setMensaje(
                        'No se pudo subir la imagen'
                    )
                    return
                }

                const { data } =
                    supabase.storage
                        .from('avatars')
                        .getPublicUrl(
                            nombreArchivo
                        )

                fotoPerfil =
                    data.publicUrl
            }

            const {
                data: grupo,
                error
            } = await supabase
                .from('grupo')
                .insert({
                    nombre: nombreGrupo.trim(),
                    id_creador: user.id,
                    foto_perfil: fotoPerfil
                })
                .select()
                .single()

            if (error) {
                setMensaje(
                    'No se pudo crear el grupo'
                )
                return
            }

            await supabase
                .from('usuario_grupo')
                .insert({
                    id_usuario: user.id,
                    id_grupo: grupo.id,
                    rol: 'admin'
                })

            for (const miembro of miembros) {
                await supabase
                    .from('usuario_grupo')
                    .insert({
                        id_usuario: miembro.id,
                        id_grupo: grupo.id,
                        rol: 'miembro'
                    })
            }

            onGrupoCreado?.()

        } catch (error) {
            setMensaje(error.message)
        } finally {
            setCargando(false)
        }
    }

    return (
        <View>

            <Text style={styles.label}>
                Nombre del grupo
            </Text>

            <TextInput
                style={styles.input}
                placeholder="Ej: Los pibes"
                placeholderTextColor="#888"
                value={nombreGrupo}
                onChangeText={(texto) => {
                    setNombreGrupo(texto)
                    setMensaje('')
                }}

            />

            <Text style={styles.label}>
                Foto del grupo (opcional)
            </Text>

            <TouchableOpacity
                style={styles.botonSecundario}
                onPress={seleccionarFoto}
            >
                {foto ? (
                    <View style={styles.previewContainer}>
                        <Image
                            source={{ uri: foto.uri }}
                            style={styles.preview}
                        />

                        <Text style={styles.botonSecundarioTexto}>
                            Cambiar foto
                        </Text>
                    </View>
                ) : (
                    <Text style={styles.botonSecundarioTexto}>
                        Seleccionar foto
                    </Text>
                )}
            </TouchableOpacity>

            <Text style={styles.label}>
                Agregar miembros
            </Text>

            <View style={styles.fila}>
                <TextInput
                    style={[styles.input, { flex: 1 }]}
                    placeholder="@usuario"
                    placeholderTextColor="#888"
                    value={miembroUsername}
                    onChangeText={(valor) => {
                        setMiembroUsername(valor)

                        if (
                            mensaje === 'Ingresá un usuario' ||
                            mensaje === 'El usuario no existe' ||
                            mensaje === 'No podés agregarte a vos mismo' ||
                            mensaje === 'Ese usuario ya fue agregado'
                        ) {
                            setMensaje('')
                        }
                    }}
                />

                <TouchableOpacity
                    style={styles.botonAgregar}
                    onPress={agregarMiembro}
                >
                    <Text style={styles.botonAgregarTexto}>
                        +
                    </Text>
                </TouchableOpacity>
            </View>

            <FlatList
                scrollEnabled={false}
                data={miembros}
                keyExtractor={item => item.id}
                renderItem={({ item }) => (
                    <View style={styles.miembroContainer}>
                        <Image
                            source={{
                                uri:
                                    item.foto_perfil ||
                                    'https://via.placeholder.com/40'
                            }}
                            style={styles.miembroFoto}
                        />

                        <Text style={styles.miembro}>
                            @{item.username}
                        </Text>
                    </View>
                )}
            />

            {mensaje ? (
                <ErrorMessage mensaje={mensaje} />
            ) : null}

            <TouchableOpacity
                style={styles.botonCrear}
                onPress={manejarSubmit}
                disabled={cargando}
            >
                <Text style={styles.botonCrearTexto}>
                    {cargando
                        ? 'Creando...'
                        : 'Crear grupo'}
                </Text>
            </TouchableOpacity>

        </View>
    )
}

const styles = StyleSheet.create({
    label: {
        color: 'white',
        fontFamily: 'CashMarket',
        marginBottom: 8,
        marginTop: 12
    },

    input: {
        backgroundColor: '#2E2E3A',
        color: 'white',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        fontFamily: 'Utendo'
    },

    fila: {
        flexDirection: 'row',
        gap: 10,
        alignItems: 'center'
    },

    botonAgregar: {
        backgroundColor: '#57C7A3',
        width: 45,
        height: 45,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center'
    },

    botonAgregarTexto: {
        fontSize: 22,
        color: '#000'
    },

    botonSecundario: {
        backgroundColor: '#4A216F',
        borderRadius: 12,
        padding: 12
    },

    botonSecundarioTexto: {
        color: 'white',
        textAlign: 'center',
        fontFamily: 'Utendo'
    },

    miembro: {
        color: 'white',
        marginTop: 8,
        fontFamily: 'Utendo'
    },

    error: {
        color: '#ff6666',
        marginTop: 8
    },

    botonCrear: {
        backgroundColor: '#57C7A3',
        borderRadius: 12,
        padding: 14,
        marginTop: 20
    },

    botonCrearTexto: {
        textAlign: 'center',
        color: '#000',
        fontFamily: 'CashMarket',
        fontSize: 16
    },
    previewContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 10
    },
    preview: {
        width: 30,
        height: 30,
        borderRadius: 10,
    },
    miembroContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10
    },

    miembroFoto: {
        width: 35,
        height: 35,
        borderRadius: 17.5,
        marginRight: 10
    },
})

export default CrearGrupo