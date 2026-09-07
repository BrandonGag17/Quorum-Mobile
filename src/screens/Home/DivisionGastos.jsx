import React, { useState } from 'react'
import {
    Modal,
    Pressable,
    SafeAreaView,
    ScrollView,
    Text,
    TextInput,
    View,
    StyleSheet,
    Image,
    FlatList,
    ActivityIndicator,
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
        <SafeAreaView style={styles.container}>
            <ScrollView style={styles.scrollContent}>
                <View style={styles.header}>
                    <Pressable
                        onPress={() => navigation.goBack()}
                        accessibilityRole="button"
                        accessibilityLabel="Volver a la juntada"
                    >
                        <Ionicons name="arrow-back" size={27} color="#FFFFFF" />
                    </Pressable>

                    <Text style={styles.title}>División de gastos</Text>
                </View>

                {modoHistorial ? (
                    <Text style={styles.subtitle}>{nombreEvento}</Text>
                ) : (
                    <View style={styles.tabsContainer}>
                        <Pressable 
                            onPress={() => setPestanaActiva('actual')}
                            style={[styles.tabButton, pestanaActiva === 'actual' && styles.tabButtonActive]}
                        >
                            <Text style={[styles.tabText, pestanaActiva === 'actual' && styles.tabTextActive]}>Actual</Text>
                        </Pressable>

                        <Pressable 
                            onPress={() => setPestanaActiva('historial')}
                            style={[styles.tabButton, pestanaActiva === 'historial' && styles.tabButtonActive]}
                        >
                            <Text style={[styles.tabText, pestanaActiva === 'historial' && styles.tabTextActive]}>Historial</Text>
                        </Pressable>
                    </View>
                )}

                {loading ? <View style={styles.loadingContainer}><ActivityIndicator size="large" color="#B514F6" /><Text style={styles.loadingText}>Cargando gastos...</Text></View> : null}
                {error ? <Text style={styles.errorText}>{error}</Text> : null}

                {pestanaActiva === 'actual' ? (
                    <>
                        <View style={styles.totalCard}>
                            <Text style={styles.totalLabel}>Total gastado</Text>
                            <View style={styles.totalValueRow}>
                                <Text style={styles.totalValue}>{totalFormateado}</Text>
                            </View>
                        </View>

                        <View style={styles.personasSection}>
                            <View style={styles.personasHeader}>
                                <Text style={styles.personasTitle}>Personas</Text>

                                {!modoHistorial ? (
                                    <Pressable 
                                        onPress={() => setModalVisible(true)}
                                        style={styles.addButton}
                                    >
                                        <Ionicons name="add" size={16} color="#B514F6" />
                                        <Text style={styles.addButtonText}>Agregar</Text>
                                    </Pressable>
                                ) : null}
                            </View>

                            {!loading && gastos.length === 0 ? (
                                <View style={styles.emptyState}>
                                    <FontAwesome6 name="receipt" size={29} color="#B514F6" />
                                    <Text style={styles.emptyTitle}>Todavía no hay gastos</Text>
                                    <Text style={styles.emptySubtitle}>
                                        Cuando alguien agregue un gasto, aparecerá acá y se sumará al total.
                                    </Text>
                                </View>
                            ) : (
                                <View>
                                    {gastosPorPersona
                                        .filter((resumen) => resumen.gastos.length > 0)
                                        .map((resumen) => {
                                            const estaExpandida = personaExpandidaId === resumen.persona.id

                                            return (
                                                <View key={resumen.persona.id} style={styles.personaItem}>
                                                    <Pressable
                                                        onPress={() => alternarDetallePersona(resumen.persona.id)}
                                                        style={styles.personaHeader}
                                                    >
                                                        <View style={styles.personaInfo}>
                                                            <Image
                                                                source={{
                                                                    uri: resumen.persona.foto_perfil || 'https://via.placeholder.com/40',
                                                                }}
                                                                style={styles.avatar}
                                                            />
                                                            <Text style={styles.personaName}>
                                                                {resumen.persona.nombre || resumen.persona.username || 'Persona'}
                                                            </Text>
                                                        </View>
                                                        <View style={styles.personaRight}>
                                                            <Text style={styles.personaTotal}>{formatearMonto(resumen.total)}</Text>
                                                            <Ionicons
                                                                name={estaExpandida ? 'chevron-up' : 'chevron-down'}
                                                                size={18}
                                                                color="#B8B8C5"
                                                            />
                                                        </View>
                                                    </Pressable>

                                                    {estaExpandida && (
                                                        <View style={styles.gastoList}>
                                                            {resumen.gastos.map((gasto) => (
                                                                <View key={gasto.id} style={styles.gastoItem}>
                                                                    <Text style={styles.gastoDescription}>{gasto.descripcion}</Text>
                                                                    <Text style={styles.gastoAmount}>{formatearMonto(gasto.monto)}</Text>
                                                                </View>
                                                            ))}
                                                        </View>
                                                    )}
                                                </View>
                                            )
                                        })}
                                </View>
                            )}
                        </View>
                    </>
                ) : (
                    <View style={styles.historialSection}>
                        <View style={styles.historialHeader}>
                            <FontAwesome6 name="clock-rotate-left" size={28} color="#B514F6" />
                            <Text style={styles.historialTitle}>Historial de gastos</Text>
                        </View>

                        {historial.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyTitle}>Todavía no hay historial</Text>
                                <Text style={styles.emptySubtitle}>
                                    Las divisiones de gastos anteriores aparecerán acá.
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.historialList}>
                                {historial.map((evento) => (
                                    <Pressable
                                        key={evento.id}
                                        onPress={() =>
                                            navigation.push('DivisionGastos', {
                                                idEvento: evento.id,
                                                modoHistorial: true,
                                                nombreEvento: evento.nombre,
                                            })
                                        }
                                        style={styles.historialCard}
                                    >
                                        <View>
                                            <Text style={styles.historialEventName}>{evento.nombre}</Text>
                                            <Text style={styles.historialEventDate}>{formatearFecha(evento.fecha_hora_inicio)}</Text>
                                        </View>
                                        <View style={styles.historialRight}>
                                            <View style={styles.historialAvatars}>
                                                {evento.personas.slice(0, 3).map((persona, idx) => (
                                                    <Image
                                                        key={persona.id}
                                                        source={{
                                                            uri: persona.foto_perfil || 'https://via.placeholder.com/32',
                                                        }}
                                                        style={[styles.smallAvatar, { marginLeft: idx > 0 ? -8 : 0 }]}
                                                    />
                                                ))}
                                                {evento.personas.length > 3 && (
                                                    <View style={[styles.smallAvatar, styles.moreAvatars]}>
                                                        <Text style={styles.moreAvatarsText}>+{evento.personas.length - 3}</Text>
                                                    </View>
                                                )}
                                            </View>
                                            <View style={styles.historialAmount}>
                                                <Text style={styles.historialTotal}>{formatearMonto(evento.total)}</Text>
                                            </View>
                                        </View>
                                    </Pressable>
                                ))}
                            </View>
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
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <View style={styles.modalHeader}>
                            <Text style={styles.modalTitle}>¿Qué gasto desea registrar?</Text>

                            <Pressable
                                onPress={() => setModalVisible(false)}
                                hitSlop={8}
                            >
                                <Ionicons name="close" size={24} color="#FFFFFF" />
                            </Pressable>
                        </View>

                        <Text style={styles.modalLabel}>¿Quién pagó?</Text>

                        <ScrollView style={styles.personasPickerContainer} nestedScrollEnabled>
                            {personas.map((persona) => (
                                <Pressable
                                    key={persona.id}
                                    onPress={() => setPagadorSeleccionado(persona)}
                                    style={[
                                        styles.personaPickerItem,
                                        pagadorSeleccionado?.id === persona.id && styles.personaPickerItemSelected
                                    ]}
                                >
                                    <Image
                                        source={{
                                            uri: persona.foto_perfil || 'https://via.placeholder.com/40',
                                        }}
                                        style={styles.pickerAvatar}
                                    />
                                    <Text style={styles.personaPickerText}>
                                        {persona.nombre || persona.username}
                                    </Text>
                                    {pagadorSeleccionado?.id === persona.id && (
                                        <Ionicons name="checkmark-circle" size={20} color="#57C7A6" />
                                    )}
                                </Pressable>
                            ))}
                        </ScrollView>

                        {personas.length === 0 && (
                            <Text style={styles.emptyPickerText}>No hay asistentes confirmados.</Text>
                        )}

                        <Text style={styles.modalLabel}>Monto</Text>

                        <TextInput
                            value={monto}
                            onChangeText={setMonto}
                            placeholder="Monto $"
                            keyboardType="numeric"
                            style={styles.input}
                            placeholderTextColor="#666"
                        />

                        <Text style={styles.modalLabel}>Nombre del gasto</Text>

                        <View>
                            <TextInput
                                value={descripcion}
                                onChangeText={setDescripcion}
                                placeholder="Ejemplo: Choripanes"
                                maxLength={50}
                                style={styles.input}
                                placeholderTextColor="#666"
                            />
                            <Text style={styles.charCount}>{descripcion.length}/50</Text>
                        </View>

                        {error ? <Text style={styles.errorText}>{error}</Text> : null}

                        <Pressable
                            onPress={handleRegistrarGasto}
                            disabled={guardando || !pagadorSeleccionado}
                            style={[
                                styles.submitButton,
                                (!pagadorSeleccionado || guardando) && styles.submitButtonDisabled
                            ]}
                        >
                            <Text style={styles.submitButtonText}>
                                {guardando ? 'Guardando...' : 'Registrar gasto'}
                            </Text>
                        </Pressable>

                        <Pressable
                            onPress={() => setModalVisible(false)}
                            style={styles.cancelButton}
                        >
                            <Text style={styles.cancelButtonText}>Cerrar</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#15151C',
    },
    scrollContent: {
        padding: 20,
        paddingBottom: 30,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        color: '#FFFFFF',
        fontSize: 24,
        fontFamily: 'CashMarket',
        flex: 1,
        marginLeft: 12,
    },
    subtitle: {
        color: '#B8B8C5',
        fontSize: 16,
        fontFamily: 'Utendo',
        marginBottom: 20,
    },
    tabsContainer: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 24,
    },
    tabButton: {
        flex: 1,
        paddingVertical: 10,
        paddingHorizontal: 16,
        borderRadius: 12,
        backgroundColor: '#23232D',
        borderWidth: 1,
        borderColor: '#3D2E6B',
        alignItems: 'center',
    },
    tabButtonActive: {
        backgroundColor: '#B514F6',
        borderColor: '#B514F6',
    },
    tabText: {
        color: '#B8B8C5',
        fontSize: 14,
        fontFamily: 'Utendo',
        fontWeight: '600',
    },
    tabTextActive: {
        color: '#FFFFFF',
    },
    loadingContainer: {
        justifyContent: 'center',
        alignItems: 'center',
        paddingVertical: 40,
    },
    loadingText: {
        color: '#B8B8C5',
        fontSize: 14,
        fontFamily: 'Utendo',
        marginTop: 12,
    },
    errorText: {
        color: '#FF6B6B',
        fontSize: 14,
        fontFamily: 'Utendo',
        marginBottom: 12,
        paddingHorizontal: 12,
        paddingVertical: 8,
        backgroundColor: '#2A0000',
        borderRadius: 8,
        overflow: 'hidden',
    },
    totalCard: {
        backgroundColor: '#23232D',
        borderRadius: 22,
        padding: 18,
        borderWidth: 1,
        borderColor: '#3D2E6B',
        marginBottom: 24,
    },
    totalLabel: {
        color: '#B8B8C5',
        fontSize: 12,
        fontFamily: 'Utendo',
        marginBottom: 8,
    },
    totalValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    totalValue: {
        color: '#57C7A6',
        fontSize: 32,
        fontFamily: 'CashMarket',
        fontWeight: '700',
    },
    personasSection: {
        marginBottom: 24,
    },
    personasHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    personasTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'CashMarket',
        fontWeight: '600',
    },
    addButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderRadius: 8,
        backgroundColor: '#23232D',
        borderWidth: 1,
        borderColor: '#3D2E6B',
    },
    addButtonText: {
        color: '#B514F6',
        fontSize: 12,
        fontFamily: 'Utendo',
        fontWeight: '600',
    },
    emptyState: {
        alignItems: 'center',
        paddingVertical: 40,
    },
    emptyTitle: {
        color: '#FFFFFF',
        fontSize: 16,
        fontFamily: 'CashMarket',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        color: '#B8B8C5',
        fontSize: 13,
        fontFamily: 'Utendo',
        textAlign: 'center',
        lineHeight: 18,
        paddingHorizontal: 12,
    },
    personaItem: {
        backgroundColor: '#23232D',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3D2E6B',
        marginBottom: 12,
        overflow: 'hidden',
    },
    personaHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 14,
        paddingVertical: 12,
    },
    personaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        flex: 1,
        gap: 12,
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#2E2942',
    },
    personaName: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Utendo',
        fontWeight: '600',
    },
    personaRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
    },
    personaTotal: {
        color: '#57C7A6',
        fontSize: 14,
        fontFamily: 'CashMarket',
        fontWeight: '600',
    },
    gastoList: {
        backgroundColor: '#1A1A24',
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderTopWidth: 1,
        borderTopColor: '#2E2942',
    },
    gastoItem: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingVertical: 8,
    },
    gastoDescription: {
        color: '#B8B8C5',
        fontSize: 12,
        fontFamily: 'Utendo',
        flex: 1,
    },
    gastoAmount: {
        color: '#FFFFFF',
        fontSize: 12,
        fontFamily: 'CashMarket',
        fontWeight: '600',
    },
    historialSection: {
        marginBottom: 24,
    },
    historialHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 20,
    },
    historialTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'CashMarket',
        fontWeight: '600',
    },
    historialList: {
        gap: 12,
    },
    historialCard: {
        backgroundColor: '#23232D',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3D2E6B',
        paddingHorizontal: 14,
        paddingVertical: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    historialEventName: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'CashMarket',
        fontWeight: '600',
        marginBottom: 4,
    },
    historialEventDate: {
        color: '#B8B8C5',
        fontSize: 12,
        fontFamily: 'Utendo',
    },
    historialRight: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
    },
    historialAvatars: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    smallAvatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#2E2942',
        borderWidth: 1,
        borderColor: '#3D2E6B',
    },
    moreAvatars: {
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#3D2E6B',
    },
    moreAvatarsText: {
        color: '#B8B8C5',
        fontSize: 10,
        fontFamily: 'Utendo',
        fontWeight: '600',
    },
    historialAmount: {
        alignItems: 'flex-end',
    },
    historialTotal: {
        color: '#57C7A6',
        fontSize: 14,
        fontFamily: 'CashMarket',
        fontWeight: '600',
    },
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        justifyContent: 'flex-end',
    },
    modalContent: {
        backgroundColor: '#15151C',
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        paddingTop: 20,
        paddingHorizontal: 20,
        paddingBottom: 30,
        maxHeight: '90%',
    },
    modalHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 24,
    },
    modalTitle: {
        color: '#FFFFFF',
        fontSize: 18,
        fontFamily: 'CashMarket',
        fontWeight: '600',
        flex: 1,
    },
    modalLabel: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Utendo',
        fontWeight: '600',
        marginBottom: 12,
        marginTop: 16,
    },
    personasPickerContainer: {
        maxHeight: 200,
        marginBottom: 8,
    },
    personaPickerItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 12,
        paddingVertical: 10,
        backgroundColor: '#23232D',
        borderRadius: 12,
        marginBottom: 8,
        borderWidth: 1,
        borderColor: '#3D2E6B',
    },
    personaPickerItemSelected: {
        borderColor: '#B514F6',
        backgroundColor: 'rgba(181, 20, 246, 0.1)',
    },
    pickerAvatar: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: '#2E2942',
    },
    personaPickerText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Utendo',
        flex: 1,
        fontWeight: '500',
    },
    emptyPickerText: {
        color: '#B8B8C5',
        fontSize: 13,
        fontFamily: 'Utendo',
        paddingVertical: 20,
        textAlign: 'center',
    },
    input: {
        backgroundColor: '#23232D',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3D2E6B',
        paddingHorizontal: 12,
        paddingVertical: 12,
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Utendo',
        marginBottom: 12,
    },
    charCount: {
        color: '#B8B8C5',
        fontSize: 11,
        fontFamily: 'Utendo',
        textAlign: 'right',
        marginTop: -8,
        marginBottom: 12,
    },
    submitButton: {
        backgroundColor: '#B514F6',
        borderRadius: 12,
        paddingVertical: 14,
        alignItems: 'center',
        marginTop: 20,
        marginBottom: 12,
    },
    submitButtonDisabled: {
        opacity: 0.5,
        backgroundColor: '#7a0d9f',
    },
    submitButtonText: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Utendo',
        fontWeight: '600',
    },
    cancelButton: {
        paddingVertical: 12,
        alignItems: 'center',
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#3D2E6B',
    },
    cancelButtonText: {
        color: '#B8B8C5',
        fontSize: 14,
        fontFamily: 'Utendo',
        fontWeight: '500',
    },
})
