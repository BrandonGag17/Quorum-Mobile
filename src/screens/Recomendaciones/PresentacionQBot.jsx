import React, { useEffect, useRef } from 'react'
import { ActivityIndicator, Alert, Keyboard, KeyboardAvoidingView, Linking, Platform, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'
import Svg, { Path } from 'react-native-svg'

const EJEMPLOS = [
  'Restaurante elegante', 'Bar tranquilo', 'Café temático',
  'Boliche para bailar', 'Sala de juegos',
]

export default function PresentacionQBot({ mensaje, onChangeMensaje, onEnviar, loading, error, resultado, onAbrirDetalle }) {
  const inputRef = useRef(null)
  const resultadosRef = useRef(null)
  const mostrarInicio = !resultado && !loading && !error
  useEffect(() => {
    if (resultado) resultadosRef.current?.scrollTo({ y: 0, animated: false })
  }, [resultado])

  function elegirEjemplo(ejemplo) {
    onChangeMensaje(ejemplo)
    inputRef.current?.focus()
  }

  async function abrirLugar(lugar) {
    if (lugar.origen !== 'web') return onAbrirDetalle(lugar)
    try { await Linking.openURL(lugar.fuenteUrl) } catch {
      Alert.alert('No pudimos abrir la fuente', 'Intentá nuevamente en unos momentos.')
    }
  }

  return (
    <KeyboardAvoidingView style={styles.panel} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
    <ScrollView
      ref={resultadosRef}
      style={styles.areaResultados}
      contentContainerStyle={styles.contenido}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      {mostrarInicio ? <>
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
        Contame qué lugar buscás. Podés indicar una zona o usar la localidad de tu perfil.
      </Text>
      <View style={styles.ejemplosIniciales}>
        {EJEMPLOS.map((ejemplo) => (
          <Pressable
            key={ejemplo}
            style={({ pressed }) => [styles.ejemploInicial, pressed && styles.ejemploPresionado]}
            onPress={() => elegirEjemplo(ejemplo)}
            accessibilityRole="button"
            accessibilityLabel={`Usar sugerencia: ${ejemplo}`}
            accessibilityHint="Completa el pedido para que puedas editarlo"
          >
            <Text style={styles.textoEjemplo}>{ejemplo}</Text>
          </Pressable>
        ))}
      </View>
      </> : null}
      {loading ? <Text style={styles.respuesta} accessibilityLiveRegion="polite">Buscando lugares para tu pedido…</Text> : null}
      {error ? <Text style={styles.error} accessibilityRole="alert">{error}</Text> : null}
      {resultado ? (
        <View style={styles.resultados}>
          <Text style={styles.etiqueta}>Tu búsqueda: {resultado.pedido}</Text>
          <Text style={styles.respuesta} accessibilityLiveRegion="polite">{resultado.mensaje}</Text>
          {resultado.lugares.map((lugar) => (
            <Pressable
              key={lugar.id}
              style={styles.lugar}
              onPress={() => abrirLugar(lugar)}
              accessibilityRole="button"
              accessibilityLabel={`${lugar.origen === 'web' ? 'Ver fuente de' : 'Ver detalle de'} ${lugar.nombre}`}
            >
              <Text style={styles.nombre}>{lugar.nombre}</Text>
              <Text style={styles.direccion}>{lugar.direccion}</Text>
              <Text style={styles.respuesta}>{lugar.motivo}</Text>
              <Text style={styles.verDetalle}>{lugar.origen === 'web' ? 'Ver fuente y reservas ↗' : 'Ver detalle →'}</Text>
            </Pressable>
          ))}
        </View>
      ) : null}
    </ScrollView>
    <View style={styles.controles}>
      {!mostrarInicio ? <ScrollView horizontal showsHorizontalScrollIndicator={false} keyboardShouldPersistTaps="handled" style={styles.carrusel} contentContainerStyle={styles.ejemplos}>
        {EJEMPLOS.map((ejemplo) => (
          <Pressable
            key={ejemplo}
            style={({ pressed }) => [styles.ejemplo, pressed && styles.ejemploPresionado]}
            onPress={() => elegirEjemplo(ejemplo)}
            disabled={loading}
            accessibilityRole="button"
            accessibilityLabel={`Usar sugerencia: ${ejemplo}`}
            accessibilityHint="Completa el pedido para que puedas editarlo"
          >
            <Text style={styles.textoSugerencia}>{ejemplo}</Text>
          </Pressable>
        ))}
      </ScrollView> : null}
      <View style={styles.compositor}>
        <Text nativeID="pedido-qbot" style={styles.etiqueta}>Tu pedido para Q-Bot</Text>
        <TextInput
          ref={inputRef}
          style={styles.input}
          value={mensaje}
          onChangeText={onChangeMensaje}
          editable={!loading}
          placeholder="Por ejemplo, un bar tranquilo cerca"
          placeholderTextColor="#74747E"
          accessibilityLabel="Tu pedido para Q-Bot"
          multiline
          maxLength={1000}
          textAlignVertical="top"
        />
      </View>
      <Pressable
        onPress={() => { Keyboard.dismiss(); onEnviar() }}
        disabled={loading || !mensaje.trim()}
        accessibilityRole="button"
        accessibilityState={{ disabled: loading || !mensaje.trim(), busy: loading }}
        style={[styles.enviar, (loading || !mensaje.trim()) && styles.deshabilitado]}
      >
        {loading ? <ActivityIndicator color="#FFFFFF" /> : null}
        <Text style={styles.textoEjemplo}>{loading ? 'Buscando lugares…' : error ? 'Reintentar búsqueda' : 'Buscar lugares'}</Text>
      </Pressable>
    </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  enviar: { backgroundColor: '#5E3D91', borderRadius: 10, minHeight: 48, padding: 14, marginTop: 16, width: '100%', flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 10 },
  deshabilitado: { opacity: 0.5 },
  error: { color: '#FFB4AB', fontFamily: 'Utendo', marginTop: 16 },
  resultados: { width: '100%' },
  respuesta: { color: '#FFFFFF', fontFamily: 'Utendo', fontSize: 15, lineHeight: 22 },
  lugar: { backgroundColor: '#373749', borderRadius: 12, padding: 16, marginTop: 14 },
  nombre: { color: '#FFFFFF', fontFamily: 'CashMarket', fontSize: 18, marginBottom: 6 },
  direccion: { color: '#BDBDC7', fontFamily: 'Utendo', marginBottom: 10 },
  verDetalle: { color: '#D9C4FF', fontFamily: 'Utendo', marginTop: 12 },
  panel: { flex: 1 },
  areaResultados: { flex: 1 },
  controles: { paddingTop: 10 },
  carrusel: { flexGrow: 0, marginBottom: 8 },
  compositor: { width: '100%' },
  etiqueta: { color: '#FFFFFF', fontFamily: 'Utendo', fontSize: 14, marginBottom: 8 },
  input: { backgroundColor: '#FFFFFF', color: '#15151C', borderRadius: 10, padding: 12, fontFamily: 'Utendo', fontSize: 16, minHeight: 52, maxHeight: 130 },
  ejemploPresionado: { opacity: 0.75 },
  contenido: { flexGrow: 1, alignItems: 'center', paddingBottom: 20 },
  titulo: { color: '#FFFFFF', fontFamily: 'CashMarket', fontSize: 24, textAlign: 'center' },
  estrellas: { marginTop: 18, marginBottom: 24 },
  pregunta: { color: '#FFFFFF', fontFamily: 'CashMarket', fontSize: 19, textAlign: 'center' },
  descripcion: { color: '#FFFFFF', fontFamily: 'Utendo', fontSize: 16, lineHeight: 23, textAlign: 'center', marginTop: 14 },
  ejemplos: { alignItems: 'center', gap: 8, paddingVertical: 2 },
  ejemplosIniciales: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 14, marginTop: 40 },
  ejemploInicial: { backgroundColor: '#5E3D91', borderRadius: 10, paddingHorizontal: 12, paddingVertical: 10, minHeight: 48, justifyContent: 'center' },
  ejemplo: { backgroundColor: '#5E3D91', borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  textoSugerencia: { color: '#FFFFFF', fontFamily: 'Utendo', fontSize: 12 },
  textoEjemplo: { color: '#FFFFFF', fontFamily: 'Utendo', fontSize: 14, textAlign: 'center' },
})
