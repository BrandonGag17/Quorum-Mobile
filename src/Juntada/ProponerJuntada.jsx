import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Platform,
    StyleSheet
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import supabase from '../supabaseClient'
import InputApp from '../Utilidades/InputApp'
import ButtonApp from '../Utilidades/BotonesApp'
import IndicadorPasos from '../Utilidades/IndicadorPasos'
import Navbar from '../Utilidades/Navbar'
import ErrorMessage from '../Utilidades/MensajeError'

const DateTimePicker =
    Platform.OS !== 'web'
        ? require('@react-native-community/datetimepicker').default
        : null;

function ProponerJuntada({ route, onCreado }) {
    const navigation = useNavigation();
    const [mensaje, setMensaje] = useState('')
    const idGrupo =
        route?.params?.idGrupo ||
        route?.params?.id;

    // PASOS
    const [paso, setPaso] =
        useState('paso1');

    // PASO 1
    const [nombreJuntada, setNombreJuntada] =
        useState('');
    const [descripcion, setDescripcion] =
        useState('');
    const [cargando, setCargando] =
        useState(false)


    // PASO 2
    const [opcionesFechas, setOpcionesFechas] =
        useState([]);
    const [opcionesLugares, setOpcionesLugares] =
        useState([]);

    const [lugarTemporal, setLugarTemporal] =
        useState('');

    const [fechaTextoTemporal, setFechaTextoTemporal] =
        useState('');

    const [fechaWeb, setFechaWeb] =
        useState('');

    const [date, setDate] =
        useState(new Date());

    const [pickerMode, setPickerMode] =
        useState('date');

    const [showPicker, setShowPicker] =
        useState(false);

    // PASO 3
    const [fechaCierre, setFechaCierre] =
        useState('');

    // -------------------------
    // FECHAS PROPUESTAS
    // -------------------------

    const onChangeNativo = (
        event,
        selectedDate
    ) => {
        if (event.type === 'dismissed') {
            setShowPicker(false);
            setPickerMode('date');
            return;
        }

        const currentDate =
            selectedDate || date;

        setDate(currentDate);

        if (Platform.OS === 'android') {
            if (pickerMode === 'date') {
                setPickerMode('time');
            } else {
                setShowPicker(false);
                setPickerMode('date');
                formatearTextoTemporal(
                    currentDate
                );
            }
        } else {
            formatearTextoTemporal(
                currentDate
            );
        }
    };

    const formatearTextoTemporal = (
        fechaObjeto
    ) => {
        const fecha =
            `${fechaObjeto.getDate()}/` +
            `${fechaObjeto.getMonth() + 1}/` +
            `${fechaObjeto.getFullYear()}`;

        const hora =
            `${fechaObjeto.getHours()}:` +
            `${fechaObjeto.getMinutes()
                .toString()
                .padStart(2, '0')}`;

        setFechaTextoTemporal(
            `${fecha} ${hora}`
        );
    };

    const añadirFecha = () => {
        let nueva = '';

        if (
            Platform.OS === 'web' &&
            fechaWeb
        ) {
            const [f, h] =
                fechaWeb.split('T');

            const [
                anio,
                mes,
                dia
            ] = f.split('-');

            nueva =
                `${dia}/${mes}/${anio} ${h}`;
        } else if (
            fechaTextoTemporal
        ) {
            nueva =
                fechaTextoTemporal;
        }

        if (
            nueva &&
            !opcionesFechas.includes(
                nueva
            )
        ) {
            setOpcionesFechas([
                ...opcionesFechas,
                nueva
            ]);

            setFechaTextoTemporal('');
            setFechaWeb('');
        }
    };

    // -------------------------
    // LUGARES
    // -------------------------

    const añadirLugar = () => {
        if (
            lugarTemporal.trim() &&
            !opcionesLugares.includes(
                lugarTemporal.trim()
            )
        ) {
            setOpcionesLugares([
                ...opcionesLugares,
                lugarTemporal.trim()
            ]);

            setLugarTemporal('');
        }
    };

    const eliminarItem = (
        lista,
        setLista,
        valor
    ) => {
        setLista(
            lista.filter(
                item => item !== valor
            )
        );
    };

    const validarPaso1 = () => {
        setMensaje('')

        if (!nombreJuntada.trim()) {
            setMensaje('Ingresá un nombre para la juntada')
            return
        }

        if (nombreJuntada.trim().length < 3) {
            setMensaje('El nombre debe tener al menos 3 caracteres')
            return
        }

        setMensaje('')
        setPaso('paso2')
    }

    const validarPaso2 = () => {
        setMensaje('')

        if (
            opcionesFechas.length === 0 &&
            opcionesLugares.length === 0
        ) {
            setMensaje(
                'Agregá al menos una fecha o un lugar'
            )
            return
        }

        setMensaje('')
        setPaso('paso3')
    }

    // -------------------------
    // GUARDAR
    // -------------------------

    const manejarSubmitFinal =
        async () => {
            try {
                setMensaje('')
                setCargando(true)
                if (!nombreJuntada.trim()) {
                    setMensaje(
                        'Ingresá un nombre para la juntada'
                    )
                    return
                }

                if (
                    opcionesFechas.length === 0 &&
                    opcionesLugares.length === 0
                ) {
                    setMensaje(
                        'Agregá al menos una fecha o un lugar'
                    )
                    return
                }

                if (!fechaCierre) {
                    setMensaje(
                        'Elegí una fecha de cierre'
                    )
                    return
                }

                const {
                    data: { user }
                } =
                    await supabase.auth.getUser();

                if (!user) {
                    setMensaje('No se pudo obtener el usuario')
                    return
                }

                const {
                    data: ev,
                    error: errorEvento
                } = await supabase
                    .from('evento')
                    .insert({
                        nombre: nombreJuntada,
                        descripcion: descripcion || null,
                        id_grupo: idGrupo,
                        id_creador: user.id,
                        estado: 'planificacion'
                    })
                    .select()
                    .single()

                if (errorEvento) {
                    setMensaje(errorEvento.message)
                    return
                }

                const {
                    data: enc,
                    error: errorEncuesta
                } = await supabase
                    .from('encuesta')
                    .insert({
                        pregunta: nombreJuntada,
                        id_evento: ev.id,
                        activa: true,
                        cierre_en: new Date(
                            fechaCierre
                        ).toISOString()
                    })
                    .select()
                    .single()

                if (errorEncuesta) {
                    setMensaje(errorEncuesta.message)
                    return
                }

                const opcionesParaInsertar = [
                    ...opcionesFechas.map(
                        f => ({
                            id_encuesta:
                                enc.id,
                            descripcion: f
                        })
                    ),

                    ...opcionesLugares.map(
                        l => ({
                            id_encuesta:
                                enc.id,
                            descripcion:
                                `Lugar: ${l}`
                        })
                    )
                ];

                const { error: errorOpciones } =
                    await supabase
                        .from('opcion_encuesta')
                        .insert(opcionesParaInsertar)

                if (errorOpciones) {
                    setMensaje(errorOpciones.message)
                    return
                }

                if (onCreado)
                    onCreado();

                navigation.navigate(
                    'Juntada',
                    {
                        idEvento: ev.id
                    }
                );
            } catch (error) {
                setMensaje(error.message)
            } finally {
                setCargando(false)
            }
        };

    // -------------------------
    // PASO 1
    // -------------------------

    if (paso === 'paso1') {
        return (
            <View style={styles.fondo}>

                <View style={styles.contenedorIndicador}>
                    <IndicadorPasos
                        pasoActual={1}
                        totalPasos={3}
                    />
                </View>

                <View style={styles.formulario}>
                    <Text style={styles.text}>
                        Nombre de la juntada:
                    </Text>

                    <InputApp
                        value={nombreJuntada}
                        onChangeText={setNombreJuntada}
                    />

                    <View style={styles.SeparadorInputs}>
                        <Text style={styles.text}>
                            Descripción (Opcional):
                        </Text>

                        <InputApp
                            value={descripcion}
                            onChangeText={setDescripcion}
                        />
                    </View>
                </View>

                {mensaje ? (
                    <ErrorMessage mensaje={mensaje} />
                ) : null}

                <View style={styles.botonContainer}>
                    <ButtonApp
                        nombre={cargando ? 'Cargando...' : 'Continuar'}
                        onPress={validarPaso1}
                        disabled={cargando}
                    />
                </View>
                <Navbar pantallaActual="Inicio" />

            </View>
        );
    }

    // -------------------------
    // PASO 2
    // -------------------------

    if (paso === 'paso2') {
        return (
            <View style={styles.fondo}>

                <View style={styles.contenedorIndicador}>
                    <IndicadorPasos pasoActual={2} totalPasos={3} />
                </View>

                <ScrollView style={{ marginTop: 110 }}>
                    <Text style={styles.text}>Sugerir Fechas y Horarios</Text>

                    {Platform.OS === 'web' ? (
                        <input
                            type="datetime-local"
                            value={fechaWeb}
                            onChange={e => setFechaWeb(e.target.value)}
                            style={{
                                borderRadius: 15,
                                border: '2px solid #979797',
                                backgroundColor: '#5D157E',
                                padding: 15,
                                color: 'white',
                                width: '100%',
                                boxSizing: 'border-box',
                                fontFamily: 'Utendo',
                                fontSize: 16,
                                colorScheme: 'dark',
                                marginTop: 10
                            }}
                        />
                    ) : (
                        <Pressable onPress={() => { setPickerMode('date'); setShowPicker(true); }}>
                            <Text>{fechaTextoTemporal || 'Seleccionar fecha...'}</Text>
                        </Pressable>
                    )}

                    <ButtonApp
                        nombre="+ Agregar fecha"
                        onPress={añadirFecha}
                    />

                    {opcionesFechas.map(f => (
                        <View key={f}>
                            <Text style={{ color: 'white' }}>{f}</Text>
                            <Pressable onPress={() => eliminarItem(opcionesFechas, setOpcionesFechas, f)}>
                                <Text style={{ color: 'white' }}>X</Text>
                            </Pressable>
                        </View>
                    ))}

                    <Text style={[styles.text, { marginTop: 20 }]}>Sugerir Lugares</Text>
                    <InputApp
                        placeholder="Nombre del lugar..."
                        value={lugarTemporal}
                        onChangeText={setLugarTemporal}
                        containerStyle={{ marginBottom: 0 }}
                    />

                    <ButtonApp
                        nombre="+ Agregar lugar"
                        onPress={añadirLugar}
                    />

                    {opcionesLugares.map(l => (
                        <View key={l}>
                            <Text style={{ color: 'white' }}>{l}</Text>
                            <Pressable onPress={() => eliminarItem(opcionesLugares, setOpcionesLugares, l)}>
                                <Text style={{ color: 'white' }}>X</Text>
                            </Pressable>
                        </View>
                    ))}

                    {showPicker && DateTimePicker && (
                        <DateTimePicker
                            value={date}
                            mode={Platform.OS === 'ios' ? 'datetime' : pickerMode}
                            is24Hour={true}
                            onChange={onChangeNativo}
                        />
                    )}
                </ScrollView>

                {mensaje ? (
                    <ErrorMessage mensaje={mensaje} />
                ) : null}

                <View style={styles.botonContainer}>
                    <ButtonApp
                        nombre={cargando ? 'Cargando...' : 'Continuar'}
                        onPress={validarPaso2}
                        disabled={cargando}
                    />
                </View>

                <Navbar pantallaActual="Inicio" />
            </View>
        );
    }

    // -------------------------
    // PASO 3
    // -------------------------

    return (
        <View style={styles.fondo}>

            <View style={styles.contenedorIndicador}>
                <IndicadorPasos pasoActual={3} totalPasos={3} />
            </View>

            <Text style={[styles.text, { marginTop: 110 }]}>¿Cuándo cierra la votación?</Text>

            {Platform.OS ===
                'web' ? (
                <input
                    type="datetime-local"
                    value={
                        fechaCierre
                    }
                    onChange={e =>
                        setFechaCierre(
                            e.target
                                .value
                        )
                    }
                />
            ) : (
                <DateTimePicker
                    value={
                        fechaCierre
                            ? new Date(
                                fechaCierre
                            )
                            : new Date()
                    }
                    mode="datetime"
                    is24Hour={true}
                    onChange={(
                        event,
                        selectedDate
                    ) => {
                        if (
                            selectedDate
                        ) {
                            setFechaCierre(
                                selectedDate.toISOString()
                            );
                        }
                    }}
                />
            )}

            {mensaje ? (
                <ErrorMessage mensaje={mensaje} />
            ) : null}

            <View style={styles.botonContainer}>
                <ButtonApp
                    nombre={cargando ? 'Cargando...' : 'Volver'}
                    onPress={() => setPaso('paso2')}
                    disabled={cargando}
                />
                <ButtonApp
                    nombre={cargando ? 'Cargando...' : 'Crear Propuesta'}
                    onPress={manejarSubmitFinal}
                    disabled={cargando}
                />
            </View>

            <Navbar pantallaActual="Inicio" />
        </View>
    );
}

const styles = StyleSheet.create({
    fondo: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        justifyContent: 'center'
    },
    text: {
        fontFamily: 'CashMarket',
        color: 'white'
    },
    contenedorIndicador: {
        position: 'absolute',
        top: 25,
        left: 25,
        right: 25,
    },
    formulario: {
        marginTop: 140
    },
    botonContainer: {
        marginTop: 'auto',
        marginBottom: 70
    },
    SeparadorInputs: {
        marginTop: 10
    }
})

export default ProponerJuntada