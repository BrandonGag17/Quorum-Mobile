import React, { useEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  Image,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import CardJuntadasPasadas from "../../components/CardJuntadasPasadas";

import {
  IconBulbFilled,
  IconCalendarEventFilled,
} from "@tabler/icons-react-native";

import Ionicons from "@expo/vector-icons/Ionicons";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

import { useGroupDetail } from "../../hooks/useGroupDetail";
import GroupHeader from "../../components/GroupHeader";

import ErrorMessage from "../../components/MensajeError";
import Loading from "../../components/Loading";

export default function Grupo({ navigation }) {
  const route = useRoute();
  const { idGrupo } = route.params;

  const {
    group,
    memberCount,
    upcomingEvents,
    pastEvents,
    proposals,
    loading,
    error,
  } = useGroupDetail(idGrupo);

  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [mostrarJuntadasPasadas, setMostrarJuntadasPasadas] = useState(false);

  const translateY = useRef(new Animated.Value(500)).current;

  useEffect(() => {
    Animated.timing(translateY, {
      toValue: mostrarCrear ? 0 : 500,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [mostrarCrear, translateY]);

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessage mensaje={error} />;
  }

  const abrirCrear = () => {
    setMostrarCrear(true);
  };

  const cerrarCrear = () => {
    setMostrarCrear(false);
  };

  const irAProponer = () => {
    cerrarCrear();
    navigation.navigate("ProponerJuntada", { idGrupo });
  };

  const irACrearEvento = () => {
    cerrarCrear();
    navigation.navigate("CrearEvento", { idGrupo });
  };

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={[]}
        ListHeaderComponent={
          <>
            <GroupHeader
              group={group}
              memberCount={memberCount}
              onPress={() =>
                navigation.navigate("InfoGrupo", { idGrupo: group?.id })
              }
              avatarSize={50}
              compact={true}
            />

            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleContainer}>
                <Ionicons name="calendar" size={25} color="#FFFFFF" />

                <Text style={styles.sectionTitle}>Próximas juntadas</Text>
              </View>
            </View>

            {upcomingEvents.length > 0 ? (
              <FlatList
                horizontal
                data={upcomingEvents}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.eventCard}
                    onPress={() =>
                      navigation.navigate("Juntada", {
                        idEvento: item.id,
                      })
                    }
                  >
                    <Text style={styles.eventTitle}>{item.nombre}</Text>

                    <Text style={styles.eventDate}>
                      {item.fecha_hora_inicio
                        ? new Date(item.fecha_hora_inicio).toLocaleString()
                        : "Fecha no definida"}
                    </Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hay próximas juntadas</Text>
              </View>
            )}

            <View style={styles.sectionRow}>
              <View style={styles.sectionTitleContainer}>
                <MaterialCommunityIcons
                  name="lightbulb-variant"
                  size={25}
                  color="#FFFFFF"
                />

                <Text style={styles.sectionTitle}>Propuestas</Text>
              </View>

              <TouchableOpacity
                onPress={abrirCrear}
                style={styles.createButton}
              >
                <Text style={styles.createButtonText}>+ Crear</Text>
              </TouchableOpacity>
            </View>

            {proposals.length > 0 ? (
              <FlatList
                horizontal
                data={proposals}
                keyExtractor={(item) => item.id.toString()}
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.horizontalList}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.proposalCard}
                    onPress={() =>
                      navigation.navigate("Juntada", {
                        idEvento: item.evento?.id,
                      })
                    }
                  >
                    <Text style={styles.proposalTitle}>
                      {item.pregunta || item.evento?.nombre || "Propuesta"}
                    </Text>

                    <Text style={styles.proposalMeta}>Abierta para votar</Text>
                  </TouchableOpacity>
                )}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>
                  Aquí aparecerán las propuestas de juntada.
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={styles.pastToggle}
              onPress={() => setMostrarJuntadasPasadas(!mostrarJuntadasPasadas)}
            >
              <Text style={styles.pastToggleText}>
                {mostrarJuntadasPasadas
                  ? "Ocultar juntadas pasadas"
                  : "Ver juntadas pasadas"}
              </Text>

              <Ionicons
                name={mostrarJuntadasPasadas ? "chevron-up" : "chevron-down"}
                size={20}
                color="#57C7A3"
              />
            </TouchableOpacity>

            {mostrarJuntadasPasadas && (
              <>
                {pastEvents.length > 0 ? (
                  <FlatList
                    data={pastEvents}
                    keyExtractor={(item) => item.id.toString()}
                    scrollEnabled={false}
                    renderItem={({ item }) => (
                      <CardJuntadasPasadas evento={item} />
                    )}
                  />
                ) : (
                  <View style={styles.emptyState}>
                    <Text style={styles.emptyText}>
                      No hay juntadas pasadas.
                    </Text>
                  </View>
                )}
              </>
            )}

          </>
        }
        renderItem={null}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      />

      <Modal
        visible={mostrarCrear}
        transparent
        animationType="none"
        onRequestClose={cerrarCrear}
      >
        <Pressable style={styles.modalOverlay} onPress={cerrarCrear}>
          <Animated.View
            style={[
              styles.bottomSheet,
              {
                transform: [{ translateY }],
              },
            ]}
          >
            <Pressable onPress={() => { }}>
              <View style={styles.sheetHandle} />

              <Text style={styles.sheetTitle}>Crear</Text>

              <TouchableOpacity
                style={styles.sheetButton}
                onPress={irAProponer}
              >
                <View style={styles.sheetButtonContent}>
                  <IconBulbFilled size={35} color="#FFFFFF" />

                  <View style={styles.modalTexts}>
                    <Text style={styles.modalTitle}>Proponer juntada</Text>

                    <Text style={styles.modalSubtitle}>
                      El grupo vota fechas, lugares y más
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.sheetButton}
                onPress={irACrearEvento}
              >
                <View style={styles.sheetButtonContent}>
                  <IconCalendarEventFilled size={35} color="#FFFFFF" />

                  <View style={styles.modalTexts}>
                    <Text style={styles.modalTitle}>Crear evento</Text>

                    <Text style={styles.modalSubtitle}>
                      Sin votaciones, fecha, hora y lugares fijos
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>

            
              <TouchableOpacity
                onPress={cerrarCrear}
                style={styles.cancelButton}
              >
                <Text style={styles.cancelButtonText}>Cancelar</Text>
              </TouchableOpacity>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#15151C",
  },

  content: {
    paddingHorizontal: 25,
    paddingTop: 25,
    paddingBottom: 110,
  },

  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    backgroundColor: "#4A216F",
    borderRadius: 10,
    padding: 10,
  },

  avatar: {
    width: 52,
    height: 52,
    borderRadius: 26,
  },

  headerInfo: {
    marginLeft: 14,
  },

  groupName: {
    color: "#FFFFFF",
    fontSize: 21,
    fontFamily: "CashMarket",
  },

  memberCount: {
    color: "#9E9E9E",
    fontSize: 14,
    fontFamily: "Utendo",
    marginTop: 3,
  },

  sectionHeader: {
    marginBottom: 12,
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 12,
  },

  sectionTitleContainer: {
    flexDirection: "row",
    alignItems: "center",
  },

  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "CashMarket",
    marginLeft: 9,
  },

  horizontalList: {
    paddingRight: 10,
    paddingBottom: 5,
  },

  eventCard: {
    width: 220,
    backgroundColor: "#4A216F",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
  },

  eventTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "CashMarket",
  },

  eventDate: {
    color: "#D6D6D6",
    fontSize: 13,
    fontFamily: "Utendo",
    marginTop: 7,
  },

  proposalCard: {
    width: 220,
    backgroundColor: "#5C3E94",
    borderRadius: 16,
    padding: 16,
    marginRight: 12,
  },

  proposalTitle: {
    color: "#FFFFFF",
    fontSize: 17,
    fontFamily: "CashMarket",
  },

  proposalMeta: {
    color: "#D3D3D3",
    fontSize: 13,
    fontFamily: "Utendo",
    marginTop: 7,
  },

  createButton: {
    backgroundColor: "#57C7A3",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
  },

  createButtonText: {
    color: "#15151C",
    fontSize: 15,
    fontFamily: "CashMarket",
  },

  emptyState: {
    backgroundColor: "#5C3E94",
    borderRadius: 12,
    paddingVertical: 22,
    paddingHorizontal: 18,
    marginBottom: 10,
  },

  emptyText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontFamily: "CashMarket",
  },

  pastToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 22,
    marginBottom: 15,
    paddingVertical: 10,
  },

  pastToggleText: {
    color: "#57C7A3",
    fontFamily: "Utendo",
    fontSize: 15,
    marginRight: 7,
  },

  pastEvent: {
    backgroundColor: "#2C2C33",
    padding: 15,
    borderRadius: 12,
    marginBottom: 10,
  },

  pastTitle: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "CashMarket",
  },

  pastDate: {
    color: "#8E8E93",
    fontSize: 13,
    fontFamily: "Utendo",
    marginTop: 5,
  },

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.45)",
  },

  bottomSheet: {
    backgroundColor: "#23232D",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 35,
  },

  sheetHandle: {
    width: 50,
    height: 5,
    backgroundColor: "#666666",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 20,
  },

  sheetTitle: {
    color: "#FFFFFF",
    fontSize: 22,
    fontFamily: "CashMarket",
    marginBottom: 20,
  },

  sheetButton: {
    backgroundColor: "#4A216F",
    padding: 16,
    borderRadius: 14,
    marginBottom: 12,
  },

  sheetButtonDisabled: {
    backgroundColor: "#2E2E2E",
    opacity: 0.7,
  },

  sheetButtonContent: {
    flexDirection: "row",
    alignItems: "center",
  },

  modalTexts: {
    flex: 1,
    marginLeft: 12,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    marginBottom: 5,
    fontSize: 16,
  },

  modalSubtitle: {
    color: "#B6B6B6",
    fontFamily: "Utendo",
    fontSize: 13,
  },

  modalTitleDisabled: {
    color: "#727272",
    fontFamily: "CashMarket",
    marginBottom: 5,
    fontSize: 16,
  },

  modalSubtitleDisabled: {
    color: "#727272",
    fontFamily: "Utendo",
    fontSize: 13,
  },

  cancelButton: {
    alignItems: "center",
    paddingVertical: 10,
    marginTop: 3,
  },

  cancelButtonText: {
    color: "#FF7A7A",
    fontFamily: "Utendo",
    fontSize: 16,
  },
});
