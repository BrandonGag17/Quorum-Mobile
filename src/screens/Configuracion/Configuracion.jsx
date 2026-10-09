import React, { useContext, useMemo } from "react";
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  Switch,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";

import { useSession } from "../../hooks/useSession";
import { useUserProfile } from "../../hooks/useUserProfile";
import ErrorMessage from "../../components/MensajeError";
import Loading from "../../components/Loading";
import { ThemeContext } from "../../context/ThemeContext";

const SECCIONES = [
  {
    titulo: "Preferencias",
    filas: [
      { id: "idioma", label: "Idioma", icon: "globe-outline" },
      { id: "tema", label: "Tema", icon: "color-palette-outline" },
      { id: "notificaciones", label: "Notificaciones", icon: "notifications-outline" },
    ],
  },
  {
    titulo: "Legal",
    filas: [
      { id: "terminos", label: "Términos y Condiciones", icon: "document-text-outline" },
      { id: "privacidad", label: "Política de Privacidad", icon: "shield-checkmark-outline" },
      { id: "aviso", label: "Aviso Legal", icon: "scale-outline" },
    ],
  },
  {
    titulo: "Soporte",
    filas: [
      { id: "faqs", label: "Preguntas Frecuentes (FAQs)", icon: "help-circle-outline" },
      { id: "nosotros", label: "Sobre nosotros", icon: "people-outline" },
    ],
  },
];

export default function Configuracion() {
  const { isDarkMode, setIsDarkMode, colors } = useContext(ThemeContext);

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

  // Por ahora solo "Tema" tiene acción; el resto queda listo para navegar.
  const handleFila = (id) => {
    if (id === "tema") setIsDarkMode(!isDarkMode);
    // TODO: navigation.navigate(...) para las demás filas
  };

  const handleEditarPerfil = () => {
    // TODO: navigation.navigate("EditarPerfil")
  };

  return (
    <SafeAreaView
      style={[styles.fondo, { backgroundColor: colors?.background ?? "#15151C" }]}
    >
      {profileLoading ? (
        <Loading />
      ) : (
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.titulo}>Configuración</Text>
          {profile ? (
            <View style={styles.tarjetaPerfil}>
              <Image
                source={{ uri: profile.foto_perfil }}
                style={styles.fotoPerfil}
              />
              <View style={styles.datosPerfil}>
                <Text style={styles.nombreCompleto} numberOfLines={1}>
                  {profile.nombre} {profile.apellido}
                </Text>
                <Text style={styles.username} numberOfLines={1}>
                  @{profile.username}
                </Text>
              </View>
              <TouchableOpacity
                onPress={handleEditarPerfil}
                accessibilityLabel="Editar perfil"
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="pencil" size={20} color="#FFFFFF" />
              </TouchableOpacity>
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

          {SECCIONES.map((seccion) => (
            <View key={seccion.titulo}>
              <Text style={styles.tituloSeccion}>{seccion.titulo}</Text>
              <View style={styles.tarjetaSeccion}>
                {seccion.filas.map((fila, index) => (
                  <TouchableOpacity
                    key={fila.id}
                    onPress={() => handleFila(fila.id)}
                    activeOpacity={0.7}
                    style={[
                      styles.fila,
                      index < seccion.filas.length - 1 && styles.filaDivisor,
                    ]}
                  >
                    <View style={styles.iconoCirculo}>
                      <Ionicons name={fila.icon} size={14} color="#FFFFFF" />
                    </View>
                    <Text style={styles.etiquetaFila}>{fila.label}</Text>
                    {fila.id === "tema" ? (
                      <Switch
                        value={isDarkMode}
                        onValueChange={setIsDarkMode}
                        accessibilityLabel="Modo oscuro"
                        trackColor={{ false: "#767577", true: "#7950A8" }}
                        thumbColor="#FFFFFF"
                      />
                    ) : (
                      <Ionicons name="chevron-forward" size={18} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}

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
          <Text style={styles.textoCopyVersion}>Versión 1.0.0</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const MORADO = "#5B3A8C";

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: 14,
    paddingTop: 30,
    paddingBottom: 110,
  },
  center: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 24,
  },
  errorText: {
    color: "#FF7A7A",
    textAlign: "center",
    marginBottom: 14,
    fontFamily: "Utendo",
  },
  tarjetaPerfil: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: MORADO,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginBottom: 22,
    marginTop: 10
  },
  fotoPerfil: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  datosPerfil: {
    flex: 1,
  },
  nombreCompleto: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    fontSize: 16,
  },
  username: {
    color: "#E0D4F0",
    fontFamily: "Utendo",
    fontSize: 11,
    marginTop: 2,
  },
  tituloSeccion: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    fontSize: 15,
    marginBottom: 8,
    marginLeft: 2,
  },
  tarjetaSeccion: {
    backgroundColor: MORADO,
    borderRadius: 12,
    marginBottom: 20,
    overflow: "hidden",
  },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 12,
  },
  filaDivisor: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.35)",
  },
  iconoCirculo: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: "#57C7A3",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 10,
  },
  etiquetaFila: {
    flex: 1,
    color: "#FFFFFF",
    fontFamily: "Utendo",
    fontSize: 13,
  },
  botonCerrar: {
    backgroundColor: "#d30909",
    borderWidth: 1.5,
    borderColor: "#a00a0a",
    borderRadius: 15,
    paddingVertical: 12,
    marginBottom: 20,
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
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
titulo: {
  color: "#FFFFFF",
  fontFamily: "CashMarket",
  fontSize: 30,
  marginBottom: 20,
},
});