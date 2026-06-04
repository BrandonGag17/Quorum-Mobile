import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet, TextInput, } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import supabase from './supabaseClient'
import Navbar from './Utilidades/Navbar'
import Iconos from '../src/Utilidades/Iconos'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import Ionicons from '@expo/vector-icons/Ionicons';
import Feather from '@expo/vector-icons/Feather'

function Inicio() {
    const navigation = useNavigation()
    const [grupos, setGrupos] = useState([])
    const [mostrarModal, setMostrarModal] = useState(false)
    const [busqueda, setBusqueda] = useState('')

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
            .select('id_grupo, grupo(*)')
            .eq('id_usuario', user.id)

        if (error) {
            console.error(error)
            return
        }

        setGrupos(data)
    }

    return (
        <View style={styles.fondo}>
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
                    size={42}
                    icono={<Ionicons name="calendar" size={24} color="#3F3F3F" />}
                />
                <Text style={styles.textoTitulo}>Proximas juntadas</Text>
            </View>

            <View style={styles.tituloSeparador}>
                <Iconos
                    size={42}
                    icono={<FontAwesome6 name="users" size={22} color="#3F3F3F" />}
                />
                <Text style={styles.textoTitulo}>Grupos</Text>


                <TouchableOpacity onPress={() => setMostrarModal(true)} style={styles.botonCrear}>
                    <Text style={styles.botonCrearTexto}>+ Crear</Text>
                </TouchableOpacity>
            </View>

            <FlatList
                data={grupos}
                keyExtractor={(item) => item.id_grupo.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.grupoCard} onPress={() => navigation.navigate('Grupo', {
                        idGrupo: item.id_grupo
                    })}>
                        <Image source={{ uri: item.grupo?.foto_perfil }} style={styles.fotoGrupo} />

                        <Image
                            source={require('../assets/img/amiguis.jpg')}
                            style={styles.imagen}
                        />
                        <View style={styles.grupoInfo}>
                            <Text style={styles.grupoNombre}>
                                {item.grupo?.nombre}
                            </Text>

                            <Text style={styles.grupoIntegrantes}>martu, martu, martu y yo</Text>
                        </View>

                    </TouchableOpacity>
                )}
            />

            {/*<Modal
                visible={mostrarModal}
                transparent={true}
                onRequestClose={() => setMostrarModal(false)}
            >
                <TouchableOpacity onPress={() => setMostrarModal(false)}>
                    <View>
                        <TouchableOpacity onPress={() => { }}>
                            <View>
                                <TouchableOpacity onPress={() => setMostrarModal(false)}>
                                    <Text>X</Text>
                                </TouchableOpacity>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>*/}

            <Navbar pantallaActual="Inicio" />
        </View>
    )

}

const styles = StyleSheet.create({
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
        marginBottom: 20
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
        padding: 12,
        marginBottom: 10
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
    }
})

export default Inicio