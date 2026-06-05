import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

function CardJuntadas({ evento, navigation }) {
    const fecha = evento.fecha_hora_inicio
        ? new Date(evento.fecha_hora_inicio)
        : null

    const fechaTexto = fecha
        ? fecha.toLocaleDateString('es-AR', {
            day: 'numeric',
            month: 'long'
        })
        : 'Sin fecha'

    const horaTexto = fecha
        ? fecha.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit'
        })
        : '--:--'

    return (
        <Pressable
            style={styles.card}
            onPress={() =>
                navigation.navigate(
                    'Juntada',
                    {
                        idEvento: evento.id
                    }
                )
            }
        >
            <View style={styles.filaFecha}>
                <FontAwesome6
                    name="calendar-day"
                    size={10}
                    color="#3F3F3F"
                />

                <Text style={styles.textoInfo}>
                    {fechaTexto}
                </Text>

                <MaterialCommunityIcons
                    name="clock"
                    size={10}
                    color="#3F3F3F"
                    style={{ marginLeft: 8 }}
                />

                <Text style={styles.textoInfo}>
                    {horaTexto}
                </Text>
            </View>

            <Text style={styles.nombre}>
                {evento.nombre}
            </Text>

            <View style={styles.filaInfo}>
                <FontAwesome6
                    name="users"
                    size={10}
                    color="#3F3F3F"
                />

                <Text
                    style={styles.textoInfo}
                    numberOfLines={1}
                >
                    {evento.grupo?.nombre || 'Sin grupo'}
                </Text>

                <FontAwesome6
                    name="location-dot"
                    size={10}
                    color="#3F3F3F"
                    style={{ marginLeft: 8 }}
                />

                <Text
                    style={styles.textoInfo}
                    numberOfLines={1}
                >
                    {evento.lugar || 'Sin ubicación'}
                </Text>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#57C7A3',
        borderRadius: 12,
        width: 200,
        paddingVertical: 15,
        paddingHorizontal: 15,
        marginBottom: 30,
        marginTop: 10,
        marginRight: 10,
    },

    filaFecha: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6,
    },

    filaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    nombre: {
        fontFamily: 'CashMarket',
        fontSize: 20,
        color: '#15151C',
        marginBottom: 6,
    },

    textoInfo: {
        fontFamily: 'Utendo',
        fontSize: 10,
        color: '#3F3F3F',
        marginLeft: 3,
        flexShrink: 1,
    },
})

export default CardJuntadas