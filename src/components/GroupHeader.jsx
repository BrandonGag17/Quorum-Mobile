import React from 'react'
import { TouchableOpacity, View, Text, Image, StyleSheet } from 'react-native'
import Ionicons from '@expo/vector-icons/Ionicons'

export default function GroupHeader({ group, memberCount, onPress, avatarSize = 110, compact = false }) {
  const avatarStyle = { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 }
  return (
    <TouchableOpacity
      style={[styles.container, compact && styles.compact]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <Image source={{ uri: group?.foto_perfil }} style={[styles.avatar, avatarStyle]} />

      <View style={styles.info}>
        <Text style={[styles.name, compact && styles.nameCompact]} numberOfLines={1}>
          {group?.nombre || ''}
        </Text>

        {memberCount !== undefined && (
          <Text style={[styles.count, compact && styles.countCompact]}>
            {memberCount} miembros
          </Text>
        )}
      </View>

      {onPress ? <Ionicons name="chevron-forward" size={22} color="#FFFFFF" style={styles.chevron} /> : null}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    marginBottom: 30
  },
  compact: {
    paddingVertical: 4,
  },
  avatar: {
    backgroundColor: '#3a3a3a',
  },
  info: {
    flex: 1,
    justifyContent: 'center',
  },
  name: {
    color: 'white',
    fontSize: 25,
    fontFamily: 'CashMarket',
  },
  nameCompact: {
    fontSize: 18,
    marginBottom: 1
  },
  count: {
    color: '#B8B8B8',
    fontSize: 14,
    fontFamily: 'Utendo',
    marginTop: 2,
  },
  countCompact: {
    fontSize: 14,
  },
  chevron: {
    marginLeft: 8,
  },
})