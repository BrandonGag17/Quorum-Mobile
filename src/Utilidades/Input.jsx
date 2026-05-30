import { View, Text, StyleSheet, TextInput } from 'react-native'

function Input({
    label,
    placeholder,
    value,
    onChangeText,
    secureTextEntry = false,
    Icon
}) {
    return (
        <View style={styles.container}>
            <View style={styles.iconoTexto}>
                {Icon && <Icon color="#FFFFFF" size={28} />}
                <Text style={styles.texto}>{label}</Text>
            </View>

            <TextInput
                style={styles.input}
                placeholder={placeholder}
                placeholderTextColor="#888"
                value={value}
                onChangeText={onChangeText}
                secureTextEntry={secureTextEntry}
            />
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 20,
    },

    iconoTexto: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        marginBottom: 10,
    },

    texto: {
        color: 'white',
        fontFamily: 'Utendo',
        fontSize: 20,
    },

    input: {
        borderRadius: 15,
        borderColor: '#4F4F55',
        borderWidth: 2,
        backgroundColor: '#2A2A2E',
        padding: 15,
        color: 'white',
    }
})

export default Input