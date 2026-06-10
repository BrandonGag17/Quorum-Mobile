import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import supabase from '../supabaseClient';
import HeaderGrupo from '../Utilidades/HeaderGrupo';
import BotonVolver from '../Utilidades/BotonVolver'
import Iconos from '../Utilidades/Iconos'
import { IconUserFilled } from '@tabler/icons-react-native'
import ButtonApp from '../Utilidades/BotonesApp'
import NavBar from '../Utilidades/Navbar'

function InfoGrupo() {
    const route = useRoute();
    const { idGrupo } = route.params;
    const [grupo, setGrupo] = useState(null);
    const [miembros, setMiembros] = useState([]);
    const [cargando, setCargando] = useState(false)


    const [mostrarModal, setMostrarModal] = useState(false);
    const [miembroUsername, setMiembroUsername] = useState('');
    const [errorMiembro, setErrorMiembro] = useState('');

    useEffect(() => {
        if (idGrupo) cargarGrupoYMiembros();
    }, [idGrupo]);

    async function cargarGrupoYMiembros() {
        const { data: grupoData } = await supabase
            .from('grupo')
            .select('*')
            .eq('id', idGrupo)
            .single();

        const { data: miembrosData } = await supabase
            .from('usuario_grupo')
            .select(`
                id,
                usuario ( username, foto_perfil )
            `)
            .eq('id_grupo', idGrupo);

        setGrupo(grupoData);
        setMiembros(miembrosData || []);
    }

    async function agregarMiembro() {
        if (!miembroUsername.trim()) return;

        const { data: usuarioEncontrado } = await supabase
            .from('usuario')
            .select('id')
            .eq('username', miembroUsername.trim())
            .single();

        if (!usuarioEncontrado) {
            setErrorMiembro('El usuario no existe');
            return;
        }

        const { error: errInsert } = await supabase
            .from('usuario_grupo')
            .insert({
                id_usuario: usuarioEncontrado.id,
                id_grupo: idGrupo,
                rol: 'miembro'
            });

        if (errInsert) {
            setErrorMiembro('Error: el usuario ya está en el grupo');
        } else {
            setMiembroUsername('');
            setMostrarModal(false);
            cargarGrupoYMiembros();
        }
    }

    return (
        <View style={styles.container}>

            <HeaderGrupo />

            <View style={styles.contenido}>
                <View style={styles.tituloSeparador}>
                    <Iconos size={36} icono={<IconUserFilled size={25} color="#000000" />} />
                    <Text style={styles.textoTitulo}> Miembros </Text>
                </View>


                <FlatList
                    data={miembros}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listaMiembros}
                    renderItem={({ item }) => (
                        <View style={styles.miembroCard}>
                            <Image
                                source={{
                                    uri:
                                        item.usuario?.foto_perfil ||
                                        'https://placeholder.com'
                                }}
                                style={styles.fotoPerfil}
                            />

                            <View style={styles.infoUsuario}>
                                <Text style={styles.nombreUsuario}>
                                    {item.usuario?.username}
                                </Text>

                                <Text style={styles.username}>
                                    @{item.usuario?.username}
                                </Text>
                            </View>
                        </View>
                    )}
                />

                <View style={styles.botonContainer}>
                    <ButtonApp
                        nombre={cargando ? 'Cargando...' : '+ Añadir miembros'}
                    />
                </View>

                <TouchableOpacity style={styles.botonSalir}>
                    <Text style={styles.textoBotonSalir}>
                        Salir del grupo
                    </Text>
                </TouchableOpacity>

                <Modal
                    visible={mostrarModal}
                    transparent
                    animationType="fade"
                >
                    <View style={styles.modalFondo}>
                        <View style={styles.modalContenido}>
                            <TouchableOpacity
                                style={styles.cerrarModal}
                                onPress={() => setMostrarModal(false)}
                            >
                                <Text style={styles.textoCerrar}>✕</Text>
                            </TouchableOpacity>

                            <Text style={styles.modalTitulo}>
                                Añadir miembro
                            </Text>

                            <TextInput
                                style={styles.input}
                                placeholder="Username"
                                placeholderTextColor="#999"
                                value={miembroUsername}
                                onChangeText={(val) => {
                                    setMiembroUsername(val);
                                    setErrorMiembro('');
                                }}
                            />

                            <TouchableOpacity
                                style={styles.botonModal}
                                onPress={agregarMiembro}
                            >
                                <Text style={styles.textoBotonModal}>
                                    Añadir
                                </Text>
                            </TouchableOpacity>

                            {errorMiembro ? (
                                <Text style={styles.error}>
                                    {errorMiembro}
                                </Text>
                            ) : null}
                        </View>
                    </View>
                </Modal>
                                        </View>

                <NavBar />
            </View>
    )
}

import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#15151C',
        paddingHorizontal: '5%',
        paddingTop: '5%',
    },

    contenido: {
        flex: 1,
    },

    miembroCard: {
        backgroundColor: '#6742a8',
        borderRadius: 15,
        paddingVertical: 12,
        paddingHorizontal: 15,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },

    fotoPerfil: {
        width: 45,
        height: 45,
        borderRadius: 999,
        marginRight: 12,
    },

    infoUsuario: {
        flex: 1,
    },

    nombreUsuario: {
        color: 'white',
        fontFamily: 'CashMarket',
        fontSize: 15,
    },

    username: {
        color: '#d5d5d5',
        fontSize: 12,
        marginTop: 2,
        fontFamily: 'Utendo '
    },

    botonAgregar: {
        backgroundColor: '#59d6b4',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 15,
    },

    textoBotonAgregar: {
        color: '#1a1a1a',
        fontWeight: 'bold',
        fontSize: 16,
    },

    botonSalir: {
        borderWidth: 2,
        borderColor: '#ff0000',
        borderRadius: 8,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },

    textoBotonSalir: {
        color: 'white',
        fontWeight: 'bold',
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
    listaMiembros: {
        paddingBottom: 20,
    },

});

export default InfoGrupo