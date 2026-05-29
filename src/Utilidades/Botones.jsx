import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'

function Button({ nombre, view, onPress }) {
    const navigation = useNavigation()

    const handlePress = () => {
        if (onPress) {
            onPress()
        }

        if (view) {
            navigation.navigate(view)
        }
    }
    return (
        <TouchableOpacity onPress={handlePress}>
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