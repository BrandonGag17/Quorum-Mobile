import { StyleSheet, Text, View, ActivityIndicator } from "react-native";

export default function Loading() {
  return (
    <View style={styles.center}>
      <ActivityIndicator size="large" color="#A846E9" />
      <Text style={styles.loadingText}>Cargando...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#15151C",
    justifyContent: "center",
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#FFFFFF",
    fontFamily: "Utendo",
    fontSize: 20
  },
});
