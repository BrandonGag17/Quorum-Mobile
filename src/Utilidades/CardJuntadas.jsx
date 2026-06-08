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
                    color="#c5c5c5"
                />

                <Text style={styles.textoInfo}>
                    {fechaTexto}
                </Text>

                <View style={styles.horaContainer}>
                    <MaterialCommunityIcons
                        name="clock"
                        size={10}
                        color="#c5c5c5"
                    />

                    <Text style={styles.textoInfo}>
                        {horaTexto}
                    </Text>
                </View>
            </View>

            <Text style={styles.nombre}>
                {evento.nombre}
            </Text>

            <View style={styles.filaInfo}>
                <FontAwesome6
                    name="users"
                    size={10}
                    color="#c5c5c5"
                />

                <Text style={styles.textoInfo}>
                    {evento.grupo?.nombre || 'Sin grupo'}
                </Text>

                <View style={styles.ubicacionContainer}>
                    <FontAwesome6
                        name="location-dot"
                        size={10}
                        color="#c5c5c5"
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
        borderRadius: 12,
        width: 210,
        paddingVertical: 15,
        paddingHorizontal: 12,
        marginBottom: 30,
        marginTop: 15,
        marginRight: 10,
        alignItems: 'flex-start',
    },
    filaFecha: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    filaInfo: {
        flexDirection: 'row',
        alignItems: 'center',
        width: '100%',
    },
    horaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
    },
    nombre: {
        fontFamily: 'CashMarket',
        fontSize: 18,
        color: 'white',
        marginBottom: 10,
        lineHeight: 22,
        marginTop: 10
    },
    textoInfo: {
        fontFamily: 'Utendo',
        fontSize: 12,
        color: '#c5c5c5',
        marginLeft: 3,
        marginTop: 3
    },
    ubicacionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 'auto',
    },

})

export default CardJuntadas