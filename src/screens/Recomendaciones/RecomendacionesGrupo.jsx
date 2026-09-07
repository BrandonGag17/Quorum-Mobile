import React from 'react'
import {
  ActivityIndicator,
  FlatList,
  Linking,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import Feather from '@expo/vector-icons/Feather'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'
import useGroupRecommendations from '../../hooks/useGroupRecommendations'
import ErrorMessage from '../../components/MensajeError'

export default function RecomendacionesGrupo() {
  const navigation = useNavigation()
  const route = useRoute()
  const idGrupo = route.params?.idGrupo

  const {
    lugares,
    lugaresSeleccionados,
    cantidadSeleccionados,
    loading,
    error,
    estaSeleccionado,
    alternarSeleccion,
    getGoogleMapsUrl,
    volverARecomendar,
    reintentar,
  } = useGroupRecommendations(idGrupo)

  function confirmarSeleccion() {
    if (!cantidadSeleccionados) return

    // Volvemos a la instancia existente. Así no se pierden el nombre, las
    // fechas ni los lugares manuales que ya estaban en el formulario.
    navigation.popTo('ProponerJuntada', {
      idGrupo,
      lugaresRecomendados: lugaresSeleccionados,
    })
  }

  function abrirEnGoogleMaps(lugar) {
    Linking.openURL(getGoogleMapsUrl(lugar))
  }

  return (
    <SafeAreaView style={styles.fondo}>
      <View style={styles.encabezado}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={styles.botonVolver}
          accessibilityRole="button"
          accessibilityLabel="Volver a la propuesta"
        >
          <Feather name="arrow-left" size={25} color="#FFFFFF" />
        </Pressable>

        <View style={styles.titulos}>
          <Text style={styles.titulo}>Recomendaciones del grupo</Text>
          <Text style={styles.subtitulo}>
            Elegí los lugares que quieras agregar a la votación.
          </Text>
        </View>
      </View>

      {error ? (
        <View>
          <ErrorMessage mensaje={error} />
          <Pressable style={styles.botonSecundario} onPress={() => reintentar()}>
            <Text style={styles.textoBoton}>Reintentar</Text>
          </Pressable>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.cargando}>
          <ActivityIndicator size="large" color="#A846E9" />
          <Text style={styles.textoCargando}>Buscando lugares para el grupo...</Text>
        </View>
      ) : (
        <FlatList
          data={lugares}
          numColumns={2}
          columnWrapperStyle={styles.fila}
          keyExtractor={(item) => String(item.id)}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            !error ? (
              <Text style={styles.vacio}>No encontramos más lugares.</Text>
            ) : null
          }
          renderItem={({ item }) => {
            const seleccionado = estaSeleccionado(item)

            return (
              <View
                style={[styles.card, seleccionado && styles.cardSeleccionada]}
              >
                <Pressable
                  onPress={() => alternarSeleccion(item)}
                  accessibilityRole="checkbox"
                  accessibilityState={{ checked: seleccionado }}
                  accessibilityLabel={`Seleccionar ${item.nombre}`}
                >
                  <View style={styles.imagenPlaceholder}>
                    <FontAwesome6
                      name="map-location-dot"
                      size={31}
                      color={seleccionado ? '#FFFFFF' : '#BDBDC7'}
                    />
                    <Feather
                      name={seleccionado ? 'check-circle' : 'circle'}
                      size={23}
                      color={seleccionado ? '#FFFFFF' : '#BDBDC7'}
                      style={styles.indicadorSeleccion}
                    />
                  </View>

                  <View style={styles.info}>
                    <Text numberOfLines={1} style={styles.nombre}>{item.nombre}</Text>
                    <Text numberOfLines={2} style={styles.direccion}>{item.direccion}</Text>
                  </View>
                </Pressable>

                <Pressable
                  style={styles.botonMaps}
                  onPress={() => abrirEnGoogleMaps(item)}
                  accessibilityRole="link"
                  accessibilityLabel={`Ver ${item.nombre} en Google Maps`}
                >
                  <FontAwesome6 name="map-location-dot" size={14} color="#FFFFFF" />
                  <Text style={styles.textoMaps}>Ver en Google Maps</Text>
                </Pressable>
              </View>
            )
          }}
        />
      )}

      <View style={styles.acciones}>
        <Pressable
          style={styles.botonSecundario}
          onPress={() => volverARecomendar()}
          disabled={loading}
        >
          <Feather name="refresh-cw" size={18} color="#FFFFFF" />
          <Text style={styles.textoBoton}>Volver a recomendar</Text>
        </Pressable>

        <Pressable
          style={[
            styles.botonPrincipal,
            !cantidadSeleccionados && styles.botonDeshabilitado,
          ]}
          onPress={confirmarSeleccion}
          disabled={!cantidadSeleccionados || loading}
        >
          <Text style={styles.textoBoton}>
            Agregar lugares ({cantidadSeleccionados})
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#15151C', paddingHorizontal: 25 },
  encabezado: { flexDirection: 'row', marginTop: 12, marginBottom: 18 },
  botonVolver: {
    width: 42,
    height: 42,
    borderRadius: 12,
    backgroundColor: '#2B2B35',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  titulos: { flex: 1 },
  titulo: { color: '#FFFFFF', fontFamily: 'CashMarket', fontSize: 24 },
  subtitulo: {
    color: '#BDBDC7',
    fontFamily: 'Utendo',
    fontSize: 13,
    lineHeight: 18,
    marginTop: 4,
  },
  lista: { paddingBottom: 12, flexGrow: 1 },
  fila: { justifyContent: 'space-between' },
  card: {
    width: '48%',
    backgroundColor: '#4D216B',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    overflow: 'hidden',
    marginBottom: 16,
  },
  cardSeleccionada: { backgroundColor: '#66278F', borderColor: '#C98BFF' },
  imagenPlaceholder: {
    height: 105,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#3C1B53',
  },
  indicadorSeleccion: { position: 'absolute', top: 9, right: 9 },
  info: { padding: 10 },
  nombre: { color: '#FFFFFF', fontFamily: 'CashMarket', fontSize: 15 },
  direccion: {
    color: '#E7D8FF',
    fontFamily: 'Utendo',
    fontSize: 11,
    lineHeight: 15,
    marginTop: 4,
  },
  botonMaps: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.2)',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 7,
    paddingVertical: 9,
  },
  textoMaps: {
    color: '#FFFFFF',
    fontFamily: 'Utendo',
    fontSize: 10,
    marginLeft: 5,
  },
  cargando: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  textoCargando: { color: '#FFFFFF', fontFamily: 'Utendo', marginTop: 12 },
  vacio: {
    color: '#BDBDC7',
    fontFamily: 'Utendo',
    textAlign: 'center',
    marginTop: 50,
  },
  acciones: { paddingVertical: 12 },
  botonSecundario: {
    minHeight: 46,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#8C60B8',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
    paddingHorizontal: 14,
  },
  botonPrincipal: {
    minHeight: 48,
    borderRadius: 14,
    backgroundColor: '#5E2D82',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
  },
  botonDeshabilitado: { opacity: 0.45 },
  textoBoton: {
    color: '#FFFFFF',
    fontFamily: 'CashMarket',
    fontSize: 16,
    marginLeft: 7,
  },
})
