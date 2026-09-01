import React from 'react'
import { View, Text, StyleSheet, SafeAreaView } from 'react-native'

export default function Exito() {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Exito</Text>
        <Text style={styles.subtitle}>Pantalla en construcción</Text>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15151C',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: 24,
    alignItems: 'center',
  },
  title: {
    color: '#FFFFFF',
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    color: '#B0B0B0',
    fontSize: 16,
    textAlign: 'center',
  },
})