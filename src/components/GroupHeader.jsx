import React from "react";
import { View, Text, TouchableOpacity, StyleSheet, Image } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

export default function GroupHeader({
  group,
  memberCount,
  onPress,
  compact = false,
  avatarSize = 50,
  containerStyle,
  contentStyle,
  groupNameStyle,
  memberCountStyle,
}) {
  return (
    <TouchableOpacity
      style={[
        styles.header,
        compact && styles.headerCompact,
        containerStyle,
      ]}
      onPress={onPress}
      activeOpacity={onPress ? 0.75 : 1}
    >
      <Image
        source={{ uri: group?.foto_perfil }}
        style={[
          styles.avatar,
          { width: avatarSize, height: avatarSize, borderRadius: avatarSize / 2 },
        ]}
      />

      <View style={[styles.headerInfo, compact && styles.headerInfoCompact, contentStyle]}>
        <Text style={[styles.groupName, compact && styles.groupNameCompact, groupNameStyle]} numberOfLines={1}>
          {group?.nombre || group?.nombre_grupo || "Grupo"}
        </Text>

        {memberCount !== undefined && (
          <Text style={[styles.memberCount, compact && styles.memberCountCompact, memberCountStyle]}>
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
    marginTop: 30,
    marginBottom: 30,
    paddingHorizontal: 35,
  },
  headerCompact: {
    marginBottom: 0,
    marginTop: 0,
    padding: 0,
    flex: 1,
  },

  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#57C7A3",
    justifyContent: "center",
    alignItems: "center",
  },

  headerInfo: {
    marginLeft: 14,
  },
  headerInfoCompact: {
    marginLeft: 12,
    flexShrink: 1,
  },

  groupName: {
    color: "#FFFFFF",
    fontSize: 19,
    fontFamily: "CashMarket",
  },
  groupNameCompact: {
    fontSize: 18,
  },

  memberCount: {
    color: "#9E9E9E",
    fontSize: 12,
    fontFamily: "Utendo",
    marginTop: 3,
  },
  memberCountCompact: {
    marginTop: 2,
  },
});
