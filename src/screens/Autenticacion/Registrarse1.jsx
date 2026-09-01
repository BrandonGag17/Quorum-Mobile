import { View, Text, StyleSheet, TouchableOpacity, Image } from "react-native";
import Checkbox from "expo-checkbox";
import {
  IconMailFilled,
  IconLockFilled,
  IconUserFilled,
} from "@tabler/icons-react-native";
import { useState } from "react";
import { useNavigation } from "@react-navigation/native";

import Input from "../../components/Input";
import ErrorMessage from "../../components/MensajeError";
import { useRegistration } from "../../hooks/useRegistration";
import Button from '../../components/BotonesIntro'

function Registrarse1() {
  const navigation = useNavigation();
  const { validateStepOne, loading, error, setError } = useRegistration();

  const [isChecked, setChecked] = useState(false);
  const [email, setEmail] = useState("");
  const [usuario, setUsuario] = useState("");
  const [password, setPassword] = useState("");

  const continuar = async () => {
    const result = await validateStepOne({
      email,
      username: usuario,
      password,
      termsAccepted: isChecked,
    });

    if (!result.valid) {
      setError(result.message);
      return;
    }

    navigation.navigate("Registrarse2", {
      email: email.trim(),
      username: usuario.trim(),
      password,
    });
  };

  const handleGoogle = async () => {
    setError("");
    setError("Google todavía no está configurado en este flujo.");
  };

  return (
    <View style={styles.fondo}>
      <Text style={styles.titulo}>Registrarse</Text>

      <Input
        label="Email:"
        placeholder="tu@gmail.com"
        value={email}
        onChangeText={(texto) => {
          setEmail(texto);
          setError("");
        }}
        Icon={IconMailFilled}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
      />

      <Input
        label="Nombre de usuario:"
        placeholder="tuusuario123"
        value={usuario}
        onChangeText={(texto) => {
          setUsuario(texto);
          setError("");
        }}
        Icon={IconUserFilled}
        autoComplete="username"
        textContentType="username"
        autoCapitalize="none"
      />

      <Input
        label="Contraseña:"
        placeholder="*******"
        value={password}
        onChangeText={(texto) => {
          setPassword(texto);
          setError("");
        }}
        secureTextEntry
        Icon={IconLockFilled}
        autoComplete="new-password"
        textContentType="newPassword"
      />

      <View style={styles.checkbox}>
        <Checkbox
          value={isChecked}
          onValueChange={(valor) => {
            setChecked(valor);
            setError("");
          }}
        />
        <Text style={styles.texto}>Acepto los términos y condiciones</Text>
      </View>

      {error ? <ErrorMessage mensaje={error} /> : null}

      <Button
        nombre={loading ? "Cargando..." : "Continuar"}
        onPress={continuar}
        disabled={loading}
      />

      <View style={styles.separador}>
        <View style={styles.linea} />
        <Text style={styles.textoSeparador}>o</Text>
        <View style={styles.linea} />
      </View>

      <TouchableOpacity style={styles.botonGoogle} onPress={handleGoogle}>
        <Image
          source={require("../../../assets/img/Iconos/Google.png")}
          style={styles.googleLogo}
        />
        <Text style={styles.textoGoogle}>Continuar con Google</Text>
      </TouchableOpacity>
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
  checkbox: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 20,
    marginTop: 10,
  },
  texto: {
    fontFamily: "Utendo",
    fontSize: 16,
    color: "#FFFFFF",
  },
  botonGoogle: {
    padding: 10,
    margin: 10,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  googleLogo: {
    width: 28,
    height: 28,
    marginRight: 15,
  },
  textoGoogle: {
    fontFamily: "Utendo",
    textAlign: "center",
    color: "black",
    fontSize: 22.5,
  },
  separador: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 10,
  },
  linea: {
    flex: 1,
    height: 1,
    backgroundColor: "#4F4F55",
  },
  textoSeparador: {
    color: "#A0A0A0",
    marginHorizontal: 15,
    fontFamily: "Utendo",
    fontSize: 16,
  },
});

export default Registrarse1;
