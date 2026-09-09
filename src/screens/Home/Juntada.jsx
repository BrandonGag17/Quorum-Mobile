import React, { useLayoutEffect } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity,
  Image
} from 'react-native'

import Ionicons from '@expo/vector-icons/Ionicons'

import Loading from '../../components/Loading'
import ErrorMessage from '../../components/MensajeError'
import { useJuntadaDetail } from '../../hooks/useJuntadaDetail'
import GroupNavigationHeader from '../../components/GroupNavigationHeader'

export default function Juntada({ route, navigation }) {
  const eventId = route?.params?.idEvento

  const {
    event,
    survey,
    memberCount,
    goingCount,
    goingUsers,
    myAttendance,
    loading,
    actionLoading,
    error,
    timeRemaining,
    changeAttendance
  } = useJuntadaDetail(eventId)

  useLayoutEffect(() => {
  if (!event) return

  navigation.setOptions({
    headerTitle: () => (
      <GroupNavigationHeader
        navigation={navigation}
        group={event.grupo}
        memberCount={memberCount}
        idGrupo={event.grupo?.id}
      />
    ),

    headerTitleAlign: 'left',

    headerStyle: {
      backgroundColor: '#15151C',
    },

    headerShadowVisible: false,
  })
}, [navigation, event, memberCount])

  if (loading) {
    return <Loading />
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <ErrorMessage mensaje={error} />
        </View>
      </SafeAreaView>
    )
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>
            Juntada no disponible
          </Text>
        </View>
      </SafeAreaView>
    )
  }


  const fecha = event.fecha_hora_inicio
    ? new Date(event.fecha_hora_inicio)
    : null

  const dia = fecha
    ? fecha.getDate()
    : 30

  const mes = fecha
    ? fecha
      .toLocaleDateString('es-AR', {
        month: 'short'
      })
      .replace('.', '')
      .toLowerCase()
    : 'abr'

  const anio = fecha
    ? fecha.getFullYear()
    : 2026

  const hora = fecha
    ? fecha.toLocaleTimeString('es-AR', {
      hour: '2-digit',
      minute: '2-digit'
    })
    : '19:00'

  const nombreEvento =
    event.nombre || 'Feria del libro'

  const lugar =
    event.lugar || 'La Rural'

  const nombreGrupo =
    event.grupo?.nombre ||
    event.grupo?.nombre_grupo ||
    'Grupo'

  const participantes =
    memberCount || 6

  const confirmados =
    goingCount || 4

  const inicial =
    nombreGrupo.charAt(0).toUpperCase()


  const renderAvatars = () => {
    const usuarios =
      Array.isArray(goingUsers)
        ? goingUsers
        : []

    if (usuarios.length === 0) {
      return (
        <View style={styles.fakeAvatars}>
          <View
            style={[
              styles.miniAvatar,
              { backgroundColor: '#00B9FF' }
            ]}
          />

          <View
            style={[
              styles.miniAvatar,
              styles.avatarOverlap,
              { backgroundColor: '#F0D000' }
            ]}
          />

          <View
            style={[
              styles.miniAvatar,
              styles.avatarOverlap,
              { backgroundColor: '#EF3340' }
            ]}
          />
        </View>
      )
    }

    return (
      <View style={styles.fakeAvatars}>
        {usuarios.slice(0, 4).map((usuario, index) => {
          const foto =
            usuario?.usuario?.foto_perfil

          if (foto) {
            return (
              <Image
                key={usuario.id_usuario || index}
                source={{ uri: foto }}
                style={[
                  styles.miniAvatar,
                  index > 0 && styles.avatarOverlap
                ]}
              />
            )
          }

          return (
            <View
              key={usuario.id_usuario || index}
              style={[
                styles.miniAvatar,
                styles.avatarFallback,
                index > 0 && styles.avatarOverlap
              ]}
            >
              <Ionicons
                name="person"
                size={10}
                color="#111111"
              />
            </View>
          )
        })}
      </View>
    )
  }

  const handleVoy = () => {
    if (!actionLoading) {
      changeAttendance('voy')
    }
  }

  const handleNoVoy = () => {
    if (!actionLoading) {
      changeAttendance('no_voy')
    }
  }

  const ActionCard = ({
    backgroundColor,
    icon,
    title,
    subtitle,
    onPress
  }) => {
    return (
      <TouchableOpacity
        activeOpacity={0.85}
        onPress={onPress}
        style={[
          styles.actionCard,
          {
            backgroundColor
          }
        ]}
      >
        <View style={styles.actionIcon}>
          <Ionicons
            name={icon}
            size={31}
            color="#FFFFFF"
          />
        </View>

        <View style={styles.actionContent}>
          <Text style={styles.actionTitle}>
            {title}
          </Text>

          <Text style={styles.actionSubtitle}>
            {subtitle}
          </Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        <View style={styles.nextRow}>

          <Text style={styles.nextText}>
            Próximo encuentro
          </Text>

          <Text style={styles.daysText}>
            {timeRemaining || 'En 12 Días'}
          </Text>

        </View>

        <View style={styles.eventCard}>

          <View style={styles.eventMain}>

            <View style={styles.dateBox}>

              <Text style={styles.dateMonth}>
                {mes}
              </Text>

              <Text style={styles.dateDay}>
                {dia}
              </Text>

              <Text style={styles.dateYear}>
                {anio}
              </Text>

            </View>

            <View style={styles.eventInfo}>

              <Text
                style={styles.eventName}
                numberOfLines={2}
              >
                {nombreEvento}
              </Text>

              <View style={styles.detailRow}>

                <Ionicons
                  name="time-outline"
                  size={15}
                  color="#FFFFFF"
                />

                <Text style={styles.detailText}>
                  {hora}
                </Text>

              </View>

              <View style={styles.detailRow}>

                <Ionicons
                  name="location-outline"
                  size={16}
                  color="#FFFFFF"
                />

                <Text
                  style={styles.detailText}
                  numberOfLines={1}
                >
                  {lugar}
                </Text>

              </View>

            </View>

          </View>

          <View style={styles.eventSeparator} />

          <View style={styles.confirmedContainer}>

            <View style={styles.confirmedTop}>

              <Ionicons
                name="people"
                size={15}
                color="#FFFFFF"
              />

              <Text style={styles.confirmedText}>
                {confirmados} de {participantes} confirmados
              </Text>

              {renderAvatars()}

            </View>

            <View style={styles.buttonsRow}>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleVoy}
                disabled={actionLoading}
                style={[
                  styles.goButton,
                  myAttendance === 'voy' &&
                  styles.goButtonSelected,
                  actionLoading &&
                  styles.disabled
                ]}
              >
                <Text style={styles.goText}>
                  Voy
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                activeOpacity={0.8}
                onPress={handleNoVoy}
                disabled={actionLoading}
                style={[
                  styles.noGoButton,
                  myAttendance === 'no_voy' &&
                  styles.noGoButtonSelected,
                  actionLoading &&
                  styles.disabled
                ]}
              >
                <Text style={styles.noGoText}>
                  No voy
                </Text>
              </TouchableOpacity>

            </View>

          </View>

        </View>

        <View style={styles.organize}>

          <Text style={styles.organizeSmall}>
            Organizá tu grupo
          </Text>

          <Text style={styles.organizeTitle}>
            Todo en un solo lugar
          </Text>

        </View>


        <ActionCard
          backgroundColor="#316D61"
          icon="calendar-outline"
          title="Fecha y hora"
          subtitle="Si te arrepentís de tu voto podes volver a votar"
          onPress={() => {
            navigation.push(
              'VotacionJuntada',
              {
                idEvento: event.id
              }
            )
          }}
        />

        <ActionCard
          backgroundColor="#571674"
          icon="cash-outline"
          title="División de Gastos"
          subtitle="Divide los gastos del grupo"
          onPress={() => { navigation.navigate('DivisionGastos', { idEvento: event.id }) }}
        />

        <ActionCard
          backgroundColor="#3D2154"
          icon="images-outline"
          title="Galería"
          subtitle="Ve las fotos super que sacaste"
          onPress={() => { }}
        />

      </ScrollView>


    </SafeAreaView >
  )
}

const styles = StyleSheet.create({

  container: {
    flex: 1,
    backgroundColor: '#15151C'
  },

  screen: {
    flex: 1,
    backgroundColor: '#15151C'
  },

  scrollContent: {
    paddingTop: 4,
    paddingBottom: 100
  },

  nextRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 35,
    paddingTop: 17,
    paddingBottom: 8
  },

  nextText: {
    color: '#9999A5',
    fontSize: 13,
    fontFamily: 'Utendo'
  },

  daysText: {
    color: '#57C7A3',
    fontSize: 11,
    fontFamily: 'CashMarket'
  },

  eventCard: {
    backgroundColor: '#22222D',
    borderRadius: 17,
    marginHorizontal: 27,
    overflow: 'hidden',
    marginBottom: 31
  },

  eventMain: {
    flexDirection: 'row',
    paddingTop: 9,
    paddingLeft: 10,
    paddingRight: 12,
    paddingBottom: 7
  },

  dateBox: {
    width: 64,
    height: 59,
    backgroundColor: '#57C7A3',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
    alignSelf: 'center'
  },

  dateMonth: {
    color: '#111111',
    fontSize: 11,
    fontFamily: 'CashMarket'
  },

  dateDay: {
    color: '#111111',
    fontSize: 28,
    lineHeight: 29,
    fontFamily: 'CashMarket'
  },

  dateYear: {
    color: '#111111',
    fontSize: 11,
    fontFamily: 'CashMarket'
  },

  eventInfo: {
    flex: 1,
    justifyContent: 'center'
  },

  eventName: {
    color: '#FFFFFF',
    fontSize: 17,
    lineHeight: 19,
    fontFamily: 'CashMarket',
    marginBottom: 7
  },

  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 5
  },

  detailText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Utendo',
    marginLeft: 6
  },

  eventSeparator: {
    height: 1,
    backgroundColor: '#656570'
  },

  confirmedContainer: {
    paddingHorizontal: 9,
    paddingTop: 9,
    paddingBottom: 7
  },

  confirmedTop: {
    height: 23,
    flexDirection: 'row',
    alignItems: 'center'
  },

  confirmedText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'CashMarket',
    marginLeft: 4
  },

  fakeAvatars: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 7
  },

  miniAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
  },

  avatarFallback: {
    backgroundColor: '#57C7A3',
    justifyContent: 'center',
    alignItems: 'center'
  },

  buttonsRow: {
    flexDirection: 'row',
    marginTop: 7
  },

  goButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#57C7A3',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 7
  },

  noGoButton: {
    flex: 1,
    height: 40,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#7225A4',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 7
  },

  goButtonSelected: {
    backgroundColor: '#57C7A3'
  },

  noGoButtonSelected: {
    backgroundColor: '#7225A4'
  },

  goText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'CashMarket'
  },

  noGoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'CashMarket'
  },

  disabled: {
    opacity: 0.5
  },

  organize: {
    marginHorizontal: 28,
    marginBottom: 13
  },

  organizeSmall: {
    color: '#9999A5',
    fontSize: 13,
    fontFamily: 'Utendo',
    marginBottom: 2
  },

  organizeTitle: {
    color: '#FFFFFF',
    fontSize: 19,
    fontFamily: 'CashMarket'
  },

  actionCard: {
    height: 72,
    borderRadius: 14,
    marginHorizontal: 23,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  },

  actionIcon: {
    width: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8
  },

  actionContent: {
    flex: 1
  },

  actionTitle: {
    color: '#FFFFFF',
    fontSize: 17,
    fontFamily: 'CashMarket',
    marginBottom: 1
  },

  actionSubtitle: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Utendo'
  },
})