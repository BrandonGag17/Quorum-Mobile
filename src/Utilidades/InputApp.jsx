import { View, Text, StyleSheet, TextInput } from 'react-native'

function InputApp({ label, placeholder, value, onChangeText, secureTextEntry = false, Icon, containerStyle }) {
    return (
        <View style={[styles.container, containerStyle]}>
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
        borderColor: '#979797',
        borderWidth: 2,
        backgroundColor: '#5D157E',
        padding: 15,
        color: 'white',
    }
})

export default InputApp