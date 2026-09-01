import { View, Text, StyleSheet, SafeAreaView } from "react-native";
import { useState } from "react";
import { useNavigation, useRoute } from "@react-navigation/native";

import Button from '../../components/BotonesIntro'
import Input from "../../components/Input";
import ErrorMessage from "../../components/MensajeError";

function Registrarse2() {
  const navigation = useNavigation();
  const route = useRoute();
  const { email, username, password } = route.params || {};

  const [nombre, setNombre] = useState("");
  const [apellido, setApellido] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [cargando, setCargando] = useState(false);

  const handleSubmit = () => {
    setMensaje("");

    if (!nombre.trim()) {
      setMensaje("Ingresá tu nombre");
      return;
    }

    if (!apellido.trim()) {
      setMensaje("Ingresá tu apellido");
      return;
    }

    navigation.navigate("Registrarse3", {
      email,
      username,
      password,
      nombre: nombre.trim(),
      apellido: apellido.trim(),
    });
  };

  return (
    <View style={styles.fondo}>
      <Text style={styles.titulo}>Registrarse</Text>

      <Input
        label="Nombre:"
        value={nombre}
        onChangeText={(texto) => {
          setNombre(texto);
          setMensaje("");
        }}
      />

      <Input
        label="Apellido:"
        value={apellido}
        onChangeText={(texto) => {
          setApellido(texto);
          setMensaje("");
        }}
      />

      {mensaje ? <ErrorMessage mensaje={mensaje} /> : null}

      <Button
        nombre={cargando ? "Cargando..." : "Continuar"}
        onPress={handleSubmit}
        disabled={cargando}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "#15151C",
    padding: 25,
    justifyContent: "center",
  },
  titulo: {
    fontFamily: "CashMarket",
    color: "white",
    fontSize: 40,
    textAlign: "center",
    marginBottom: 30,
  },
});

export default Registrarse2;
