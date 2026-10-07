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

/**
 * Componente PopUp para reseñar una juntada
 */
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
            {/* Nombre de la juntada */}
            <Text style={styles.nombreJuntada}>{juntada.nombre}</Text>

            {/* Estrellas */}
            <View style={styles.contenedorEstrellas}>
              {[0, 1, 2, 3, 4].map(renderEstrella)}
            </View>

            {/* Mensaje bajo estrellas */}
            {calificacion > 0 && (
              <Text style={styles.mensajeCalificacion}>
                {calificacion === 1 && 'No me gustó 😢'}
                {calificacion === 2 && 'Estuvo mal'}
                {calificacion === 3 && 'Estuvo bien'}
                {calificacion === 4 && 'Me gustó mucho 😊'}
                {calificacion === 5 && '¡Excelente! 🎉'}
              </Text>
            )}

            {/* TextInput para comentario */}
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

            {/* Mensaje de error */}
            {error && <Text style={styles.error}>{error}</Text>}
          </ScrollView>

          {/* Botones de acción */}
          <View style={styles.contenedorBotones}>
            <TouchableOpacity
              style={[styles.boton, styles.botonSecundario]}
              onPress={onClose}
              disabled={loading}
            >
              <Text style={styles.textoBotonSecundario}>Saltar</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.boton,
                styles.botonPrimario,
                (calificacion === 0 || loading) && styles.botonDeshabilitado,
              ]}
              onPress={handleEnviar}
              disabled={loading || calificacion === 0}
            >
              {loading ? (
                <ActivityIndicator color="#23232D" size="small" />
              ) : (
                <Text style={styles.textoBotonPrimario}>Enviar</Text>
              )}
            </TouchableOpacity>
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
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    width: '100%',
    backgroundColor: '#23232D',
    borderRadius: 24,
    paddingVertical: 28,
    paddingHorizontal: 22,
    maxHeight: '85%',
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 16,
    zIndex: 10,
  },
  closeText: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
  },
  titulo: {
    color: 'white',
    fontSize: 20,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    marginTop: 16,
  },
  contenido: {
    marginBottom: 20,
  },
  nombreJuntada: {
    color: '#E0E0EA',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontStyle: 'italic',
  },
  contenedorEstrellas: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    gap: 10,
  },
  estrella: {
    padding: 4,
  },
  mensajeCalificacion: {
    color: '#57C7A3',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 24,
    fontWeight: '500',
  },
  etiquetaComentario: {
    color: '#E0E0EA',
    fontSize: 12,
    marginBottom: 8,
    marginTop: 8,
  },
  inputComentario: {
    backgroundColor: '#3A3A47',
    borderRadius: 12,
    padding: 12,
    color: 'white',
    minHeight: 80,
    textAlignVertical: 'top',
    fontSize: 13,
    borderWidth: 1,
    borderColor: '#4A4A5A',
  },
  contadorCaracteres: {
    color: '#7A7A8E',
    fontSize: 11,
    marginTop: 6,
    textAlign: 'right',
  },
  error: {
    color: '#FF6B6B',
    fontSize: 12,
    marginTop: 12,
    textAlign: 'center',
  },
  contenedorBotones: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 12,
  },
  boton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  botonPrimario: {
    backgroundColor: '#57C7A3',
  },
  botonSecundario: {
    backgroundColor: '#3A3A47',
    borderWidth: 1,
    borderColor: '#4A4A5A',
  },
  botonDeshabilitado: {
    backgroundColor: '#4A4A5A',
    opacity: 0.6,
  },
  textoBotonPrimario: {
    color: '#23232D',
    fontWeight: '600',
    fontSize: 14,
  },
  textoBotonSecundario: {
    color: '#E0E0EA',
    fontWeight: '600',
    fontSize: 14,
  },
})
