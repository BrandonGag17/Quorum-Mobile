import { StyleSheet, Text, TouchableOpacity } from 'react-native'

function Button({ nombre, onPress, disabled = false, backgroundColor }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            disabled={disabled}
        >
            <Text
                style={[
                    styles.botones,
                    backgroundColor && { backgroundColor }
                ]}
            >
                {nombre}
            </Text>
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
        borderRadius: 15
    }
})

export default Button
