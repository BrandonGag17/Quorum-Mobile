import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, Image, TextInput, TouchableOpacity, Modal, Alert } from 'react-native';
import { useRoute } from '@react-navigation/native';
import supabase from '../supabaseClient';
import BotonVolver from '../Utilidades/BotonVolver';

function InfoGrupo() {
    const route = useRoute();
    const { idGrupo } = route.params;
    const [grupo, setGrupo] = useState(null);
    const [miembros, setMiembros] = useState([]);

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
        <View>
            <BotonVolver />
            <Text>{grupo?.nombre || 'Cargando...'}</Text>

            <Text>Miembros</Text>
            <FlatList
                data={miembros}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                    <View>
                        <Image
                            source={{ uri: item.usuario?.foto_perfil || 'https://placeholder.com' }}
                            style={{ width: 50, height: 50 }}
                        />
                        <Text>@{item.usuario?.username}</Text>
                    </View>
                )}
            />

            <TouchableOpacity onPress={() => setMostrarModal(true)}>
                <Text>+ Añadir miembro</Text>
            </TouchableOpacity>

            <Modal visible={mostrarModal} transparent={true} animationType="fade">
                <View>
                    <View>
                        <TouchableOpacity onPress={() => setMostrarModal(false)}>
                            <Text>X</Text>
                        </TouchableOpacity>

                        <Text>Añadir miembro</Text>

                        <Text>Buscar miembro:</Text>
                        <TextInput
                            value={miembroUsername}
                            onChangeText={(val) => {
                                setMiembroUsername(val);
                                setErrorMiembro('');
                            }}
                        />

                        <TouchableOpacity onPress={agregarMiembro}>
                            <Text>Añadir miembros</Text>
                        </TouchableOpacity>

                        {errorMiembro ? <Text>{errorMiembro}</Text> : null}
                    </View>
                </View>
            </Modal>
        </View>
    );
}

export default InfoGrupo;