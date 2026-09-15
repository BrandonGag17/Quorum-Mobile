import React, { useEffect, useLayoutEffect, useRef, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  Modal,
  Pressable,
  Animated,
} from "react-native";
import { useRoute } from "@react-navigation/native";

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
import CardJuntadas from "../../components/CardJuntadas";
import CardJuntadasPasadas from "../../components/CardJuntadasPasadas";

export default function Grupo({ navigation }) {
  const route = useRoute();
  const { idGrupo } = route.params;

  const {
    group,
    memberCount,
    upcomingEvents,
    pastEvents,
    loadPastEvents,
    loadingPastEvents,
    proposals,
    loading,
    error,
  } = useGroupDetail(idGrupo);

  const [mostrarCrear, setMostrarCrear] = useState(false);
  const [mostrarJuntadasPasadas, setMostrarJuntadasPasadas] = useState(false);

  const translateY = useRef(new Animated.Value(500)).current;

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle:
        loading || !group
          ? () => null
          : () => (
              <GroupHeader
                group={group}
                memberCount={memberCount}
                compact
                avatarSize={40}
                onPress={() =>
                  navigation.navigate("InfoGrupo", {
                    idGrupo,
                  })
                }
                containerStyle={styles.headerGroupTitle}
                contentStyle={styles.headerGroupContent}
                groupNameStyle={styles.headerGroupName}
                memberCountStyle={styles.headerGroupCount}
              />
            ),
      headerTitleAlign: "left",
      headerTitleContainerStyle: styles.headerTitleContainer,
      headerStyle: styles.headerStyle,
    });
  }, [navigation, group, memberCount, idGrupo, loading]);

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

    navigation.navigate("ProponerJuntada", {
      idGrupo,
    });
  };

  const irACrearEvento = () => {
    cerrarCrear();

    navigation.navigate("CrearEvento", {
      idGrupo,
    });
  };

  const obtenerFecha = (fecha) => {
    if (!fecha) {
      return {
        dia: "--",
        mes: "---",
        hora: "--:--",
      };
    }

    const fechaObjeto = new Date(fecha);

    return {
      dia: fechaObjeto.toLocaleDateString("es-AR", {
        day: "2-digit",
      }),

      mes: fechaObjeto
        .toLocaleDateString("es-AR", {
          month: "short",
        })
        .replace(".", "")
        .toUpperCase(),

      hora: fechaObjeto.toLocaleTimeString("es-AR", {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };
  };

  const renderPropuesta = ({ item }) => {
    const evento = item.evento;
    const fecha = obtenerFecha(evento?.fecha_hora_inicio);

    return (
      <TouchableOpacity
        activeOpacity={0.85}
        style={styles.proposalCard}
        onPress={() =>
          navigation.navigate("VotacionJuntada", {
            idEvento: evento?.id,
          })
        }
      >
        <View style={styles.proposalHeader}>
          <View style={styles.proposalHeaderLeft}>
            <View style={styles.proposalIcon}>
              <Ionicons name="bulb" size={17} color="#5CC2A7" />
            </View>

            <Text style={styles.proposalLabel}>PROPUESTA</Text>
          </View>

          <View style={styles.openBadge}>
            <View style={styles.openDot} />

            <Text style={styles.openText}>ABIERTA</Text>
          </View>
        </View>

        <Text style={styles.proposalTitle} numberOfLines={2}>
          {item.pregunta || evento?.nombre || "Propuesta de juntada"}
        </Text>

        <View style={styles.proposalSeparator} />

        <View style={styles.proposalFooter}>
          <View>
            <Text style={styles.voteTitle}>Tu opinión cuenta</Text>

            <Text style={styles.voteSubtitle}>
              Elegí las opciones de la juntada
            </Text>
          </View>

          <View style={styles.voteButton}>
            <Text style={styles.voteButtonText}>Votar</Text>

            <Ionicons name="arrow-forward" size={16} color="#15151C" />
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {upcomingEvents.length > 0 ? (
          <FlatList
            horizontal
            data={upcomingEvents}
            renderItem={({ item }) => (
              <CardJuntadas evento={item} navigation={navigation} />
            )}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventList}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="calendar-outline" size={22} color="#5CC2A7" />
            </View>

            <View style={styles.emptyContent}>
              <Text style={styles.emptyTitle}>No hay próximas juntadas</Text>

              <Text style={styles.emptyText}>
                Cuando creen una, aparecerá acá.
              </Text>
            </View>
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
            activeOpacity={0.8}
          >
            <Ionicons name="add" size={18} color="#15151C" />

            <Text style={styles.createButtonText}>Crear</Text>
          </TouchableOpacity>
        </View>

        {proposals.length > 0 ? (
          <FlatList
            horizontal
            data={proposals}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.horizontalList}
            renderItem={renderPropuesta}
          />
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.emptyIcon}>
              <Ionicons name="bulb-outline" size={22} color="#5CC2A7" />
            </View>

            <View style={styles.emptyContent}>
              <Text style={styles.emptyTitle}>No hay propuestas</Text>

              <Text style={styles.emptyText}>
                Acá aparecerán las próximas propuestas de juntada.
              </Text>
            </View>
          </View>
        )}
        <TouchableOpacity
          style={styles.pastToggle}
          activeOpacity={0.7}
          onPress={() => {
            const mostrar = !mostrarJuntadasPasadas;

            setMostrarJuntadasPasadas(mostrar);

            if (mostrar) {
              loadPastEvents();
            }
          }}
        >
          <View style={styles.pastToggleLeft}>
            <Ionicons name="time-outline" size={19} color="#8E8E99" />

            <Text style={styles.pastToggleText}>
              {mostrarJuntadasPasadas
                ? "Ocultar juntadas pasadas"
                : "Ver juntadas pasadas"}
            </Text>
          </View>

          <Ionicons
            name={mostrarJuntadasPasadas ? "chevron-up" : "chevron-down"}
            size={19}
            color="#5CC2A7"
          />
        </TouchableOpacity>

        {mostrarJuntadasPasadas && (
          <>
            {pastEvents.length > 0 ? (
              <FlatList
                data={pastEvents}
                keyExtractor={(item) => item.id.toString()}
                scrollEnabled={false}
                renderItem={({ item }) => <CardJuntadasPasadas evento={item} />}
              />
            ) : (
              <View style={styles.emptyState}>
                <Text style={styles.emptyText}>No hay juntadas pasadas.</Text>
              </View>
            )}
          </>
        )}
      </View>

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
            <Pressable onPress={() => {}}>
              <View style={styles.sheetHandle} />

              <Text style={styles.sheetTitle}>Crear</Text>

              {/* PROPONER */}
              <TouchableOpacity
                style={styles.sheetButton}
                onPress={irAProponer}
                activeOpacity={0.8}
              >
                <View style={styles.sheetIcon}>
                  <IconBulbFilled size={28} color="#5CC2A7" />
                </View>

                <View style={styles.modalTexts}>
                  <Text style={styles.modalTitle}>Proponer juntada</Text>

                  <Text style={styles.modalSubtitle}>
                    El grupo vota fechas, lugares y más
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#777782" />
              </TouchableOpacity>

              {/* CREAR EVENTO */}
              <TouchableOpacity
                style={styles.sheetButton}
                onPress={irACrearEvento}
                activeOpacity={0.8}
              >
                <View style={styles.sheetIcon}>
                  <IconCalendarEventFilled size={28} color="#5CC2A7" />
                </View>

                <View style={styles.modalTexts}>
                  <Text style={styles.modalTitle}>Crear evento</Text>

                  <Text style={styles.modalSubtitle}>
                    Sin votaciones, fecha, hora y lugar fijos
                  </Text>
                </View>

                <Ionicons name="chevron-forward" size={20} color="#777782" />
              </TouchableOpacity>

              {/* CANCELAR */}
              <TouchableOpacity
                onPress={cerrarCrear}
                style={styles.cancelButton}
                activeOpacity={0.7}
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
    paddingBottom: 25,
  },

  headerStyle: {
    backgroundColor: "#15151C",
    shadowColor: "transparent",
    elevation: 0,
  },

  headerTitleContainer: {
    flexGrow: 1,
    marginLeft: 0,
  },

  headerGroupTitle: {
    marginTop: 0,
    marginBottom: 0,
    padding: 0,
    flex: 1,
  },

  headerGroupContent: {
    marginLeft: 10,
  },

  headerGroupName: {
    fontSize: 17,
  },

  headerGroupCount: {
    fontSize: 11,
  },

  sectionRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 22,
    marginBottom: 13,
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
    letterSpacing: -0.3,
  },

  /* =====================================================
     CREAR
  ===================================================== */

  createButton: {
    height: 40,
    paddingHorizontal: 13,
    borderRadius: 12,
    backgroundColor: "#5CC2A7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  createButtonText: {
    color: "#15151C",
    fontSize: 14,
    fontFamily: "CashMarket",
    marginLeft: 3,
  },

  /* =====================================================
     JUNTADAS
  ===================================================== */

  eventList: {
    paddingRight: 10,
    paddingBottom: 2,
  },

  /* =====================================================
     PROPUESTAS
  ===================================================== */

  horizontalList: {
    paddingRight: 10,
    paddingBottom: 7,
  },

  proposalCard: {
    width: 245,
    minHeight: 100,
    backgroundColor: "#5C3E94",
    borderRadius: 20,
    padding: 16,
    marginRight: 15,

    borderWidth: 1,
    borderColor: "#6A4AA1",

    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.28,
    shadowRadius: 7,
    elevation: 6,
  },

  proposalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },

  proposalHeaderLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  proposalIcon: {
    width: 31,
    height: 31,
    borderRadius: 10,
    backgroundColor: "rgba(92, 194, 167, 0.14)",
    alignItems: "center",
    justifyContent: "center",
  },

  proposalLabel: {
    color: "#CFC5E8",
    fontFamily: "Utendo",
    fontSize: 10,
    fontWeight: "700",
    letterSpacing: 0.7,
    marginLeft: 8,
  },

  openBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "rgba(21, 21, 28, 0.28)",
    borderRadius: 20,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },

  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "#5CC2A7",
    marginRight: 5,
  },

  openText: {
    color: "#5CC2A7",
    fontFamily: "Utendo",
    fontSize: 9,
    fontWeight: "700",
  },

  proposalTitle: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    fontSize: 21,
    lineHeight: 25,
    minHeight: 50,
    letterSpacing: -0.3,
  },

  proposalSeparator: {
    height: 1,
    backgroundColor: "rgba(255, 255, 255, 0.14)",
    marginTop: 3,
    marginBottom: 11,
  },

  proposalFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },

  voteTitle: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    fontSize: 12,
  },

  voteSubtitle: {
    color: "#B9B0D0",
    fontFamily: "Utendo",
    fontSize: 9,
    marginTop: 2,
  },

  voteButton: {
    height: 34,
    paddingHorizontal: 11,
    borderRadius: 10,
    backgroundColor: "#5CC2A7",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },

  voteButtonText: {
    color: "#15151C",
    fontFamily: "CashMarket",
    fontSize: 12,
    marginRight: 5,
  },

  /* =====================================================
     EMPTY STATES
  ===================================================== */

  emptyState: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#202027",
    borderRadius: 16,
    padding: 15,
    borderWidth: 1,
    borderColor: "#30303A",
    marginBottom: 5,
  },

  emptyIcon: {
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(92, 194, 167, 0.10)",
    alignItems: "center",
    justifyContent: "center",
  },

  emptyContent: {
    flex: 1,
    marginLeft: 12,
  },

  emptyTitle: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    fontSize: 14,
  },

  emptyText: {
    color: "#8E8E99",
    fontFamily: "Utendo",
    fontSize: 11,
    lineHeight: 16,
    marginTop: 3,
  },

  /* =====================================================
     JUNTADAS PASADAS
  ===================================================== */

  pastToggle: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 21,
    marginBottom: 15,
    paddingVertical: 11,
    paddingHorizontal: 4,
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#292932",
  },

  pastToggleLeft: {
    flexDirection: "row",
    alignItems: "center",
  },

  pastToggleText: {
    color: "#A5A5B0",
    fontFamily: "Utendo",
    fontSize: 13,
    marginLeft: 8,
  },

  /* =====================================================
     MODAL
  ===================================================== */

  modalOverlay: {
    flex: 1,
    justifyContent: "flex-end",
    backgroundColor: "rgba(0, 0, 0, 0.52)",
  },

  bottomSheet: {
    backgroundColor: "#23232D",
    borderTopLeftRadius: 25,
    borderTopRightRadius: 25,
    padding: 25,
    paddingBottom: 35,
    borderTopWidth: 1,
    borderColor: "#34343F",
  },

  sheetHandle: {
    width: 45,
    height: 4,
    backgroundColor: "#555560",
    borderRadius: 10,
    alignSelf: "center",
    marginBottom: 21,
  },

  sheetTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontFamily: "CashMarket",
    marginBottom: 18,
  },

  sheetButton: {
    backgroundColor: "#2D2D37",
    padding: 14,
    borderRadius: 16,
    marginBottom: 10,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#383844",
  },

  sheetIcon: {
    width: 47,
    height: 47,
    borderRadius: 14,
    backgroundColor: "#3B3B47",
    alignItems: "center",
    justifyContent: "center",
  },

  modalTexts: {
    flex: 1,
    marginLeft: 12,
    marginRight: 8,
  },

  modalTitle: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    fontSize: 16,
    marginBottom: 4,
  },

  modalSubtitle: {
    color: "#9999A5",
    fontFamily: "Utendo",
    fontSize: 11,
    lineHeight: 16,
  },

  cancelButton: {
    alignItems: "center",
    paddingVertical: 12,
    marginTop: 2,
  },

  cancelButtonText: {
    color: "#8F8F9A",
    fontFamily: "Utendo",
    fontSize: 14,
  },
});
