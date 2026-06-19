import { View, Text, StyleSheet } from 'react-native'

function Iconos({ icono, size, titulo }) {
    return (
        <View style={styles.tituloSeparador}>
            <View
                style={[
                    styles.circulo,
                    {
                        width: size,
                        height: size,
                        borderRadius: size / 2,
                    },
                ]}
            >
                {icono}
            </View>

            <Text style={styles.textoTitulo}>{titulo}</Text>
        </View>
    )
}

const styles = StyleSheet.create({
    tituloSeparador: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 10,
        marginBottom: 14,
    },
    textoTitulo: {
        color: 'white',
        marginLeft: 10,
        fontFamily: 'CashMarket',
        fontSize: 20,
        flex: 1
    },
    circulo: {
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: '#57C7A3',
    },
})

export default Iconos