import React, { useState } from "react";
import {
  StyleSheet,
  Text,
  View,
  FlatList,
  TouchableOpacity,
  TextInput,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import useRecommendations from '../../hooks/useRecommendations'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/MensajeError'
import InfoRecomendaciones from './InfoRecomendaciones'
import SeccionesRecomendaciones from '../../components/SeccionesRecomendaciones'
import PresentacionQBot from './PresentacionQBot'
import useQBot from '../../hooks/useQBot'

export default function Recomendaciones() {
  const navigation = useNavigation()
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null)
  const [seccion, setSeccion] = useState('lugares')
  // Vive en la pantalla para conservarlo cuando se desmonta la solapa Q-Bot.
  const qbot = useQBot()

  const {
    lugaresFiltrados,
    busqueda,
    setBusqueda,
    loading,
    error,
    refresh,
    getGoogleMapsUrl,
  } = useRecommendations();

  function abrirEnGoogleMaps(lugar) {
    const url = getGoogleMapsUrl(lugar);
    Linking.openURL(url);
  }

  function abrirDetalle(lugar) {
    const state = navigation.getState?.();
    const routeNames = state?.routeNames || [];

    if (routeNames.includes("InfoRecomendaciones")) {
      navigation.navigate("InfoRecomendaciones", { lugar });
      return;
    }

    setLugarSeleccionado(lugar);
  }

  if (lugarSeleccionado) {
    return (
      <InfoRecomendaciones
        lugarOverride={lugarSeleccionado}
        onBack={() => setLugarSeleccionado(null)}
      />
    );
  }

  return (
    <SafeAreaView style={styles.fondo}>
      <SeccionesRecomendaciones seleccionada={seccion} onChange={setSeccion} />

      {seccion === 'qbot' ? (
        <PresentacionQBot
          mensaje={qbot.mensaje}
          onChangeMensaje={qbot.setMensaje}
          onEnviar={qbot.enviar}
          loading={qbot.loading}
          error={qbot.error}
          resultado={qbot.resultado}
          onAbrirDetalle={abrirDetalle}
        />
      ) : null}

      {seccion === 'actividades' ? (
        <View style={styles.emptyState}>
          <Text style={styles.titulo}>Actividades</Text>
          <Text style={styles.emptyText}>
            Próximamente: juegos, preguntas para charlar y más ideas para compartir con amigos.
          </Text>
        </View>
      ) : null}

      {/* Conservamos montada la lista para mantener su posición al cambiar de solapa.
          El hook también permanece en esta pantalla: cambiar de sección no vuelve a consultar. */}
      <View style={[styles.lugares, seccion !== 'lugares' && styles.oculto]}>
      <Text style={styles.titulo}>Recomendación de lugares</Text>

      <View style={styles.buscador}>
        <Feather name="search" size={22} color="#808080" />

        <TextInput
          style={styles.inputBuscador}
          placeholder="Buscar lugares"
          placeholderTextColor="#808080"
          value={busqueda}
          onChangeText={setBusqueda}
        />
      </View>

      {error ? (
        <View style={styles.errorWrapper}>
          <ErrorMessage mensaje={error} />

          <TouchableOpacity style={styles.botonReintentar} onPress={refresh}>
            <Text style={styles.textoReintentar}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      {loading ? <Loading /> : <FlatList
        data={lugaresFiltrados}
        numColumns={2}
        columnWrapperStyle={styles.fila}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          !error ? <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No encontramos lugares para mostrar.</Text>
          </View> : null
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => abrirDetalle(item)}
            activeOpacity={0.85}
          >
            <View style={styles.cardVisual}>
              <View style={styles.locationIcon}>
                <FontAwesome6 name="location-dot" size={22} color="#5CC2A7" />
              </View>

              <TouchableOpacity
                style={styles.mapsButton}
                onPress={() => abrirEnGoogleMaps(item)}
                accessibilityRole="button"
                accessibilityLabel={`Abrir ${item.nombre} en Google Maps`}
              >
                <FontAwesome6
                  name="map-location-dot"
                  size={15}
                  color="#FFFFFF"
                />
              </TouchableOpacity>
            </View>

            <View style={styles.info}>
              <Text numberOfLines={2} style={styles.nombre}>
                {item.nombre}
              </Text>

              <View style={styles.direccionContainer}>
                <FontAwesome6
                  name="location-dot"
                  size={10}
                  color="#A9A9B5"
                  style={styles.iconoDireccion}
                />

                <Text numberOfLines={2} style={styles.direccion}>
                  {item.direccion}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}
      />}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  lugares: { flex: 1 },
  oculto: { display: 'none' },
  fondo: {
    flex: 1,
    backgroundColor: "#15151C",
    padding: 25,
    paddingBottom: 90,
  },
  header: {
    marginTop: 7,
    marginBottom: 4,
  },
  titulo: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    fontSize: 27,
    letterSpacing: -0.5,
  },
  subtitulo: {
    color: "#A9A9B5",
    fontFamily: "Utendo",
    fontSize: 14,
    marginTop: 4,
  },
  fila: {
    justifyContent: "space-between",
  },
  card: {
    width: "48%",
    backgroundColor: "#5C3E94",
    borderRadius: 15,
    overflow: "hidden",
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#6846A5",
  },
  botonGoogleMaps: {
    width: "100%",
    height: 120,
    backgroundColor: "#5C3E94",
    justifyContent: "center",
    alignItems: "center",
  },
  textoSinImagen: {
    color: "#BDBDC7",
    fontFamily: "Utendo",
    fontSize: 12,
    marginTop: 8,
  },
  info: {
    padding: 12,
    minHeight: 82,
  },
  nombre: {
    color: "#FFFFFF",
    fontFamily: "CashMarket",
    fontSize: 16,
    lineHeight: 19,
    fontWeight: "700",
  },
  direccionContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 4,
  },
  iconoDireccion: {
    marginRight: 6,
  },
  direccion: {
    flex: 1,
    color: "#B9B9C7",
    fontSize: 11,
    lineHeight: 16,
    fontFamily: "Utendo",
  },
  buscador: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#25252a",
    borderRadius: 15,
    paddingHorizontal: 15,
    height: 52,
    marginBottom: 30,
    marginTop: 10,
    borderWidth: 1,
    borderColor: "#353540",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 5,
    },
    shadowOpacity: 0.35,
    shadowRadius: 5,
    elevation: 6,
  },
  inputBuscador: {
    flex: 1,
    color: "white",
    fontFamily: "Utendo",
    marginLeft: 10,
    fontSize: 16,
  },
  errorWrapper: {
    marginBottom: 14,
  },
  botonReintentar: {
    alignSelf: "center",
    backgroundColor: "#4A216F",
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 6,
  },
  textoReintentar: {
    color: "white",
    fontFamily: "Utendo",
  },
  emptyState: {
    marginTop: 40,
    backgroundColor: "#202027",
    borderRadius: 16,
    paddingVertical: 26,
    paddingHorizontal: 20,
    borderWidth: 1,
    borderColor: "#353540",
  },
  emptyText: {
    color: "#A9A9B5",
    textAlign: "center",
    fontFamily: "Utendo",
    fontSize: 14,
    lineHeight: 20,
  },
  cardVisual: {
    height: 110,
    backgroundColor: "#493477",
    alignItems: "center",
    justifyContent: "center",
    position: "relative",
  },

  locationIcon: {
    width: 52,
    height: 52,
    borderRadius: 26,
    backgroundColor: "rgba(92, 194, 167, 0.12)",
    alignItems: "center",
    justifyContent: "center",
  },

  mapsButton: {
    position: "absolute",
    top: 10,
    right: 10,
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: "rgba(21, 21, 28, 0.55)",
    alignItems: "center",
    justifyContent: "center",
  },
});
