import React, { useEffect, useState } from 'react'
import {
    View,
    Text,
    Pressable,
    ScrollView,
    Platform,
    StyleSheet
} from 'react-native'
import { useNavigation, useRoute } from '@react-navigation/native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

import useCreateProposal from '../../hooks/useCreateProposal'

import InputApp from '../../components/Input'
import ButtonApp from '../../components/Botones'
import IndicadorPasos from '../../components/IndicadorPasos'
import ErrorMessage from '../../components/MensajeError'

const DateTimePicker =
    Platform.OS !== 'web'
        ? require('@react-native-community/datetimepicker').default
        : null

export default function ProponerJuntada() {

    const navigation = useNavigation()
    const route = useRoute()

    const idGrupo =
        route?.params?.idGrupo ||
        route?.params?.id

    const {
        crearPropuesta,
        cargando,
        error,
        limpiarError
    } = useCreateProposal()

    // =========================
    // PASOS
    // =========================

    const [paso, setPaso] = useState(1)

    // =========================
    // PASO 1
    // =========================

    const [nombreJuntada, setNombreJuntada] =
        useState('')

    const [descripcion, setDescripcion] =
        useState('')

    // =========================
    // PASO 2
    // =========================

    const [opcionesFechas, setOpcionesFechas] =
        useState([])

    const [opcionesLugares, setOpcionesLugares] =
        useState([])

    const [lugarTemporal, setLugarTemporal] =
        useState('')

    // La pantalla de recomendaciones devuelve objetos completos de Geoapify.
    // Aquí los convertimos al texto que actualmente guarda la encuesta.
    useEffect(() => {

        const recomendados =
            route?.params?.lugaresRecomendados

        if (!Array.isArray(recomendados) || recomendados.length === 0) {
            return
        }

        const nuevosLugares = recomendados.map(
            lugar => [lugar.nombre, lugar.direccion]
                .filter(Boolean)
                .join(' — ')
        )

        setOpcionesLugares(actuales => [
            ...actuales,
            ...nuevosLugares.filter(
                lugar => lugar && !actuales.includes(lugar)
            )
        ])

        // Consumimos el parámetro para que un render posterior no vuelva a
        // agregar las mismas opciones.
        navigation.setParams({
            lugaresRecomendados: undefined
        })

    }, [navigation, route?.params?.lugaresRecomendados])

    const [fechaTextoTemporal, setFechaTextoTemporal] =
        useState('')

    const [fechaWeb, setFechaWeb] =
        useState('')

    const [date, setDate] =
        useState(new Date())

    const [pickerMode, setPickerMode] =
        useState('date')

    const [showPicker, setShowPicker] =
        useState(false)

    // =========================
    // PASO 3
    // =========================

    const [fechaCierre, setFechaCierre] =
        useState('')

    const [fechaCierreDate, setFechaCierreDate] =
        useState(new Date())

    // =========================
    // FECHAS
    // =========================

    const formatearFecha = (fechaObjeto) => {

        const fecha =
            `${fechaObjeto.getDate()}/` +
            `${fechaObjeto.getMonth() + 1}/` +
            `${fechaObjeto.getFullYear()}`

        const hora =
            `${fechaObjeto.getHours()}:` +
            `${fechaObjeto
                .getMinutes()
                .toString()
                .padStart(2, '0')}`

        return `${fecha} ${hora}`
    }

    const onChangeNativo = (
        event,
        selectedDate
    ) => {

        if (event.type === 'dismissed') {
            setShowPicker(false)
            setPickerMode('date')
            return
        }

        const currentDate =
            selectedDate || date

        setDate(currentDate)

        // ANDROID
        if (Platform.OS === 'android') {

            // Primero selecciona fecha
            if (pickerMode === 'date') {

                setTimeout(() => {
                    setPickerMode('time')
                    setShowPicker(true)
                }, 0)

                return
            }

            // Después selecciona hora
            setShowPicker(false)
            setPickerMode('date')

            setFechaTextoTemporal(
                formatearFecha(currentDate)
            )

            return
        }

        // IOS
        setFechaTextoTemporal(
            formatearFecha(currentDate)
        )
    }

    const añadirFecha = () => {

        let nuevaFecha = ''

        // WEB
        if (
            Platform.OS === 'web' &&
            fechaWeb
        ) {

            const [fecha, hora] =
                fechaWeb.split('T')

            const [
                anio,
                mes,
                dia
            ] = fecha.split('-')

            nuevaFecha =
                `${dia}/${mes}/${anio} ${hora}`
        }

        // ANDROID / IOS
        else if (fechaTextoTemporal) {

            nuevaFecha =
                fechaTextoTemporal
        }

        if (
            nuevaFecha &&
            !opcionesFechas.includes(nuevaFecha)
        ) {

            setOpcionesFechas([
                ...opcionesFechas,
                nuevaFecha
            ])

            setFechaTextoTemporal('')
            setFechaWeb('')
            setDate(new Date())
        }
    }

    const eliminarFecha = (fecha) => {

        setOpcionesFechas(
            opcionesFechas.filter(
                item => item !== fecha
            )
        )
    }

    // =========================
    // LUGARES
    // =========================

    const añadirLugar = () => {

        const lugar =
            lugarTemporal.trim()

        if (
            lugar &&
            !opcionesLugares.includes(lugar)
        ) {

            setOpcionesLugares([
                ...opcionesLugares,
                lugar
            ])

            setLugarTemporal('')
        }
    }

    const eliminarLugar = (lugar) => {

        setOpcionesLugares(
            opcionesLugares.filter(
                item => item !== lugar
            )
        )
    }

    // =========================
    // VALIDAR PASO 1
    // =========================

    const validarPaso1 = () => {

        limpiarError()

        const nombre =
            nombreJuntada.trim()

        if (!nombre) {
            return
        }

        if (nombre.length < 3) {
            return
        }

        setPaso(2)
    }

    // =========================
    // VALIDAR PASO 2
    // =========================

    const validarPaso2 = () => {

        limpiarError()

        if (
            opcionesFechas.length === 0 &&
            opcionesLugares.length === 0
        ) {
            return
        }

        setPaso(3)
    }

    // =========================
    // CREAR PROPUESTA
    // =========================

    const manejarSubmitFinal = async () => {

        limpiarError()

        if (!fechaCierre) {
            return
        }

        if (!idGrupo) {
            return
        }

        const {
            data,
            error: errorCreacion
        } = await crearPropuesta({

            idGrupo,

            nombre:
                nombreJuntada,

            descripcion,

            opcionesFechas,

            opcionesLugares,

            fechaCierre
        })

        if (errorCreacion) {
            return
        }

        navigation.navigate(
            'Juntada',
            {
                idEvento:
                    data.evento.id
            }
        )
    }

    // =========================
    // PASO 1
    // =========================

    if (paso === 1) {

        return (
            <View style={styles.fondo}>

                <View style={styles.contenedorIndicador}>

                    <IndicadorPasos
                        pasoActual={1}
                        totalPasos={3}
                    />

                </View> 

                <View style={styles.formulario}>

                    <Text style={styles.titulo}>
                        Crear propuesta de juntada
                    </Text>

                    <Text style={styles.descripcionPaso}>
                        Primero contanos qué juntada
                        querés organizar.
                    </Text>

                    <Text style={styles.label}>
                        Nombre de la juntada
                    </Text>

                    <InputApp
                        value={nombreJuntada}
                        onChangeText={setNombreJuntada}
                        placeholder="Ej: Juntada de fin de año"
                    />

                    <View style={styles.separadorInput}>

                        <Text style={styles.label}>
                            Descripción
                        </Text>

                        <InputApp
                            value={descripcion}
                            onChangeText={setDescripcion}
                            placeholder="Contanos un poco más..."
                        />

                    </View>

                </View>

                {error ? (
                    <ErrorMessage
                        mensaje={error}
                    />
                ) : null}

                <View style={styles.botonContainer}>

                    <ButtonApp
                        nombre="Continuar"
                        onPress={validarPaso1}
                        disabled={cargando}
                    />

                </View>

            </View>
        )
    }

    // =========================
    // PASO 2
    // =========================

    if (paso === 2) {

        return (
            <View style={styles.fondo}>

                <View style={styles.contenedorIndicador}>

                    <IndicadorPasos
                        pasoActual={2}
                        totalPasos={3}
                    />

                </View>

                <ScrollView
                    style={styles.scroll}
                    contentContainerStyle={
                        styles.scrollContenido
                    }
                    showsVerticalScrollIndicator={false}
                >

                    <Text style={styles.titulo}>
                        Elegí las opciones
                    </Text>

                    <Text style={styles.descripcionPaso}>
                        Podés proponer distintas fechas,
                        horarios y lugares para que el
                        grupo vote.
                    </Text>

                    {/* FECHAS */}

                    <Text style={styles.seccion}>
                        Fechas y horarios
                    </Text>

                    {Platform.OS === 'web' ? (

                        <input
                            type="datetime-local"
                            value={fechaWeb}
                            onChange={
                                e =>
                                    setFechaWeb(
                                        e.target.value
                                    )
                            }
                            style={
                                styles.datetimeInput
                            }
                        />

                    ) : (

                        <Pressable
                            style={
                                styles.selector
                            }
                            onPress={() => {

                                setPickerMode(
                                    'date'
                                )

                                setShowPicker(
                                    true
                                )
                            }}
                        >

                            <Text
                                style={
                                    styles.selectorTexto
                                }
                            >
                                {
                                    fechaTextoTemporal ||
                                    'Seleccionar fecha y hora'
                                }
                            </Text>

                        </Pressable>
                    )}

                    <ButtonApp
                        nombre="+ Agregar fecha"
                        onPress={añadirFecha}
                        disabled={cargando}
                    />

                    {opcionesFechas.length > 0 && (

                        <View style={styles.lista}>

                            {opcionesFechas.map(
                                (
                                    fecha,
                                    index
                                ) => (

                                    <View
                                        key={fecha}
                                        style={[
                                            styles.item,
                                            index ===
                                                opcionesFechas.length - 1 &&
                                            {
                                                borderBottomWidth: 0
                                            }
                                        ]}
                                    >

                                        <Text
                                            style={
                                                styles.itemTexto
                                            }
                                        >
                                            {fecha}
                                        </Text>

                                        <Pressable
                                            onPress={() =>
                                                eliminarFecha(
                                                    fecha
                                                )
                                            }
                                            style={
                                                styles.botonEliminar
                                            }
                                        >

                                            <MaterialCommunityIcons
                                                name="trash-can-outline"
                                                size={22}
                                                color="#FFF"
                                            />

                                        </Pressable>

                                    </View>
                                )
                            )}

                        </View>
                    )}

                    {/* LUGARES */}

                    <Text style={styles.seccion}>
                        Lugares
                    </Text>

                    <InputApp
                        value={lugarTemporal}
                        onChangeText={
                            setLugarTemporal
                        }
                        placeholder="Ej: Palermo, Parque Centenario..."
                    />

                    <ButtonApp
                        nombre="+ Agregar lugar"
                        onPress={añadirLugar}
                        disabled={cargando}
                    />

                    <ButtonApp
                        nombre="Recomendar lugares para el grupo"
                        onPress={() => navigation.navigate(
                            'RecomendacionesGrupo',
                            { idGrupo }
                        )}
                        disabled={cargando || !idGrupo}
                    />

                    {opcionesLugares.length > 0 && (

                        <View style={styles.lista}>

                            {opcionesLugares.map(
                                (
                                    lugar,
                                    index
                                ) => (

                                    <View
                                        key={lugar}
                                        style={[
                                            styles.item,
                                            index ===
                                                opcionesLugares.length - 1 &&
                                            {
                                                borderBottomWidth: 0
                                            }
                                        ]}
                                    >

                                        <Text
                                            style={
                                                styles.itemTexto
                                            }
                                        >
                                            {lugar}
                                        </Text>

                                        <Pressable
                                            onPress={() =>
                                                eliminarLugar(
                                                    lugar
                                                )
                                            }
                                            style={
                                                styles.botonEliminar
                                            }
                                        >

                                            <MaterialCommunityIcons
                                                name="trash-can-outline"
                                                size={22}
                                                color="#FFF"
                                            />

                                        </Pressable>

                                    </View>
                                )
                            )}

                        </View>
                    )}

                    {/* DATE PICKER NATIVO */}

                    {showPicker &&
                        DateTimePicker && (

                            <DateTimePicker
                                value={date}
                                mode={
                                    Platform.OS === 'ios'
                                        ? 'datetime'
                                        : pickerMode
                                }
                                is24Hour={true}
                                onChange={
                                    onChangeNativo
                                }
                            />

                        )}

                </ScrollView>

                {error ? (
                    <ErrorMessage
                        mensaje={error}
                    />
                ) : null}

                <View style={styles.botonContainer}>

                    <ButtonApp
                        nombre="Continuar"
                        onPress={validarPaso2}
                        disabled={cargando}
                    />

                </View>

            </View>
        )
    }

    // =========================
    // PASO 3
    // =========================

    return (

        <View style={styles.fondo}>

            <View style={styles.contenedorIndicador}>

                <IndicadorPasos
                    pasoActual={3}
                    totalPasos={3}
                />

            </View>

            <View style={styles.formulario}>

                <Text style={styles.titulo}>
                    Cierre de la votación
                </Text>

                <Text style={styles.descripcionPaso}>
                    Elegí hasta cuándo los integrantes
                    del grupo podrán votar.
                </Text>

                {Platform.OS === 'web' ? (

                    <input
                        type="datetime-local"
                        value={
                            fechaCierre
                                ? fechaCierre.slice(
                                    0,
                                    16
                                )
                                : ''
                        }
                        onChange={
                            e =>
                                setFechaCierre(
                                    e.target.value
                                )
                        }
                        style={
                            styles.datetimeInput
                        }
                    />

                ) : (

                    <View
                        style={
                            styles.datePickerContainer
                        }
                    >

                        <DateTimePicker
                            value={
                                fechaCierreDate
                            }
                            mode="datetime"
                            is24Hour={true}
                            onChange={(
                                event,
                                selectedDate
                            ) => {

                                if (
                                    event?.type ===
                                    'dismissed'
                                ) {
                                    return
                                }

                                if (
                                    selectedDate
                                ) {

                                    setFechaCierreDate(
                                        selectedDate
                                    )

                                    setFechaCierre(
                                        selectedDate.toISOString()
                                    )
                                }
                            }}
                        />

                    </View>
                )}

            </View>

            {error ? (
                <ErrorMessage
                    mensaje={error}
                />
            ) : null}

            <View style={styles.botonContainer}>

                <ButtonApp
                    nombre="Volver"
                    onPress={() => {

                        limpiarError()

                        setPaso(2)

                    }}
                    disabled={cargando}
                />

                <ButtonApp
                    nombre={
                        cargando
                            ? 'Creando...'
                            : 'Crear propuesta'
                    }
                    onPress={
                        manejarSubmitFinal
                    }
                    disabled={cargando}
                />

            </View>

        </View>
    )
}

const styles = StyleSheet.create({

    fondo: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25
    },

    contenedorIndicador: {
        position: 'absolute',
        top: 25,
        left: 25,
        right: 25
    },

    formulario: {
        marginTop: 110
    },

    titulo: {
        color: '#FFFFFF',
        fontFamily: 'CashMarket',
        fontSize: 26,
        marginBottom: 10
    },

    descripcionPaso: {
        color: '#B6B6B6',
        fontFamily: 'Utendo',
        fontSize: 15,
        lineHeight: 22,
        marginBottom: 25
    },

    label: {
        color: '#FFFFFF',
        fontFamily: 'CashMarket',
        fontSize: 16,
        marginBottom: 8,
        marginTop: 10
    },

    separadorInput: {
        marginTop: 10
    },

    seccion: {
        color: '#FFFFFF',
        fontFamily: 'CashMarket',
        fontSize: 19,
        marginTop: 25,
        marginBottom: 12
    },

    scroll: {
        marginTop: 100
    },

    scrollContenido: {
        paddingBottom: 30
    },

    selector: {
        backgroundColor: '#312E32',
        borderWidth: 2,
        borderColor: '#55515A',
        borderRadius: 15,
        paddingHorizontal: 15,
        paddingVertical: 16
    },

    selectorTexto: {
        color: '#FFFFFF',
        fontFamily: 'Utendo',
        fontSize: 15
    },

    datetimeInput: {
        borderRadius: 15,
        border: '2px solid #55515A',
        backgroundColor: '#312E32',
        padding: 15,
        color: 'white',
        width: '100%',
        boxSizing: 'border-box',
        fontFamily: 'Utendo',
        fontSize: 15,
        colorScheme: 'dark',
        marginTop: 5
    },

    lista: {
        backgroundColor: '#5C3E94',
        borderRadius: 15,
        overflow: 'hidden',
        marginTop: 12
    },

    item: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingVertical: 14,
        paddingHorizontal: 15,
        borderBottomWidth: 1,
        borderBottomColor:
            'rgba(255,255,255,0.25)'
    },

    itemTexto: {
        color: '#FFFFFF',
        fontFamily: 'Utendo',
        fontSize: 14,
        flex: 1,
        marginRight: 10
    },

    botonEliminar: {
        paddingHorizontal: 5,
        marginLeft: 10
    },

    datePickerContainer: {
        marginTop: 10
    },

    botonContainer: {
        marginTop: 'auto',
        marginBottom: 20
    }
})
