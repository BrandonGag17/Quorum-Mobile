import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import supabase from '../supabaseClient';

function Juntada({ route, navigation }) {
    const { idEvento } = route.params;

    const [evento, setEvento] = useState(null);
    const [encuesta, setEncuesta] = useState(null);

    const [asistentesCount, setAsistentesCount] = useState(0);
    const [totalGrupo, setTotalGrupo] = useState(0);
    const [usuariosQueVan, setUsuariosQueVan] = useState([]);
    const [tiempoRestante, setTiempoRestante] = useState('');

    useEffect(() => {
        cargarDatosEvento();
    }, [idEvento]);

    useEffect(() => {
        if (!encuesta?.cierre_en) return;

        actualizarTiempo();

        const intervalo = setInterval(() => {
            actualizarTiempo();
        }, 1000);

        return () => clearInterval(intervalo);
    }, [encuesta]);

    async function cargarDatosEvento() {
        const { data: eventoData } = await supabase
            .from('evento')
            .select('*')
            .eq('id', idEvento)
            .single();

        if (!eventoData) return;

        setEvento(eventoData);

        calcularParticipantes(
            eventoData.id_grupo,
            eventoData.id
        );
        if (
            eventoData.estado ===
            'confirmado'
        ) {
            cargarUsuariosQueVan(
                eventoData.id
            );
        }

        const { data: encuestaData } = await supabase
            .from('encuesta')
            .select('*')
            .eq('id_evento', idEvento)
            .maybeSingle();

        if (encuestaData) {
            setEncuesta(encuestaData);

            if (encuestaData.activa) {
                verificarCierreEncuesta(encuestaData);
            }
        }
    }

    async function calcularParticipantes(idGrupo, idEv) {
        const { count: miembros } = await supabase
            .from('usuario_grupo')
            .select('*', {
                count: 'exact',
                head: true
            })
            .eq('id_grupo', idGrupo);

        setTotalGrupo(miembros || 0);

        const { data: asistentes } = await supabase
            .from('usuario_evento')
            .select('asistencia')
            .eq('id_evento', idEv);

        if (asistentes) {
            const van = asistentes.filter(
                a => a.asistencia === 'voy'
            ).length;

            setAsistentesCount(van);
        }
    }

    function actualizarTiempo() {
        if (!encuesta?.cierre_en) return;

        const ahora = new Date();
        const cierre = new Date(encuesta.cierre_en);

        const diferencia = cierre - ahora;

        if (diferencia <= 0) {
            setTiempoRestante('Finalizada');
            return;
        }

        const dias = Math.floor(
            diferencia / (1000 * 60 * 60 * 24)
        );

        const horas = Math.floor(
            (diferencia % (1000 * 60 * 60 * 24))
            / (1000 * 60 * 60)
        );

        const minutos = Math.floor(
            (diferencia % (1000 * 60 * 60))
            / (1000 * 60)
        );

        const segundos = Math.floor(
            (diferencia % (1000 * 60))
            / 1000
        );

        setTiempoRestante(
            `${dias} días ${horas} horas ${minutos} minutos ${segundos} segundos`
        );
    }
    async function cargarUsuariosQueVan(idEv) {
        const { data: asistentes } = await supabase
            .from('usuario_evento')
            .select('id_usuario')
            .eq('id_evento', idEv)
            .eq('asistencia', 'voy');

        if (!asistentes?.length) {
            setUsuariosQueVan([]);
            return;
        }

        const idsUsuarios = asistentes.map(
            a => a.id_usuario
        );

        const { data: usuarios } = await supabase
            .from('usuario')
            .select('id, username')
            .in('id', idsUsuarios);

        setUsuariosQueVan(
            usuarios || []
        );
    }
    function convertirFechaTexto(fechaTexto) {
        const [fecha, hora] = fechaTexto.split(' ');
        const [dia, mes, anio] = fecha.split('/');
        const [horas, minutos] = hora.split(':');

        return new Date(
            anio,
            mes - 1,
            dia,
            horas,
            minutos
        ).toISOString();
    }

    async function verificarCierreEncuesta(encuestaActual) {
        const ahora = new Date();
        const cierre = new Date(encuestaActual.cierre_en);

        if (ahora < cierre) return;

        const {
            error: errorOpciones
        } = await supabase
            .from('opcion_encuesta')
            .insert(opcionesParaInsertar)

        if (errorOpciones) {
            setMensaje(errorOpciones.message)
            return
        }

        const idsOpciones = opciones.map(o => o.id);

        const { data: votos } = await supabase
            .from('voto')
            .select('*')
            .in('id_opcion', idsOpciones);

        const conteo = {};

        idsOpciones.forEach(id => {
            conteo[id] = 0;
        });

        votos?.forEach(v => {
            conteo[v.id_opcion]++;
        });

        const fechas = opciones.filter(
            o => !o.descripcion.startsWith('Lugar:')
        );

        const lugares = opciones.filter(
            o => o.descripcion.startsWith('Lugar:')
        );

        let fechaGanadora = null;
        let lugarGanador = null;

        let maxFecha = -1;
        let maxLugar = -1;

        fechas.forEach(op => {
            const votosOpcion =
                conteo[op.id] || 0;

            if (votosOpcion > maxFecha) {
                maxFecha = votosOpcion;
                fechaGanadora = op.descripcion;
            }
        });

        lugares.forEach(op => {
            const votosOpcion =
                conteo[op.id] || 0;

            if (votosOpcion > maxLugar) {
                maxLugar = votosOpcion;
                lugarGanador = op.descripcion.replace(
                    'Lugar: ',
                    ''
                );
            }
        });

        await supabase
            .from('evento')
            .update({
                estado: 'confirmado',
                fecha_hora_inicio:
                    fechaGanadora
                        ? convertirFechaTexto(
                            fechaGanadora
                        )
                        : null,
                lugar: lugarGanador
            })
            .eq('id', idEvento);

        await supabase
            .from('encuesta')
            .update({
                activa: false
            })
            .eq('id', encuestaActual.id);

        cargarDatosEvento();
    }

    async function cambiarAsistencia(estado) {
        const { data: userData } = await supabase.auth.getUser();
        const user = userData?.user;
        if (!user) return;

        const { data: registroExistente } = await supabase
            .from('usuario_evento')
            .select('id')
            .eq('id_usuario', user.id)
            .eq('id_evento', idEvento)
            .maybeSingle();

        const datos = {
            asistencia: estado,
            respondio_en: new Date().toISOString()
        };

        if (registroExistente) {
            await supabase.from('usuario_evento').update(datos).eq('id', registroExistente.id);
        } else {
            await supabase.from('usuario_evento').insert({
                id_usuario: user.id,
                id_evento: idEvento,
                ...datos
            });
        }

        if (evento) {
            await calcularParticipantes(evento.id_grupo, evento.id);
            if (evento.estado === 'confirmado') {
                await cargarUsuariosQueVan(evento.id);
            }
        }
    }

    if (!evento) {
        return (
            <View>
                <Text>Cargando...</Text>
            </View>
        );
    }

    return (
        <ScrollView>
            <Pressable onPress={() => navigation.navigate('InicioGrupo', { id: evento.id_grupo })}>
                <Text>Volver al grupo</Text>
            </Pressable>

            {evento.estado === 'confirmado' ? (
                <View>
                    <Text>{evento.nombre}</Text>
                    <Text>Fecha:</Text>
                    <Text>{new Date(evento.fecha_hora_inicio).toLocaleString()}</Text>
                    <Text>Lugar:</Text>
                    <Text>{evento.lugar}</Text>
                    <Text>Personas que van:</Text>
                    {usuariosQueVan.length === 0 ? (
                        <Text>Nadie confirmó asistencia</Text>
                    ) : (
                        usuariosQueVan.map(usuario => (
                            <Text key={usuario.id}>{usuario.username}</Text>
                        ))
                    )}
                    <Pressable onPress={() => cambiarAsistencia('voy')}>
                        <Text>Voy</Text>
                    </Pressable>
                    <Pressable onPress={() => cambiarAsistencia('no_voy')}>
                        <Text>No voy</Text>
                    </Pressable>
                </View>
            ) : (
                <>
                    <View>
                        <Text>{evento.nombre}</Text>
                        <Text>Van {asistentesCount}/{totalGrupo}</Text>
                        <Text>Estado: {evento.estado}</Text>
                    </View>
                    <View>
                        <Pressable onPress={() => cambiarAsistencia('voy')}>
                            <Text>Voy</Text>
                        </Pressable>
                        <Pressable onPress={() => cambiarAsistencia('no_voy')}>
                            <Text>No voy</Text>
                        </Pressable>
                    </View>

                    {encuesta?.activa && (
                        <>
                            <Text>👥 Votaciones</Text>
                            <Pressable onPress={() => navigation.navigate('VotacionJuntada', { idEvento })}>
                                <Text>Fecha y hora</Text>
                                <Text>Si te arrepentís de tu voto podés volver a votar</Text>
                            </Pressable>
                            <View>
                                <Text>La votación cierra en:</Text>
                                <Text>{tiempoRestante}</Text>
                            </View>
                        </>
                    )}

                    <Text>⚙️ Opcionales</Text>
                    <Pressable onPress={() => alert('Próximamente disponible')}>
                        <Text>$ División de Gastos</Text>
                        <Text>Divide los gastos del grupo</Text>
                    </Pressable>
                </>
            )}
        </ScrollView>
    );
}

export default Juntada;