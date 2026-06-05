import React from 'react'
import { View, Text, ScrollView, StyleSheet } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'

const juntadas = [
    {
        id: 1,
        fecha: '17 de Abril',
        hora: '07:00 PM',
        nombre: 'Cumple de Cata',
        grupo: 'Panaderos 🍞✏️',
        lugar: 'Casa de Cata',
    },
    {
        id: 2,
        fecha: '17 de Abril',
        hora: '07:00 PM',
        nombre: 'Cumple de Cata',
        grupo: 'Panaderos 🍞✏️',
        lugar: 'Casa de Cata',
    },
]

function HarcodeoCards() {
    return (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.scroll}>
            {juntadas.map((j) => (
                <View key={j.id} style={styles.card}>

                    <View style={styles.filaFecha}>
                        <FontAwesome6 name="calendar-day" size={10} color="#3F3F3F"/>
                        <Text style={styles.textoInfo}> {j.fecha} </Text>
                        <MaterialCommunityIcons name="clock" size={10} color="#3F3F3F" style={{ marginLeft: 8 }}/>
                        <Text style={styles.textoInfo}>{j.hora}</Text>
                    </View>

                    <Text style={styles.nombre}>{j.nombre}</Text>

                    <View style={styles.filaInfo}>
                        <FontAwesome6 name="users" size={10} color="#3F3F3F" />
                        <Text style={styles.textoInfo} numberOfLines={1} >{j.grupo} </Text>
                        <FontAwesome6 name="location-dot" size={10} color="#3F3F3F" style={{ marginLeft: 8 }}/>
                        <Text style={styles.textoInfo} numberOfLines={1}> {j.lugar} </Text>
                    </View>

                </View>
            ))}
        </ScrollView>
    )
}

const styles = StyleSheet.create({
    scroll: {
        gap: 10,
        paddingBottom: 0,
    },

    card: {
        backgroundColor: '#57C7A3',
        borderRadius: 12,
        width: 200,
        paddingVertical: 15,
        paddingHorizontal: 15,
        marginBottom: 30,
        marginTop: 10
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

export default HarcodeoCards