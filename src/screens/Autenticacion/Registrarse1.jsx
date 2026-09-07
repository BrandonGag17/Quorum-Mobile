import { View, Text, StyleSheet, TouchableOpacity, Image, KeyboardAvoidingView, ScrollView, Platform, } from "react-native";
import Checkbox from "expo-checkbox";
import { IconMailFilled, IconLockFilled, IconUserFilled } from "@tabler/icons-react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";

import Input from "../../components/Input";
import ErrorMessage from "../../components/MensajeError";
import { useRegistration } from "../../hooks/useRegistration";
import Button from '../../components/BotonesIntro'
import { useCallback } from "react";

import { useForm, Controller } from "react-hook-form";

function Registrarse1() {
  const navigation = useNavigation();
  const { validateStepOne, error, setError } = useRegistration();

  const {
    control, handleSubmit, formState: { errors, isSubmitting }, reset,
  } = useForm({
    defaultValues: {
      email: "",
      username: "",
      password: "",
      termsAccepted: false,
    },
  });
  useFocusEffect(
    useCallback(() => {
      reset(undefined, { keepValues: true });
      setError("");
    }, [reset, setError])
  );


  const continuar = async ({
    email,
    username,
    password,
    termsAccepted,
  }) => {
    setError("");

    const result = await validateStepOne({
      email,
      username,
      password,
      termsAccepted,
    });

    if (!result.valid) {
      setError(result.message);
      return;
    }

    navigation.navigate("Registrarse2", {
      email: email.trim(),
      username: username.trim(),
      password,
    });
  };


  const handleGoogle = async () => {
    setError("");
    setError("Google todavía no está configurado en este flujo.");
  };

  return (
    <KeyboardAvoidingView
      style={styles.fondo}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <ScrollView
        contentContainerStyle={styles.contenido}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.titulo}>Registrarse</Text>

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
                setError("");
              }}
              onBlur={onBlur}
              Icon={IconMailFilled}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              textContentType="emailAddress"
            />
          )}
        />

        {errors.email && (
          <ErrorMessage mensaje={errors.email.message} />
        )}

        <Controller
          control={control}
          name="username"
          rules={{
            validate: {
              required: (value) =>
                value.trim().length > 0 ||
                "El nombre de usuario es obligatorio",
              minLength: (value) =>
                value.trim().length >= 3 ||
                "El usuario debe tener al menos 3 caracteres",
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Nombre de usuario:"
              placeholder="tuusuario123"
              value={value}
              onChangeText={(texto) => {
                onChange(texto);
                setError("");
              }}
              onBlur={onBlur}
              Icon={IconUserFilled}
              autoComplete="username"
              textContentType="username"
              autoCapitalize="none"
            />
          )}
        />

        {errors.username && (
          <ErrorMessage mensaje={errors.username.message} />
        )}

        <Controller
          control={control}
          name="password"
          rules={{
            required: "La contraseña es obligatoria",
            minLength: {
              value: 8,
              message: "La contraseña debe tener al menos 8 caracteres",
            },
          }}
          render={({ field: { onChange, onBlur, value } }) => (
            <Input
              label="Contraseña:"
              placeholder="*******"
              value={value}
              onChangeText={(texto) => {
                onChange(texto);
                setError("");
              }}
              onBlur={onBlur}
              secureTextEntry
              Icon={IconLockFilled}
              autoComplete="new-password"
              textContentType="newPassword"
              autoCapitalize="none"
            />
          )}
        />

        {errors.password && (
          <ErrorMessage mensaje={errors.password.message} />
        )}

        <Controller
          control={control}
          name="termsAccepted"
          rules={{
            validate: (value) =>
              value === true || "Debés aceptar los términos y condiciones",
          }}
          render={({ field: { onChange, value } }) => (
            <View style={styles.checkbox}>
              <Checkbox
                value={value}
                onValueChange={(checked) => {
                  onChange(checked);
                  setError("");
                }}
              />
              <Text style={styles.texto}>
                Acepto los términos y condiciones
              </Text>
            </View>
          )}
        />

        {errors.termsAccepted && (
          <ErrorMessage mensaje={errors.termsAccepted.message} />
        )}

        {error ? <ErrorMessage mensaje={error} /> : null}

        <Button
          nombre={isSubmitting ? "Cargando..." : "Continuar"}
          onPress={handleSubmit(continuar)}
          disabled={isSubmitting}
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
        <TouchableOpacity
          style={styles.botonCuenta}
          onPress={() => navigation.replace("IniciarSesion")}
          disabled={isSubmitting}
          accessibilityRole="button"
        >
          <Text style={styles.textoCuenta}>
            ¿Ya tienes una cuenta?{" "}
            <Text style={styles.enlaceCuenta}>¡Inicia sesión!</Text>
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
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
