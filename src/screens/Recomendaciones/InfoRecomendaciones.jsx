import React from "react";
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useNavigation, useRoute } from "@react-navigation/native";
import Ionicons from "@expo/vector-icons/Ionicons";
import Entypo from "@expo/vector-icons/Entypo";

import Loading from "../../components/Loading";
import ErrorMessage from "../../components/MensajeError";
import useRecommendationDetail from "../../hooks/useRecommendationDetail";

export default function InfoRecomendaciones({ lugarOverride, onBack }) {
  const navigation = useNavigation();
  const route = useRoute();

  const lugarInicial = lugarOverride || route.params?.lugar || null;

  const { lugar, categoria, googleMapsUrl, loading, error, refresh } =
    useRecommendationDetail(lugarInicial);

  function volver() {
    if (onBack) {
      onBack();
      return;
    }

    if (navigation.canGoBack()) {
      navigation.goBack();
    }
  }

  if (loading) {
    return <Loading />;
  }

  return (
    <SafeAreaView style={styles.fondo}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contenido}
      >
        <TouchableOpacity
          style={styles.botonVolver}
          onPress={volver}
          activeOpacity={0.7}
        >
          <Ionicons name="chevron-back" size={21} color="#B9B9C7" />

          <Text style={styles.textoVolver}>Volver</Text>
        </TouchableOpacity>

        <View style={styles.imagenContainer}>
          <Image
            source={require("../../../assets/img/Placeholders/laHormiga.png")}
            style={styles.imagen}
          />

          <TouchableOpacity
            style={styles.mapsFlotante}
            onPress={() => Linking.openURL(googleMapsUrl)}
            activeOpacity={0.8}
          >
            <Ionicons name="map-outline" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={styles.titulo}>{lugar?.nombre || "Lugar"}</Text>

        <View style={styles.metaContainer}>
          {categoria ? (
            <View style={styles.categoria}>
              <Text style={styles.categoriaTexto}>{categoria}</Text>
            </View>
          ) : null}

          <View style={styles.rating}>
            <Ionicons name="star-outline" size={14} color="#000" />

            <Text style={styles.ratingTexto}>Sin valoraciones</Text>
          </View>
        </View>

        <View style={styles.locationCard}>
          <View style={styles.locationIcon}>
            <Entypo name="location-pin" size={23} color="#5CC2A7" />
          </View>

          <View style={styles.locationInfo}>
            <Text style={styles.locationLabel}>Ubicación</Text>

            <Text style={styles.locationAddress}>
              {lugar?.direccion || "-"}
            </Text>

            {lugar?.ciudad || lugar?.provincia ? (
              <Text style={styles.locationCity}>
                {[lugar?.ciudad, lugar?.provincia].filter(Boolean).join(", ")}
              </Text>
            ) : null}
          </View>
        </View>

        <TouchableOpacity
          style={styles.botonMaps}
          onPress={() => Linking.openURL(googleMapsUrl)}
          activeOpacity={0.8}
        >
          <Ionicons name="map-outline" size={21} color="#15151C" />

          <Text style={styles.textoBoton}>Abrir en Google Maps</Text>

          <Ionicons name="arrow-forward" size={18} color="#15151C" />
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorContainer}>
            <ErrorMessage mensaje={error} />

            <TouchableOpacity
              style={styles.reintentar}
              onPress={refresh}
              activeOpacity={0.8}
            >
              <Text style={styles.reintentarTexto}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {lugar?.descripcion ? (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Descripción</Text>

            <Text style={styles.descripcion}>{lugar.descripcion}</Text>
          </View>
        ) : null}

        <View style={styles.seccion}>
          <Text style={styles.seccionTitulo}>Información</Text>

          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.label}>Ciudad</Text>

              <Text style={styles.valor}>{lugar?.ciudad || "-"}</Text>
            </View>

            <View style={styles.separador} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Provincia</Text>

              <Text style={styles.valor}>{lugar?.provincia || "-"}</Text>
            </View>

            <View style={styles.separador} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>Código Postal</Text>

              <Text style={styles.valor}>{lugar?.codigoPostal || "-"}</Text>
            </View>

            <View style={styles.separador} />

            <View style={styles.infoRow}>
              <Text style={styles.label}>País</Text>

              <Text style={styles.valor}>{lugar?.pais || "-"}</Text>
            </View>
          </View>
        </View>

        {lugar?.telefono || lugar?.sitioWeb || lugar?.email ? (
          <View style={styles.seccion}>
            <Text style={styles.seccionTitulo}>Contacto</Text>

            <View style={styles.infoCard}>
              {lugar?.telefono ? (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Teléfono</Text>

                    <Text style={styles.valor} numberOfLines={2}>
                      {lugar.telefono}
                    </Text>
                  </View>

                  {lugar?.sitioWeb || lugar?.email ? (
                    <View style={styles.separador} />
                  ) : null}
                </>
              ) : null}

              {lugar?.sitioWeb ? (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Sitio web</Text>

                    <Text style={styles.valor} numberOfLines={2}>
                      {lugar.sitioWeb}
                    </Text>
                  </View>

                  {lugar?.email ? <View style={styles.separador} /> : null}
                </>
              ) : null}

              {lugar?.email ? (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email</Text>

                  <Text style={styles.valor} numberOfLines={2}>
                    {lugar.email}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: "#15151C",
    paddingHorizontal: 25,
    paddingTop: 18,
  },

  contenido: {
    paddingBottom: 35,
  },

  botonVolver: {
    flexDirection: "row",
    alignItems: "center",
    alignSelf: "flex-start",
    height: 40,
    marginBottom: 8,
  },

  textoVolver: {
    color: "#B9B9C7",
    fontFamily: "Utendo",
    fontSize: 14,
    marginLeft: 2,
  },

  imagenContainer: {
    width: "100%",
    height: 220,
    borderRadius: 20,
    overflow: "hidden",
    backgroundColor: "#493477",
    marginTop: 4,
    position: "relative",
  },

  imagen: {
    width: "100%",
    height: "100%",
  },

  mapsFlotante: {
    position: "absolute",
    top: 12,
    right: 12,
    width: 42,
    height: 42,
    borderRadius: 13,
    backgroundColor: "rgba(21, 21, 28, 0.78)",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.12)",
  },

  titulo: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    fontSize: 30,
    lineHeight: 35,
    marginTop: 16,
    letterSpacing: -0.5,
  },

  metaContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 20,
  },

  categoria: {
    backgroundColor: "#5C3E94",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
    marginRight: 8,
    borderWidth: 1,
    borderColor: "#6846A5",
  },

  categoriaTexto: {
    color: "#FFFFFF",
    fontFamily: "Utendo",
    fontSize: 12,
    fontWeight: "600",
  },

  rating: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#57C7A3",
    borderRadius: 10,
    paddingHorizontal: 11,
    paddingVertical: 7,
  },

  ratingTexto: {
    color: "#000",
    fontFamily: "Utendo",
    fontSize: 12,
    fontWeight: "600",
    marginLeft: 5,
  },

  locationCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#202027",
    borderRadius: 16,
    padding: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#353540",
  },

  locationIcon: {
    width: 44,
    height: 44,
    borderRadius: 13,
    backgroundColor: "rgba(92, 194, 167, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  locationInfo: {
    flex: 1,
    marginLeft: 12,
  },

  locationLabel: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    fontSize: 14,
  },

  locationAddress: {
    color: "#D0D0D8",
    fontFamily: "Utendo",
    fontSize: 13,
    lineHeight: 18,
    marginTop: 3,
  },

  locationCity: {
    color: "#898995",
    fontFamily: "Utendo",
    fontSize: 12,
    marginTop: 2,
  },

  botonMaps: {
    height: 54,
    backgroundColor: "#5CC2A7",
    borderRadius: 15,
    justifyContent: "center",
    alignItems: "center",
    flexDirection: "row",
    paddingHorizontal: 18,
    marginBottom: 30,
  },

  textoBoton: {
    color: "#15151C",
    fontFamily: "CashMarket",
    fontSize: 15,
    marginLeft: 9,
    flex: 1,
  },
  seccion: {
    marginBottom: 28,
  },

  seccionTitulo: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    fontSize: 19,
    marginBottom: 10,
    letterSpacing: -0.2,
  },
  descripcion: {
    color: "#B9B9C7",
    fontFamily: "Utendo",
    fontSize: 14,
    lineHeight: 21,
  },

  infoCard: {
    backgroundColor: "#202027",
    borderRadius: 16,
    paddingHorizontal: 16,
    borderWidth: 1,
    borderColor: "#353540",
  },

  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    minHeight: 50,
  },

  label: {
    color: "#898995",
    fontFamily: "Utendo",
    fontSize: 13,
  },

  valor: {
    color: "#FFFFFF",
    fontFamily: "Utendo",
    fontSize: 13,
    lineHeight: 18,
    flex: 1,
    textAlign: "right",
    marginLeft: 20,
  },

  separador: {
    height: 1,
    backgroundColor: "#353540",
  },

  errorContainer: {
    marginBottom: 24,
  },

  reintentar: {
    alignSelf: "center",
    backgroundColor: "#5CC2A7",
    borderRadius: 11,
    paddingHorizontal: 18,
    height: 40,
    justifyContent: "center",
    marginTop: 8,
  },

  reintentarTexto: {
    color: "#15151C",
    fontFamily: "Utendo",
    fontWeight: "700",
    fontSize: 14,
  },
});
