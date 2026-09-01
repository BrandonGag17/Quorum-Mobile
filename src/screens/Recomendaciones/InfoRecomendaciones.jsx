import React from 'react'
import {
  StyleSheet,
  Text,
  View,
  Image,
  ScrollView,
  TouchableOpacity,
  Linking,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation, useRoute } from '@react-navigation/native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Entypo from '@expo/vector-icons/Entypo'
import Iconos from '../../components/Iconos'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/MensajeError'
import useRecommendationDetail from '../../hooks/useRecommendationDetail'

export default function InfoRecomendaciones({ lugarOverride, onBack }) {
  const navigation = useNavigation()
  const route = useRoute()

  const lugarInicial = lugarOverride || route.params?.lugar || null

  const {
    lugar,
    categoria,
    googleMapsUrl,
    loading,
    error,
    refresh,
  } = useRecommendationDetail(lugarInicial)

  function volver() {
    if (onBack) {
      onBack()
      return
    }

    if (navigation.canGoBack()) {
      navigation.goBack()
    }
  }

  if (loading) {
    return <Loading />
  }

  return (
    <SafeAreaView style={styles.fondo}>
      <ScrollView showsVerticalScrollIndicator={false}>
        <TouchableOpacity style={styles.botonVolver} onPress={volver}>
          <Ionicons name="chevron-back" size={22} color="#FFFFFF" />
          <Text style={styles.textoVolver}>Volver</Text>
        </TouchableOpacity>

        <Image
          source={require('../../../assets/img/Placeholders/PlaceholderPerfil.png')}
          style={styles.imagen}
        />

        <Text style={styles.titulo}>{lugar?.nombre || 'Lugar'}</Text>

        <View style={styles.ratingContainer}>
          <View style={styles.rating}>
            <Text style={styles.ratingTexto}>⭐ Sin valoraciones</Text>
          </View>

          <View style={styles.categoria}>
            <Text style={styles.categoriaTexto}>{categoria}</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.botonMaps}
          onPress={() => Linking.openURL(googleMapsUrl)}
        >
          <Ionicons name="images-outline" size={22} color="#000" />
          <Text style={styles.textoBoton}>Ver fotos y ficha en Google Maps</Text>
        </TouchableOpacity>

        {error ? (
          <View style={styles.errorContainer}>
            <ErrorMessage mensaje={error} />

            <TouchableOpacity
              style={styles.reintentar}
              onPress={refresh}
            >
              <Text style={styles.reintentarTexto}>Reintentar</Text>
            </TouchableOpacity>
          </View>
        ) : null}

        {lugar?.descripcion ? (
          <>
            <Iconos
              titulo="Descripción"
              size={36}
              icono={<Ionicons name="information-circle" size={24} color="#000" />}
            />

            <View style={styles.card}>
              <Text style={styles.descripcion}>{lugar.descripcion}</Text>
            </View>
          </>
        ) : null}

        <Iconos
          titulo="Ubicación"
          size={36}
          icono={<Entypo name="location-pin" size={24} color="#000" />}
        />

        <View style={styles.card}>
          <View style={styles.filaInfo}>
            <Entypo name="location-pin" size={20} color="#57C7A3" />
            <Text style={styles.infoTexto}>{lugar?.direccion || '-'}</Text>
          </View>
        </View>

        <Iconos
          titulo="Información"
          size={36}
          icono={<Ionicons name="information-circle" size={24} color="#000" />}
        />

        <View style={styles.card}>
          <View style={styles.infoRow}>
            <Text style={styles.label}>Ciudad</Text>
            <Text style={styles.valor}>{lugar?.ciudad || '-'}</Text>
          </View>

          <View style={styles.separador} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Provincia</Text>
            <Text style={styles.valor}>{lugar?.provincia || '-'}</Text>
          </View>

          <View style={styles.separador} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>Código Postal</Text>
            <Text style={styles.valor}>{lugar?.codigoPostal || '-'}</Text>
          </View>

          <View style={styles.separador} />

          <View style={styles.infoRow}>
            <Text style={styles.label}>País</Text>
            <Text style={styles.valor}>{lugar?.pais || '-'}</Text>
          </View>
        </View>

        {lugar?.telefono || lugar?.sitioWeb || lugar?.email ? (
          <>
            <Iconos
              titulo="Contacto"
              size={36}
              icono={<Ionicons name="call" size={24} color="#000" />}
            />

            <View style={styles.card}>
              {lugar?.telefono ? (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Teléfono</Text>
                    <Text style={styles.valor}>{lugar.telefono}</Text>
                  </View>
                  <View style={styles.separador} />
                </>
              ) : null}

              {lugar?.sitioWeb ? (
                <>
                  <View style={styles.infoRow}>
                    <Text style={styles.label}>Sitio web</Text>
                    <Text style={styles.valor}>{lugar.sitioWeb}</Text>
                  </View>
                  {lugar?.email ? <View style={styles.separador} /> : null}
                </>
              ) : null}

              {lugar?.email ? (
                <View style={styles.infoRow}>
                  <Text style={styles.label}>Email</Text>
                  <Text style={styles.valor}>{lugar.email}</Text>
                </View>
              ) : null}
            </View>
          </>
        ) : null}
      </ScrollView>
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
  botonVolver: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
  },
  textoVolver: {
    color: 'white',
    fontFamily: 'Utendo',
    marginLeft: 4,
    fontSize: 15,
  },
  imagen: {
    width: '100%',
    height: 220,
    borderRadius: 18,
    marginTop: 15,
  },
  titulo: {
    color: 'white',
    fontFamily: 'CashMarket',
    fontSize: 28,
    marginTop: 18,
  },
  ratingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 28,
  },
  rating: {
    backgroundColor: '#FFE28A',
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
  },
  ratingTexto: {
    color: '#000',
    fontFamily: 'CashMarket',
    fontSize: 13,
  },
  categoria: {
    backgroundColor: '#57C7A3',
    borderRadius: 25,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  categoriaTexto: {
    color: '#000',
    fontFamily: 'CashMarket',
    fontSize: 13,
  },
  card: {
    backgroundColor: '#23232D',
    borderRadius: 18,
    padding: 18,
    marginTop: 12,
    marginBottom: 26,
  },
  filaInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  infoTexto: {
    color: 'white',
    fontFamily: 'Utendo',
    fontSize: 15,
    marginLeft: 10,
    flex: 1,
    lineHeight: 22,
  },
  descripcion: {
    color: 'white',
    fontFamily: 'Utendo',
    fontSize: 15,
    lineHeight: 23,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  label: {
    color: '#BDBDC7',
    fontFamily: 'CashMarket',
    fontSize: 14,
  },
  valor: {
    color: 'white',
    fontFamily: 'Utendo',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    marginLeft: 20,
  },
  separador: {
    height: 1,
    backgroundColor: '#39394A',
  },
  botonMaps: {
    backgroundColor: '#57C7A3',
    borderRadius: 16,
    height: 58,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    marginBottom: 30,
  },
  textoBoton: {
    color: '#000',
    fontFamily: 'CashMarket',
    fontSize: 16,
    marginLeft: 10,
  },
  errorContainer: {
    marginBottom: 20,
  },
  reintentar: {
    alignSelf: 'center',
    backgroundColor: '#4A216F',
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginTop: 6,
  },
  reintentarTexto: {
    color: 'white',
    fontFamily: 'Utendo',
  },
})