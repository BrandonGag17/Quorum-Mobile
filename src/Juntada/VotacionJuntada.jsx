import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import supabase from '../supabaseClient';
import BotonVolver from '../Utilidades/BotonVolver';

function VotacionJuntada({ route, navigation }) {
    const { idEvento } = route.params;
    const [encuesta, setEncuesta] = useState(null);
    const [opcionesFechas, setOpcionesFechas] = useState([]);
    const [opcionesLugares, setOpcionesLugares] = useState([]);
    const [votosTotales, setVotosTotales] = useState({});
    const [misVotos, setMisVotos] = useState([]);

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
        <ScrollView>
            <BotonVolver />

            <Text>Votación juntada</Text>

            <View>
                <Text>Votá tus preferencias</Text>
                <Text>Selecciona las opciones que te convengan. Podés elegir varias por tema y proponer nuevas opciones.</Text>
            </View>

            <Text>Fecha y horario</Text>
            <View>
                {opcionesFechas.map(op => (
                    <Pressable
                        key={op.id}
                        onPress={() => alternarVoto(op.id)}
                    >
                        <Text>
                            {op.descripcion}
                            {' - '}
                            {votosTotales[op.id] || 0} votos
                            {' '}
                            {misVotos.includes(op.id) ? '✅' : ''}
                        </Text>
                    </Pressable>
                ))}
            </View>

            <Text>Lugar</Text>
            <View>
                {opcionesLugares.map(op => (
                    <Pressable
                        key={op.id}
                        onPress={() => alternarVoto(op.id)}
                    >
                        <Text>
                            {op.descripcion}
                            {' - '}
                            {votosTotales[op.id] || 0} votos
                            {' '}
                            {misVotos.includes(op.id) ? '✅' : ''}
                        </Text>
                    </Pressable>
                ))}
            </View>

            
        </ScrollView>
    );
}

export default VotacionJuntada;