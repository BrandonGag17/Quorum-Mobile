import { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, Modal, FlatList } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import supabase from './supabaseClient'

function Inicio() {
    const navigation = useNavigation()
    const [grupos, setGrupos] = useState([])
    const [mostrarModal, setMostrarModal] = useState(false)

    useEffect(() => {
        cargarGrupos()
    }, [])

    async function cargarGrupos() {
        const { data: { session } } =
            await supabase.auth.getSession()

        console.log("SESSION:", session)

        if (!session) {
            navigation.replace('IniciarSesion')
            return
        }

        const user = session.user

        console.log("USER:", user)

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
        <View>
            <Text>Grupos</Text>

            <TouchableOpacity onPress={() => setMostrarModal(true)}>
                <Text>+</Text>
            </TouchableOpacity>

            <FlatList
                data={grupos}
                keyExtractor={(item) => item.id_grupo.toString()}
                renderItem={({ item }) => (
                    <TouchableOpacity onPress={() => { }}>
                        <Text>{item.grupo ? item.grupo.nombre : 'Sin nombre'} {item.grupo ? item.grupo.descripcion : ''}</Text>
                    </TouchableOpacity>
                )}
            />

            <Modal
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
                                <Text>Crear grupo (por implementar)</Text>
                            </View>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>

            <TouchableOpacity
                onPress={async () => {
                    await supabase.auth.signOut()
                }}
            >
                <Text>Cerrar sesión</Text>
            </TouchableOpacity>
        </View>
    )
}

export default Inicio