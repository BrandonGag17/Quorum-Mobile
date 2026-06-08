import { StyleSheet, Text, TouchableOpacity } from 'react-native'

function Button({ nombre, onPress, disabled = false }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
        >
            <Text style={styles.botones}>{nombre}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    botones: {
        fontFamily: 'Utendo',
        textAlign: 'center',
        color: 'white',
        fontSize: 22.5,
        padding: 10,
        backgroundColor: '#A846E9',
        borderRadius: 15
    }
})

export default Button