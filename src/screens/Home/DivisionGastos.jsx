import React, { useState } from 'react'
import {
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    View,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import useGastos from '../../hooks/useGastos'


export default function DivisionGastos({ route, navigation }) {
    const [pestanaActiva, setPestanaActiva] = useState('actual')
    const [modalVisible, setModalVisible] = useState(false)
    const [pagadorSeleccionado, setPagadorSeleccionado] = useState(null)
    const [monto, setMonto] = useState('')
    const [descripcion, setDescripcion] = useState('')
    const [personaExpandidaId, setPersonaExpandidaId] = useState(null)

    const eventId = route?.params?.idEvento

    const {
        gastos,
        gastosPorPersona,
        personas,
        totalGastado,
        historial,
        loading,
        guardando,
        error,
        agregarGasto,
    } = useGastos(eventId)

    const modoHistorial = route?.params?.modoHistorial ?? false
    const nombreEvento = route?.params?.nombreEvento ?? ''

    async function handleRegistrarGasto() {
        const { error: errorCreacion } = await agregarGasto({
            pagadorId: pagadorSeleccionado?.id,
            descripcion,
            monto,
        })

        if (errorCreacion) {
            return
        }

        setPagadorSeleccionado(null)
        setMonto('')
        setDescripcion('')
        setModalVisible(false)
    }

    const totalFormateado = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
    }).format(totalGastado)

    function formatearMonto(valor) {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            maximumFractionDigits: 0,
        }).format(valor)
    }
    function formatearFecha(fecha) {
        if (!fecha) {
            return 'Fecha desconocida'
        }

        return new Intl.DateTimeFormat('es-AR', {
            day: 'numeric',
            month: 'long',
        }).format(new Date(fecha))
    }

    function alternarDetallePersona(personaId) {
        setPersonaExpandidaId((idActual) =>
            idActual === personaId ? null : personaId
        )
    }

    return (
        <SafeAreaView>
            <ScrollView>
                <View>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        accessibilityRole="button"
                        accessibilityLabel="Volver a la juntada"
                    >
                        <Ionicons name="arrow-back" size={27} />
                    </Pressable>

                    <Text>División de gastos</Text>
                </View>

                {modoHistorial ? (
                    <Text>{nombreEvento}</Text>
                ) : (
                    <View>
                        <Pressable onPress={() => setPestanaActiva('actual')}>
                            <Text>Actual</Text>
                        </Pressable>

                        <Pressable onPress={() => setPestanaActiva('historial')}>
                            <Text>Historial</Text>
                        </Pressable>
                    </View>
                )}

                {loading ? <Text>Cargando gastos...</Text> : null}
                {error ? <Text>{error}</Text> : null}

                {pestanaActiva === 'actual' ? (
                    <>
                        <View>
                            <Text>Total gastado:</Text>
                            <Text>{totalFormateado}</Text>
                            <Text>$</Text>
                        </View>

                        <View>
                            <View>
                                <Text>Personas</Text>

                                {!modoHistorial ? (
                                    <Pressable onPress={() => setModalVisible(true)}>
                                        <Ionicons name="add" size={16} />
                                        <Text>Agregar</Text>
                                    </Pressable>
                                ) : null}
                            </View>

                            {!loading && gastos.length === 0 ? (
                                <View>
                                    <FontAwesome6 name="receipt" size={29} />
                                    <Text>Todavía no hay gastos</Text>
                                    <Text>
                                        Cuando alguien agregue un gasto, aparecerá acá y se sumará al total.
                                    </Text>
                                </View>
                            ) : (
                                gastosPorPersona
                                    .filter((resumen) => resumen.gastos.length > 0)
                                    .map((resumen) => {
                                        const estaExpandida = personaExpandidaId === resumen.persona.id

                                        return (
                                            <View key={resumen.persona.id}>
                                                <Pressable
                                                    onPress={() => alternarDetallePersona(resumen.persona.id)}
                                                >
                                                    <Text>
                                                        {resumen.persona.nombre || resumen.persona.username || 'Persona'}
                                                    </Text>
                                                    <Text>{formatearMonto(resumen.total)}</Text>
                                                    <Ionicons
                                                        name={estaExpandida ? 'chevron-up' : 'chevron-down'}
                                                        size={18}
                                                    />
                                                </Pressable>

                                                {estaExpandida
                                                    ? resumen.gastos.map((gasto) => (
                                                        <View key={gasto.id}>
                                                            <Text>{gasto.descripcion}:</Text>
                                                            <Text>{formatearMonto(gasto.monto)}</Text>
                                                        </View>
                                                    ))
                                                    : null}
                                            </View>
                                        )
                                    })
                            )}
                        </View>
                    </>
                ) : (
                    <View>
                        <FontAwesome6 name="clock-rotate-left" size={28} />
                        <Text>Historial de gastos</Text>

                        {historial.length === 0 ? (
                            <View>
                                <Text>Todavía no hay historial</Text>
                                <Text>
                                    Las divisiones de gastos anteriores aparecerán acá.
                                </Text>
                            </View>
                        ) : (
                            historial.map((evento) => (
                                <Pressable
                                    key={evento.id}
                                    onPress={() =>
                                        navigation.push('DivisionGastos', {
                                            idEvento: evento.id,
                                            modoHistorial: true,
                                            nombreEvento: evento.nombre,
                                        })
                                    }
                                >
                                    <Text>{evento.nombre}</Text>
                                    <Text>{formatearMonto(evento.total)}</Text>
                                    <Text>{formatearFecha(evento.fecha_hora_inicio)}</Text>
                                    <Text>{evento.personas.length} personas</Text>
                                </Pressable>
                            ))
                        )}
                    </View>
                )}
            </ScrollView>
            <Modal
                visible={modalVisible}
                transparent
                animationType="fade"
                onRequestClose={() => setModalVisible(false)}
            >
                <View>
                    <View>
                        <View>
                            <Text>¿Qué gasto desea registrar?</Text>

                            <Pressable
                                onPress={() => setModalVisible(false)}
                            >
                                <Ionicons name="close" size={24} color="#222" />
                            </Pressable>
                        </View>

                        <Text>¿Quién pagó?</Text>

                        <View>
                            {personas.map((persona) => (
                                <Pressable
                                    key={persona.id}
                                    onPress={() => setPagadorSeleccionado(persona)}
                                >
                                    <Text>
                                        {persona.nombre || persona.username}
                                        {pagadorSeleccionado?.id === persona.id
                                            ? ' - Seleccionado'
                                            : ''}
                                    </Text>
                                </Pressable>
                            ))}
                        </View>

                        {personas.length === 0 ? (
                            <Text>No hay asistentes confirmados.</Text>
                        ) : null}

                        <Text>Monto</Text>

                        <TextInput
                            value={monto}
                            onChangeText={setMonto}
                            placeholder="Monto $"
                            keyboardType="numeric"
                        />

                        <Text>Nombre del gasto</Text>

                        <TextInput
                            value={descripcion}
                            onChangeText={setDescripcion}
                            placeholder="Ejemplo: Choripanes"
                            maxLength={50}
                        />

                        <Text>{descripcion.length}/50</Text>

                        {error ? <Text>{error}</Text> : null}

                        <Pressable
                            onPress={handleRegistrarGasto}
                            disabled={guardando}
                        >
                            <Text>
                                {guardando ? 'Guardando...' : 'Registrar gasto'}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => setModalVisible(false)}
                        >
                            <Text>Cerrar</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}
