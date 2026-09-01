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
        backgroundColor: '#A846E9',
        borderRadius: 15
    }
})

export default Button
