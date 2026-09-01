import React, { useMemo } from 'react'
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  TouchableOpacity
} from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'
import Octicons from '@expo/vector-icons/Octicons'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'

import GroupHeader from '../../components/GroupHeader'
import Loading from '../../components/Loading'
import ErrorMessage from '../../components/MensajeError'
import { useVotacionDetail } from '../../hooks/useVotacionDetail'

function OptionCard({ option, votes, selected, onPress, disabled }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled}
      style={[
        styles.option,
        selected && styles.optionSelected,
        disabled && styles.optionDisabled
      ]}
    >
      <View style={styles.optionLeft}>
        <View style={styles.radio}>
          <Text style={styles.radioText}>{selected ? '◉' : '◯'}</Text>
        </View>

        <Text style={styles.optionText}>{option.descripcion}</Text>
      </View>

      <Text style={styles.votesText}>{votes ?? 0}</Text>
    </TouchableOpacity>
  )
}

export default function VotacionJuntada({ route, navigation }) {
  const eventId = route?.params?.idEvento

  const {
    survey,
    event,
    groupMemberCount,
    voteCounts,
    myVotes,
    loading,
    actionLoading,
    error,
    categories,
    voteOption,
    isCreator
  } = useVotacionDetail(eventId)

  const totalVotes = useMemo(() => {
    return Object.values(voteCounts ?? {}).reduce((acc, value) => acc + value, 0)
  }, [voteCounts])

  if (loading) {
    return <Loading />
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pageContent}>
          <ErrorMessage mensaje={error} />
        </View>
      </SafeAreaView>
    )
  }

  if (!survey || !event) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.pageContent}>
          <Text style={styles.emptyText}>No hay votación disponible para este evento.</Text>
        </View>
      </SafeAreaView>
    )
  }

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.pageContent} showsVerticalScrollIndicator={false}>
        <GroupHeader
          group={event.grupo}
          memberCount={groupMemberCount}
          onPress={() => navigation.navigate('InfoGrupo', { idGrupo: event.id_grupo })}
          avatarSize={52}
          compact
        />

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <Octicons name="sparkles-fill" size={18} color="#FFFFFF" />
            <Text style={styles.heroTitle}>Votá tus preferencias</Text>
          </View>

          <Text style={styles.heroText}>
            Seleccioná las opciones que te convengan. Podés votar varias opciones por categoría.
          </Text>

          <View style={styles.metaRow}>
            <View style={styles.metaPill}>
              <Ionicons name="checkmark-circle" size={14} color="#57C7A3" />
              <Text style={styles.metaText}>{totalVotes} votos</Text>
            </View>

            <View style={styles.metaPill}>
              <FontAwesome6 name="users" size={12} color="#57C7A3" />
              <Text style={styles.metaText}>{groupMemberCount} miembros</Text>
            </View>

            {isCreator ? (
              <View style={styles.metaPillAccent}>
                <Text style={styles.metaTextAccent}>Creador</Text>
              </View>
            ) : null}
          </View>
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <Ionicons name="calendar" size={20} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Fecha y horario</Text>
          </View>

          {categories.fechas.length > 0 ? (
            categories.fechas.map(option => (
              <OptionCard
                key={option.id}
                option={option}
                votes={voteCounts[option.id]}
                selected={myVotes.includes(option.id)}
                onPress={() => voteOption(option.id)}
                disabled={actionLoading}
              />
            ))
          ) : (
            <Text style={styles.emptySectionText}>No hay opciones de fecha.</Text>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.sectionHeader}>
            <FontAwesome6 name="location-dot" size={18} color="#FFFFFF" />
            <Text style={styles.sectionTitle}>Lugar</Text>
          </View>

          {categories.lugares.length > 0 ? (
            categories.lugares.map(option => (
              <OptionCard
                key={option.id}
                option={option}
                votes={voteCounts[option.id]}
                selected={myVotes.includes(option.id)}
                onPress={() => voteOption(option.id)}
                disabled={actionLoading}
              />
            ))
          ) : (
            <Text style={styles.emptySectionText}>No hay opciones de lugar.</Text>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#15151C'
  },
  pageContent: {
    padding: 20,
    paddingBottom: 110,
  },
  emptyText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Utendo',
    textAlign: 'center',
    marginTop: 20
  },
  emptySectionText: {
    color: '#B8B8C5',
    fontFamily: 'Utendo',
    fontSize: 13,
    paddingVertical: 8
  },
  heroCard: {
    backgroundColor: '#4A216F',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#5E2D82'
  },
  heroTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8
  },
  heroTitle: {
    color: '#FFFFFF',
    fontFamily: 'CashMarket',
    fontSize: 18
  },
  heroText: {
    color: '#E6DFF2',
    fontFamily: 'Utendo',
    fontSize: 13,
    lineHeight: 19
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 14
  },
  metaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#2A2038',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  metaPillAccent: {
    backgroundColor: '#57C7A3',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 7
  },
  metaText: {
    color: '#FFFFFF',
    fontFamily: 'Utendo',
    fontSize: 12
  },
  metaTextAccent: {
    color: '#111111',
    fontFamily: 'Utendo',
    fontSize: 12,
    fontWeight: '700'
  },
  card: {
    borderWidth: 1,
    borderColor: '#3D2E6B',
    borderRadius: 18,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#11111A'
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12
  },
  sectionTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'CashMarket'
  },
  option: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151520',
    borderWidth: 1,
    borderColor: '#2F1B3D',
    borderRadius: 14,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10
  },
  optionSelected: {
    backgroundColor: 'rgba(87, 199, 163, 0.14)',
    borderColor: '#57C7A3'
  },
  optionDisabled: {
    opacity: 0.75
  },
  optionLeft: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingRight: 10
  },
  radio: {
    width: 22,
    alignItems: 'center'
  },
  radioText: {
    color: '#FFFFFF',
    fontSize: 16
  },
  optionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Utendo',
    flex: 1
  },
  votesText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Utendo',
    backgroundColor: '#58386f',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    overflow: 'hidden'
  }
})