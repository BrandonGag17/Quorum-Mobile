import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  Image,
  TextInput,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  StyleSheet,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { SafeAreaView } from "react-native-safe-area-context";
import FontAwesome6 from "@expo/vector-icons/FontAwesome6";
import GroupHeader from "../../components/GroupHeader";
import Button from "../../components/Botones";
import { useGroupInfo } from "../../hooks/userGroupInfo";
import UserSearch from "../../components/UserSearch";

function InfoGrupo() {
  const route = useRoute();
  const navigation = useNavigation();
  const { idGrupo } = route.params;

  const {
    group,
    members,
    memberCount,
    loading,
    error,
    addMemberByUsername,
    addMemberById,
    leaveGroup,
  } = useGroupInfo(idGrupo);

  const [mostrarModal, setMostrarModal] = useState(false);
  const [mostrarPopupSalir, setMostrarPopupSalir] = useState(false);
  const [miembroUsername, setMiembroUsername] = useState("");
  const [errorMiembro, setErrorMiembro] = useState("");
  const [selectedUser, setSelectedUser] = useState(null);
  const [miembroSeleccionado, setMiembroSeleccionado] = useState(null);
  const [mostrarPopupMiembro, setMostrarPopupMiembro] = useState(false);

  async function confirmarSalir() {
    const res = await leaveGroup();
    setMostrarPopupSalir(false);
    if (!res?.error) {
      const parent = navigation.getParent ? navigation.getParent() : null;
      if (parent && parent.navigate) {
        parent.navigate("Inicio", {
          screen: "HomeScreen",
          params: { refresh: true },
        });
      } else {
        navigation.navigate("Inicio", {
          screen: "HomeScreen",
          params: { refresh: true },
        });
      }
    }
  }

  async function agregarMiembro() {
    setErrorMiembro("");

    if (selectedUser) {
      const res = await addMemberById(selectedUser.id);
      if (res?.error) {
        setErrorMiembro(res.error.message || String(res.error));
        return;
      }
      setSelectedUser(null);
      setMiembroUsername("");
      setMostrarModal(false);
      return;
    }

    const q = miembroUsername.replace(/^@/, "").trim();
    if (!q) {
      setErrorMiembro("Ingresá un usuario");
      return;
    }
    const { data, error } = await addMemberByUsername(q);
    if (error) {
      setErrorMiembro(error.message || String(error));
      return;
    }
    setMiembroUsername("");
    setMostrarModal(false);
  }

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#B514F6" />
      </SafeAreaView>
    );
  }

  function abrirPopupMiembro(miembro) {
    setMiembroSeleccionado(miembro);
    setMostrarPopupMiembro(true);
  }


  return (
    <View style={styles.container}>
      <View style={styles.contenido}>
        <View style={styles.profileHeader}>
          <Image
            source={{ uri: group?.foto_perfil }}
            style={styles.profileAvatar}
          />
          <Text style={styles.profileName}>{group?.nombre}</Text>
          <Text style={styles.profileCount}>{memberCount} miembros</Text>
        </View>

        <View style={styles.sectionHeader}>
          <FontAwesome6 name="user-group" size={20} color="#FFFFFF" />
          <Text style={styles.sectionTitle}>Miembros</Text>
        </View>

        <FlatList
          data={members}
          keyExtractor={(item) => item.id?.toString() || item.usuario?.id}
          showsVerticalScrollIndicator={members.length > 4}
          scrollEnabled={members.length > 4}
          contentContainerStyle={styles.listaMiembros}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.miembroCard}
              activeOpacity={0.8}
              onPress={() => abrirPopupMiembro(item)}
            >
              <Image
                source={{ uri: item.usuario?.foto_perfil }}
                style={styles.fotoPerfil}
              />

              <View style={styles.infoUsuario}>
                <Text style={styles.nombreUsuario}>
                  {item.usuario?.username}
                </Text>

                <Text style={styles.username}>
                  @{item.usuario?.username}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />

        <View>
          <Button onPress={() => setMostrarModal(true)} nombre={loading ? "Cargando..." : "+ Añadir miembros"} />
        </View>

        <TouchableOpacity style={styles.botonSalir} onPress={() => setMostrarPopupSalir(true)}>
          <Text style={styles.textoBotonSalir}>Salir del grupo</Text>
        </TouchableOpacity>

        <Modal
          visible={mostrarModal}
          transparent
          animationType="fade"
          onRequestClose={() => setMostrarModal(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <View style={styles.headerModal}>
                <Text style={styles.modalTitulo}>Añadir miembro</Text>
                <TouchableOpacity onPress={() => setMostrarModal(false)}>
                  <Text style={styles.botonCerrar}>✕</Text>
                </TouchableOpacity>
              </View>

              <UserSearch
                value={miembroUsername}
                onChangeText={(txt) => {
                  setMiembroUsername(txt);
                  setErrorMiembro("");
                  setSelectedUser(null);
                }}
                onSelect={(user) => {
                  setErrorMiembro("");
                  setSelectedUser(user);
                  setMiembroUsername(`@${user.username}`);
                }}
                excludeIds={members.map((m) => m.usuario?.id)}
              />

              <TouchableOpacity
                style={styles.botonModal}
                onPress={agregarMiembro}
              >
                <Text style={styles.textoBotonModal}>Añadir</Text>
              </TouchableOpacity>

              {errorMiembro ? (
                <Text style={styles.error}>{errorMiembro}</Text>
              ) : null}
            </View>
          </View>
        </Modal>

        <Modal
          visible={mostrarPopupSalir}
          transparent
          animationType="fade"
          onRequestClose={() => setMostrarPopupSalir(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={styles.modal}>
              <View style={styles.headerModal}>
                <Text style={styles.modalTitulo}>¿Salir del grupo?</Text>
              </View>

              <Text style={styles.modalTextoSalir}>
                Vas a dejar de formar parte del grupo.
              </Text>

              <TouchableOpacity
                style={[styles.botonModal, { backgroundColor: "#ff0000" }]}
                onPress={confirmarSalir}
              >
                <Text style={styles.textoBotonModal}>Sí, salir</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => setMostrarPopupSalir(false)}
                style={styles.cancelarBtn}
              >
                <Text style={styles.cancelarTexto}>Cancelar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </View>
      <Modal
        visible={mostrarPopupMiembro}
        transparent
        animationType="slide"
        onRequestClose={() => setMostrarPopupMiembro(false)}
      >
        <View style={styles.popupMiembroOverlay}>
          {/* Permite cerrar tocando fuera */}
          <TouchableOpacity
            style={styles.popupZonaCerrar}
            activeOpacity={1}
            onPress={() => setMostrarPopupMiembro(false)}
          />

          <View style={styles.popupMiembro}>
            {miembroSeleccionado && (
              <>
                <Image
                  source={{
                    uri: miembroSeleccionado.usuario?.foto_perfil,
                  }}
                  style={styles.popupFotoPerfil}
                />

                <Text style={styles.popupNombre}>
                  {miembroSeleccionado.usuario?.username}
                </Text>

                <Text style={styles.popupInfo}>
                  Cumpleaños
                </Text>

                <TouchableOpacity
                  style={styles.botonSalir}
                  onPress={() => {
                    setMostrarPopupMiembro(false);
                  }}
                >
                  <Text style={styles.textoBotonSalir}>Sacar del grupo</Text>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>
    </View>
  )
}

const styles = StyleSheet.create({
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    color: "white",
    fontSize: 20,
    fontWeight: "700",
    marginLeft: 8,
  },
  headerGrupo: {
    alignItems: "center",
    marginBottom: 30,
  },
  fotoGrupo: {
    width: 110,
    height: 110,
    borderRadius: 60,
    marginBottom: 14,
    borderWidth: 2,
    borderColor: "#5E2D82",
  },
  nombreGrupo: {
    color: "white",
    fontSize: 28,
    fontFamily: "CashMarket",
    marginBottom: 4,
  },
  cantidadMiembros: {
    color: "#B8B8B8",
    fontSize: 14,
    fontFamily: "Utendo",
  },
  container: {
    flex: 1,
    backgroundColor: "#15151C",
    paddingHorizontal: "5%",
    paddingTop: "5%",
  },
  contenido: {
    flex: 1,
    paddingBottom: 50,
  },
  miembroCard: {
    backgroundColor: "#4A216F",
    borderRadius: 15,
    paddingVertical: 12,
    paddingHorizontal: 15,
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  fotoPerfil: {
    width: 45,
    height: 45,
    borderRadius: 25,
    marginRight: 12,
  },
  infoUsuario: {
    flex: 1,
  },
  nombreUsuario: {
    color: "white",
    fontFamily: "CashMarket",
    fontSize: 16,
  },
  username: {
    color: "#d5d5d5",
    fontSize: 12,
    marginTop: 2,
    fontFamily: "Utendo ",
  },
  botonSalir: {
    backgroundColor: "#d30909",
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    marginTop: 4,
    bottom: 60
  },
  textoBotonSalir: {
    color: "white",
    fontWeight: "bold",
    fontSize: 16,
    fontFamily: "CashMarket",
  },
  listaMiembros: {
    paddingBottom: 120,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#15151C",
  },
  modalOverlay: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modal: {
    width: "85%",
    backgroundColor: "#23232D",
    padding: 20,
    borderRadius: 20,
  },
  headerModal: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 25,
  },
  modalTitulo: {
    color: "white",
    fontSize: 24,
    fontFamily: "CashMarket",
  },
  botonCerrar: {
    color: "#B0B0B0",
    fontSize: 24,
    fontFamily: "Utendo",
  },
  input: {
    backgroundColor: "#2E2E3A",
    color: "white",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontFamily: "Utendo",
  },
  botonModal: {
    backgroundColor: "#5E2D82",
    padding: 12,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  textoBotonModal: {
    color: "white",
    fontFamily: "CashMarket",
  },
  error: {
    color: "#ff0000",
    marginTop: 10,
    fontFamily: "Utendo",
  },
  modalTextoSalir: {
    color: "#B6B6B6",
    fontFamily: "Utendo",
  },
  cancelarBtn: {
    marginTop: 15,
    alignItems: "center",
  },
  cancelarTexto: {
    color: "#9E9E9E",
    fontFamily: "Utendo",
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: 22,
    marginTop: 6,
  },
  profileAvatar: {
    width: 120,
    height: 120,
    borderRadius: 25,
    borderWidth: 2,
    borderColor: "#5E2D82",
    marginBottom: 12,
    backgroundColor: "#3a3a3a",
  },
  profileName: {
    color: "white",
    fontSize: 24,
    fontFamily: "CashMarket",
    marginBottom: 4,
    textAlign: "center",
  },
  profileCount: {
    color: "#B8B8B8",
    fontSize: 14,
    fontFamily: "Utendo",
    textAlign: "center",
  },

  popupMiembroOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.55)",
  },
  popupZonaCerrar: {
    flex: 1,
  },
  popupMiembro: {
    backgroundColor: "#6240A0",
    paddingTop: 10,
    paddingBottom: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  popupFotoPerfil: {
    width: 64,
    height: 64,
    borderRadius: 32,
    borderWidth: 2,
    borderColor: "#FFE600",
    marginBottom: 8,
  },
  popupNombre: {
    color: "#FFFFFF",
    fontSize: 15,
    fontFamily: "CashMarket",
    marginBottom: 3,
  },
  popupInfo: {
    color: "#FFFFFF",
    fontSize: 11,
    fontFamily: "Utendo",
    marginBottom: 10,
  },
});

export default InfoGrupo;
