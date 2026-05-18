import { TouchableOpacity, Text, StyleSheet } from 'react-native'

export default function CustomButton({ text, onPress, style, textStyle }) {
    return (
        <TouchableOpacity style={[styles.button, style]} onPress={onPress}>
            <Text style={[styles.text, textStyle]}>{text}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    button: {
        backgroundColor: '#0D0E2A',
        padding: 10,
        borderRadius: 8,
        alignItems: 'center',
        alignSelf: 'stretch'

    },
    text: {
        color: '#fff',
        fontSize: 16,
        fontFamily: 'Utendo'
    }
})