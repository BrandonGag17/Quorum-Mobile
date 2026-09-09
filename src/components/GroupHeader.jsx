import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";

export default function GroupHeader({
  group,
  memberCount,
  compact = false,
  avatarSize = 50,
  containerStyle,
  contentStyle,
  groupNameStyle,
  memberCountStyle,
}) {
  return (
    <View
      style={[
        styles.header,
        compact && styles.headerCompact,
        containerStyle,
      ]}
    >
      <Image
        source={{ uri: group?.foto_perfil }}
        style={[
          styles.avatar,
          {
            width: avatarSize,
            height: avatarSize,
            borderRadius: avatarSize / 2,
          },
        ]}
      />

      <View
        style={[
          styles.headerInfo,
          compact && styles.headerInfoCompact,
          contentStyle,
        ]}
      >
        <Text
          style={[
            styles.groupName,
            compact && styles.groupNameCompact,
            groupNameStyle,
          ]}
          numberOfLines={1}
        >
          {group?.nombre || group?.nombre_grupo || "Grupo"}
        </Text>

        {memberCount !== undefined && (
          <Text
            style={[
              styles.memberCount,
              compact && styles.memberCountCompact,
              memberCountStyle,
            ]}
          >
            {memberCount} miembros
          </Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
  },

  headerCompact: {
    padding: 0,
    flex: 1,
  },

  avatar: {
    backgroundColor: "#57C7A3",
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
