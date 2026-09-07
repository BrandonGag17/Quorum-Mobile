import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

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
      <View style={styles.avatar}>
        <Ionicons
          name="people"
          size={30}
          color="#15151C"
        />
      </View>

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
    marginTop: 30,
    marginBottom: 30,
    paddingHorizontal: 35,
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
