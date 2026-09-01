import React, { useState } from 'react'
import {
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    View,
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import useGastos from '../../hooks/useGastos'

export default function DivisionGastos({ route, navigation }) {
    const [pestanaActiva, setPestanaActiva] = useState('actual')
    const eventId = route?.params?.idEvento

    const {
        gastos,
        totalGastado,
        loading,
        error,
    } = useGastos(eventId)

    const totalFormateado = new Intl.NumberFormat('es-AR', {
        style: 'currency',
        currency: 'ARS',
        maximumFractionDigits: 0,
    }).format(totalGastado)

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

                <View>
                    <Pressable onPress={() => setPestanaActiva('actual')}>
                        <Text>Actual</Text>
                    </Pressable>

                    <Pressable onPress={() => setPestanaActiva('historial')}>
                        <Text>Historial</Text>
                    </Pressable>
                </View>

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

                                <Pressable>
                                    <Ionicons name="add" size={16} />
                                    <Text>Agregar</Text>
                                </Pressable>
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
                                gastos.map((gasto) => (
                                    <View key={gasto.id}>
                                        <Text>
                                            {gasto.pagador?.nombre || gasto.pagador?.username || 'Persona'}
                                        </Text>
                                        <Text>{gasto.descripcion}</Text>
                                        <Text>${gasto.monto}</Text>
                                    </View>
                                ))
                            )}
                        </View>
                    </>
                ) : (
                    <View>
                        <FontAwesome6 name="clock-rotate-left" size={28} />
                        <Text>Todavía no hay historial</Text>
                        <Text>Las divisiones de gastos anteriores aparecerán acá.</Text>
                    </View>
                )}
            </ScrollView>
        </SafeAreaView>
    )
}
