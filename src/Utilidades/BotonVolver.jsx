import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { IconCaretLeftFilled } from '@tabler/icons-react-native'
import Ionicons from '@expo/vector-icons/Ionicons'

const BotonVolver = ({ titulo = "Volver" }) => {
    const navigation = useNavigation();

    return (
        <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()} style={styles.botonVolver}>
            <Ionicons name="arrow-back" size={24} color="white" />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    botonVolver: {
        width: 42,
        height: 42,
        borderRadius: 21,
        justifyContent: 'center',
        alignItems: 'center',
    }
})

export default BotonVolver