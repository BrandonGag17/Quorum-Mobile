import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import supabase from '../supabaseClient';

function DetalleJuntada({ route, navigation, idEvento: idEventoProp }) {

    const idEvento =
        route?.params?.idEvento ??
        idEventoProp;

    if (!idEvento) {
        return null;
    }
    const [evento, setEvento] = useState(null);
    const [asistentesCount, setAsistentesCount] = useState(0);
    const [totalGrupo, setTotalGrupo] = useState(0);

    useEffect(() => {
        cargarDatosEvento();
    }, [idEvento]);

    async function cargarDatosEvento() {
        console.log('Buscando evento:', idEvento);

        const { data: eventoData, error } = await supabase
            .from('evento')
            .select('*')
            .eq('id', idEvento)
            .single();

        console.log('eventoData:', eventoData);
        console.log('error:', error);

        if (eventoData) {
            setEvento(eventoData);
            calcularParticipantes(eventoData.id_grupo, eventoData.id);
        }
    }

    async function calcularParticipantes(idGrupo, idEv) {
        const { count: miembros } = await supabase
            .from('usuario_grupo')
            .select('*', { count: 'exact', head: true })
            .eq('id_grupo', idGrupo);
        setTotalGrupo(miembros || 0);

        const { data: asistentes } = await supabase
            .from('usuario_evento')
            .select('asistencia')
            .eq('id_evento', idEv);

        if (asistentes) {
            // Contamos los que dicen 'voy'
            const van = asistentes.filter(a => a.asistencia === 'voy').length;
            setAsistentesCount(van);
        }
    }

    async function cambiarAsistencia(estado) {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return;

        // Buscamos si ya existe el registro para este usuario y este evento
        const { data: registroExistente } = await supabase
            .from('usuario_evento')
            .select('id')
            .eq('id_usuario', user.id)
            .eq('id_evento', idEvento)
            .maybeSingle(); // Usamos maybeSingle para obtener el objeto directo o null

        if (registroExistente) {
            // Si existe, actualizamos usando su ID
            await supabase
                .from('usuario_evento')
                .update({
                    asistencia: estado,
                    respondio_en: new Date().toISOString()
                })
                .eq('id', registroExistente.id);
        } else {
            // Si no existe, creamos uno nuevo
            await supabase
                .from('usuario_evento')
                .insert({
                    id_usuario: user.id,
                    id_evento: idEvento,
                    asistencia: estado,
                    respondio_en: new Date().toISOString()
                });
        }

        // Recargamos los números
        if (evento) calcularParticipantes(evento.id_grupo, evento.id);
    }

    if (!evento) return <View><Text>Cargando...</Text></View>;

    return (
        <ScrollView>
            <Pressable onPress={() => navigation.navigate('InicioGrupo', { id: evento.id_grupo })}>
                <Text>Panaderos (Volver al grupo)</Text>
            </Pressable>

            <View>
                <View>
                    <Text>{evento.nombre}</Text>
                    <Text>Van {asistentesCount}/{totalGrupo}</Text>
                </View>

                <View>
                    <Pressable onPress={() => cambiarAsistencia('voy')}>
                        <Text>Voy</Text>
                    </Pressable>
                    <Pressable onPress={() => cambiarAsistencia('no_voy')}>
                        <Text>No voy</Text>
                    </Pressable>
                </View>
            </View>

            <Text>👥 Votaciones</Text>
            <Pressable onPress={() => navigation.navigate('VotacionJuntada', { idEvento })}>
                <Text>Fecha y hora</Text>
                <Text>Si te arrepentís de tu voto podés volver a votar</Text>
            </Pressable>

            <Text>⚙️ Opcionales</Text>
            <Pressable onPress={() => alert('Próximamente disponible')}>
                <Text>$ División de Gastos</Text>
                <Text>Divide los gastos del grupo</Text>
            </Pressable>
        </ScrollView>
    );
}

export default DetalleJuntada