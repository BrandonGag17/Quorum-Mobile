import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
} from "react-native";
import * as ImagePicker from "expo-image-picker";
import supabase from "../../services/supabaseClient";
import ErrorMessage from "../../components/MensajeError";
import useCreateGroup from "../../hooks/useCreateGroup";
import UserSearch from "../../components/UserSearch";
import Button from "../../components/Botones";

const FOTO_DEFAULT =
  "https://fusjhtyvjkshuzxofeqj.supabase.co/storage/v1/object/public/avatars/PlaceholderGrupo.png";

function CrearGrupo({ onGrupoCreado }) {
  const [nombreGrupo, setNombreGrupo] = useState("");
  const [foto, setFoto] = useState(null);
  const [miembroUsername, setMiembroUsername] = useState("");
  const [miembros, setMiembros] = useState([]);
  const [mensaje, setMensaje] = useState("");

  const { create, loading: creating, error: createError } = useCreateGroup();

  async function seleccionarFoto() {
    const resultado = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
    });
    if (!resultado.canceled) {
      setFoto(resultado.assets[0]);
    }
  }

  async function handleSelectUser(user) {
    setMensaje("");
    const { data: me } = await supabase.auth.getUser();
    const myId = me?.user?.id;
    if (user.id === myId) {
      setMensaje("No podés agregarte a vos mismo");
      return;
    }
    if (miembros.some((m) => m.id === user.id)) {
      setMensaje("Ese usuario ya fue agregado");
      return;
    }
    setMiembros((prev) => [...prev, user]);
    setMiembroUsername("");
  }

  function eliminarMiembro(usuarioId) {
    setMiembros((prev) => prev.filter((miembro) => miembro.id !== usuarioId));
  }

  async function manejarSubmit() {
    if (creating) return;
    setMensaje("");

    if (!nombreGrupo.trim()) {
      setMensaje("Ingresá un nombre para el grupo");
      return;
    }

    if (nombreGrupo.trim().length < 3) {
      setMensaje("El nombre debe tener al menos 3 caracteres");
      return;
    }

    if (miembros.length === 0) {
      setMensaje("Agregá al menos un integrante para crear el grupo");
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setMensaje("No se pudo obtener el usuario");
      return;
    }

    const miembrosIds = miembros.map((m) => m.id);

    const { data: grupoCreado, error } = await create({
      nombre: nombreGrupo.trim(),
      fotoUri: foto?.uri || null,
      creatorId: user.id,
      miembros: miembrosIds,
    });

    if (error) {
      setMensaje(error.message || String(error));
      return;
    }

    onGrupoCreado?.();
  }

  return (
    <View>
      <Text style={styles.label}>Nombre del grupo</Text>

      <TextInput
        style={styles.input}
        placeholder="Ej: Los pibes"
        placeholderTextColor="#888"
        value={nombreGrupo}
        onChangeText={(texto) => {
          setNombreGrupo(texto);
          setMensaje("");
        }}
      />

      <Text style={styles.label}>Foto del grupo (opcional)</Text>

      <TouchableOpacity style={styles.botonSecundario} onPress={seleccionarFoto}>
        {foto ? (
          <View style={styles.previewContainer}>
            <Image source={{ uri: foto.uri }} style={styles.preview} />
            <Text style={styles.botonSecundarioTexto}>Cambiar foto</Text>
          </View>
        ) : (
          <Text style={styles.botonSecundarioTexto}>Seleccionar foto</Text>
        )}
      </TouchableOpacity>

      <Text style={styles.label}>Agregar miembros</Text>

      <UserSearch
        value={miembroUsername}
        onChangeText={setMiembroUsername}
        onSelect={handleSelectUser}
        excludeIds={miembros.map((m) => m.id)}
      />

      <FlatList
        scrollEnabled={false}
        data={miembros}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.miembroContainer}>
            <Image
              source={{
                uri: item.foto_perfil || "https://via.placeholder.com/40",
              }}
              style={styles.miembroFoto}
            />

            <Text style={styles.miembro}>@{item.username}</Text>

            <TouchableOpacity
              style={styles.botonEliminar}
              onPress={() => eliminarMiembro(item.id)}
            >
              <Text style={styles.botonEliminarTexto}>×</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      {mensaje ? <ErrorMessage mensaje={mensaje} /> : null}
      {createError ? <ErrorMessage mensaje={createError} /> : null}

      <TouchableOpacity
        style={styles.botonCrear}
        onPress={manejarSubmit}
        disabled={creating}
      >
        <Text style={styles.botonCrearTexto}>{creating ? "Creando..." : "Crear grupo"}</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  label: {
    color: "white",
    fontFamily: "CashMarket",
    marginBottom: 8,
    marginTop: 12,
  },
  input: {
    backgroundColor: "#2E2E3A",
    color: "white",
    borderRadius: 12,
    paddingHorizontal: 15,
    paddingVertical: 12,
    fontFamily: "Utendo",
  },
  botonSecundario: {
    backgroundColor: "#4A216F",
    borderRadius: 12,
    padding: 12,
    alignItems: "center",
  },
  botonSecundarioTexto: {
    color: "white",
    textAlign: "center",
    fontFamily: "Utendo",
  },
  previewContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  preview: {
    width: 30,
    height: 30,
    borderRadius: 10,
  },
  fila: {
    flexDirection: "row",
    gap: 10,
    alignItems: "center",
  },
  miembroContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
  },
  miembroFoto: {
    width: 35,
    height: 35,
    borderRadius: 17.5,
    marginRight: 10,
  },
  miembro: {
    color: "white",
    fontFamily: "Utendo",
  },
  botonEliminar: {
    marginLeft: "auto",
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: "#4A216F",
    justifyContent: "center",
    alignItems: "center",
  },
  botonEliminarTexto: {
    color: "white",
    fontSize: 20,
    fontFamily: "Utendo",
  },
  suggestionsContainer: {
    backgroundColor: "#2B2B32",
    borderRadius: 10,
    marginTop: 8,
    maxHeight: 200,
  },
  suggestionItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderBottomColor: "#3a3a3a",
    borderBottomWidth: 1,
  },
  suggestionAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 10,
  },
  suggestionText: {
    color: "white",
    fontFamily: "Utendo",
  },
  botonCrear: {
    backgroundColor: "#57C7A3",
    borderRadius: 12,
    padding: 14,
    marginTop: 20,
  },
  botonCrearTexto: {
    textAlign: "center",
    color: "#000",
    fontFamily: "CashMarket",
    fontSize: 16,
  },
});

export default CrearGrupo;