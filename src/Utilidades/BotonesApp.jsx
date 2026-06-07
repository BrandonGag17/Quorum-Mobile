import { StyleSheet, Text, TouchableOpacity } from 'react-native'
import { useNavigation } from '@react-navigation/native'

function ButtonApp({ nombre, view, onPress }) {
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
        <TouchableOpacity
            onPress={handlePress}
            style={styles.botonContainer}
        >
            <Text style={styles.botones}>{nombre}</Text>
        </TouchableOpacity>
    )
}

const styles = StyleSheet.create({
    botones: {
        fontFamily: 'Utendo',
        textAlign: 'center',
        color: 'black',
        fontSize: 22.5,
        padding: 10,
        margin: 10,
        backgroundColor: '#57C7A3',
        borderRadius: 15,
        width: '100%',
        alignSelf: 'center',
    },
    botonContainer: {
        width: '100%',
    }
})

export default ButtonApp