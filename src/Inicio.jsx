import { useEffect, useState, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import Ionicons from '@expo/vector-icons/Ionicons'
import { IconUserFilled } from '@tabler/icons-react-native'

import {
    FlatList, Image, Modal, ScrollView, StyleSheet,
    Text, TextInput, TouchableOpacity, View
} from 'react-native'

import { SafeAreaView } from 'react-native-safe-area-context'

import supabase from './supabaseClient'
import CrearGrupo from './Grupo/CrearGrupo'
import CardJuntadas from './Utilidades/CardJuntadas'
import Iconos from './Utilidades/Iconos'
import Navbar from './Utilidades/Navbar'

function Inicio() {
    const navigation = useNavigation()

    const [grupos, setGrupos] = useState([])
    const [eventos, setEventos] = useState([])
    const [mostrarModal, setMostrarModal] = useState(false)
    const [busqueda, setBusqueda] = useState('')
    const [cargandoGrupos, setCargandoGrupos] = useState(true)
    const [cargandoEventos, setCargandoEventos] = useState(true)

    // 🔥 control anti doble init
    const initialized = useRef(false)
    const authListener = useRef(null)

    useEffect(() => {
        if (initialized.current) return
        initialized.current = true

        iniciar()

        authListener.current =
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (event === 'SIGNED_OUT') {
                    setGrupos([])
                    setEventos([])
                    return
                }

                if (event === 'SIGNED_IN' && session?.user) {
                    await cargarGrupos(session.user)
                }
            })

        return () => {
            authListener.current?.subscription?.unsubscribe()
        }
    }, [])

    // 🔥 INIT SOLO 1 VEZ
    async function iniciar() {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session?.user) {
            navigation.replace('IniciarSesion')
            return
        }

        await cargarGrupos(session.user)
    }

    // 🔥 GRUPOS + EVENTOS EN CADENA CONTROLADA
    async function cargarGrupos(user) {
        if (!user) return

        setCargandoGrupos(true)

        const { data, error } = await supabase
            .from('usuario_grupo')
            .select(`
                id_grupo,
                grupo (
                    nombre,
                    foto_perfil,
                    usuario_grupo (
                        usuario ( username )
                    )
                )
            `)
            .eq('id_usuario', user.id)

        if (error) {
            console.error(error)
            setCargandoGrupos(false)
            return
        }

        const gruposProcesados = (data || []).map(item => {
            const usernames = item.grupo?.usuario_grupo
                ?.map(m => m.usuario?.username)
                .filter(Boolean) || []

            const integrantes =
                usernames.length > 3
                    ? `${usernames.slice(0, 3).join(', ')} y más`
                    : usernames.join(', ')

            return { ...item, integrantes }
        })

        setGrupos(gruposProcesados)
        setCargandoGrupos(false)

        // 🔥 LLAMADA DIRECTA (SIN USEEFFECT)
        await cargarEventos(gruposProcesados.map(g => g.id_grupo))
    }

    async function cargarEventos(idsGrupos) {
        if (!idsGrupos.length) {
            setEventos([])
            setCargandoEventos(false)
            return
        }

        setCargandoEventos(true)

        const ahora = new Date().toISOString()

        const { data, error } = await supabase
            .from('evento')
            .select(`
                *,
                grupo ( nombre )
            `)
            .in('id_grupo', idsGrupos)
            .eq('estado', 'confirmado')
            .gte('fecha_hora_inicio', ahora)
            .order('fecha_hora_inicio', { ascending: true })

        if (error) {
            console.log(error.message)
            setCargandoEventos(false)
            return
        }

        setEventos(data || [])
        setCargandoEventos(false)
    }
    return (
        <SafeAreaView style={styles.fondo}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contenido}
            >
                <Text style={styles.titulo}>Quórum</Text>

                {/* BUSCADOR */}
                <View style={styles.buscador}>
                    <Feather name="search" size={22} color="#808080" />
                    <TextInput
                        style={styles.inputBuscador}
                        placeholder="Buscar grupos"
                        placeholderTextColor="#808080"
                        value={busqueda}
                        onChangeText={setBusqueda}
                    />
                </View>

                {/* JUNTADAS */}
                <Iconos
                    size={36}
                    titulo="Próximas juntadas"
                    icono={<Ionicons name="calendar" size={25} color="#000000" />}
                />

                {cargandoEventos ? (
                    <View style={styles.noJuntadas}>
                        <Text style={styles.text}>
                            Cargando juntadas...
                        </Text>
                    </View>
                ) : eventos.length > 0 ? (
                    <FlatList
                        horizontal
                        data={eventos}
                        keyExtractor={(item) => item.id.toString()}
                        renderItem={({ item }) => (
                            <CardJuntadas
                                evento={item}
                                navigation={navigation}
                            />
                        )}
                        showsHorizontalScrollIndicator={false}
                        contentContainerStyle={styles.juntadasContainer}
                    />
                ) : (
                    <View style={styles.noJuntadas}>
                        <Text style={styles.text}>
                            No hay próximas juntadas
                        </Text>
                    </View>
                )}
                {/* GRUPOS HEADER */}
                <View style={styles.titulo_crear}>
                    <Iconos
                        size={36}
                        titulo="Grupos"
                        icono={<IconUserFilled size={25} color="#000000" />}
                    />

                    <TouchableOpacity
                        onPress={() => setMostrarModal(true)}
                        style={styles.botonCrear}
                    >
                        <Text style={styles.botonCrearTexto}>+ Crear</Text>
                    </TouchableOpacity>
                </View>

                {cargandoGrupos ? (
                    <View style={styles.noJuntadas}>
                        <Text style={styles.text}>
                            Cargando grupos...
                        </Text>
                    </View>
                ) : grupos.length > 0 ? (
                    <FlatList
                        scrollEnabled={false}
                        data={grupos}
                        keyExtractor={(item) => item.id_grupo.toString()}
                        renderItem={({ item }) => (
                            <TouchableOpacity
                                style={styles.grupoCard}
                                onPress={() =>
                                    navigation.navigate('Grupo', {
                                        idGrupo: item.id_grupo
                                    })
                                }
                            >
                                <Image
                                    source={{ uri: item.grupo.foto_perfil }}
                                    style={styles.imagen}
                                />

                                <View style={styles.grupoInfo}>
                                    <Text style={styles.grupoNombre}>
                                        {item.grupo.nombre}
                                    </Text>

                                    <Text style={styles.grupoIntegrantes}>
                                        {item.integrantes}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )}
                    />
                ) : (
                    <View style={styles.noJuntadas}>
                        <Text style={styles.text}>
                            Todavía no formás parte de ningún grupo
                        </Text>
                    </View>
                )}

                {/* MODAL */}
                {mostrarModal && (
                    <Modal
                        visible={mostrarModal}
                        transparent
                        animationType="fade"
                        onRequestClose={() => setMostrarModal(false)}
                    >
                        <View style={styles.modalOverlay}>
                            <View style={styles.modal}>
                                <View style={styles.headerModal}>
                                    <Text style={styles.modalTitulo}>
                                        Crear grupo
                                    </Text>

                                    <TouchableOpacity onPress={() => setMostrarModal(false)}>
                                        <Text style={styles.botonCerrar}>✕</Text>
                                    </TouchableOpacity>
                                </View>

                                <CrearGrupo
                                    onGrupoCreado={() => {
                                        cacheGrupos = null
                                        setMostrarModal(false)
                                        supabase.auth.getSession().then(({ data }) => {
                                            if (data?.session?.user) {
                                                cargarGrupos(data.session.user)
                                            }
                                        })
                                    }}
                                />
                            </View>
                        </View>
                    </Modal>
                )}
            </ScrollView>

            <Navbar pantallaActual="Inicio" />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    botonCrear: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#57C7A3',
        padding: 7,
        paddingLeft: 10,
        paddingRight: 10,
        borderRadius: 10,
        paddingHorizontal: 12,
    },
    botonCrearTexto: {
        color: '#15151C',
        fontSize: 15,
        fontFamily: 'CashMarket',
    },
    fondo: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        paddingBottom: 90
    },
    titulo: {
        color: 'white',
        fontFamily: 'CashMarket',
        fontSize: 34,
        marginBottom: 5,
    },
    buscador: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#373749',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 52,
        marginBottom: 30,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#726c79',
    },
    inputBuscador: {
        flex: 1,
        color: 'white',
        fontFamily: 'Utendo',
        marginLeft: 10,
        fontSize: 16,
    },
    imagen: {
        width: 50,
        height: 50,
        borderRadius: 50
    },
    grupoInfo: {
        flex: 1,
        marginLeft: 12,
        justifyContent: 'center'
    },
    grupoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#4A216F',
        borderRadius: 18,
        paddingVertical: 10,
        paddingHorizontal: 12,
        marginBottom: 10,
    },
    grupoNombre: {
        color: 'white',
        fontFamily: 'CashMarket',
        fontSize: 17,
    },
    grupoIntegrantes: {
        color: '#A8A8B5',
        fontFamily: 'Utendo',
        fontSize: 13,
        marginTop: 2,
    },
    contenido: {
        paddingBottom: 20,
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)',
    },

    modal: {
        width: '85%',
        backgroundColor: '#23232D',
        padding: 20,
        borderRadius: 20,
    },

    headerModal: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 25,
    },

    modalTitulo: {
        color: 'white',
        fontSize: 24,
        fontFamily: 'CashMarket',
    },

    botonCerrar: {
        color: '#B0B0B0',
        fontSize: 24,
        fontFamily: 'Utendo',
    },
    noJuntadas: {
        padding: 50,
        backgroundColor: '#5C3E94',
        borderRadius: 10,
        marginBottom: 20
    },
    text: {
        fontFamily: 'CashMarket',
        color: 'white',
        textAlign: 'center'
    },
    juntadasContainer: {
        paddingRight: 25,
        gap: 12,
    },
    titulo_crear: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between'
    },
})

export default Inicio