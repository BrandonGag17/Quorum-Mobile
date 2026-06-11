import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView, StyleSheet } from 'react-native'
import supabase from '../supabaseClient'
import Navbar from '../Utilidades/Navbar'
import HeaderGrupo from '../Utilidades/HeaderGrupo'
import Octicons from '@expo/vector-icons/Octicons'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import Ionicons from '@expo/vector-icons/Ionicons'

function VotacionJuntada({ route, navigation }) {
    const { idEvento } = route.params;
    const [encuesta, setEncuesta] = useState(null);
    const [opcionesFechas, setOpcionesFechas] = useState([]);
    const [opcionesLugares, setOpcionesLugares] = useState([]);
    const [votosTotales, setVotosTotales] = useState({});
    const [misVotos, setMisVotos] = useState([]);
    const [grupo, setGrupo] = useState(null);
    const [cantidadMiembros, setCantidadMiembros] = useState(0);

    useEffect(() => {
        cargarVotacion();
    }, [idEvento]);

    async function cargarVotacion() {
        const {
            data: encuesta,
            error
        } = await supabase
            .from('encuesta')
            .select('*')
            .eq('id_evento', idEvento)
            .single()

        if (error) {
            console.log(error)
            return
        }

        if (!encuesta) return;
        setEncuesta(encuesta);

        const { data: eventoData } = await supabase
            .from('evento')
            .select('id_grupo')
            .eq('id', idEvento)
            .single();

        if (eventoData) {

            const { data: grupoData } = await supabase
                .from('grupo')
                .select('*')
                .eq('id', eventoData.id_grupo)
                .single();

            setGrupo(grupoData);

            const { count } = await supabase
                .from('usuario_grupo')
                .select('*', {
                    count: 'exact',
                    head: true
                })
                .eq('id_grupo', eventoData.id_grupo);

            setCantidadMiembros(count || 0);
        }

        const {
            data: ops,
            error: errorOps
        } = await supabase
            .from('opcion_encuesta')
            .select('*')
            .eq('id_encuesta', encuesta.id)

        if (errorOps) {
            console.log(errorOps)
            return
        }

        if (ops) {
            setOpcionesFechas(
                ops.filter(op => op.tipo === 'fecha')
            )

            setOpcionesLugares(
                ops.filter(op => op.tipo === 'lugar')
            )
            cargarVotosYPorcentajes(ops);
        }
    }

    async function cargarVotosYPorcentajes(listaOpciones) {
        const idsOpciones = listaOpciones.map(o => o.id);
        if (listaOpciones.length === 0) {
            setVotosTotales({})
            setMisVotos([])
            return
        }
        const {
            data: todosLosVotos,
            error: errorVotos
        } = await supabase
            .from('voto')
            .select('*')
            .in('id_opcion', idsOpciones)

        if (errorVotos) {
            console.log(
                'Error cargando votos:',
                errorVotos.message
            )
            return
        }

        const conteo = {};
        idsOpciones.forEach(id => { conteo[id] = 0; });

        if (todosLosVotos) {
            todosLosVotos.forEach(v => {
                conteo[v.id_opcion] = (conteo[v.id_opcion] || 0) + 1;
            });

            const { data: userData } = await supabase.auth.getUser();
            const user = userData?.user;
            if (user) {
                const usuarioVotos = todosLosVotos
                    .filter(v => v.id_usuario === user.id)
                    .map(v => v.id_opcion);
                setMisVotos(usuarioVotos);
            }
        }
        setVotosTotales(conteo);
    }

    async function alternarVoto(idOpcion) {
        const {
            data: { user }
        } = await supabase.auth.getUser()

        if (!user) return

        const yaVoto =
            misVotos.includes(idOpcion)

        if (yaVoto) {
            const { error } = await supabase
                .from('voto')
                .delete()
                .eq('id_usuario', user.id)
                .eq('id_opcion', idOpcion)

            if (error) {
                console.log(
                    'Error eliminando voto:',
                    error.message
                )
                return
            }
        } else {
            const { error } = await supabase
                .from('voto')
                .insert({
                    id_usuario: user.id,
                    id_opcion: idOpcion
                })

            if (error) {
                console.log(
                    'Error creando voto:',
                    error.message
                )
                return
            }
        }

        cargarVotacion()
    }

    return (
        <View style={styles.fondo}>

            <ScrollView>
                {grupo && (
                    <HeaderGrupo
                        grupo={grupo}
                        cantidadMiembros={cantidadMiembros}
                    />
                )}

                <View style={styles.votaciones}>
                    <View style={styles.tituloSeparadorPeroOtro}>
                        <Octicons name="sparkles-fill" size={20} color="white" />
                        <Text style={styles.titulo}>Votá tus preferencias</Text>
                    </View>
                    <Text style={styles.text}>Selecciona las opciones que te convengan. Podés elegir varias por tema y proponer nuevas opciones.</Text>
                </View>

                <View style={styles.card}>
                    <View style={styles.tituloSeparador}>
                        <Ionicons name="today" size={20} color="white" />
                        <Text style={styles.sectionTitle}>Fecha y horario</Text>
                    </View>
                    {opcionesFechas.map(op => (
                        <Pressable
                            key={op.id}
                            onPress={() => alternarVoto(op.id)}
                            style={[
                                styles.option,
                                misVotos.includes(op.id) && styles.optionSelected
                            ]}
                        >
                            <Text style={styles.optionText}>
                                {misVotos.includes(op.id) ? '◉ ' : '◯ '}
                                {op.descripcion}
                            </Text>

                            <Text style={styles.votesText}>
                                {votosTotales[op.id] || 0}
                            </Text>
                        </Pressable>
                    ))}
                </View>


                <View style={styles.card}>
                    <View style={styles.tituloSeparador}>
                        <FontAwesome6 name="location-dot" size={20} color="white" />
                        <Text style={styles.sectionTitle}>Lugar</Text>
                    </View>
                    {opcionesLugares.map(op => (
                        <Pressable
                            key={op.id}
                            onPress={() => alternarVoto(op.id)}
                            style={[
                                styles.option,
                                misVotos.includes(op.id) && styles.optionSelected
                            ]}
                        >
                            <Text style={styles.optionText}>
                                {misVotos.includes(op.id) ? '◉ ' : '◯ '}
                                {op.descripcion}
                            </Text>

                            <Text style={styles.votesText}>
                                {votosTotales[op.id] || 0}
                            </Text>
                        </Pressable>
                    ))}
                </View>
            </ScrollView>
            <Navbar pantallaActual="Inicio" />

        </View>
    );
}

const styles = StyleSheet.create({
    fondo: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        paddingBottom: 90
    },
    text: {
        fontFamily: 'Utendo',
        color: '#D0D0D0',
        fontSize: 13,
        marginTop: 6,
        lineHeight: 18,
    },
    titulo: {
        fontFamily: 'CashMarket',
        color: 'white',
        fontSize: 18,
    },
    tituloSeparador: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 20,
        gap: 10
    },
    tituloSeparadorPeroOtro: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        gap: 10
    },
    votaciones: {
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#3A2350',
        backgroundColor: '#4A216F',
        padding: 16,
        marginBottom: 20,
    },
    sectionTitle: {
        color: '#FFF',
        fontSize: 18,
        fontFamily: 'CashMarket',
    },

    card: {
        borderWidth: 2,
        borderColor: '#5E2D82',
        borderRadius: 18,
        padding: 12,
        marginBottom: 20,
        backgroundColor: '#11111A',
    },

    option: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: '#2F1B3D',
        borderRadius: 14,
        paddingVertical: 14,
        paddingHorizontal: 14,
        marginBottom: 10,
        backgroundColor: '#151520',
    },

    optionSelected: {
        backgroundColor: 'rgba(97, 46, 134, 0.35)',
        borderColor: '#7C3AED',
    },

    optionText: {
        color: '#FFF',
        fontSize: 15,
        fontFamily: 'Utendo',
        flex: 1,
    },

    votesText: {
        color: '#FFF',
        fontSize: 13,
        fontFamily: 'Utendo',
        backgroundColor: '#58386f',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 12,
        overflow: 'hidden',
    },
});

export default VotacionJuntada;