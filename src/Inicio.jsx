import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Image, FlatList, StyleSheet, TextInput, } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { IconSearch, IconFolderFilled, IconCalendarWeekFilled } from '@tabler/icons-react-native'
import supabase from './supabaseClient'
import Navbar from './Utilidades/Navbar'

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
                <IconSearch size={22} color="#808080" />

                <TextInput
                    style={styles.inputBuscador}
                    placeholder="Buscar grupos"
                    placeholderTextColor="#808080"
                    value={busqueda}
                    onChangeText={setBusqueda}
                />
            </View>

            <View style={styles.tituloSeparador}>
                <IconCalendarWeekFilled size={25} color="#ffffff" />
                <Text style={styles.textoTitulo}>Proximas juntadas</Text>
            </View>

            <View style={styles.tituloSeparador}>
                <IconFolderFilled size={25} color="#ffffff" />
                <Text style={styles.textoTitulo}>Grupos</Text>
            </View>

            <FlatList
                data={grupos}
                keyExtractor={(item) => item.id_grupo.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity style={styles.grupoCard} onPress={() => navigation.navigate('Grupo', {
                        idGrupo: item.id_grupo
                    })}>
                        <Image
                            source={{ uri: item.grupo?.foto_perfil }}
                            style={styles.fotoGrupo}
                        />

                        <View style={styles.grupoInfo}>
                            <Text style={styles.grupoNombre}>
                                {item.grupo?.nombre}
                            </Text>
                        </View>
                    </TouchableOpacity>
                )}
            />

            <TouchableOpacity onPress={() => setMostrarModal(true)}>
                <Text style={styles.test}>+</Text>
            </TouchableOpacity>

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
        fontSize: 20
    },
    test: {
        color: 'white'
    }
})

export default Inicio