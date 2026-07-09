import React, { useState } from 'react'
import { View, Text, Pressable, StyleSheet, Modal, TouchableOpacity } from 'react-native'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import { useNavigation } from '@react-navigation/native'

function CardJuntadasPasadas({ evento }) {
    const navigation = useNavigation();
    const fecha = new Date(evento.fecha_hora_inicio);
    const fechaTexto = fecha.toLocaleDateString('es-AR');
    const horaTexto = fecha.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit',
    });
    const [mostrarModal, setMostrarModal] = useState(false);

    return (
        <>
            <View style={styles.card}>

                {/* CLICK EN CARD */}
                <Pressable
                    onPress={() =>
                        navigation.navigate('Juntada', {
                            idEvento: evento.id
                        })
                    }
                >
                    <Text style={styles.nombre}>
                        {evento.nombre}
                    </Text>

                    <View style={styles.filaSuperior}>
                        <View style={styles.fechaPill}>
                            <Text style={styles.textoInfo}>
                                {fechaTexto}
                            </Text>
                        </View>

                        <View style={styles.horaContainer}>
                            <MaterialCommunityIcons
                                name="clock"
                                size={11}
                                color="#57C7A3"
                            />

                            <Text style={styles.horaTexto}>
                                {horaTexto}
                            </Text>
                        </View>
                    </View>

                    <View style={styles.infoRow}>
                        <FontAwesome6
                            name="location-dot"
                            size={11}
                            color="#B6B6B6"
                        />

                        <Text style={styles.textoInfo}>
                            {evento.lugar || 'Sin ubicación'}
                        </Text>
                    </View>
                </Pressable>

                {/* BOTÓN SEPARADO (NO INTERFIERE) */}
                <Pressable
                    style={styles.botonRehacer}
                    onPress={() => setMostrarModal(true)}
                >
                    <Text style={styles.textoBoton}>
                        Rehacer juntada
                    </Text>
                </Pressable>

            </View>

            {/* MODAL */}
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
                                    eventoBase: evento
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
                                    eventoBase: evento
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
    );
}

const styles = StyleSheet.create({
    textoModalBoton: {
        color: '#FFFFFF',
        fontSize: 14,
        fontFamily: 'Utendo',
    },
    card: {
        backgroundColor: '#4A216F',

        borderRadius: 18,

        width: 220,

        paddingVertical: 16,
        paddingHorizontal: 14,

        marginTop: 10,
        marginBottom: 20,
        marginRight: 12,
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
    },

    nombre: {
        color: '#FFFFFF',
        fontSize: 20,
        fontFamily: 'CashMarket',
        marginBottom: 14,
    },

    infoRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },

    textoInfo: {
        color: '#C5C5C5',
        fontSize: 12,
        fontFamily: 'Utendo',

        marginLeft: 6,
    },

    horaTexto: {
        color: '#57C7A3',
        fontSize: 12,
        fontFamily: 'Utendo',
        marginLeft: 4,
    },
})

export default CardJuntadasPasadas