import React from 'react'
import {
    Modal,
    Pressable,
    Text,
    TouchableOpacity,
    StyleSheet,
    View,
    TextInput,
    ScrollView,
    ActivityIndicator,
} from 'react-native'
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import Button from '../components/Botones'

export default function PopUpResena({
    visible,
    onClose,
    juntada,
    calificacion,
    setCalificacion,
    comentario,
    setComentario,
    onEnviar,
    loading,
    error,
}) {
    if (!juntada) return null

    const handleEnviar = () => {
        if (calificacion === 0) {
            alert('Por favor, selecciona una calificación')
            return
        }
        onEnviar(calificacion, comentario)
    }

    const renderEstrella = (index) => {
        const numero = index + 1
        const llena = numero <= calificacion

        return (
            <TouchableOpacity
                key={numero}
                onPress={() => setCalificacion(numero)}
                style={styles.estrella}
            >
                <MaterialCommunityIcons
                    name={llena ? 'star' : 'star-outline'}
                    size={40}
                    color={llena ? '#57C7A3' : '#7A7A8E'}
                />
            </TouchableOpacity>
        )
    }

    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable style={styles.modal} onPress={(e) => e.stopPropagation()}>
                    <TouchableOpacity
                        style={styles.closeButton}
                        onPress={onClose}
                        disabled={loading}
                    >
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>

                    <Text style={styles.titulo}>¡Ratea la juntada!</Text>

                    <ScrollView style={styles.contenido} scrollEnabled={false}>
                        <Text style={styles.nombreJuntada}>{juntada.nombre}</Text>

                        <View style={styles.contenedorEstrellas}>
                            {[0, 1, 2, 3, 4].map(renderEstrella)}
                        </View>

                        <Text style={styles.etiquetaComentario}>
                            ¿Queres dejar algún comentario?
                        </Text>
                        <TextInput
                            style={styles.inputComentario}
                            placeholder="Lo que quieras escribir"
                            placeholderTextColor="#7A7A8E"
                            value={comentario}
                            onChangeText={setComentario}
                            multiline
                            maxLength={200}
                            editable={!loading}
                        />
                        <Text style={styles.contadorCaracteres}>
                            {comentario.length}/200
                        </Text>

                        {error && <Text style={styles.error}>{error}</Text>}
                    </ScrollView>

                    <View style={styles.contenedorBotones}>
                        <View
                            style={[
                                styles.envolturaBoton,
                                (calificacion === 0 || loading) && styles.botonDeshabilitado,
                            ]}
                        >
                            <Button
                                nombre={loading ? 'Enviando...' : 'Enviar'}
                                onPress={handleEnviar}
                                disabled={loading || calificacion === 0}
                                backgroundColor="#57C7A3"
                            />
                        </View>
                    </View>
                </Pressable>
            </Pressable>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.6)',
        justifyContent: 'flex-end',
    },
    modal: {
        width: '100%',
        backgroundColor: '#3C3C4C',
        borderTopLeftRadius: 40,
        borderTopRightRadius: 40,
        borderBottomLeftRadius: 0,
        borderBottomRightRadius: 0,
        paddingTop: 24,
        paddingBottom: 10,
        paddingHorizontal: 24,
        maxHeight: '85%',
    },
    closeButton: {
        position: 'absolute',
        top: 28,
        right: 24,
        zIndex: 10,
    },
    closeText: {
        color: 'white',
        fontSize: 26,
        fontWeight: '300',
    },
    titulo: {
        color: 'white',
        fontFamily: 'CashMarket',
        fontSize: 18,
        textAlign: 'center',
        marginTop: 14,
        marginBottom: 20,
    },
    contenido: {
        marginBottom: 24,
        flexGrow: 0,
    },
    nombreJuntada: {
        fontFamily: 'CashMarket',
        color: '#fff',
        alignSelf: 'center',
        marginBottom: 10
    },
    contenedorEstrellas: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 10,
        gap: 4,
    },
    estrella: {
        padding: 2,
    },
    etiquetaComentario: {
        color: '#E0E0EA',
        fontSize: 12,
        marginBottom: 8,
        marginTop: 8,
    },
    inputComentario: {
        backgroundColor: '#343441',
        borderRadius: 12,
        padding: 10,
        color: 'white',
    },
    contadorCaracteres: {
        color: '#B8B8C6',
        fontFamily: 'Utendo',
        fontSize: 11,
        textAlign: 'right',
        marginTop: 10,
    },
    error: {
        color: '#FF6B6B',
        fontFamily: 'Utendo',
        fontSize: 12,
        marginTop: 18,
        textAlign: 'center',
    },
    contenedorBotones: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    envolturaBoton: {
        width: 200,
        marginTop: -10
    },
})