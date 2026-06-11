import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet, ActivityIndicator, Image } from 'react-native';
import supabase from '../supabaseClient'
import { IconUserFilled } from '@tabler/icons-react-native';
import Iconos from '../Utilidades/Iconos'
import Navbar from '../Utilidades/Navbar'
import MaterialIcons from '@expo/vector-icons/MaterialIcons'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import Ionicons from '@expo/vector-icons/Ionicons';
import { SafeAreaView } from 'react-native-safe-area-context'
import HeaderGrupo from '../Utilidades/HeaderGrupo';
import BotonVolver from '../Utilidades/BotonVolver';

function Juntada({ route, navigation }) {
    const { idEvento } = route.params;

    const [evento, setEvento] = useState(null);
    const [encuesta, setEncuesta] = useState(null);

    const [asistentesCount, setAsistentesCount] = useState(0);
    const [grupo, setGrupo] = useState(null);
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

        const { data: grupoData } = await supabase
            .from('grupo')
            .select('*')
            .eq('id', eventoData.id_grupo)
            .single();

        setGrupo(grupoData);

        await calcularParticipantes(
            eventoData.id_grupo,
            eventoData.id
        );

        await cargarUsuariosQueVan(
            eventoData.id
        );

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
            .select('id, username, foto_perfil')
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

        const { data: opciones } = await supabase
            .from('opcion_encuesta')
            .select('*')
            .eq('id_encuesta', encuestaActual.id);

        if (!opciones?.length) return;

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
            op => op.tipo === 'fecha'
        )

        const lugares = opciones.filter(
            op => op.tipo === 'lugar'
        )

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
            await cargarUsuariosQueVan(evento.id);
        }
    }

    if (!evento) {
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
        <View style={styles.fondo}>
            <ScrollView>
                {grupo && (
                    <HeaderGrupo
                        grupo={grupo}
                        cantidadMiembros={totalGrupo}
                    />
                )}

                {evento.estado === 'confirmado' ? (
                    <View style={styles.confirmedCard}>
                        <Text style={styles.tituloInfo}>{evento.nombre}</Text>

                        {/*                         <Text style={styles.label}>Fecha</Text>
                       <Text style={styles.value}>{new Date(evento.fecha_hora_inicio).toLocaleString()}</Text>

                        <Text style={styles.label}>Hora</Text>
                        <Text style={styles.value}>{new Date(evento.fecha_hora_inicio).toLocaleString()}</Text>*/}
                        <View style={styles.infoJuntada}>
                            <View style={styles.infofechahora}>

                                <View style={styles.infoFila}>
                                    <FontAwesome6 name="calendar-day" size={14} color="white" />
                                    <Text style={styles.value}>
                                        {new Date(evento.fecha_hora_inicio).toLocaleDateString()}
                                    </Text>
                                </View>

                                <View style={styles.infoFila}>
                                    <Ionicons name="time" size={14} color="white" />
                                    <Text style={styles.value}>
                                        {new Date(evento.fecha_hora_inicio).toLocaleTimeString([], {
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </Text>
                                </View>
                            </View>
                            <View style={styles.infoLugarInteg}>
                                <View style={styles.infoFila}>
                                    <FontAwesome6 name="location-dot" size={14} color="white" />
                                    <Text style={styles.value}>{evento.lugar}</Text>
                                </View>

                                <View style={styles.infoFila}>
                                    <FontAwesome6 name="users" size={14} color="white" />

                                    {usuariosQueVan.length === 0 ? (
                                        <Text style={styles.value}>0 participantes</Text>
                                    ) : (
                                        <Text style={styles.value}>
                                            {usuariosQueVan.length} participantes
                                        </Text>
                                    )}
                                </View>
                            </View>
                        </View>

                        <View style={styles.buttonsCon}>
                            <Pressable style={styles.btnVoy} onPress={() => cambiarAsistencia('voy')}>
                                <Text style={styles.text}>Voy</Text>
                            </Pressable>
                            <Pressable style={styles.btnNoVoy} onPress={() => cambiarAsistencia('no_voy')}>
                                <Text style={styles.text}>No voy</Text>
                            </Pressable>
                        </View>
                    </View>

                ) : (
                    <View style={styles.card}>
                        <View>
                            <Text style={styles.eventName}>{evento.nombre}</Text>
                            <View style={styles.avatarsRow}>
                                <Text style={styles.infoText}>
                                    Van {asistentesCount}/{totalGrupo}
                                </Text>

                                {usuariosQueVan.slice(0, 5).map((usuario, i) => (
                                    <Image
                                        key={usuario.id}
                                        source={{ uri: usuario.foto_perfil }}
                                        style={[
                                            styles.avatar,
                                            { marginLeft: i === 0 ? 6 : -6 }
                                        ]}
                                    />
                                ))}

                                {usuariosQueVan.length > 5 && (
                                    <Text style={styles.masUsuarios}>
                                        +{usuariosQueVan.length - 5}
                                    </Text>
                                )}
                            </View>
                        </View>
                        <View style={styles.buttonsCol}>
                            <Pressable style={styles.btnVoy} onPress={() => cambiarAsistencia('voy')}>
                                <Text style={styles.text}>Voy</Text>
                            </Pressable>
                            <Pressable style={styles.btnNoVoy} onPress={() => cambiarAsistencia('no_voy')}>
                                <Text style={styles.text}>No voy</Text>
                            </Pressable>
                        </View>
                    </View>
                )}

                {encuesta?.activa && (
                    <>
                        <View style={styles.tituloSeparador}>
                            <Iconos
                                size={36}
                                icono={<IconUserFilled size={25} color="#000000" />}
                            />
                            <Text style={styles.textoTitulo}>Votaciones</Text>
                        </View>
                        <Pressable
                            style={styles.cardGastos}
                            onPress={() =>
                                navigation.navigate(
                                    'VotacionJuntada',
                                    {
                                        idEvento
                                    }
                                )
                            }
                        >
                            <View style={styles.iconoContainer}>
                                <IconUserFilled size={22} color="#FFFFFF" />
                            </View>
                            <View style={styles.textoContainer}>
                                <Text style={styles.titulo}>Fecha, hora y ubicación</Text>
                                <Text style={styles.descripcion}>
                                    Vota las opciones establecidas o sugiere otra opción
                                </Text>
                            </View>
                        </Pressable>

                        <View style={styles.contadorCard}>
                            <Ionicons
                                name="time-outline"
                                size={22}
                                color="#57C7A3"
                            />

                            <View style={styles.contadorTexto}>
                                <Text style={styles.contadorLabel}>
                                    La votación finaliza en
                                </Text>

                                <Text style={styles.contadorTiempo}>
                                    {tiempoRestante}
                                </Text>
                            </View>
                        </View>
                    </>
                )}

                <View style={styles.tituloSeparador}>
                    <Iconos
                        size={36}
                        icono={<IconUserFilled size={25} color="#000000" />}
                    />
                    <Text style={styles.textoTitulo}>Opcionales</Text>
                </View>
                <Pressable
                    style={styles.cardGastos}
                    onPress={() => alert('Próximamente disponible')}
                >
                    <View style={styles.iconoContainer}>
                        <MaterialIcons name="attach-money" size={24} color="white" />
                    </View>
                    <View style={styles.textoContainer}>
                        <Text style={styles.titulo}>División de Gastos</Text>
                        <Text style={styles.descripcion}>Divide los gastos del grupo</Text>
                    </View>
                </Pressable>
            </ScrollView>
            <Navbar pantallaActual="Inicio" />
        </View>
    )
}

const styles = StyleSheet.create({
    contadorCard: {
        flexDirection: 'row',
        alignItems: 'center',
        borderRadius: 16,
        padding: 16,
        marginBottom: 25,
    },

    contadorTexto: {
        marginLeft: 12,
        flex: 1,
    },

    contadorLabel: {
        color: '#B8B8B8',
        fontSize: 13,
        fontFamily: 'Utendo',
        marginBottom: 4,
    },

    contadorTiempo: {
        color: '#FFFFFF',
        fontSize: 17,
        fontFamily: 'CashMarket',
    },
    fondo: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        paddingBottom: 90
    },
    text: {
        fontFamily: 'CashMarket',
        color: 'white'
    },
    tituloSeparador: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 8,
        marginBottom: 14,
    },
    cardGastos: {
        backgroundColor: '#4B1F6F',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#6E3D97',
        marginVertical: 8,
    },

    iconoContainer: {
        marginRight: 12,
    },

    textoContainer: {
        flex: 1,
    },
    text: {
        fontFamily: 'CashMarket',
        color: 'white'
    },

    titulo: {
        color: '#FFFFFF',
        fontSize: 18,
        fontWeight: '600',
        marginBottom: 2,
        fontFamily: 'CashMarket'
    },
    tituloInfo: {
        color: '#FFFFFF',
        fontSize: 26,
        fontFamily: 'CashMarket',
        marginBottom: 25,
        alignSelf: 'center',
    },
    textoTitulo: {
        color: 'white',
        marginLeft: 10,
        fontFamily: 'CashMarket',
        fontSize: 20,
        flex: 1
    },

    descripcion: {
        color: '#B8B8C5',
        fontSize: 13,
        fontFamily: 'Utendo'
    },
    card: {
        backgroundColor: '#5C3E94',
        borderRadius: 16,
        padding: 16,
        marginVertical: 20,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    eventName: {
        color: '#FFFFFF',
        fontSize: 16,
        fontWeight: '700',
        marginBottom: 6,
        fontFamily: 'CashMarket'
    },
    infoText: {
        color: '#B8B8C5',
        fontSize: 13,
        fontFamily: 'Utendo'
    },
    avatarsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
        gap: 4,
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        backgroundColor: '#6B4FAD',
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#3D2E6B',
        marginLeft: -6,
    },
    avatarText: {
        color: '#E0D4FF',
        fontSize: 11,
        fontWeight: '600',
    },
    buttonsCol: {
        gap: 10,
        alignItems: 'flex-end',
    },
    btnVoy: {
        backgroundColor: '#57C7A3',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 25,
    },
    btnNoVoy: {
        backgroundColor: '#D64545',
        borderRadius: 12,
        paddingVertical: 12,
        paddingHorizontal: 15,
    },

    confirmedCard: {
        backgroundColor: '#23232D',
        borderRadius: 24,
        padding: 22,
        marginVertical: 12,
        borderWidth: 1,
        borderColor: '#5E2D82',
    },
    infoJuntada: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: 10,
    },

    infofechahora: {
        width: '48%',
    },
    infoLugarInteg: {
        width: '48%',
    },
    label: {
        color: '#D8D0F5',
        fontSize: 14,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 4,
    },

    value: {
        color: '#FFF',
        fontSize: 13,
        marginLeft: 8,
        marginBottom: 0,
        fontFamily: 'Utendo',
    },
    userItem: {
        color: '#FFF',
        fontSize: 16,
        marginTop: 4,
    },

    buttonsCon: {
        flexDirection: 'row',
        gap: 10,
        marginTop: 20,
    },
    infoFila: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#15151C'
    },
    avatar: {
        width: 28,
        height: 28,
        borderRadius: 14,
        borderWidth: 2,
        borderColor: '#3D2E6B',
    },
})

export default Juntada