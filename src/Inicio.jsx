import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet, TextInput, ScrollView, Modal } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import supabase from './supabaseClient'
import Navbar from './Utilidades/Navbar'
import Iconos from '../src/Utilidades/Iconos'
import Ionicons from '@expo/vector-icons/Ionicons'
import Feather from '@expo/vector-icons/Feather'
import CardJuntadas from './Utilidades/CardJuntadas'
import { IconUserFilled } from '@tabler/icons-react-native';
import CrearGrupo from './Grupo/CrearGrupo'

function Inicio() {
    const navigation = useNavigation()
    const [grupos, setGrupos] = useState([])
    const [mostrarModal, setMostrarModal] = useState(false)
    const [busqueda, setBusqueda] = useState('')
    const [eventos, setEventos] = useState([])

    useEffect(() => {
        cargarGrupos()
    }, [])

    async function cargarGrupos() {
        const { data: { session } } = await supabase.auth.getSession()

        if (!session) {
            navigation.replace('IniciarSesion')
            return
        }

        const user = session.user

        const { data, error } = await supabase
            .from('usuario_grupo')
            .select(`
        id_grupo,
        grupo (
            *,
            usuario_grupo (
                usuario (
                    username
                )
            )
        )
    `)
            .eq('id_usuario', user.id)

        if (error) {
            console.error(error)
            return
        }

        setGrupos(data)

        if (data && data.length > 0) {
            const idsGrupos = data.map(g => g.id_grupo)
            traerEventos(idsGrupos)
        }
    }

    async function traerEventos(idsGrupos) {
        const { data, error } = await supabase
            .from('evento')
            .select(`
                *,
                grupo (
                    nombre
                )
            `)
            .in('id_grupo', idsGrupos)

        if (error) {
            console.log("Error consultando eventos:", error.message)
            return
        }
        setEventos(data || [])
    }

    const ahora = new Date().toISOString();

    const eventosConfirmados = eventos.filter(e =>
        e.estado === 'confirmado' && (e.fecha_hora_inicio > ahora || !e.fecha_hora_inicio)
    )

    return (
        <SafeAreaView style={styles.fondo}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.contenido}
            >
                <Text style={styles.titulo}>Quórum</Text>

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

                <View style={styles.tituloSeparador}>
                    <Iconos
                        size={36}
                        icono={<Ionicons name="calendar" size={25} color="#000000" />}
                    />
                    <Text style={styles.textoTitulo}>Proximas juntadas</Text>
                </View>

                {eventosConfirmados.length > 0 ? (
                    eventosConfirmados.map(e => (
                        <CardJuntadas
                            key={e.id}
                            evento={e}
                            navigation={navigation}
                        />
                    ))
                ) : (
                    <Text>No hay juntadas confirmadas</Text>
                )}


                <View style={styles.tituloSeparador}>
                    <Iconos
                        size={36}
                        icono={<IconUserFilled size={25} color="#000000" />}
                    />
                    <Text style={styles.textoTitulo}>Grupos</Text>


                    <TouchableOpacity onPress={() => setMostrarModal(true)} style={styles.botonCrear}>
                        <Text style={styles.botonCrearTexto}>+ Crear</Text>
                    </TouchableOpacity>
                </View>

                <FlatList
                    scrollEnabled={false}
                    data={grupos}
                    keyExtractor={(item) => item.id_grupo.toString()}
                    renderItem={({ item }) => {
                        const integrantes = item.grupo?.usuario_grupo
                            ?.map(m => m.usuario?.username)
                            .filter(Boolean)
                            .join(', ')

                        return (
                            <TouchableOpacity
                                style={styles.grupoCard}
                                onPress={() =>
                                    navigation.navigate('Grupo', {
                                        idGrupo: item.id_grupo
                                    })
                                }
                            >
                                <Image
                                    source={
                                        item.grupo?.foto_perfil
                                            ? { uri: item.grupo.foto_perfil }
                                            : require('../assets/img/amiguis.jpg')
                                    }
                                    style={styles.imagen}
                                />

                                <View style={styles.grupoInfo}>
                                    <Text style={styles.grupoNombre}>
                                        {item.grupo?.nombre}
                                    </Text>

                                    <Text style={styles.grupoIntegrantes}>
                                        {integrantes}
                                    </Text>
                                </View>
                            </TouchableOpacity>
                        )
                    }}
                />

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
                                    <Text style={styles.modalTitulo}>Crear grupo</Text>

                                    <TouchableOpacity onPress={() => setMostrarModal(false)}>
                                        <Text style={styles.botonCerrar}>✕</Text>
                                    </TouchableOpacity>
                                </View>
                                <CrearGrupo
                                    onGrupoCreado={() => {
                                        setMostrarModal(false)
                                        cargarGrupos()
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
        borderRadius: 8
    },
    botonCrearTexto: {
        color: '#000000',
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
        fontSize: 30
    },
    buscador: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderRadius: 15,
        paddingHorizontal: 15,
        height: 50,
        marginBottom: 30,
        marginTop: 20,
        borderWidth: 2,
        borderColor: '#d9d9d9',
    },
    inputBuscador: {
        flex: 1,
        color: '#15151C',
        fontFamily: 'Utendo',
        marginLeft: 10,
        fontSize: 16,
    },
    tituloSeparador: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    textoTitulo: {
        color: 'white',
        marginLeft: 10,
        fontFamily: 'CashMarket',
        fontSize: 20,
        flex: 1
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
        borderRadius: 16,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginBottom: 8
    },
    grupoNombre: {
        color: 'white',
        fontFamily: 'CashMarket',
        fontSize: 16
    },
    grupoIntegrantes: {
        color: '#b0a0cc',
        fontFamily: 'Utendo',
        fontSize: 13,
        marginTop: 2
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
})

export default Inicio