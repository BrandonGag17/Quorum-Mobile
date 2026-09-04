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
        fontFamily: 'CashMarket',
        textAlign: 'center',
        color: 'white',
        fontSize: 19,
        padding: 12,
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: '#5E2D82',
        borderRadius: 15,
        bottom: 60
    }
})

export default Button
