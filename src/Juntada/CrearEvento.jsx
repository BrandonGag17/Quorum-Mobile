import React, { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    Pressable,
    ScrollView,
    Platform,
    StyleSheet,
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

function CrearEvento({ route, onCreado }) {
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

    const [date, setDate] =
        useState(new Date());

    const [pickerMode, setPickerMode] =
        useState('date');

    const [showPicker, setShowPicker] =
        useState(false);

    const [fechaEvento, setFechaEvento] = useState('');
    const [lugarEvento, setLugarEvento] = useState('');

    // -------------------------
    // FECHAS PROPUESTAS
    // -------------------------

    const onChangeNativo = (event, selectedDate) => {
        if (event.type === 'dismissed') {
            setShowPicker(false);
            setPickerMode('date');
            return;
        }

        const currentDate = selectedDate || date;

        setDate(currentDate);

        // 🔵 ESTA ES LA PARTE IMPORTANTE
        setFechaEvento(currentDate.toISOString());

        if (Platform.OS === 'android') {
            if (pickerMode === 'date') {
                setTimeout(() => {
                    setPickerMode('time');
                    setShowPicker(true);
                }, 0);

                return;
            } else {
                setShowPicker(false);
                setPickerMode('date');
            }
        }
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
        setMensaje('');

        if (!fechaEvento) {
            setMensaje('Elegí la fecha del evento');
            return;
        }

        if (!lugarEvento.trim()) {
            setMensaje('Ingresá el lugar del evento');
            return;
        }

        setMensaje('');
        manejarSubmitFinal(); // 👈 directo a crear evento
    };

    // -------------------------
    // GUARDAR
    // -------------------------

    const manejarSubmitFinal = async () => {
        try {
            setMensaje('');
            setCargando(true);

            // 🔴 validaciones básicas
            if (!nombreJuntada.trim()) {
                setMensaje('Ingresá un nombre para el evento');
                return;
            }

            if (!fechaEvento) {
                setMensaje('Elegí la fecha del evento');
                return;
            }

            if (!lugarEvento.trim()) {
                setMensaje('Ingresá el lugar del evento');
                return;
            }

            // 🔵 usuario logueado
            const {
                data: { user }
            } = await supabase.auth.getUser();

            if (!user) {
                setMensaje('No se pudo obtener el usuario');
                return;
            }

            // 🔵 1. Crear lugar (FK nueva estructura)
            const { data: lugar, error: errorLugar } = await supabase
                .from('lugar')
                .insert({
                    nombre: lugarEvento.trim()
                })
                .select()
                .single();

            if (errorLugar) {
                setMensaje(errorLugar.message);
                return;
            }

            const { data: ev, error: errorEvento } = await supabase
                .from('evento')
                .insert({
                    nombre: nombreJuntada.trim(),
                    descripcion: descripcion || null,
                    id_grupo: idGrupo,
                    id_creador: user.id,
                    estado: 'confirmado',
                    fecha_hora_inicio: new Date(fechaEvento).toISOString(),
                    id_lugar: lugar.id,
                    lugar: lugarEvento
                })
                .select()
                .single();

            if (errorEvento) {
                setMensaje(errorEvento.message);
                return;
            }

            if (onCreado) onCreado();

            navigation.navigate('Juntada', {
                idEvento: ev.id
            });

        } catch (error) {
            setMensaje(error.message);
        } finally {
            setCargando(false);
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

                    <Text style={styles.text}>Fecha del evento</Text>

                    {Platform.OS === 'web' ? (
                        <input
                            type="datetime-local"
                            value={fechaEvento}
                            onChange={e => setFechaEvento(e.target.value)}
                            style={{
                                borderRadius: 15,
                                border: '2px solid #979797',
                                backgroundColor: '#312e32',
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
                            <Text>
                                {fechaEvento
                                    ? new Date(fechaEvento).toLocaleString()
                                    : 'Seleccionar fecha...'}
                            </Text>
                        </Pressable>
                    )}

                    <Text style={[styles.text, { marginTop: 20 }]}>
                        Lugar del evento
                    </Text>

                    <InputApp
                        placeholder="Ej: Casa de Juan, plaza, bar..."
                        value={lugarEvento}
                        onChangeText={setLugarEvento}
                    />

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
    },
    itemLista: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.4)',
    },

    itemTexto: {
        color: 'white',
        fontSize: 15,
        fontFamily: 'Utendo',
        flex: 1,
        marginLeft: 15
    },

    botonEliminar: {
        marginLeft: 15,
        paddingHorizontal: 5,
    },
    listaContainer: {
        backgroundColor: '#5C3E94',
        borderRadius: 20,
        marginTop: 10,
        overflow: 'hidden',
    },
})

export default CrearEvento