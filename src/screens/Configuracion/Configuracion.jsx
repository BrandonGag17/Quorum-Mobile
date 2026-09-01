import React, { useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useSession } from "../../hooks/useSession";
import { useUserProfile } from "../../hooks/useUserProfile";
import ErrorMessage from "../../components/MensajeError";
import Loading from "../../components/Loading";

export default function Configuracion() {
  const {
    profile,
    loading: profileLoading,
    error: profileError,
  } = useUserProfile();
  const { logout, loading: logoutLoading, error: logoutError } = useSession();

  const currentYear = useMemo(() => new Date().getFullYear(), []);

  const handleLogout = async () => {
    await logout();
  };

  return (
    <SafeAreaView style={styles.fondo}>
      {profileLoading ? (
        <Loading />
      ) : (
        <>
          {profile ? (
            <View style={styles.perfil}>
              <Image
                source={{ uri: profile.foto_perfil }}
                style={styles.fotoPerfil}
              />

              <Text style={styles.username}>@{profile.username}</Text>
              <Text style={styles.nombreCompleto}>
                {profile.nombre} {profile.apellido}
              </Text>
            </View>
          ) : (
            <View style={styles.center}>
              <Text style={styles.errorText}>No se pudo cargar tu perfil.</Text>
            </View>
          )}

          {profileError ? (
            <ErrorMessage mensaje="No se pudo cargar tu perfil." />
          ) : null}
          {logoutError ? (
            <ErrorMessage mensaje="No se pudo cerrar sesión. Intentalo de nuevo." />
          ) : null}

          <TouchableOpacity
            onPress={handleLogout}
            disabled={logoutLoading}
            style={[
              styles.botonCerrar,
              logoutLoading && styles.botonCerrarDisabled,
            ]}
          >
            <Text style={styles.botones}>
              {logoutLoading ? "Cerrando sesión..." : "Cerrar sesión"}
            </Text>
          </TouchableOpacity>

          <Text style={styles.textoCopyVersion}>
            Copyright © {currentYear} - Quórum
          </Text>
          <Text style={styles.textoCopyVersion}>Versión Demo 0.0.0</Text>
        </>
      )}
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
  center: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  perfil: {
    alignItems: "center",
    marginBottom: 30,
  },
  fotoPerfil: {
    width: 100,
    height: 100,
    borderRadius: 55,
    marginBottom: 12,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: "#5E2D82",
  },
  username: {
    color: "white",
    fontFamily: "CashMarket",
    fontSize: 25,
  },
  nombreCompleto: {
    color: "#B0B0B0",
    fontFamily: "Utendo",
    fontSize: 18,
    marginTop: 4,
  },
  botonCerrar: {
    backgroundColor: "#d30909",
    borderWidth: 2,
    borderRadius: 15,
    paddingVertical: 12,
    marginBottom: 20,
    alignItems: "center",
  },
  botonCerrarDisabled: {
    opacity: 0.7,
  },
  botones: {
    fontFamily: "Utendo",
    textAlign: "center",
    color: "white",
    fontSize: 20,
  },
  textoCopyVersion: {
    color: "white",
    textAlign: "center",
    fontFamily: "Utendo",
    marginBottom: 10,
    fontSize: 15,
  },
  errorText: {
    color: "#FF7A7A",
    textAlign: "center",
    marginBottom: 14,
    fontFamily: "Utendo",
  },
});
