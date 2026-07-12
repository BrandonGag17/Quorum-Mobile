import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Modal, TouchableOpacity } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useNavigation } from '@react-navigation/native'

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
                <Pressable
                    onPress={() =>
                        navigation.navigate("Juntada", {
                            idEvento: evento.id,
                        })
                    }
                >
                    <View style={styles.contenido}>

                        <View style={styles.fecha}>
                            <Text style={styles.textoDia}>{dia}</Text>
                            <Text style={styles.textoMes}>{mes}</Text>
                        </View>

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

            <Modal
                visible={mostrarModal}
                transparent
                animationType="fade"
                onRequestClose={() => setMostrarModal(false)}
            >
                <Pressable
                    style={styles.modalOverlay}
                    onPress={() => setMostrarModal(false)}
                >
                    <Pressable style={styles.modal}>
                        <Text style={styles.titulo}>
                            ¿Cómo querés rehacer esta juntada?
                        </Text>

                        <TouchableOpacity
                            style={styles.boton}
                            onPress={() => {
                                setMostrarModal(false);
                                navigation.navigate("ProponerJuntada", {
                                    idGrupo: evento.id_grupo,
                                    eventoBase: evento,
                                });
                            }}
                        >
                            <Text style={styles.textoModalBoton}>
                                Volver a proponer
                            </Text>
                        </TouchableOpacity>

                        <TouchableOpacity
                            style={styles.boton}
                            onPress={() => {
                                setMostrarModal(false);
                                navigation.navigate("CrearEvento", {
                                    idGrupo: evento.id_grupo,
                                    eventoBase: evento,
                                });
                            }}
                        >
                            <Text style={styles.textoModalBoton}>
                                Crear evento directamente
                            </Text>
                        </TouchableOpacity>

                    </Pressable>
                </Pressable>
            </Modal>
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
        width: 340,
        borderRadius: 28,
        borderWidth: 2,
        borderColor: "#57C7A3",
        backgroundColor: "#17171D",
        padding: 18,
        marginTop: 10,
    },
    contenido: {
        flexDirection: "row",
        alignItems: "center",
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

    fechaPill: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#2A2038',
        paddingHorizontal: 8,
        paddingVertical: 5,
        borderRadius: 999,
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
    },
    textoBoton: {
        color: 'white',
        fontFamily: 'Utendo',
        fontSize: 12
    },
    fecha: {
        width: 20,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
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