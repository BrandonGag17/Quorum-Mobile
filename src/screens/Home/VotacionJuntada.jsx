import React, { useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Modal,
  Pressable,
  Platform,
  TextInput,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Octicons from "@expo/vector-icons/Octicons";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";

import GroupHeader from "../../components/GroupHeader";
import Loading from "../../components/Loading";
import ErrorMessage from "../../components/MensajeError";
import { useVotacionDetail } from "../../hooks/useVotacionDetail";
import InputApp from "../../components/Input";
import ButtonApp from "../../components/Botones";

const DateTimePicker =
  Platform.OS !== "web"
    ? require("@react-native-community/datetimepicker").default
    : null;

function OptionCard({ option, votes, selected, onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.option,
        selected && styles.optionSelected,
        disabled && styles.optionDisabled,
      ]}
    >
      <View style={styles.optionLeft}>
        <View style={styles.radio}>
          <Text style={styles.radioText}>{selected ? "◉" : "◯"}</Text>
        </View>

        <Text style={styles.optionText}>{option.descripcion}</Text>
      </View>

      <Text style={styles.votesText}>{votes ?? 0}</Text>
    </TouchableOpacity>
  );
}

export default function VotacionJuntada({ route, navigation }) {
  const eventId = route?.params?.idEvento;

  const {
    survey,
    event,
    groupMemberCount,
    voteCounts,
    myVotes,
    loading,
    actionLoading,
    error,
    categories,
    voteOption,
    suggestOption,
    suggestionLoading,
    isCreator,
  } = useVotacionDetail(eventId);

  const [suggestionType, setSuggestionType] = React.useState(null);
  const [placeSuggestion, setPlaceSuggestion] = React.useState("");
  const [dateSuggestion, setDateSuggestion] = React.useState("");
  const [webDateSuggestion, setWebDateSuggestion] = React.useState("");
  const [date, setDate] = React.useState(new Date());
  const [pickerMode, setPickerMode] = React.useState("date");
  const [showPicker, setShowPicker] = React.useState(false);
  const [suggestionError, setSuggestionError] = React.useState("");

  const totalVotes = useMemo(() => {
    return Object.values(voteCounts ?? {}).reduce(
      (acc, value) => acc + value,
      0,
    );
  }, [voteCounts]);

  const formatDate = (value) => {
    const day = value.getDate();
    const month = value.getMonth() + 1;
    const year = value.getFullYear();
    const hours = value.getHours();
    const minutes = value.getMinutes().toString().padStart(2, "0");

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  };

  const handleNativeDateChange = (event, selectedDate) => {
    if (event.type === "dismissed") {
      setShowPicker(false);
      setPickerMode("date");
      return;
    }

    const nextDate = selectedDate || date;
    setDate(nextDate);

    if (Platform.OS === "android" && pickerMode === "date") {
      setPickerMode("time");
      setShowPicker(true);
      return;
    }

    setShowPicker(false);
    setPickerMode("date");
    setDateSuggestion(formatDate(nextDate));
  };

  const openSuggestion = (type) => {
    setSuggestionType(type);
    setSuggestionError("");
    setPlaceSuggestion("");
    setDateSuggestion("");
    setWebDateSuggestion("");
    setDate(new Date());
  };

  const closeSuggestion = () => {
    if (suggestionLoading) {
      return;
    }

    setSuggestionType(null);
    setSuggestionError("");
    setShowPicker(false);
    setPickerMode("date");

  };

  const submitSuggestion = async () => {
    const description =
      suggestionType === "fecha"
        ? Platform.OS === "web" && webDateSuggestion
          ? (() => {
              const [datePart, timePart] = webDateSuggestion.split("T");
              const [year, month, day] = datePart.split("-");
              return `${Number(day)}/${Number(month)}/${year} ${timePart}`;
            })()
          : dateSuggestion
        : placeSuggestion.trim();

    if (!description) {
      setSuggestionError(
        suggestionType === "fecha"
          ? "Seleccioná una fecha y hora."
          : "Ingresá un lugar.",
      );
      return;
    }

    const { error: submitError } = await suggestOption({
      tipo: suggestionType,
      descripcion: description,
    });

    if (submitError) {
      setSuggestionError(
        submitError.message || "No se pudo guardar la sugerencia.",
      );
      return;
    }

    closeSuggestion();
  };

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pageContent}>
          <ErrorMessage mensaje={error} />
        </View>
      </SafeAreaView>
    );
  }

  if (!survey || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pageContent}>
          <Text style={styles.emptyText}>
            No hay votación disponible para este evento.
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.pageContent}
        showsVerticalScrollIndicator={false}
      >
        <GroupHeader
          group={event.grupo}
          memberCount={groupMemberCount}
          onPress={() =>
            navigation.navigate("InfoGrupo", { idGrupo: event.id_grupo })
          }
          avatarSize={52}
          compact
        />

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Octicons name="sparkles-fill" size={18} color="#FFFFFF" />
            <Text style={styles.heroTitle}>Votá tus preferencias</Text>
          </View>

          <Text style={styles.heroText}>
            Seleccioná las opciones que te convengan. Podés votar varias
            opciones por categoría.
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="checkmark-circle" size={14} color="#57C7A3" />
              <Text style={styles.metaText}>{totalVotes} votos</Text>
            </View>

            <View style={styles.metaPill}>
              <FontAwesome6 name="users" size={12} color="#57C7A3" />
              <Text style={styles.metaText}>{groupMemberCount} miembros</Text>
            </View>

            {isCreator ? (
              <View style={styles.metaPillAccent}>
                <Text style={styles.metaTextAccent}>Creador</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <Ionicons name="calendar" size={20} color="#FFFFFF" />
              <Text style={styles.sectionTitle}>Fecha y horario</Text>
            </View>
            <TouchableOpacity
              style={styles.suggestButton}
              onPress={(event) => {
                event.stopPropagation();
                openSuggestion("fecha");
              }}
              disabled={suggestionLoading}
            >
              <Text style={styles.suggestButtonText}>Sugerir</Text>
            </TouchableOpacity>
          </View>

          {categories.fechas.length > 0 ? (
            categories.fechas.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                votes={voteCounts[option.id]}
                selected={myVotes.includes(option.id)}
                onPress={() => voteOption(option.id)}
                disabled={actionLoading}
              />
            ))
          ) : (
            <Text style={styles.emptySectionText}>
              No hay opciones de fecha.
            </Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <View style={styles.sectionTitleGroup}>
              <FontAwesome6 name="location-dot" size={18} color="#FFFFFF" />
              <Text style={styles.sectionTitle}>Lugar</Text>
            </View>
            <TouchableOpacity
              style={styles.suggestButton}
              onPress={(event) => {
                event.stopPropagation();
                openSuggestion("lugar");
              }}
              disabled={suggestionLoading}
            >
              <Text style={styles.suggestButtonText}>Sugerir</Text>
            </TouchableOpacity>
          </View>

          {categories.lugares.length > 0 ? (
            categories.lugares.map((option) => (
              <OptionCard
                key={option.id}
                option={option}
                votes={voteCounts[option.id]}
                selected={myVotes.includes(option.id)}
                onPress={() => voteOption(option.id)}
                disabled={actionLoading}
              />
            ))
          ) : (
            <Text style={styles.emptySectionText}>
              No hay opciones de lugar.
            </Text>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={Boolean(suggestionType)}
        transparent
        animationType="fade"
        onRequestClose={closeSuggestion}
      >
        <View style={styles.modalOverlay}>
          <Pressable
            style={styles.suggestionModal}
            onPress={(event) => event.stopPropagation()}
          >
            <TouchableOpacity
              style={styles.closeButton}
              onPress={(event) => {
                event.stopPropagation();
                closeSuggestion();
              }}
              disabled={suggestionLoading}
            >
              <Text style={styles.closeText}>✕</Text>
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.modalContent}
            >
              <Text style={styles.modalTitle}>
                Sugerir{" "}
                {suggestionType === "fecha" ? "fecha y horario" : "lugar"}
              </Text>

              <Text style={styles.modalDescription}>
                Agregá una opción para que el grupo pueda votarla.
              </Text>

              {suggestionType === "fecha" ? (
                <>
                  {Platform.OS === "web" ? (
                    <input
                      type="datetime-local"
                      value={webDateSuggestion}
                      onChange={(event) =>
                        setWebDateSuggestion(event.target.value)
                      }
                      style={styles.datetimeInput}
                    />
                  ) : (
                    <>
                      <TextInput
                        value={dateSuggestion}
                        onChangeText={setDateSuggestion}
                        style={styles.datetimeInput}
                        placeholder="Ej: 01/07/2026 22:26"
                        placeholderTextColor="#888"
                      />

                      <Pressable
                        style={styles.selector}
                        onPress={() => {
                          setPickerMode("date");
                          setShowPicker(true);
                        }}
                      >
                        <Text style={styles.selectorText}>
                          Seleccionar fecha y hora
                        </Text>
                      </Pressable>
                    </>
                  )}

                  {showPicker && DateTimePicker ? (
                    <DateTimePicker
                      value={date}
                      mode={Platform.OS === "ios" ? "datetime" : pickerMode}
                      is24Hour
                      onChange={handleNativeDateChange}
                    />
                  ) : null}
                </>
              ) : (
                <InputApp
                  value={placeSuggestion}
                  onChangeText={setPlaceSuggestion}
                  placeholder="Ej: Palermo, Parque Centenario..."
                />
              )}

              {suggestionError ? (
                <Text style={styles.suggestionError}>{suggestionError}</Text>
              ) : null}

              <ButtonApp
                nombre={
                  suggestionLoading ? "Guardando..." : "Agregar sugerencia"
                }
                onPress={submitSuggestion}
                disabled={suggestionLoading}
                backgroundColor="#57C7A3"
              />
            </ScrollView>
          </Pressable>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#15151C",
  },
  pageContent: {
    padding: 20,
    paddingBottom: 110,
  },
  emptyText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontFamily: "Utendo",
    textAlign: "center",
    marginTop: 20,
  },
  emptySectionText: {
    color: "#B8B8C5",
    fontFamily: "Utendo",
    fontSize: 13,
    paddingVertical: 8,
  },
  heroCard: {
    backgroundColor: "#4A216F",
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    marginTop: 20,
    borderWidth: 1,
    borderColor: "#5E2D82",
  },
  heroTopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  heroTitle: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    fontSize: 18,
  },
  heroText: {
    color: "#E6DFF2",
    fontFamily: "Utendo",
    fontSize: 13,
    lineHeight: 19,
  },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginTop: 14,
  },
  metaPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "#2A2038",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaPillAccent: {
    backgroundColor: "#57C7A3",
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  metaText: {
    color: "#FFFFFF",
    fontFamily: "Utendo",
    fontSize: 12,
  },
  metaTextAccent: {
    color: "#111111",
    fontFamily: "Utendo",
    fontSize: 12,
    fontWeight: "700",
  },
  card: {
    borderWidth: 1,
    borderColor: "#3D2E6B",
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    backgroundColor: "#11111A",
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  sectionTitleGroup: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    flex: 1,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 18,
    fontFamily: "CashMarket",
  },
  suggestButton: {
    backgroundColor: "#57C7A3",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },
  suggestButtonText: {
    color: "#111111",
    fontFamily: "CashMarket",
    fontSize: 12,
  },
  option: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#151520",
    borderWidth: 1,
    borderColor: "#2F1B3D",
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
  },
  optionSelected: {
    backgroundColor: "rgba(87, 199, 163, 0.14)",
    borderColor: "#57C7A3",
  },
  optionDisabled: {
    opacity: 0.75,
  },
  optionLeft: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingRight: 10,
  },
  radio: {
    width: 22,
    alignItems: "center",
  },
  radioText: {
    color: "#FFFFFF",
    fontSize: 16,
  },
  optionText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "Utendo",
    flex: 1,
  },
  votesText: {
    color: "#FFFFFF",
    fontSize: 13,
    fontFamily: "Utendo",
    backgroundColor: "#58386f",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: "hidden",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  suggestionModal: {
    width: "100%",
    maxHeight: "85%",
    backgroundColor: "#23232D",
    borderRadius: 24,
    paddingHorizontal: 22,
    position: "relative",
  },
  modalContent: {
    paddingTop: 48,
    paddingBottom: 18,
  },
  closeButton: {
    position: "absolute",
    top: 12,
    right: 16,
    zIndex: 2,
  },
  closeText: {
    color: "#FFFFFF",
    fontSize: 22,
    fontWeight: "bold",
  },
  modalTitle: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    fontSize: 21,
    textAlign: "center",
    marginBottom: 10,
  },
  modalDescription: {
    color: "#B9B9C7",
    fontFamily: "Utendo",
    fontSize: 14,
    lineHeight: 20,
    textAlign: "center",
    marginBottom: 22,
  },
  datetimeInput: {
    width: "100%",
    height: 52,
    borderRadius: 15,
    border: "2px solid #57575C",
    backgroundColor: "#36363A",
    paddingHorizontal: 15,
    color: "#888",
    fontFamily: "Utendo",
    fontSize: 15,
    outlineStyle: "none",
    appearance: "none",
    WebkitAppearance: "none",
    boxShadow: "none",
    boxSizing: "border-box",
    colorScheme: "dark",
    marginBottom: 12,
    paddingLeft: 10,
    paddingRight: 10
  },
  selector: {
    borderRadius: 15,
    borderWidth: 2,
    borderColor: "#57575C",
    backgroundColor: "#36363A",
    padding: 15,
    marginBottom: 12,
  },
  selectorText: {
    color: "#FFFFFF",
    fontFamily: "Utendo",
    fontSize: 15,
  },
  suggestionError: {
    color: "#FF8F8F",
    fontFamily: "Utendo",
    fontSize: 13,
    textAlign: "center",
    marginBottom: 8,
  },
});
