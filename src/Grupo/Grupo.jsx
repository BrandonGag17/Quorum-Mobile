import { useEffect, useState } from 'react'
import {
    View,
    Text,
    Pressable,
    Modal,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import supabase from '../supabaseClient'
import Navbar from '../Utilidades/Navbar'
import Iconos from '../Utilidades/Iconos'
import Ionicons from '@expo/vector-icons/Ionicons'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

function Grupo() {
    const route = useRoute()
    const navigation = useNavigation()

    const { idGrupo } = route.params

    const [grupo, setGrupo] = useState(null)
    const [eventos, setEventos] = useState([])
    const [mostrarModal, setMostrarModal] = useState(false)
    const [cargando, setCargando] = useState(true)

    useEffect(() => {
        cargarDatos()
    }, [])

    async function cargarDatos() {
        setCargando(true)

        await Promise.all([
            traerGrupo(),
            traerEventos()
        ])

        setCargando(false)
    }

    async function traerGrupo() {
        const { data, error } = await supabase
            .from('grupo')
            .select('*')
            .eq('id', idGrupo)
            .single()

        if (error) {
            console.log(
                'Error consultando grupo:',
                error.message
            )
            return
        }

        setGrupo(data)
    }

    async function traerEventos() {
        const { data, error } = await supabase
            .from('evento')
            .select('*')
            .eq('id_grupo', idGrupo)
            .order('fecha_hora_inicio', {
                ascending: true
            })

        if (error) {
            console.log(
                'Error consultando eventos:',
                error.message
            )
            return
        }

        setEventos(data || [])
    }

    const eventosConfirmados = eventos.filter(
        evento =>
            evento.estado === 'confirmado' &&
            (
                !evento.fecha_hora_inicio ||
                new Date(evento.fecha_hora_inicio) > new Date()
            )
    )

    const propuestasPlanificacion = eventos.filter(
        evento => evento.estado === 'planificacion'
    )

    const renderEvento = ({ item }) => (
        <Pressable
            style={styles.card}
            onPress={() =>
                navigation.navigate(
                    'Juntada',
                    { idEvento: item.id }
                )
            }
        >
            <Text style={styles.cardTitulo}>
                {item.nombre}
            </Text>
        </Pressable>
    )

    if (cargando) {
        return (
            <View style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color="#B514F6"
                />


                <Navbar pantallaActual="Inicio" />
            </View>
        )
    }

    return (
        <View style={styles.container}>

            <Text style={styles.nombreGrupo}>
                {grupo?.nombre || 'Grupo sin nombre'}
            </Text>

            <View style={styles.tituloSeparador}>
                <Iconos
                    size={42}
                    icono={<Ionicons name="calendar" size={24} color="#3F3F3F" />}
                />
                <Text style={styles.textoTitulo}>Proximas juntadas</Text>
            </View>

            {eventosConfirmados.length > 0 ? (
                <FlatList
                    data={eventosConfirmados}
                    keyExtractor={(item) =>
                        item.id.toString()
                    }
                    renderItem={renderEvento}
                />
            ) : (
                <Text>
                    No hay juntadas confirmadas
                </Text>
            )}

            <View style={styles.tituloSeparador}>
                <Iconos
                    size={42}
                    icono={<MaterialCommunityIcons name="lightbulb-variant" size={24} color="#3F3F3F" />
                    }
                />
                <Text style={styles.textoTitulo}>Propuestas</Text>

            <TouchableOpacity onPress={() => setMostrarModal(true)} style={styles.botonCrear}>
                <Text style={styles.botonCrearTexto}>+ Crear</Text>
            </TouchableOpacity>
            </View>

            {propuestasPlanificacion.length > 0 ? (
                <FlatList
                    data={propuestasPlanificacion}
                    keyExtractor={(item) =>
                        item.id.toString()
                    }
                    renderItem={renderEvento}
                />
            ) : (
                <Text>
                    No hay propuestas de planificación
                </Text>
            )}

            <Modal
                visible={mostrarModal}
                transparent
                animationType="fade"
                onRequestClose={() =>
                    setMostrarModal(false)
                }
            >
                <View style={styles.modalOverlay}>
                    <View style={styles.modal}>

                        <Pressable
                            onPress={() =>
                                setMostrarModal(false)
                            }
                        >
                            <Text>Cerrar</Text>
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                setMostrarModal(false)

                                navigation.navigate(
                                    'ProponerJuntada',
                                    { idGrupo }
                                )
                            }}
                        >
                            <Text>
                                Proponer Juntada
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => {
                                setMostrarModal(false)

                                navigation.navigate(
                                    'CrearEvento',
                                    { idGrupo }
                                )
                            }}
                        >
                            <Text>
                                Crear Evento
                            </Text>
                        </Pressable>

                    </View>
                </View>
            </Modal>
            <Navbar pantallaActual="Inicio" />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        paddingBottom: 90
    },

    nombreGrupo: {
        fontSize: 28,
        fontWeight: 'bold',
        marginBottom: 20,
        color: 'white'
    },

    titulo: {
        fontSize: 20,
        fontWeight: 'bold',
        marginTop: 20,
        marginBottom: 10
    },

    card: {
        padding: 15,
        marginBottom: 10,
        borderRadius: 12,
        backgroundColor: '#EEEEEE'
    },

    cardTitulo: {
        fontSize: 16
    },

    botonMas: {
        position: 'absolute',
        right: 25,
        bottom: 25,
        width: 60,
        height: 60,
        borderRadius: 30,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#B514F6'
    },

    textoMas: {
        color: 'white',
        fontSize: 30
    },

    modalOverlay: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: 'rgba(0,0,0,0.5)'
    },

    modal: {
        width: '80%',
        padding: 20,
        borderRadius: 15,
        backgroundColor: 'white'
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#15151C'
    },
    tituloSeparador: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20
    },
    textoTitulo: {
        color: 'white',
        marginLeft: 10,
        fontFamily: 'CashMarket',
        fontSize: 20
    },
    botonCrear: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: '#57C7A3',
        padding: 6,
        borderRadius: 8
    },
    botonCrearTexto: {
        color: '#3F3F3F',
        fontSize: 15,
        fontFamily: 'CashMarket',
    },
})

export default Grupo