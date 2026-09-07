import React from 'react'
import { Pressable, StyleSheet, Text, View } from 'react-native'

const SECCIONES = [
  { id: 'actividades', nombre: 'Actividades' },
  { id: 'qbot', nombre: 'Q-Bot' },
  { id: 'lugares', nombre: 'Lugares' },
]

export default function SeccionesRecomendaciones({ seleccionada, onChange }) {
  return (
    <View style={styles.solapas} accessibilityRole="tablist">
      {SECCIONES.map(({ id, nombre }) => (
        <Pressable
          key={id}
          accessibilityRole="tab"
          accessibilityState={{ selected: seleccionada === id }}
          onPress={() => onChange(id)}
          style={styles.area}
        >
          <View style={[styles.solapa, seleccionada === id && styles.activa]}>
            <Text style={styles.texto}>{nombre}</Text>
          </View>
        </Pressable>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  solapas: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  area: { flex: 1, minHeight: 48, justifyContent: 'center' },
  solapa: {
    borderRadius: 20, borderWidth: 1, borderColor: '#96969F',
    backgroundColor: '#3B3D3F', paddingHorizontal: 8, paddingVertical: 7,
    alignItems: 'center',
  },
  activa: { backgroundColor: '#5E3D91', borderColor: '#5E3D91' },
  texto: { color: '#FFFFFF', fontFamily: 'Utendo', fontSize: 12 },
})
