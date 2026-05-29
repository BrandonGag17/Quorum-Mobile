import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'

function Button({ nombre, view }) {

    const navigation = useNavigation()

    return (
        <TouchableOpacity onPress={() => navigation.navigate(view)}>
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
        margin: 10,
        backgroundColor: '#A846E9',
        borderRadius: 15
    }
})

export default Button