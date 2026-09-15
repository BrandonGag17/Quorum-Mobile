import React from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

function CardJuntadas({ evento, navigation }) {
  const fecha = evento?.fecha_hora_inicio
    ? new Date(evento.fecha_hora_inicio)
    : null;

  const dia = fecha
    ? fecha.toLocaleDateString("es-AR", {
        day: "2-digit",
      })
    : "--";

  const mes = fecha
    ? fecha
        .toLocaleDateString("es-AR", {
          month: "short",
        })
        .replace(".", "")
        .toUpperCase()
    : "---";

  const horaTexto = fecha
    ? fecha.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";

  return (
    <Pressable
      style={({ pressed }) => [
        styles.card,
        pressed && styles.cardPressed,
      ]}
      onPress={() =>
        navigation.navigate("Juntada", {
          idEvento: evento.id,
        })
      }
    >
      <View style={styles.header}>
        <View style={styles.fechaContainer}>
          <View style={styles.fechaBox}>
            <Text style={styles.dia}>{dia}</Text>
            <Text style={styles.mes}>{mes}</Text>
          </View>

          <Text style={styles.hora}>{horaTexto}</Text>
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.infoRow}>
            <FontAwesome6
              name="users"
              size={12}
              color="#FFFFFF"
            />

            <Text
              style={styles.infoTexto}
              numberOfLines={1}
            >
              {evento?.grupo?.nombre || "Sin grupo"}
            </Text>
          </View>

          <View style={styles.infoRow}>
            <FontAwesome6
              name="location-dot"
              size={12}
              color="#FFFFFF"
            />

            <Text
              style={styles.infoTexto}
              numberOfLines={1}
            >
              {evento?.lugar || "Sin ubicación"}
            </Text>
          </View>
        </View>
      </View>

      <View style={styles.separador} />

      <Text
        style={styles.nombre}
        numberOfLines={2}
      >
        {evento?.nombre || "Juntada"}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    width: 245,
    height: 145,
    backgroundColor: "#5C3E94",
    borderRadius: 18,
    padding: 14,
    marginTop: 10,
    marginBottom: 15,
    marginRight: 12,

    shadowColor: "#000000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.28,
    shadowRadius: 6,
    elevation: 7,

    overflow: "hidden",
  },

  cardPressed: {
    opacity: 0.88,
    transform: [
      {
        scale: 0.98,
      },
    ],
  },

  header: {
    flexDirection: "row",
    alignItems: "flex-start",
  },

  fechaContainer: {
    width: 48,
    alignItems: "center",
  },

  fechaBox: {
    width: 48,
    height: 48,
    backgroundColor: "#3F2B63",
    borderRadius: 12,

    alignItems: "center",
    justifyContent: "center",

    marginBottom: 7,
  },

  dia: {
    color: "#FFFFFF",
    fontSize: 20,
    fontFamily: "CashMarket",
    lineHeight: 21,
  },

  mes: {
    color: "#5CC2A7",
    fontSize: 9,
    fontFamily: "Utendo",
    marginTop: 1,
  },

  hora: {
    color: "#5CC2A7",
    fontSize: 9,
    fontFamily: "Utendo",
  },

  infoContainer: {
    flex: 1,
    marginLeft: 15,
    paddingTop: 2,
    alignSelf: "center",
  },

  infoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    paddingRight: 5,
  },

  infoTexto: {
    flex: 1,
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Utendo",
    marginLeft: 7,
  },

  separador: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.18)",
    marginTop: 10,
    marginBottom: 10,
  },

  nombre: {
    color: "#FFFFFF",
    fontSize: 20,
    lineHeight: 23,
    fontFamily: "CashMarket",
    paddingRight: 5,
  },
});

export default CardJuntadas;