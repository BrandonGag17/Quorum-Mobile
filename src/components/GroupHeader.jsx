import React from "react";
import { View, Text, Image, TouchableOpacity, StyleSheet } from "react-native";

export default function GroupHeader({
  group,
  memberCount,
  onPress,
}) {
  return (
    <TouchableOpacity
      style={styles.header}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <Image
        source={{ uri: group?.foto_perfil }}
        style={styles.avatar}
      />

      <View style={styles.headerInfo}>
        <Text style={styles.groupName} numberOfLines={1}>
          {group?.nombre || group?.nombre_grupo || "Grupo"}
        </Text>

        {memberCount !== undefined && (
          <Text style={styles.memberCount}>
            {memberCount} miembros
          </Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 30,
    padding: 10,
    marginTop: 30
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 26,
  },

  headerInfo: {
    marginLeft: 14,
  },

  groupName: {
    color: "#FFFFFF",
    fontSize: 19,
    fontFamily: "CashMarket",
  },

  memberCount: {
    color: "#9E9E9E",
    fontSize: 12,
    fontFamily: "Utendo",
    marginTop: 3,
  },
});