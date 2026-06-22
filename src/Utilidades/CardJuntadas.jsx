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
            <View style={styles.filaSuperior}>
                <View style={styles.fechaPill}>
                    <FontAwesome6
                        name="calendar-day"
                        size={10}
                        color="#CFCFCF"
                    />

                    <Text style={styles.textoInfo}>
                        {fechaTexto}
                    </Text>
                </View>

                <View style={styles.horaContainer}>
                    <MaterialCommunityIcons
                        name="clock"
                        size={11}
                        color="#57C7A3"
                    />

                    <Text style={styles.horaTexto}>
                        {horaTexto}
                    </Text>
                </View>
            </View>

            <Text style={styles.nombre}>
                {evento.nombre}
            </Text>

            <View style={styles.filaInferior}>
                <View style={styles.infoRow}>
                    <FontAwesome6
                        name="users"
                        size={11}
                        color="#B6B6B6"
                    />

                    <Text style={styles.textoInfo}>
                        {evento.grupo?.nombre || 'Sin grupo'}
                    </Text>
                </View>

                <View style={styles.infoRow}>
                    <FontAwesome6
                        name="location-dot"
                        size={11}
                        color="#B6B6B6"
                    />

                    <Text style={styles.textoInfo}>
                        {evento.lugar || 'Sin ubicación'}
                    </Text>
                </View>
            </View>
        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: '#4A216F',

        borderRadius: 18,

        width: 220,

        paddingVertical: 16,
        paddingHorizontal: 14,

        marginTop: 10,
        marginBottom: 20,
        marginRight: 12,
    },

    filaSuperior: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    filaInferior: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    fechaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2038',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 999,
    },

    horaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },

    nombre: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'CashMarket',
        marginBottom: 14,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    textoInfo: {
        color: '#C5C5C5',
        fontSize: 12,
        fontFamily: 'Utendo',

        marginLeft: 6,
    },

    horaTexto: {
        color: '#57C7A3',
        fontSize: 12,
        fontFamily: 'Utendo',
        marginLeft: 4,
    },
})

export default CardJuntadas