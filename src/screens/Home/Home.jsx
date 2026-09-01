import React, { useCallback } from "react";
import {
  SafeAreaView,
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  StyleSheet,
  Modal,
} from "react-native";
import Feather from "@expo/vector-icons/Feather";
import Ionicons from "@expo/vector-icons/Ionicons";
import { IconUserFilled } from "@tabler/icons-react-native";
import {
  useNavigation,
  useFocusEffect,
  useRoute,
} from "@react-navigation/native";

import { useHomeSummary } from "../../hooks/useHome";
import CrearGrupo from "./CrearGrupo";
import ErrorMessage from "../../components/MensajeError";
import Loading from "../../components/Loading";
import CardJuntadas from "../../components/CardJuntadas";

export default function Home() {
  const { groups, events, loading, error, refresh } = useHomeSummary();
  const [busqueda, setBusqueda] = React.useState("");
  const [mostrarModal, setMostrarModal] = React.useState(false);

  const navigation = useNavigation();

  const route = useRoute();

  useFocusEffect(
    useCallback(() => {
      if (route?.params?.refresh) {
        refresh();
        navigation.setParams({ refresh: undefined });
      }
    }, [route?.params?.refresh]),
  );

  const gruposFiltrados = groups.filter((group) =>
    group.grupo?.nombre?.toLowerCase().includes(busqueda.toLowerCase()),
  );

  const renderGrupo = ({ item }) => (
    <TouchableOpacity
      style={styles.grupoCard}
      onPress={() => navigation.navigate("Grupo", { idGrupo: item.id_grupo })}
    >
      <Image
        source={{ uri: item.grupo?.foto_perfil }}
        style={styles.grupoImagen}
      />

      <View style={styles.grupoInfo}>
        <Text style={styles.grupoNombre}>{item.grupo?.nombre}</Text>
        <Text style={styles.grupoIntegrantes}>
          {item.integrantes || "Grupo"}
        </Text>
      </View>

      <Text style={styles.grupoFlecha}>›</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return <Loading />;
  }

  if (error) {
    return <ErrorMessage mensaje={error} />;
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.title}>Quórum</Text>

        <View style={styles.searchBox}>
          <Feather name="search" size={20} color="#A0A0A0" />
          <TextInput
            value={busqueda}
            onChangeText={setBusqueda}
            placeholder="Buscar grupos"
            placeholderTextColor="#A0A0A0"
            style={styles.searchInput}
          />
        </View>

        <View style={styles.sectionHeader}>
          <View style={styles.sectionTitleWrap}>
            <Ionicons name="calendar" size={25} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Próximas juntadas</Text>
          </View>
        </View>

        {events.length > 0 ? (
          <FlatList
            horizontal
            data={events}
            renderItem={({ item }) => (
              <CardJuntadas
                evento={item}
                navigation={navigation}
              />
            )}
            keyExtractor={(item) => item.id.toString()}
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.eventList}
          />

        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No tenés próximas juntadas</Text>
          </View>
        )}

        <View style={styles.sectionHeaderRow}>
          <View style={styles.sectionTitleWrap}>
            <IconUserFilled size={25} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Grupos</Text>
          </View>

          <TouchableOpacity
            style={styles.createButton}
            onPress={() => setMostrarModal(true)}
          >
            <Text style={styles.createButtonText}>+ Crear</Text>
          </TouchableOpacity>
        </View>

        {gruposFiltrados.length > 0 ? (
          <FlatList
            scrollEnabled={false}
            data={gruposFiltrados}
            renderItem={renderGrupo}
            keyExtractor={(item) => item.id_grupo.toString()}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              Todavía no formás parte de ningún grupo
            </Text>
          </View>
        )}

        {mostrarModal && (
          <Modal
            visible={mostrarModal}
            transparent
            animationType="fade"
            onRequestClose={() => setMostrarModal(false)}
          >
            <View style={styles.modalOverlay}>
              <View style={styles.modal}>
                <View style={styles.modalHeader}>
                  <Text style={styles.modalTitulo}>Crear grupo</Text>
                  <TouchableOpacity onPress={() => setMostrarModal(false)}>
                    <Feather name="x" size={24} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>

                <CrearGrupo
                  onGrupoCreado={() => {
                    setMostrarModal(false);
                    refresh();
                  }}
                />
              </View>
            </View>
          </Modal>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#15151C",
    paddingHorizontal: 20,
    paddingTop: 25,
    paddingRight: 25,
    paddingLeft: 25,
  },
  content: {
    paddingBottom: 110,
  },
  title: {
    color: "#FFFFFF",
    fontSize: 34,
    fontWeight: "700",
    marginBottom: 15,
  },
  searchBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#2B2B32",
    borderRadius: 16,
    paddingHorizontal: 12,
    height: 52,
    marginBottom: 40,
    borderWidth: 1,
    borderColor: "#4D4D57",
        shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  searchInput: {
    flex: 1,
    color: "#FFFFFF",
    marginLeft: 10,
    fontSize: 16,
    
  },
  sectionHeader: {
    marginBottom: 12,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
    marginTop: 25,
  },
  sectionTitleWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  sectionTitle: {
    color: "#FFFFFF",
    fontSize: 23,
    fontWeight: "700",
  },
  eventList: {
    paddingRight: 14,
  },
  createButton: {
    backgroundColor: "#57C7A3",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  createButtonText: {
    color: "#15151C",
    fontWeight: "700",
  },
  grupoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#4A216F",
    borderRadius: 18,
    padding: 10,
    marginBottom: 12.5,
    borderWidth: 1.5,
    borderColor: "#512377",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  grupoImagen: {
    width: 50,
    height: 50,
    borderRadius: 12.5,
  },
  grupoInfo: {
    marginLeft: 12,
    flex: 1,
  },
  grupoNombre: {
    color: "#FFFFFF",
    fontSize: 17,
    fontWeight: "600",
  },
  grupoIntegrantes: {
    color: "#B9B9C7",
    fontSize: 13,
    marginTop: 3,
  },
  grupoFlecha: {
    color: "#ffffff",
    fontSize: 27,

    marginLeft: 8,
  },
  emptyState: {
    backgroundColor: "#4A216F",
    padding: 30,
    borderRadius: 12,
    marginBottom: 18,
  },
  emptyText: {
    color: "#FFFFFF",
    textAlign: "center",
    fontWeight: "600",
  },
  modalOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modal: {
    width: "85%",
    backgroundColor: "#23232D",
    borderRadius: 20,
    padding: 20,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  modalTitle: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
  },
  modalTitulo: {
    color: "#FFFFFF",
    fontSize: 24,
    fontWeight: "700",
    textAlign: "center",
  },
  closeText: {
    color: "#B0B0B0",
    fontSize: 24,
  },
  modalButton: {
    color: "#57C7A3",
    textAlign: "center",
    fontWeight: "700",
    marginTop: 10,
  },
  errorText: {
    color: "#FF7A7A",
    textAlign: "center",
    marginTop: 24,
  },
});
