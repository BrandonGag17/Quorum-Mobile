import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../../hooks/useSession";
import React, { useState } from "react";

import Button from "../../components/BotonesIntro";
import Input from "../../components/Input";
import ErrorMessage from "../../components/MensajeError";
import { IconMailFilled, IconLockFilled } from "@tabler/icons-react-native";

function normalizeAuthError(message) {
  if (!message) return "";

  if (message.includes("Invalid login credentials")) {
    return "Email o contraseña incorrectos.";
  }

  if (message.includes("AuthApiError")) {
    return "No se pudo iniciar sesión. Intentalo de nuevo.";
  }
  return "No se pudo iniciar sesión. Intentalo de nuevo.";
}

export default function IniciarSesion({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, loading, error } = useSession();

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      return;
    }

    const result = await login(email.trim(), password);

    if (result.success) {
      navigation.reset({
        index: 0,
        routes: [{ name: "Home" }],
      });
    }
  };

  const displayError = error ? normalizeAuthError(error) : "";

  const handleGoogle = async () => {
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: "http://localhost:5173/inicio" },
    });
    if (error) setMensaje("Error: " + error.message);
  };

  return (
    <SafeAreaView style={styles.fondo}>
      <Text style={styles.titulo}>Iniciar sesión</Text>

      <Input
        label="Email:"
        placeholder="tu@gmail.com"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoComplete="email"
        textContentType="emailAddress"
        autoCorrect={false}
        Icon={IconMailFilled}
      />

      <Input
        label="Contraseña:"
        placeholder="********"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        autoComplete="password"
        textContentType="password"
        Icon={IconLockFilled}
      />
      <Text style={styles.olvido}>¿Olvidaste tu contraseña?</Text>

      {displayError ? (
        <ErrorMessage mensaje={displayError} />
      ) : null}

      <Button
        nombre={loading ? "Cargando..." : "Iniciar sesión"}
        onPress={handleLogin}
        disabled={loading || !email || !password}
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
          resizeMode="contain"
        />
        <Text style={styles.textoGoogle}>Continuar con Google</Text>
      </TouchableOpacity>
    </SafeAreaView>
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
  iconoTexto: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  texto: {
    color: "white",
    fontFamily: "Utendo",
    fontSize: 20,
    marginTop: 5,
  },
  botonGoogle: {
    padding: 10,
    margin: 10,
    backgroundColor: "#ffffff",
    borderRadius: 15,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  googleLogo: {
    width: 26,
    height: 26,
    marginRight: 15,
  },
  textoGoogle: {
    fontFamily: "CashMarket",
    textAlign: "center",
    color: "black",
    fontSize: 20,
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
  olvido: {
    alignItems: "flex-end",
    color: "#A846E9",
    textDecorationLine: "underline",
    textAlign: "right",
    marginBottom: 20,
  },
});
