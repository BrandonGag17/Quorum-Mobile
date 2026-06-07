import React from 'react'
import { TouchableOpacity, Text, StyleSheet } from 'react-native'
import { useNavigation } from '@react-navigation/native'
import { IconCaretLeftFilled } from '@tabler/icons-react-native'

const BotonVolver = ({ titulo = "Volver" }) => {
    const navigation = useNavigation();

    return (
        <TouchableOpacity onPress={() => navigation.canGoBack() && navigation.goBack()} style={styles.botonVolver}>
            <IconCaretLeftFilled size={20} color={'white'} />
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    botonVolver: {
        width: 42,
        height: 42,
        borderRadius: 21,
        backgroundColor: '#23232D',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15,
    }
})

export default BotonVolver