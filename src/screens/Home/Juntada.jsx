import React from 'react'
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
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'

import GroupHeader from '../../components/GroupHeader'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/MensajeError'
import { useJuntadaDetail } from '../../hooks/useJuntadaDetail'

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
    isCreator,
    changeAttendance,
    finalizeSurvey
  } = useJuntadaDetail(eventId)

  if (loading) {
    return <Loading />
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <ErrorMessage mensaje={error} />
        </View>
      </SafeAreaView>
    )
  }

  if (!event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Juntada no disponible</Text>
        </View>
      </SafeAreaView>
    )
  }

  const fechaInicio = event.fecha_hora_inicio ? new Date(event.fecha_hora_inicio) : null

  const fechaTexto = fechaInicio
    ? fechaInicio.toLocaleDateString('es-AR', {
        weekday: 'long',
        day: 'numeric',
        month: 'long'
      })
    : 'Fecha pendiente'

  const horaTexto = fechaInicio
    ? fechaInicio.toLocaleTimeString('es-AR', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Hora pendiente'

  const renderAsistencia = () => (
    <View style={styles.attendanceCard}>
      <Text style={styles.sectionTitle}>Tu respuesta</Text>

      <View style={styles.buttonsRow}>
        <TouchableOpacity
          style={[
            styles.buttonYes,
            myAttendance === 'voy' && styles.buttonSelected,
            actionLoading && styles.buttonDisabled
          ]}
          onPress={() => changeAttendance('voy')}
          disabled={actionLoading}
        >
          <Ionicons name="checkmark" size={18} color="#111111" />
          <Text style={styles.buttonYesText}>
            {myAttendance === 'voy' ? '✓ Voy' : 'Voy'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.buttonNo,
            myAttendance === 'no_voy' && styles.buttonSelected,
            actionLoading && styles.buttonDisabled
          ]}
          onPress={() => changeAttendance('no_voy')}
          disabled={actionLoading}
        >
          <Ionicons name="close" size={18} color="#FFFFFF" />
          <Text style={styles.buttonNoText}>
            {myAttendance === 'no_voy' ? '✕ No voy' : 'No voy'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  )

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <GroupHeader
          group={event.grupo}
          memberCount={memberCount}
          onPress={() => navigation.navigate('InfoGrupo', { idGrupo: event.id_grupo })}
          avatarSize={52}
          compact
        />

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Text style={styles.title}>{event.nombre}</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>
                {event.estado === 'confirmado' ? 'Confirmada' : 'En planificación'}
              </Text>
            </View>
          </View>

          {event.descripcion ? (
            <Text style={styles.subtitle}>{event.descripcion}</Text>
          ) : null}

          {event.estado === 'confirmado' ? (
            <View style={styles.infoGrid}>
              <View style={styles.infoBlock}>
                <FontAwesome6 name="calendar-day" size={14} color="#57C7A3" />
                <Text style={styles.infoLabel}>Fecha</Text>
                <Text style={styles.infoValue}>{fechaTexto}</Text>
              </View>

              <View style={styles.infoBlock}>
                <Ionicons name="time" size={16} color="#57C7A3" />
                <Text style={styles.infoLabel}>Hora</Text>
                <Text style={styles.infoValue}>{horaTexto}</Text>
              </View>

              <View style={styles.infoBlockWide}>
                <FontAwesome6 name="location-dot" size={14} color="#57C7A3" />
                <Text style={styles.infoLabel}>Lugar</Text>
                <Text style={styles.infoValue}>{event.lugar || 'Lugar pendiente'}</Text>
              </View>
            </View>
          ) : (
            <View style={styles.planCard}>
              <Text style={styles.planLabel}>Votación activa</Text>
              <Text style={styles.planValue}>{timeRemaining || 'Calculando...'}</Text>

              {survey?.activa ? (
                <TouchableOpacity
                  style={styles.voteButton}
                  onPress={() => navigation.navigate('VotacionJuntada', { idEvento: event.id })}
                >
                  <Text style={styles.voteButtonText}>Ir a votar</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          )}
        </View>

        <View style={styles.summaryCard}>
          <View style={styles.summaryHeader}>
            <Text style={styles.sectionTitle}>Participación</Text>
            <Text style={styles.summaryCount}>{goingCount}/{memberCount}</Text>
          </View>

          <View style={styles.avatarRow}>
            {goingUsers.slice(0, 5).map((usuario, index) => {
              const avatarUri = usuario?.usuario?.foto_perfil

              return avatarUri ? (
                <Image
                  key={usuario.id_usuario}
                  source={{ uri: avatarUri }}
                  style={[styles.avatar, { marginLeft: index === 0 ? 0 : -8 }]}
                />
              ) : (
                <View key={usuario.id_usuario} style={[styles.avatarFallback, { marginLeft: index === 0 ? 0 : -8 }]}>
                  <FontAwesome6 name="user" size={12} color="#E8E8E8" />
                </View>
              )
            })}

            {goingCount > 5 ? (
              <View style={styles.moreBadge}>
                <Text style={styles.moreBadgeText}>+{goingCount - 5}</Text>
              </View>
            ) : null}
          </View>
        </View>

        {renderAsistencia()}

        {survey?.activa ? (
          <View style={styles.surveyCard}>
            <Text style={styles.sectionTitle}>Votación</Text>
            <Text style={styles.surveyText}>
              {survey.pregunta || 'La votación sigue abierta.'}
            </Text>
            <Text style={styles.surveyTimer}>{timeRemaining || 'Calculando...'}</Text>

            {isCreator ? (
              <TouchableOpacity style={styles.finalizeButton} onPress={finalizeSurvey} disabled={actionLoading}>
                <Text style={styles.finalizeButtonText}>Finalizar votación</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15151C'
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 110,
  },
  title: {
    color: '#FFFFFF',
    fontSize: 24,
    fontFamily: 'CashMarket',
    flex: 1,
    marginRight: 12
  },
  subtitle: {
    color: '#B8B8C5',
    fontSize: 14,
    fontFamily: 'Utendo',
    marginBottom: 18,
    lineHeight: 20
  },
  heroCard: {
    backgroundColor: '#23232D',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#3D2E6B',
    marginBottom: 14
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  badge: {
    backgroundColor: '#57C7A3',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999
  },
  badgeText: {
    color: '#111111',
    fontFamily: 'Utendo',
    fontSize: 11,
    fontWeight: '700'
  },
  infoGrid: {
    gap: 12
  },
  infoBlock: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2E2942'
  },
  infoBlockWide: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2E2942'
  },
  infoLabel: {
    color: '#B8B8C5',
    fontSize: 12,
    fontFamily: 'Utendo',
    marginTop: 6,
    marginBottom: 4
  },
  infoValue: {
    color: '#FFFFFF',
    fontSize: 14,
    fontFamily: 'CashMarket'
  },
  planCard: {
    backgroundColor: '#1A1A24',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#2E2942'
  },
  planLabel: {
    color: '#57C7A3',
    fontFamily: 'Utendo',
    fontSize: 12,
    marginBottom: 4
  },
  planValue: {
    color: '#FFFFFF',
    fontFamily: 'CashMarket',
    fontSize: 16
  },
  voteButton: {
    marginTop: 12,
    backgroundColor: '#57C7A3',
    borderRadius: 12,
    paddingVertical: 11,
    alignItems: 'center'
  },
  voteButtonText: {
    color: '#111111',
    fontFamily: 'CashMarket',
    fontSize: 14
  },
  summaryCard: {
    backgroundColor: '#1F1B2C',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#3D2E6B',
    marginBottom: 14
  },
  summaryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontFamily: 'CashMarket',
    fontSize: 16
  },
  summaryCount: {
    color: '#57C7A3',
    fontFamily: 'CashMarket',
    fontSize: 15
  },
  avatarRow: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#1F1B2C',
    backgroundColor: '#3A3A3A'
  },
  avatarFallback: {
    width: 34,
    height: 34,
    borderRadius: 17,
    borderWidth: 2,
    borderColor: '#1F1B2C',
    backgroundColor: '#3A3A3A',
    justifyContent: 'center',
    alignItems: 'center'
  },
  moreBadge: {
    marginLeft: 6,
    backgroundColor: '#29243E',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 6
  },
  moreBadgeText: {
    color: '#FFFFFF',
    fontFamily: 'Utendo',
    fontSize: 12
  },
  attendanceCard: {
    backgroundColor: '#23232D',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#3D2E6B',
    marginBottom: 14
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12
  },
  buttonYes: {
    flex: 1,
    backgroundColor: '#57C7A3',
    borderRadius: 14,
    paddingVertical: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  buttonNo: {
    flex: 1,
    backgroundColor: '#D64545',
    borderRadius: 14,
    paddingVertical: 13,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8
  },
  buttonSelected: {
    borderWidth: 2,
    borderColor: '#FFFFFF'
  },
  buttonDisabled: {
    opacity: 0.75
  },
  buttonYesText: {
    color: '#111111',
    fontFamily: 'CashMarket',
    fontSize: 14
  },
  buttonNoText: {
    color: '#FFFFFF',
    fontFamily: 'CashMarket',
    fontSize: 14
  },
  surveyCard: {
    backgroundColor: '#1F1B2C',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#3D2E6B'
  },
  surveyText: {
    color: '#D0D0D0',
    fontFamily: 'Utendo',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 8
  },
  surveyTimer: {
    color: '#57C7A3',
    fontFamily: 'CashMarket',
    fontSize: 15,
    marginBottom: 12
  },
  finalizeButton: {
    backgroundColor: '#6C3E8E',
    borderRadius: 14,
    paddingVertical: 13,
    alignItems: 'center'
  },
  finalizeButtonText: {
    color: '#FFFFFF',
    fontFamily: 'CashMarket',
    fontSize: 14
  },
})