import React, { useState, useMemo } from "react";
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Platform,
} from "react-native";

import { SafeAreaView } from "react-native-safe-area-context";
import DateTimePicker from "@react-native-community/datetimepicker";
import { useHorarios } from "../../hooks/useHorarios";
import Ionicons from "@expo/vector-icons/Ionicons";

const MESES = [
    "Enero",
    "Febrero",
    "Marzo",
    "Abril",
    "Mayo",
    "Junio",
    "Julio",
    "Agosto",
    "Septiembre",
    "Octubre",
    "Noviembre",
    "Diciembre",
];

const DIAS_SEMANA = ["DOM", "LUN", "MAR", "MIÉ", "JUE", "VIE", "SÁB"];

const DIAS_REPETICION = [
    { numero: 1, nombre: "Lun" },
    { numero: 2, nombre: "Mar" },
    { numero: 3, nombre: "Mié" },
    { numero: 4, nombre: "Jue" },
    { numero: 5, nombre: "Vie" },
    { numero: 6, nombre: "Sáb" },
    { numero: 7, nombre: "Dom" },
];

export default function OrganizadorHorarios() {
    const hoy = new Date();

    const [mesActual, setMesActual] = useState(hoy.getMonth());
    const [anioActual, setAnioActual] = useState(hoy.getFullYear());
    const [diaSeleccionado, setDiaSeleccionado] = useState(hoy.getDate());

    const [mostrarFormulario, setMostrarFormulario] = useState(false);
    const [guardado, setGuardado] = useState(false);
    const [nombreEvento, setNombreEvento] = useState("");
    const [horaInicio, setHoraInicio] = useState(new Date());
    const [horaFin, setHoraFin] = useState(new Date());

    const [seRepite, setSeRepite] = useState(false);
    const [diasSeleccionados, setDiasSeleccionados] = useState([]);

    const seleccionarDia = (numeroDia) => {
        setDiasSeleccionados((dias) =>
            dias.includes(numeroDia)
                ? dias.filter((dia) => dia !== numeroDia)
                : [...dias, numeroDia]
        );
    };

    const {
        agregarHorario,
        agregarHorarioRecurrente,
        limpiarError,
        loading,
        error,
        horarios,
        horariosRecurrentes,
    } = useHorarios();

    const obtenerDiasDelMes = () => {
        const primerDia = new Date(anioActual, mesActual, 1).getDay();

        const cantidadDias = new Date(
            anioActual,
            mesActual + 1,
            0
        ).getDate();

        const calendario = [];

        for (let i = 0; i < primerDia; i++) {
            calendario.push(null);
        }

        for (let dia = 1; dia <= cantidadDias; dia++) {
            calendario.push(dia);
        }

        return calendario;
    };

    const cambiarMes = (direccion) => {
        let nuevoMes = mesActual + direccion;
        let nuevoAnio = anioActual;

        if (nuevoMes < 0) {
            nuevoMes = 11;
            nuevoAnio--;
        }

        if (nuevoMes > 11) {
            nuevoMes = 0;
            nuevoAnio++;
        }

        setMesActual(nuevoMes);
        setAnioActual(nuevoAnio);
        setDiaSeleccionado(null);
    };

    const dias = obtenerDiasDelMes();

    const marcadoresPorDia = useMemo(() => {
        const mapa = {};

        const primerDiaMes = new Date(anioActual, mesActual, 1);
        const ultimoDiaMes = new Date(anioActual, mesActual + 1, 0);

        // contar horarios normales
        (horarios || []).forEach((h) => {
            try {
                const inicio = new Date(h.fecha_hora_inicio);
                if (
                    inicio.getFullYear() === anioActual &&
                    inicio.getMonth() === mesActual
                ) {
                    const d = inicio.getDate();
                    mapa[d] = (mapa[d] || 0) + 1;
                }
            } catch (e) {
                // ignore parse errors
            }
        });

        // contar horarios recurrentes: considerar fecha_inicio, fecha_fin y dias de semana
        (horariosRecurrentes || []).forEach((r) => {
            try {
                const fechaInicio = r.fecha_inicio ? new Date(r.fecha_inicio) : new Date(-8640000000000000);
                const fechaFin = r.fecha_fin ? new Date(r.fecha_fin) : new Date(8640000000000000);

                // lista de dias de semana en el objeto (campo dia_horario_recurrente puede variar)
                const diasSemana = (r.dia_horario_recurrente || r.dias || []).map(x => x?.dia_semana ?? x).filter(Boolean);

                // recorrer cada día del mes y sumar si aplica
                for (let dia = 1; dia <= ultimoDiaMes.getDate(); dia++) {
                    const fecha = new Date(anioActual, mesActual, dia);
                    if (fecha < fechaInicio || fecha > fechaFin) continue;
                    // ajustar: en la base los días parecen venir 1=lun..7=dom o similar; normalizamos a JS getDay()
                    const jsDay = fecha.getDay(); // 0=dom,1=lun..6=sab
                    const diaSem = jsDay === 0 ? 7 : jsDay; // 1=lun..7=dom
                    if (diasSemana.includes(diaSem) || diasSemana.includes(jsDay)) {
                        mapa[dia] = (mapa[dia] || 0) + 1;
                    }
                }
            } catch (e) {
                // ignore
            }
        });

        return mapa;
    }, [horarios, horariosRecurrentes, mesActual, anioActual]);

    const formatTime = (date) => {
        if (!date) return "";
        try {
            return new Date(date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        } catch (e) {
            return '';
        }
    };

    const eventosDelDia = useMemo(() => {
        if (!diaSeleccionado) return [];
        const fechaObj = new Date(anioActual, mesActual, diaSeleccionado);
        const resultados = [];

        (horarios || []).forEach((h) => {
            try {
                const inicio = new Date(h.fecha_hora_inicio);
                const fin = new Date(h.fecha_hora_fin);
                if (
                    inicio.getFullYear() === anioActual &&
                    inicio.getMonth() === mesActual &&
                    inicio.getDate() === diaSeleccionado
                ) {
                    resultados.push({
                        tipo: 'normal',
                        id: h.id_horario || h.id,
                        titulo: h.titulo,
                        inicio,
                        fin,
                        repeticion: false,
                    });
                }
            } catch (e) {}
        });

        (horariosRecurrentes || []).forEach((r) => {
            try {
                const fechaInicio = r.fecha_inicio ? new Date(r.fecha_inicio) : new Date(-8640000000000000);
                const fechaFin = r.fecha_fin ? new Date(r.fecha_fin) : new Date(8640000000000000);
                if (fechaObj < fechaInicio || fechaObj > fechaFin) return;

                const diasSemana = (r.dia_horario_recurrente || r.dias || []).map(x => x?.dia_semana ?? x).filter(Boolean);
                const jsDay = fechaObj.getDay();
                const diaSem = jsDay === 0 ? 7 : jsDay;

                if (diasSemana.includes(diaSem) || diasSemana.includes(jsDay)) {
                    // hora_inicio/hora_fin suelen venir como 'HH:MM:SS'
                    const partsI = (r.hora_inicio || '').split(':').map(Number);
                    const partsF = (r.hora_fin || '').split(':').map(Number);
                    const inicio = new Date(anioActual, mesActual, diaSeleccionado, partsI[0] || 0, partsI[1] || 0);
                    const fin = new Date(anioActual, mesActual, diaSeleccionado, partsF[0] || 0, partsF[1] || 0);
                    resultados.push({
                        tipo: 'recurrente',
                        id: r.id_horario_recurrente || r.id,
                        titulo: r.titulo,
                        inicio,
                        fin,
                        repeticion: true,
                    });
                }
            } catch (e) {}
        });

        resultados.sort((a, b) => a.inicio - b.inicio);
        return resultados;
    }, [diaSeleccionado, horarios, horariosRecurrentes, mesActual, anioActual]);

    const abrirFormulario = () => {
        limpiarError();
        setGuardado(false);
        setMostrarFormulario(true);
    };

    const agregarEvento = async () => {
        setGuardado(false);
        const guardar = seRepite ? agregarHorarioRecurrente : agregarHorario;
        const resultado = await guardar({
            titulo: nombreEvento,
            anio: anioActual,
            mes: mesActual,
            dia: diaSeleccionado,
            horaInicio,
            horaFin,
            dias: diasSeleccionados,
        });
        if (resultado.error) return;
        setGuardado(true);
        setNombreEvento("");
        setSeRepite(false);
        setDiasSeleccionados([]);
        setMostrarFormulario(false);
    };

    return (
        <SafeAreaView style={styles.container}>
            <ScrollView
                keyboardShouldPersistTaps="handled"
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.content}
            >
                <View style={styles.header}>

                    <Text style={styles.headerTitle}>
                        Organizá tus horarios
                    </Text>

                    <View style={styles.headerSpacer} />
                </View>

                <View style={styles.separator} />
                <View style={styles.monthHeader}>
                    <View style={styles.monthTitleContainer}>
                        <Text style={styles.monthTitle}>
                            {MESES[mesActual]}
                        </Text>

                        <Text style={styles.year}>
                            {anioActual}
                        </Text>
                    </View>

                    <View style={styles.monthControls}>
                        <TouchableOpacity
                            style={styles.arrowButton}
                            onPress={() => cambiarMes(-1)}
                        >
                            <Ionicons
                                name="chevron-back"
                                size={20}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.arrowButton}
                            onPress={() => cambiarMes(1)}
                        >
                            <Ionicons
                                name="chevron-forward"
                                size={20}
                                color="#FFFFFF"
                            />
                        </TouchableOpacity>
                    </View>
                </View>
                <View style={styles.weekRow}>
                    {DIAS_SEMANA.map((dia) => (
                        <View key={dia} style={styles.dayCell}>
                            <Text style={styles.weekDay}>
                                {dia}
                            </Text>
                        </View>
                    ))}
                </View>
                <View style={styles.calendarGrid}>
                    {dias.map((dia, index) => {
                        const seleccionado = dia === diaSeleccionado;
                        const count = dia ? (marcadoresPorDia[dia] || 0) : 0;

                        return (
                            <View
                                key={index}
                                style={styles.dayCell}
                            >
                                {dia !== null && (
                                    <TouchableOpacity
                                        style={[
                                            styles.dayButton,
                                            seleccionado && styles.selectedDay,
                                        ]}
                                        onPress={() => setDiaSeleccionado(dia)}
                                    >
                                        <Text
                                            style={[
                                                styles.dayText,
                                                seleccionado &&
                                                styles.selectedDayText,
                                            ]}
                                        >
                                            {dia}
                                        </Text>

                                        <View style={styles.dotsContainer}>
                                            {Array.from({ length: Math.min(count, 3) }).map((_, i) => (
                                                <View key={i} style={styles.dot} />
                                            ))}
                                            {count > 3 && (
                                                <Text style={styles.extra}>+{count - 3}</Text>
                                            )}
                                        </View>

                                    </TouchableOpacity>
                                )}
                            </View>
                        );
                    })}
                </View>

                <View style={styles.eventsSection}>
                    <View style={styles.eventsHeader}>
                        <Text style={styles.eventsTitle}>Mis horarios</Text>
                        {!mostrarFormulario && (
                            <TouchableOpacity onPress={abrirFormulario}>
                                <Text style={styles.text}>+ Crear</Text>
                            </TouchableOpacity>
                        )}
                    </View>

                    {diaSeleccionado && (
                        <View style={styles.dayEventsContainer}>
                            <Text style={styles.text}>Actividades del {diaSeleccionado}/{String(mesActual + 1).padStart(2, '0')}/{anioActual}</Text>
                            {eventosDelDia.length === 0 ? (
                                <Text style={styles.text}>No hay actividades ese día</Text>
                            ) : (
                                eventosDelDia.map((e) => (
                                    <View key={`${e.tipo}-${e.id}`} style={styles.eventItem}>
                                        <Text style={styles.eventTitle}>{e.titulo}</Text>
                                        <Text style={styles.text}>{formatTime(e.inicio)} - {formatTime(e.fin)} {e.repeticion ? '• Repite' : ''}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    )}

                    {guardado && <Text style={styles.text}>Evento guardado correctamente</Text>}
                    {mostrarFormulario && (
                        <View style={styles.form}>
                            <View style={styles.eventsHeader}>
                                <Text style={styles.text}>Nuevo evento</Text>
                                <TouchableOpacity
                                    disabled={loading}
                                    onPress={() => setMostrarFormulario(false)}
                                    accessibilityLabel="Cerrar formulario"
                                >
                                    <Ionicons name="close" size={22} color="white" />
                                </TouchableOpacity>
                            </View>
                            <TextInput
                                placeholder="Nombre del evento"
                                placeholderTextColor="#AAAAAA"
                                value={nombreEvento}
                                onChangeText={setNombreEvento}
                                editable={!loading}
                                style={styles.input}
                            />
                            <CampoHora label="Desde" value={horaInicio} onChange={setHoraInicio} disabled={loading} />
                            <CampoHora label="Hasta" value={horaFin} onChange={setHoraFin} disabled={loading} />
                            <TouchableOpacity
                                disabled={loading}
                                accessibilityRole="checkbox"
                                accessibilityState={{ checked: seRepite }}
                                onPress={() => {
                                    setSeRepite((valor) => !valor);
                                }}
                            >
                                <Text style={styles.text}>
                                    {seRepite ? "☑" : "☐"} Todas las semanas
                                </Text>
                            </TouchableOpacity>
                            {seRepite && (
                                <View style={styles.timeField}>
                                    <Text style={styles.text}>Se repite los:</Text>
                                    {DIAS_REPETICION.map((dia) => (
                                        <TouchableOpacity
                                            key={dia.numero}
                                            disabled={loading}
                                            accessibilityRole="checkbox"
                                            accessibilityState={{ checked: diasSeleccionados.includes(dia.numero) }}
                                            onPress={() => seleccionarDia(dia.numero)}
                                        >
                                            <Text style={styles.text}>
                                                {diasSeleccionados.includes(dia.numero) ? "☑" : "☐"} {dia.nombre}
                                            </Text>
                                        </TouchableOpacity>
                                    ))}
                                </View>
                            )}
                            {error && (
                                <Text style={styles.error}>{error}</Text>
                            )}
                            <TouchableOpacity
                                style={styles.saveButton}
                                onPress={agregarEvento}
                                disabled={loading}
                            >
                                <Text style={styles.text}>
                                    {loading ? "Guardando..." : "Agregar evento"}
                                </Text>
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

            </ScrollView>
        </SafeAreaView >
    );
}

function CampoHora({ label, value, onChange, disabled }) {
    const [abierto, setAbierto] = useState(false);
    const hora = value.getHours().toString().padStart(2, "0");
    const minutos = value.getMinutes().toString().padStart(2, "0");

    return (
        <View style={styles.timeField}>
            <Text style={styles.text}>{label}</Text>
            {Platform.OS === "web" ? (
                <input
                    aria-label={label}
                    type="time"
                    disabled={disabled}
                    value={hora + ":" + minutos}
                    onChange={(event) => {
                        if (!event.target.value) return;
                        const [hours, minutes] = event.target.value.split(":").map(Number);
                        const nuevaHora = new Date(value);
                        nuevaHora.setHours(hours, minutes, 0, 0);
                        onChange(nuevaHora);
                    }}
                />
            ) : (
                <>
                    <TouchableOpacity disabled={disabled} onPress={() => setAbierto(true)}>
                        <Text style={styles.text}>{hora}:{minutos}</Text>
                    </TouchableOpacity>
                    {abierto && (
                        <DateTimePicker
                            value={value}
                            mode="time"
                            is24Hour
                            onChange={(_, horaElegida) => {
                                setAbierto(false);
                                if (horaElegida) onChange(horaElegida);
                            }}
                        />
                    )}
                </>
            )}
        </View>
    );
}

const styles = StyleSheet.create({
    text: { color: "#FFFFFF" },
    error: { color: "#FF9090" },
    eventsHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingVertical: 12,
    },
    form: { gap: 12 },
    input: {
        color: "#FFFFFF",
        borderWidth: 1,
        borderColor: "#676772",
        borderRadius: 8,
        padding: 12,
    },
    timeField: { gap: 8 },
    saveButton: {
        backgroundColor: "#621580",
        alignItems: "center",
        borderRadius: 8,
        padding: 12,
    },
    eventsTitle:
    {
        color: "#FFFFFF",
    },

    container: {
        flex: 1,
        backgroundColor: "#15151C",
    },

    content: {
        paddingBottom: 100,
    },

    header: {
        height: 65,
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 20,
    },

    headerTitle: {
        flex: 1,
        color: "#FFFFFF",
        fontSize: 22,
        fontWeight: "700",
        textAlign: "center",
    },

    headerSpacer: {
        width: 40,
    },

    separator: {
        height: 1,
        backgroundColor: "#676772",
    },

    monthHeader: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
        paddingHorizontal: 30,
        marginTop: 22,
        marginBottom: 12,
    },

    monthTitleContainer: {
        flexDirection: "row",
        alignItems: "baseline",
        gap: 8,
    },

    monthTitle: {
        color: "#FFFFFF",
        fontSize: 27,
        fontWeight: "700",
    },

    year: {
        color: "#57C7A3",
        fontSize: 15,
        fontWeight: "700",
    },

    monthControls: {
        flexDirection: "row",
        gap: 12,
    },

    arrowButton: {
        width: 30,
        height: 30,
        justifyContent: "center",
        alignItems: "center",
    },

    weekRow: {
        flexDirection: "row",
        paddingHorizontal: 28,
        marginBottom: 8,
    },

    calendarGrid: {
        flexDirection: "row",
        flexWrap: "wrap",
        paddingHorizontal: 28,
    },

    dayCell: {
        width: "14.2857%",
        alignItems: "center",
    },

    weekDay: {
        color: "#FFFFFF",
        fontSize: 9,
        fontWeight: "500",
    },

    dayButton: {
        width: 34,
        height: 34,
        borderRadius: 8,
        justifyContent: "center",
        alignItems: "center",
        marginVertical: 6,
    },

    selectedDay: {
        backgroundColor: "#621580",
    },

    dayText: {
        color: "#FFFFFF",
        fontSize: 12,
    },

    selectedDayText: {
        fontWeight: "600",
    },

    dotsContainer: {
        flexDirection: "row",
        marginTop: 4,
        justifyContent: "center",
        alignItems: "center",
    },

    dot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: "#57C7A3",
        marginHorizontal: 2,
    },

    extra: {
        color: "#57C7A3",
        fontSize: 10,
        marginLeft: 4,
    },

    dayEventsContainer: {
        paddingVertical: 12,
        gap: 8,
    },

    eventItem: {
        paddingVertical: 8,
        borderBottomWidth: 1,
        borderBottomColor: '#333',
    },

    eventTitle: {
        color: '#FFFFFF',
        fontWeight: '700',
    },

    eventsSection: {
        borderTopWidth: 1,
        borderTopColor: "#676772",
        marginHorizontal: 30,
        marginTop: 8,
    },
});