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
        fontSize: 17,
        padding: 10,
        marginTop: 10,
        marginBottom: 10,
        backgroundColor: '#5E2D82',
        borderRadius: 15,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 5,
        },
        shadowOpacity: 0.35,
        shadowRadius: 5,
        elevation: 6,
    }
})

export default Button
