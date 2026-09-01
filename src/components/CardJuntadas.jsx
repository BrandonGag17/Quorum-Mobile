import React from 'react'
import { View, Text, Pressable, StyleSheet } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

function CardJuntadas({ evento, navigation }) {
    const fecha = evento.fecha_hora_inicio
        ? new Date(evento.fecha_hora_inicio)
        : null

    const dia = fecha
        ? fecha.toLocaleDateString('es-AR', {
            day: '2-digit',
        })
        : '--'

    const mes = fecha
        ? fecha.toLocaleDateString('es-AR', {
            month: 'short',
        }).replace('.', '').toUpperCase()
        : '---'

    const horaTexto = fecha
        ? fecha.toLocaleTimeString('es-AR', {
            hour: '2-digit',
            minute: '2-digit',
        })
        : '--:--'

    return (
        <Pressable
            style={({ pressed }) => [
                styles.card,
                pressed && styles.cardPressed,
            ]}
            onPress={() =>
                navigation.navigate('Juntada', {
                    idEvento: evento.id,
                })
            }
        >
            {/* ENCABEZADO */}
            <View style={styles.header}>

                {/* FECHA + HORA */}
                <View style={styles.fechaContainer}>

                    <View style={styles.fechaBox}>
                        <Text style={styles.dia}>
                            {dia}
                        </Text>

                        <Text style={styles.mes}>
                            {mes}
                        </Text>
                    </View>


                        <Text style={styles.hora}>
                            {horaTexto}
                        </Text>

                </View>

                {/* GRUPO + LUGAR */}
                <View style={styles.infoContainer}>

                    <View style={styles.infoRow}>
                        <FontAwesome6
                            name="users"
                            size={12}
                            color="#BDBDC7"
                        />

                        <Text
                            style={styles.infoTexto}
                            numberOfLines={1}
                        >
                            {evento.grupo?.nombre || 'Sin grupo'}
                        </Text>
                    </View>

                    <View style={styles.infoRow}>
                        <FontAwesome6
                            name="location-dot"
                            size={12}
                            color="#BDBDC7"
                        />

                        <Text
                            style={styles.infoTexto}
                            numberOfLines={1}
                        >
                            {evento.lugar || 'Sin ubicación'}
                        </Text>
                    </View>

                </View>

            </View>

            {/* SEPARADOR */}
            <View style={styles.separador} />

            {/* NOMBRE */}
            <Text
                style={styles.nombre}
                numberOfLines={2}
            >
                {evento.nombre}
            </Text>

        </Pressable>
    )
}

const styles = StyleSheet.create({
    card: {
        width: 245,
        height: 160,
        backgroundColor: '#4A216F',
        borderRadius: 18,
        borderWidth: 1,
        borderColor: '#5A2A80',
        padding: 14,
        marginTop: 10,
        marginBottom: 15,
        marginRight: 12,
        shadowOpacity: 0.35,
        shadowRadius: 6,
        elevation: 7,

        overflow: 'hidden',
    },

    cardPressed: {
        opacity: 0.88,
        transform: [
            {
                scale: 0.98,
            },
        ],
    },

    header: {
        flexDirection: 'row',
        alignItems: 'flex-start',
    },

    /*
     * FECHA
     */
    fechaContainer: {
        width: 48,
        alignItems: 'center',
    },

    fechaBox: {
        width: 48,
        height: 48,

        backgroundColor: '#32184B',

        borderRadius: 12,

        alignItems: 'center',
        justifyContent: 'center',

        borderWidth: 1,
        borderColor: '#5E3280',
    },

    dia: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'CashMarket',

        lineHeight: 21,
    },

    mes: {
        color: '#57C7A3',
        fontSize: 9,
        fontFamily: 'Utendo',

        marginTop: 1,
    },

    /*
     * HORA
     */
    horaRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 6
    },

    hora: {
        color: '#57C7A3',
        fontSize: 10,
        fontFamily: 'Utendo',
        marginLeft: 4,
        marginBottom: 6
    },

    /*
     * GRUPO + LUGAR
     */
    infoContainer: {
        flex: 1,
        marginLeft: 15,
        paddingTop: 2,
        alignSelf: 'center',
        gap: 5
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',

        marginBottom: 8,

        paddingRight: 5,
    },

    infoTexto: {
        color: '#C4C2CA',

        fontSize: 11,
        fontFamily: 'Utendo',

        marginLeft: 7,

        flexShrink: 1,
    },

    /*
     * SEPARADOR
     */
    separador: {
        height: 1,

        backgroundColor: '#623487',

        marginTop: 13,
        marginBottom: 12,
    },

    /*
     * NOMBRE
     */
    nombre: {
        color: '#FFFFFF',

        fontSize: 20,
        lineHeight: 23,

        fontFamily: 'CashMarket',

        paddingRight: 5,

        marginBottom: 10,
    },
})

export default CardJuntadas