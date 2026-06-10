import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TextInput, TouchableOpacity, Modal } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import supabase from '../supabaseClient';
import HeaderGrupo from '../Utilidades/HeaderGrupo';
import ButtonApp from '../Utilidades/BotonesApp'
import NavBar from '../Utilidades/Navbar'

function InfoGrupo() {
    const route = useRoute();
    const navigation = useNavigation();
    const { idGrupo } = route.params;
    const [grupo, setGrupo] = useState(null);
    const [miembros, setMiembros] = useState([]);
    const [cargando, setCargando] = useState(false)

    const [mostrarModal, setMostrarModal] = useState(false);
    const [mostrarPopupSalir, setMostrarPopupSalir] = useState(false);
    const [miembroUsername, setMiembroUsername] = useState('');
    const [errorMiembro, setErrorMiembro] = useState('');

    useEffect(() => {
        if (idGrupo) cargarGrupoYMiembros();
    }, [idGrupo]);

    async function cargarGrupoYMiembros() {
        setCargando(true);

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

        setCargando(false);
    }

    async function confirmarSalir() {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
            const { error } = await supabase
                .from('usuario_grupo')
                .delete()
                .eq('id_grupo', idGrupo)
                .eq('id_usuario', user.id);

            if (!error) {
                setMostrarPopupSalir(false); // Primero cerramos el popup
                navigation.navigate('Inicio'); // Luego navegamos
            }
        }
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

        const {
            data: { user }
        } = await supabase.auth.getUser();

        if (usuarioEncontrado.id === user.id) {
            setErrorMiembro('No podés agregarte a vos mismo');
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

    if (cargando) {
        return (
            <View style={styles.loadingContainer}>
                <Text style={styles.loadingText}>
                    Cargando grupo...
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <HeaderGrupo
                grupo={grupo}
                cantidadMiembros={miembros.length}
            />
            <View style={styles.contenido}>


                <FlatList
                    data={miembros}
                    keyExtractor={(item) => item.id.toString()}
                    showsVerticalScrollIndicator={false}
                    contentContainerStyle={styles.listaMiembros}
                    renderItem={({ item }) => (
                        <View style={styles.miembroCard}>
                            <Image
                                source={{
                                    uri: item.usuario?.foto_perfil
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
                        onPress={() => setMostrarModal(true)}
                        nombre={cargando ? 'Cargando...' : '+ Añadir miembros'}
                    />
                </View>

                <TouchableOpacity
                    style={styles.botonSalir}
                    onPress={() => setMostrarPopupSalir(true)}
                >
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

                <Modal
                    visible={mostrarPopupSalir}
                    transparent
                    animationType="fade"
                >
                    <View style={styles.modalFondo}>
                        <View style={styles.modalContenido}>
                            <Text style={styles.modalTitulo}>
                                ¿Salir del grupo?
                            </Text>

                            <Text style={styles.modalTexto}>
                                Vas a dejar de formar parte del grupo.
                            </Text>

                            <ButtonApp
                                nombre="Sí, salir"
                                onPress={confirmarSalir}
                            />

                            <TouchableOpacity
                                onPress={() => setMostrarPopupSalir(false)}
                            >
                                <Text style={styles.cancelarTexto}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>
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
        paddingBottom: 90,
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
        backgroundColor: '#ff0000',
        borderRadius: 15,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
    },

    textoBotonSalir: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
        fontFamily: 'CashMarket'
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
        paddingBottom: 120,
    },
    loadingContainer: {
        flex: 1,
        backgroundColor: '#15151C',
        justifyContent: 'center',
        alignItems: 'center',
    },

    loadingText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'CashMarket',
    },

    modalFondo: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.75)',
        justifyContent: 'center',
        alignItems: 'center',
    },

    modalContenido: {
        width: '85%',
        backgroundColor: '#1E1E2D',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#4B1F6F',
    },

    modalTitulo: {
        color: 'white',
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 10,
        fontFamily: 'CashMarket',
    },

    modalTexto: {
        color: '#D8C7E8',
        textAlign: 'center',
        marginBottom: 20,
        fontFamily: 'Utendo',
    },

    cancelarTexto: {
        color: '#AAA',
        textAlign: 'center',
        marginTop: 15,
        fontFamily: 'Utendo',
    },
    botonContainer: {
        marginTop: 10,
        marginBottom: 10,
    },

    cerrarModal: {
        position: 'absolute',
        top: 15,
        right: 15,
        zIndex: 1,
    },

    textoCerrar: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'CashMarket',
    },

    input: {
        backgroundColor: '#1B1B29',
        borderWidth: 1,
        borderColor: '#4B1F6F',
        borderRadius: 12,
        paddingHorizontal: 15,
        paddingVertical: 12,
        color: 'white',
        fontSize: 16,
        fontFamily: 'Utendo',
        marginBottom: 15,
        marginTop: 10,
    },

    botonModal: {
        backgroundColor: '#5C3E94',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 5,
    },

    textoBotonModal: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'CashMarket',
    },

    error: {
        color: '#FF6B6B',
        textAlign: 'center',
        marginTop: 12,
        fontSize: 14,
        fontFamily: 'Utendo',
    },
});

export default InfoGrupo