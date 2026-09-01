import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Modal, TouchableOpacity } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useNavigation } from '@react-navigation/native'
import CustomPopup from '../components/PopUp';

const formatearFecha = (fechaString) => {
    const fecha = new Date(fechaString);

    const meses = [
        'ENE', 'FEB', 'MAR', 'ABR', 'MAY', 'JUN',
        'JUL', 'AGO', 'SEP', 'OCT', 'NOV', 'DIC'
    ];

    return {
        dia: fecha.getDate(),
        mes: meses[fecha.getMonth()]
    };
};

function CardJuntadasPasadas({ evento }) {
    const navigation = useNavigation();
    const fecha = new Date(evento.fecha_hora_inicio);
    const { dia, mes } = formatearFecha(evento.fecha_hora_inicio);

    const horaTexto = fecha.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const [mostrarModal, setMostrarModal] = useState(false);

    return (
        <>
            <View style={styles.card}>
                <View style={styles.contenido}>

                    <View style={styles.fecha}>
                        <Text style={styles.textoDia}>{dia}</Text>
                        <Text style={styles.textoMes}>{mes}</Text>
                    </View>

                    <View style={styles.derecha}>
                        <Pressable
                            onPress={() =>
                                navigation.navigate("Juntada", {
                                    idEvento: evento.id,
                                })
                            }
                        >
                            <View style={styles.info}>
                                <Text style={styles.nombre}>
                                    {evento.nombre}
                                </Text>

                                <View style={styles.detalles}>

                                    <View style={styles.horaContainer}>
                                        <MaterialCommunityIcons
                                            name="clock"
                                            size={15}
                                            color="white"
                                        />
                                        <Text style={styles.horaTexto}>
                                            {horaTexto}
                                        </Text>
                                    </View>

                                    <View style={styles.infoRow}>
                                        <FontAwesome6
                                            name="location-dot"
                                            size={15}
                                            color="white"
                                        />
                                        <Text style={styles.textoInfo}>
                                            {evento.lugar || "Sin ubicación"}
                                        </Text>
                                    </View>

                                </View>
                            </View>
                        </Pressable>

                        <Pressable
                            style={styles.botonRehacer}
                            onPress={() => setMostrarModal(true)}
                        >
                            <Text style={styles.textoBoton}>
                                Rehacer juntada
                            </Text>
                        </Pressable>
                    </View>

                </View>
            </View>

            <CustomPopup
                visible={mostrarModal}
                onClose={() => setMostrarModal(false)}
                title="¿Cómo querés rehacer esta juntada?"
                option1={{
                    label: 'Volver a proponer',
                    onPress: () => {
                        setMostrarModal(false);
                        navigation.navigate('ProponerJuntada', {
                            idGrupo: evento.id_grupo,
                            eventoBase: evento,
                        });
                    },
                }}
                option2={{
                    label: 'Crear evento',
                    onPress: () => {
                        setMostrarModal(false);
                        navigation.navigate('CrearEvento', {
                            idGrupo: evento.id_grupo,
                            eventoBase: evento,
                        });
                    },
                }}
            />
        </>
    )
}
const styles = StyleSheet.create({
    textoModalBoton: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Utendo',
    },
    card: {
        width: 350,
        alignSelf: 'center',
        borderRadius: 28,
        borderWidth: 2,
        borderColor: "#57C7A3",
        backgroundColor: "#17171D",
        padding: 15,
        marginTop: 10,
    },
    contenido: {
        flexDirection: "row",
        alignItems: "stretch",
    },
    fecha: {
        width: 30,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 25,
    },
    derecha: {
        flex: 1,
    },
    filaSuperior: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 14,
    },
    filaInferior: {
        flexDirection: 'row',
        justifyContent: 'space-between',
    },

    horaContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginRight: 12,
    },
    nombre: {
        color: "white",
        fontSize: 22,
        fontFamily: "CashMarket",
        marginBottom: 8,
    },
    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    textoInfo: {
        color: 'white',
        fontSize: 13,
        fontFamily: 'Utendo',
        marginLeft: 5,
    },
    horaTexto: {
        color: 'white',
        fontSize: 13,
        fontFamily: 'Utendo',
        marginLeft: 5,
    },
    botonRehacer: {
        alignSelf: "flex-end",
        backgroundColor: "#66278F",
        borderRadius: 10,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginTop: 7
    },
    textoBoton: {
        color: 'white',
        fontFamily: 'Utendo',
        fontSize: 12
    },
    textoDia: {
        color: 'white',
        fontSize: 19,
        fontFamily: 'CashMarket',
    },
    textoMes: {
        color: '#B514F6',
        fontSize: 14,
        fontFamily: 'CashMarket',
        marginTop: -5,
    },
    info: {
        flex: 1,
    },
    detalles: {
        flexDirection: "row",
        alignItems: "center",
        flexWrap: "wrap",
    },
})

export default CardJuntadasPasadas  