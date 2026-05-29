import { useEffect, useState, useRef } from 'react'
import { useNavigation } from '@react-navigation/native'
import { StyleSheet, Text, View, Image, TouchableOpacity, Animated } from 'react-native'

function Button({ nombre, view }) {

    return (
        <TouchableOpacity onPress={() => navigation.navigate(view)}>
            <Text style={styles.botones}>{nombre}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    inicio: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        justifyContent: 'center'
    },
    logo: {
        width: 200,
        height: 200,
        resizeMode: 'contain',
        alignSelf: 'center'
    },
    titulo: {
        fontFamily: 'CashMarket',
        color: 'white',
        fontSize: 35,
        textAlign: 'center',
        marginBottom: 10
    },
    subtitulo: {
        fontFamily: 'Utendo',
        color: 'white',
        fontSize: 20,
        textAlign: 'center',
        marginBottom: 10
    },
    botones: {
        fontFamily: 'Utendo',
        textAlign: 'center',
        color: 'white',
        fontSize: 22.5,
        padding: 10,
        margin: 10,
        backgroundColor: '#A846E9',
        borderRadius: 15
    }
})

export default Button