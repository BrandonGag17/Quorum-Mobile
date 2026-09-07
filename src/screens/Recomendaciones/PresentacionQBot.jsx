import React, { useRef } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

const EJEMPLOS = [
  'Restaurante elegante', 'Bar tranquilo', 'Café temático',
  'Boliche para bailar', 'Sala de juegos',
]

export default function PresentacionQBot({ mensaje, onChangeMensaje }) {
  const inputRef = useRef(null)

  function elegirEjemplo(ejemplo) {
    onChangeMensaje(ejemplo)
    inputRef.current?.focus()
  }

  return (
    <KeyboardAvoidingView style={styles.panel} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={styles.titulo}>Recomendaciones con IA</Text>
      <View style={styles.estrellas} accessible={false}>
        <Svg width={76} height={76} viewBox="0 0 76 76">
          <Path d="M29 5 L38 24 L57 33 L38 42 L29 61 L20 42 L1 33 L20 24 Z" fill="#5E3D91" />
          <Path d="M59 7 L62 13 L68 16 L62 19 L59 25 L56 19 L50 16 L56 13 Z" fill="#666FA1" />
          <Path d="M56 42 L60 51 L69 55 L60 59 L56 68 L52 59 L43 55 L52 51 Z" fill="#69A4AD" />
        </Svg>
      </View>
      <Text style={styles.pregunta}>¿A dónde querés ir?</Text>
      <Text style={styles.descripcion}>
        Soy Q-Bot, tu asistente para armar planes.
      </Text>
      <Text style={styles.descripcion}>
        Pronto vas a poder contarme qué lugar buscás y recibir recomendaciones según tus gustos y ubicación.
      </Text>
      <View style={styles.ejemplos}>
        {EJEMPLOS.map((ejemplo) => (
          <Pressable
            key={ejemplo}
            style={({ pressed }) => [styles.ejemplo, pressed && styles.ejemploPresionado]}
            onPress={() => elegirEjemplo(ejemplo)}
            accessibilityRole="button"
            accessibilityLabel={`Usar sugerencia: ${ejemplo}`}
            accessibilityHint="Completa el pedido para que puedas editarlo"
          >
            <Text style={styles.textoEjemplo}>{ejemplo}</Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.compositor}>
        <Text nativeID="pedido-qbot" style={styles.etiqueta}>Tu pedido para Q-Bot</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={mensaje}
          onChangeText={onChangeMensaje}
          placeholder="Por ejemplo, un bar tranquilo cerca"
          placeholderTextColor="#74747E"
          accessibilityLabel="Tu pedido para Q-Bot"
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
      </View>
      <Text style={styles.aviso}>Podés preparar tu pedido. El envío estará disponible próximamente.</Text>
    </ScrollView>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  panel: { flex: 1 },
  compositor: { width: '100%', marginTop: 28 },
  etiqueta: { color: '#FFFFFF', fontFamily: 'Utendo', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', color: '#15151C', borderRadius: 10, padding: 12, fontFamily: 'Utendo', fontSize: 16, minHeight: 52, maxHeight: 130 },
  ejemploPresionado: { opacity: 0.75 },
  contenido: { flexGrow: 1, alignItems: 'center', paddingBottom: 20 },
  titulo: { color: '#FFFFFF', fontFamily: 'CashMarket', fontSize: 24, textAlign: 'center' },
  estrellas: { marginTop: 18, marginBottom: 24 },
  pregunta: { color: '#FFFFFF', fontFamily: 'CashMarket', fontSize: 19, textAlign: 'center' },
  descripcion: { color: '#FFFFFF', fontFamily: 'Utendo', fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 14 },
  ejemplos: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 40 },
  ejemplo: { backgroundColor: '#5E3D91', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minHeight: 48, justifyContent: 'center' },
  textoEjemplo: { color: '#FFFFFF', fontFamily: 'Utendo', fontSize: 14, textAlign: 'center' },
  aviso: { color: '#BDBDC7', fontFamily: 'Utendo', fontSize: 13, textAlign: 'center', marginTop: 28 },
})
