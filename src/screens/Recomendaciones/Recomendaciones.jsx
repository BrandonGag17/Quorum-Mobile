import React, { useState } from 'react'
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

export default function Recomendaciones() {
  const navigation = useNavigation()
  const [lugarSeleccionado, setLugarSeleccionado] = useState(null)

  const {
    lugaresFiltrados,
    busqueda,
    setBusqueda,
    loading,
    error,
    refresh,
    getGoogleMapsUrl,
  } = useRecommendations()

  function abrirEnGoogleMaps(lugar) {
    const url = getGoogleMapsUrl(lugar)
    Linking.openURL(url)
  }

  function abrirDetalle(lugar) {
    const state = navigation.getState?.()
    const routeNames = state?.routeNames || []

    if (routeNames.includes('InfoRecomendaciones')) {
      navigation.navigate('InfoRecomendaciones', { lugar })
      return
    }

    setLugarSeleccionado(lugar)
  }

  if (lugarSeleccionado) {
    return (
      <InfoRecomendaciones
        lugarOverride={lugarSeleccionado}
        onBack={() => setLugarSeleccionado(null)}
      />
    )
  }

  if (loading) {
    return <Loading />
  }

  return (
    <SafeAreaView style={styles.fondo}>
      <Text style={styles.titulo}>Recomendación de lugares</Text>

      <View style={styles.buscador}>
        <Feather
          name="search"
          size={22}
          color="#808080"
        />

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

          <TouchableOpacity
            style={styles.botonReintentar}
            onPress={refresh}
          >
            <Text style={styles.textoReintentar}>Reintentar</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <FlatList
        data={lugaresFiltrados}
        numColumns={2}
        columnWrapperStyle={styles.fila}
        keyExtractor={(item) => String(item.id)}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>No encontramos lugares para mostrar.</Text>
          </View>
        }
        renderItem={({ item }) => (
          <View style={styles.card}>
            <TouchableOpacity
              style={styles.botonGoogleMaps}
              onPress={() => abrirEnGoogleMaps(item)}
              accessibilityRole="button"
              accessibilityLabel={`Abrir ${item.nombre} en Google Maps`}
            >
              <FontAwesome6
                name="map-location-dot"
                size={30}
                color="#BDBDC7"
              />

              <Text style={styles.textoSinImagen}>Abrir en Google Maps</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.info}
              onPress={() => abrirDetalle(item)}
            >
              <Text numberOfLines={1} style={styles.nombre}>{item.nombre}</Text>

              <View style={styles.direccionContainer}>
                <FontAwesome6
                  name="location-dot"
                  size={11}
                  color="#B6B6B6"
                  style={styles.iconoDireccion}
                />

                <Text numberOfLines={2} style={styles.direccion}>{item.direccion}</Text>
              </View>
            </TouchableOpacity>
          </View>
        )}
      />
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fondo: {
    flex: 1,
    backgroundColor: '#15151C',
    padding: 25,
    paddingBottom: 90,
  },
  titulo: {
    color: 'white',
    fontFamily: 'CashMarket',
    fontSize: 24,
    marginBottom: 10,
    marginTop: 7,
  },
  fila: {
    justifyContent: 'space-between',
  },
  card: {
    width: '48%',
    backgroundColor: '#66278F',
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 16,
  },
  botonGoogleMaps: {
    width: '100%',
    height: 120,
    backgroundColor: '#4D216B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  textoSinImagen: {
    color: '#BDBDC7',
    fontFamily: 'Utendo',
    fontSize: 12,
    marginTop: 8,
  },
  info: {
    padding: 10,
  },
  nombre: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  direccionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  iconoDireccion: {
    marginRight: 6,
  },
  direccion: {
    flex: 1,
    color: '#E7D8FF',
    fontSize: 12,
    fontFamily: 'Utendo',
  },
  buscador: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#373749',
    borderRadius: 16,
    paddingHorizontal: 15,
    height: 52,
    marginBottom: 20,
    marginTop: 20,
    borderWidth: 1,
    borderColor: '#726c79',
  },
  inputBuscador: {
    flex: 1,
    color: 'white',
    fontFamily: 'Utendo',
    marginLeft: 10,
    fontSize: 16,
  },
  errorWrapper: {
    marginBottom: 14,
  },
  botonReintentar: {
    alignSelf: 'center',
    backgroundColor: '#4A216F',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 6,
  },
  textoReintentar: {
    color: 'white',
    fontFamily: 'Utendo',
  },
  emptyState: {
    marginTop: 40,
    backgroundColor: '#2B2B32',
    borderRadius: 12,
    padding: 16,
  },
  emptyText: {
    color: '#BDBDC7',
    textAlign: 'center',
    fontFamily: 'Utendo',
  },
})
