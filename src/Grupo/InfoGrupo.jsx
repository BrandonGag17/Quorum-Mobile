import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TextInput, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import { useRoute, useNavigation } from '@react-navigation/native';
import supabase from '../supabaseClient';
import HeaderGrupo from '../Utilidades/HeaderGrupo';
import ButtonApp from '../Utilidades/BotonesApp'
import Navbar from '../Utilidades/Navbar'
import { SafeAreaView } from 'react-native-safe-area-context'
import Iconos from '../Utilidades/Iconos'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6';

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
        <View style={styles.container}>
            <BotonVolver />

            <View style={styles.headerGrupo}>
                <Image
                    source={{ uri: grupo?.foto_perfil }}
                    style={styles.fotoGrupo}
                />

                <Text style={styles.nombreGrupo}>
                    {grupo?.nombre}
                </Text>

                <Text style={styles.cantidadMiembros}>
                    {miembros.length} miembros
                </Text>
            </View>

            <View style={styles.contenido}>

                <Iconos
                    size={36}
                    titulo="Miembros"
                    icono={<FontAwesome6 name="user-group" size={20} color="black" />}
                />

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
                    onRequestClose={() => setMostrarModal(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modal}>

                            <View style={styles.headerModal}>
                                <Text style={styles.modalTitulo}>
                                    Añadir miembro
                                </Text>

                                <TouchableOpacity onPress={() => setMostrarModal(false)}>
                                    <Text style={styles.botonCerrar}>✕</Text>
                                </TouchableOpacity>
                            </View>

                            <TextInput
                                style={styles.input}
                                placeholder="@usuario"
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
                    onRequestClose={() => setMostrarPopupSalir(false)}
                >
                    <View style={styles.modalOverlay}>
                        <View style={styles.modal}>

                            <View style={styles.headerModal}>
                                <Text style={styles.modalTitulo}>
                                    ¿Salir del grupo?
                                </Text>
                            </View>

                            <Text style={styles.modalTextoSalir}>
                                Vas a dejar de formar parte del grupo.
                            </Text>

                            <TouchableOpacity
                                style={[styles.botonModal, { backgroundColor: '#ff0000' }]}
                                onPress={confirmarSalir}
                            >
                                <Text style={styles.textoBotonModal}>
                                    Sí, salir
                                </Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                onPress={() => setMostrarPopupSalir(false)}
                                style={styles.cancelarBtn}
                            >
                                <Text style={styles.cancelarTexto}>
                                    Cancelar
                                </Text>
                            </TouchableOpacity>

                        </View>
                    </View>
                </Modal>
            </View>

            <Navbar pantallaActual="Inicio" />
        </View>
    )
}

import { StyleSheet } from 'react-native';
import BotonVolver from '../Utilidades/BotonVolver';

const styles = StyleSheet.create({
    headerGrupo: {
        alignItems: 'center',
        marginBottom: 30,
    },
    fotoGrupo: {
        width: 110,
        height: 110,
        borderRadius: 60,
        marginBottom: 14,
        borderWidth: 2,
        borderColor: '#5E2D82',
    },

    nombreGrupo: {
        color: 'white',
        fontSize: 28,
        fontFamily: 'CashMarket',
        marginBottom: 4,
    },

    cantidadMiembros: {
        color: '#B8B8B8',
        fontSize: 14,
        fontFamily: 'Utendo',
    },
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
        backgroundColor: '#4A216F',
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
        borderRadius: 25,
        marginRight: 12,
    },

    infoUsuario: {
        flex: 1,
    },

    nombreUsuario: {
        color: 'white',
        fontFamily: 'CashMarket',
        fontSize: 16,
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
        backgroundColor: '#2A1A1A',
        borderWidth: 2,
        borderColor: '#d30909',
        borderRadius: 14,
        paddingVertical: 12,
        alignItems: 'center',
    },

    textoBotonSalir: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 18,
        fontFamily: 'CashMarket'
    },
    listaMiembros: {
        paddingBottom: 120,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#15151C'
    },

    loadingText: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'CashMarket',
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

    input: {
        backgroundColor: '#2E2E3A',
        color: 'white',
        padding: 12,
        borderRadius: 10,
        marginBottom: 15,
        fontFamily: 'Utendo',
    },

    botonModal: {
        backgroundColor: '#5C3E94',
        padding: 12,
        borderRadius: 10,
        alignItems: 'center',
    },

    textoBotonModal: {
        color: 'white',
        fontFamily: 'CashMarket',
    },

    error: {
        color: '#ff0000',
        marginTop: 10,
        fontFamily: 'Utendo',
    },
    modalTextoSalir: {
        color: '#B6B6B6',
        fontFamily: 'Utendo',
        marginBottom: 20,
    },

    cancelarBtn: {
        marginTop: 15,
        alignItems: 'center',
    },

    cancelarTexto: {
        color: '#9E9E9E',
        fontFamily: 'Utendo',
    },
});

export default InfoGrupo