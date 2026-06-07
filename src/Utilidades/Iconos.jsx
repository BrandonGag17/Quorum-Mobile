import { View, StyleSheet } from 'react-native'

function Iconos ({ icono, size }) {
    return (
        <View style={[styles.circulo, { width: size, height: size, borderRadius: size / 2 }]}>
            {icono}
        </View>
    )
}

const styles = StyleSheet.create({
    circulo: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#57C7A3',
    },
})

export default Iconos