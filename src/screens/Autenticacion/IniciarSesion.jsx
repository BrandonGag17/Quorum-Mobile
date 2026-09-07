import {
  View, Text, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, ScrollView, Platform, Alert
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useSession } from "../../hooks/useSession";
import React, { useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import Button from "../../components/BotonesIntro";
import Input from "../../components/Input";
import ErrorMessage from "../../components/MensajeError";
import { IconMailFilled, IconLockFilled } from "@tabler/icons-react-native";
import { useForm, Controller } from "react-hook-form";

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
  const { login, loading, error, clearError } = useSession();

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  useFocusEffect(
    useCallback(() => {
      reset();
      clearError();
    }, [reset, clearError])
  );

  const handleLogin = async ({ email, password }) => {
    await login(email.trim(), password);
  };

  const displayError = error ? normalizeAuthError(error) : "";

  const handleGoogle = () => {
    Alert.alert(
      "Inicio con Google",
      "Google todavía no está configurado en este flujo."
    );
  };

  return (
    <SafeAreaView style={styles.fondo}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        <ScrollView
          contentContainerStyle={styles.contenido}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.titulo}>Iniciar sesión</Text>

          <Controller
            control={control}
            name="email"
            rules={{
              required: "El email es obligatorio",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Ingresá un email válido",
              },
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Email:"
                placeholder="tu@gmail.com"
                value={value}
                onChangeText={(texto) => {
                  onChange(texto);
                  clearError();
                }}
                onBlur={onBlur}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                textContentType="emailAddress"
                autoCorrect={false}
                Icon={IconMailFilled}
              />
            )}
          />

          {errors.email && (
            <ErrorMessage mensaje={errors.email.message} />
          )}

          <Controller
            control={control}
            name="password"
            rules={{
              required: "La contraseña es obligatoria",
            }}
            render={({ field: { onChange, onBlur, value } }) => (
              <Input
                label="Contraseña:"
                placeholder="********"
                value={value}
                onChangeText={(texto) => {
                  onChange(texto);
                  clearError();
                }}
                onBlur={onBlur}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                autoComplete="password"
                textContentType="password"
                Icon={IconLockFilled}
              />
            )}
          />

          {errors.password && (
            <ErrorMessage mensaje={errors.password.message} />
          )}
          <Text style={styles.olvido}>¿Olvidaste tu contraseña?</Text>

          {displayError ? (
            <ErrorMessage mensaje={displayError} />
          ) : null}

          <Button
            nombre={loading || isSubmitting ? "Cargando..." : "Iniciar sesión"}
            onPress={handleSubmit(handleLogin)}
            disabled={loading || isSubmitting}
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
          <TouchableOpacity
            style={styles.botonCuenta}
            onPress={() => navigation.replace("Registrarse1")}
            disabled={loading || isSubmitting}
            accessibilityRole="button"
          >
            <Text style={styles.textoCuenta}>
              ¿Todavía no tienes una cuenta?{" "}
              <Text style={styles.enlaceCuenta}>¡Regístrate!</Text>
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  botonCuenta: {
    minHeight: 48,
    marginTop: 16,
    paddingVertical: 12,
    justifyContent: "center",
  },
  textoCuenta: {
    fontFamily: "Utendo",
    fontSize: 16,
    color: "#FFFFFF",
    textAlign: "center",
  },
  enlaceCuenta: {
    color: "#A846E9",
    textDecorationLine: "underline",
  },
  fondo: {
    flex: 1,
    backgroundColor: "#15151C",
  },
  contenido: {
    flexGrow: 1,
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
