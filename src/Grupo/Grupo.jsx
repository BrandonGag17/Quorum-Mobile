import { useEffect, useState, useRef } from 'react'
import {
    View,
    Text,
    Pressable,
    Modal,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
    Animated,
    Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useRoute, useNavigation } from '@react-navigation/native'
import supabase from '../supabaseClient'

import Navbar from '../Utilidades/Navbar'
import Iconos from '../Utilidades/Iconos'
import CardJuntadas from '../Utilidades/CardJuntadas'
import BotonVolver from '../Utilidades/BotonVolver'

import Ionicons from '@expo/vector-icons/Ionicons'
import { IconBulbFilled, IconCalendarEventFilled } from '@tabler/icons-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

function Grupo() {
    const route = useRoute()
    const navigation = useNavigation()

    const { idGrupo } = route.params

    const [grupo, setGrupo] = useState(null)
    const [eventos, setEventos] = useState([])
    const [mostrarModal, setMostrarModal] = useState(false)
    const [cargando, setCargando] = useState(true)

    const translateY = useRef(new Animated.Value(400)).current

    useEffect(() => {
        if (mostrarModal) {
            Animated.timing(translateY, {
                toValue: 0,
                duration: 300,
                useNativeDriver: false,
            }).start()
        } else {
            Animated.timing(translateY, {
                toValue: 400,
                duration: 300,
                useNativeDriver: false,
            }).start()
        }
    }, [mostrarModal])

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
            .select(`
            *,
            grupo (
                nombre
            )
        `)
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

    if (cargando) {
        return (
            <SafeAreaView style={styles.loadingContainer}>
                <ActivityIndicator
                    size="large"
                    color="#B514F6"
                />


                <Navbar pantallaActual="Inicio" />
            </SafeAreaView>
        )
    }

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
            >

                <View style={styles.headerGrupo}>
                    <BotonVolver />

                    <Image
                        source={
                            grupo?.foto_perfil
                                ? { uri: grupo.foto_perfil }
                                : require('../../assets/img/amiguis.jpg')
                        }
                        style={styles.fotoGrupo}
                    />

                    <Text style={styles.nombreGrupo}>
                        {grupo?.nombre || 'Grupo sin nombre'}
                    </Text>
                </View>

                <View style={styles.tituloSeparador}>
                    <Iconos
                        size={36}
                        icono={
                            <Ionicons
                                name="calendar"
                                size={25}
                                color="#000000"
                            />
                        }
                    />

                    <Text style={styles.textoTitulo}>
                        Proximas juntadas
                    </Text>
                </View>

                {eventosConfirmados.length > 0 ? (
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={eventosConfirmados}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <CardJuntadas
                                evento={item}
                                navigation={navigation}
                            />
                        )}
                    />
                ) : (
                    <Text style={{ color: 'white' }}>
                        No hay juntadas confirmadas
                    </Text>
                )}

                <View style={styles.tituloSeparador}>
                    <Iconos
                        size={36}
                        icono={<MaterialCommunityIcons name="lightbulb-variant" size={25} color="#000000" />
                        }
                    />
                    <Text style={styles.textoTitulo}>Propuestas</Text>

                    <TouchableOpacity onPress={() => setMostrarModal(true)} style={styles.botonCrear}>
                        <Text style={styles.botonCrearTexto}>+ Crear</Text>
                    </TouchableOpacity>
                </View>

                {propuestasPlanificacion.length > 0 ? (
                    <FlatList
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        data={propuestasPlanificacion}
                        keyExtractor={(item) => item.id}
                        renderItem={({ item }) => (
                            <CardJuntadas
                                evento={item}
                                navigation={navigation}
                            />
                        )}
                    />
                ) : (
                    <Text style={{ color: 'white' }}>
                        No hay propuestas de planificación
                    </Text>
                )}

                <Modal
                    visible={mostrarModal}
                    transparent
                    animationType="none"
                    onRequestClose={() => setMostrarModal(false)}
                >
                    <Pressable
                        style={styles.modalOverlay}
                        onPress={() => setMostrarModal(false)}
                    >
                        <Animated.View
                            style={[
                                styles.bottomSheet,
                                { transform: [{ translateY }] }
                            ]}
                        >
                            <Pressable
                                onPress={() => { }}
                            >
                                <View style={styles.sheetHandle} />

                                <Text style={styles.sheetTitulo}>
                                    Crear
                                </Text>

                                <TouchableOpacity
                                    style={styles.sheetBoton}
                                    onPress={() => {
                                        setMostrarModal(false)

                                        navigation.navigate(
                                            'ProponerJuntada',
                                            { idGrupo }
                                        )
                                    }}
                                >
                                    <View style={styles.sheetBotonTexto}>
                                        <IconBulbFilled size={35} />
                                        <View style={styles.textosModal}>
                                            <Text style={styles.tituloModal}>Proponer juntadas</Text>
                                            <Text style={styles.subtituloModal}>El grupo vota fechas, lugares y mas</Text>
                                        </View>
                                    </View>
                                </TouchableOpacity>

                                <View style={styles.sheetBotonDisabled}>
                                    <View style={styles.sheetBotonTexto}>
                                        <IconCalendarEventFilled
                                            size={35}
                                            color="#727272"
                                        />

                                        <View style={styles.textosModal}>
                                            <Text style={styles.tituloModalDisabled}>
                                                Crear evento
                                            </Text>

                                            <Text style={styles.subtituloModalDisabled}>
                                                Sin votaciones, fecha fija
                                            </Text>
                                        </View>
                                    </View>
                                </View>

                            </Pressable>
                        </Animated.View>
                    </Pressable>
                </Modal>
            </ScrollView>

            <Navbar pantallaActual="Inicio" />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    /* TEMPORAL POR LA DEMO */
    sheetBotonDisabled: {
        backgroundColor: '#2E2E2E',
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
        opacity: 0.7
    },

    tituloModalDisabled: {
        color: '#727272',
        fontFamily: 'CashMarket',
        marginBottom: 5
    },

    subtituloModalDisabled: {
        color: '#727272',
        fontFamily: 'Utendo'
    },
    /* TEMPORAL POR LA DEMO */
    container: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        paddingBottom: 90
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
        justifyContent: 'flex-end',
        backgroundColor: 'rgba(0,0,0,0.45)',
    },
    bottomSheet: {
        backgroundColor: '#23232D',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
        padding: 25,
        paddingBottom: 40,
    },
    sheetHandle: {
        width: 50,
        height: 5,
        backgroundColor: '#666',
        borderRadius: 10,
        alignSelf: 'center',
        marginBottom: 20,
    },
    sheetTitulo: {
        color: 'white',
        fontSize: 22,
        fontFamily: 'CashMarket',
        marginBottom: 20,
    },
    sheetBoton: {
        backgroundColor: '#4A216F',
        padding: 16,
        borderRadius: 14,
        marginBottom: 12,
    },
    sheetBotonTexto: {
        color: 'white',
        fontSize: 16,
        fontFamily: 'Utendo',
        flexDirection: 'row',
        alignItems: 'center',
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
        fontSize: 20,
        flex: 1
    },
    textosModal: {
        marginLeft: 10
    },
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
    tituloModal: {
        color: 'white',
        fontFamily: 'CashMarket',
        marginBottom: 5
    },
    subtituloModal: {
        color: '#b6b6b6',
        fontFamily: 'Utendo'
    },
    headerGrupo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 25,
    },

    fotoGrupo: {
        width: 40,
        height: 40,
        borderRadius: 27.5,
        marginLeft: 10,
        marginRight: 12,
    },

    nombreGrupo: {
        color: 'white',
        fontFamily: 'CashMarket',
        fontSize: 26,
        flexShrink: 1,
    },
})

export default Grupo