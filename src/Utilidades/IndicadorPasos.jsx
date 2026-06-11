import { View, Text, StyleSheet } from 'react-native'
import Iconos from '../Utilidades/Iconos'
import { IconUserFilled } from '@tabler/icons-react-native'

function IndicadorPasos({
    pasoActual,
    totalPasos
}) {
    const porcentaje =
        (pasoActual / totalPasos) * 100

    return (
        <>
            <View style={styles.todo}>
                <View style={styles.tituloSeparador}>
                    <Iconos
                        size={36}
                        icono={<IconUserFilled size={25} color="#000000" />}
                    />

                    <View style={styles.textos}>
                        <Text style={styles.textoTitulo}>
                            Proponer juntada
                        </Text>

                        <Text style={styles.pasoTexto}>
                            Paso {pasoActual} de {totalPasos}
                        </Text>
                    </View>
                </View>

                <View style={styles.barraContainer}>
                    <View
                        style={[
                            styles.barraProgreso,
                            {
                                width: `${porcentaje}%`
                            }
                        ]}
                    />
                </View>
            </View>
        </>
    )
}

const styles = StyleSheet.create({
    todo: {
        marginTop: '7.5%',
    },
    container: {
        width: '100%',
        marginBottom: '5%',
    },
    textos: {
        marginLeft: 10,
    },
    pasoTexto: {
        color: '#A0A0A0',
        fontSize: 13,
        marginLeft: 10,
    },
    barraContainer: {
        width: '100%',
        height: 4,
        backgroundColor: '#2a2a3a',
        borderRadius: 999,
    },
    barraProgreso: {
        height: '100%',
        backgroundColor: '#7F4BC5',
        borderRadius: 999,
    },
    tituloSeparador: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 12
    },
    textoTitulo: {
        color: 'white',
        marginLeft: 10,
        fontFamily: 'CashMarket',
        fontSize: 20,
    },
})

export default IndicadorPasos