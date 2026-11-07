import React, { useState } from "react";
import { View, Text, Pressable, StyleSheet } from "react-native";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import { useNavigation } from "@react-navigation/native";
import CustomPopup from "../components/PopUp";

function CardJuntadasPasadas({ evento }) {
  const navigation = useNavigation();
  const fecha = evento?.fecha_hora_inicio
    ? new Date(evento.fecha_hora_inicio)
    : null;
  const fechaValida = fecha && !Number.isNaN(fecha.getTime());
  const dia = fechaValida
    ? fecha.toLocaleDateString("es-AR", { day: "2-digit" })
    : "--";
  const mes = fechaValida
    ? fecha.toLocaleDateString("es-AR", { month: "short" })
        .replace(".", "")
        .toUpperCase()
    : "---";
  const fechaTexto = fechaValida
    ? fecha.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : "Fecha no disponible";
  const horaTexto = fechaValida
    ? fecha.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      })
    : "--:--";
  const nombreEvento = evento?.nombre || "Juntada";
  const nombreGrupo = evento?.grupo?.nombre || "Grupo";
  const lugar = evento?.lugar || "Sin ubicación";
  const [mostrarModal, setMostrarModal] = useState(false);

  return (
    <>
      <View style={styles.card}>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${nombreEvento}, ${nombreGrupo}, ${fechaTexto}, ${horaTexto}, ${lugar}`}
          onPress={() =>
            navigation.navigate("Juntada", {
              idEvento: evento.id,
            })
          }
          style={({ pressed }) => [
            styles.detalleEvento,
            pressed && styles.detalleEventoPresionado,
          ]}
        >
          <View style={styles.encabezado}>
            <View style={styles.fecha}>
              <Text style={styles.dia}>{dia}</Text>
              <Text style={styles.mes}>{mes}</Text>
            </View>

            <View style={styles.contenido}>
              <Text style={styles.nombre} numberOfLines={2}>
                {nombreEvento}
              </Text>
            </View>

            <FontAwesome6 name="chevron-right" size={13} color="#777782" />
          </View>

          <View style={styles.separador} />

          <View style={styles.detalles}>
            <View style={styles.horario}>
              <FontAwesome6 name="clock" size={12} color="#5CC2A7" />
              <Text style={styles.hora}>{horaTexto}</Text>
            </View>

            <View style={styles.ubicacion}>
              <FontAwesome6 name="location-dot" size={12} color="#A5A2AC" />
              <Text style={styles.lugar} numberOfLines={1}>
                {lugar}
              </Text>
            </View>
          </View>
        </Pressable>

        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`Rehacer ${nombreEvento}`}
          onPress={() => setMostrarModal(true)}
          style={({ pressed }) => [
            styles.botonRehacer,
            pressed && styles.botonRehacerPresionado,
          ]}
        >
          <FontAwesome6 name="rotate-right" size={13} color="#15151C" />
          <Text style={styles.textoBoton}>Rehacer juntada</Text>
          <FontAwesome6 name="arrow-right" size={12} color="#15151C" />
        </Pressable>
      </View>

      <CustomPopup
        visible={mostrarModal}
        onClose={() => setMostrarModal(false)}
        title="¿Cómo querés rehacer esta juntada?"
        option1={{
          label: "Volver a proponer",
          onPress: () => {
            setMostrarModal(false);
            navigation.navigate("ProponerJuntada", {
              idGrupo: evento.id_grupo,
              eventoBase: evento,
            });
          },
        }}
        option2={{
          label: "Crear evento",
          onPress: () => {
            setMostrarModal(false);
            navigation.navigate("CrearEvento", {
              idGrupo: evento.id_grupo,
              eventoBase: evento,
            });
          },
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  card: {
    width: "100%",
    alignSelf: "center",
    borderRadius: 20,
    borderWidth: 1,
    borderColor: "#353540",
    backgroundColor: "#202027",
    padding: 15,
    marginTop: 9,
    marginBottom: 5,
  },

  detalleEvento: {
    borderRadius: 12,
  },

  detalleEventoPresionado: {
    opacity: 0.78,
  },

  encabezado: {
    flexDirection: "row",
    alignItems: "center",
  },

  fecha: {
    width: 58,
    height: 62,
    borderRadius: 15,
    backgroundColor: "#5CC2A7",
    alignItems: "center",
    justifyContent: "center",
  },

  dia: {
    color: "#000",
    fontSize: 24,
    lineHeight: 27,
    fontFamily: "CashMarket",
  },

  mes: {
    color: "#000",
    fontSize: 10,
    letterSpacing: 0.5,
    fontWeight: 'bold',
    fontFamily: "Utendo",
    marginTop: 1,
  },

  contenido: {
    flex: 1,
    minWidth: 0,
    marginHorizontal: 12,
  },

  estado: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 5,
  },

  estadoPunto: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#777782",
    marginRight: 6,
  },

  estadoTexto: {
    color: "#A5A2AC",
    fontSize: 9,
    letterSpacing: 0.7,
    fontFamily: "Utendo",
  },

  nombre: {
    color: "#FFFFFF",
    fontSize: 18,
    lineHeight: 22,
    fontFamily: "CashMarket",
  },

  grupo: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 5,
  },

  textoGrupo: {
    flex: 1,
    color: "#B9B9C7",
    fontSize: 11,
    fontFamily: "Utendo",
    marginLeft: 6,
  },

  separador: {
    height: 1,
    backgroundColor: "#353540",
    marginTop: 13,
    marginBottom: 12,
  },

  detalles: {
    flexDirection: "row",
    alignItems: "center",
    minHeight: 32,
  },

  horario: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#293B37",
    borderRadius: 10,
    paddingHorizontal: 10,
    minHeight: 32,
    marginRight: 10,
  },

  hora: {
    color: "#FFFFFF",
    fontSize: 12,
    fontFamily: "Utendo",
    marginLeft: 6,
  },

  ubicacion: {
    flex: 1,
    minWidth: 0,
    flexDirection: "row",
    alignItems: "center",
  },

  lugar: {
    flex: 1,
    color: "#C3C1CA",
    fontSize: 12,
    fontFamily: "Utendo",
    marginLeft: 6,
  },

  botonRehacer: {
    minHeight: 40,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#5CC2A7",
    borderRadius: 12,
    paddingHorizontal: 12,
    marginTop: 13,
  },

  botonRehacerPresionado: {
    opacity: 0.8,
  },

  textoBoton: {
    color: "#15151C",
    fontSize: 13,
    fontFamily: "CashMarket",
    marginHorizontal: 8,
  },
});

export default CardJuntadasPasadas;
