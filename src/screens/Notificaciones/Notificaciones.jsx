import React, { useContext } from "react";
import { ThemeContext } from "../../context/ThemeContext";
import { View, Text, StyleSheet, SafeAreaView } from "react-native";

export default function Notificaciones() {
  // Leemos los colores compartidos por el ThemeProvider de App.js.
  const { colors } = useContext(ThemeContext);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <Text style={[styles.title, { color: colors.text }]}>Notificaciones</Text>
        <Text style={[styles.subtitle, { color: colors.text }]}>Pantalla en construcción</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    padding: 24,
    alignItems: "center",
    paddingBottom: 110,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    opacity: 0.7,
    fontSize: 16,
    textAlign: "center",
  },
});
