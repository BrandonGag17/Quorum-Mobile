import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import Ionicons from "@expo/vector-icons/Ionicons";

import GroupHeader from "./GroupHeader";

export default function GroupNavigationHeader({
  navigation,
  group,
  memberCount,
  idGrupo,
}) {
  return (
    <View style={styles.container}>

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={styles.backButton}
        activeOpacity={0.7}
      >
        <Ionicons
          name="chevron-back"
          size={30}
          color="#FFFFFF"
        />
      </TouchableOpacity>

      <GroupHeader
        group={group}
        memberCount={memberCount}
        compact
        avatarSize={40}
        containerStyle={styles.groupHeader}
        contentStyle={styles.groupContent}
        groupNameStyle={styles.groupName}
        memberCountStyle={styles.memberCount}
      />

    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },

  backButton: {
    width: 35,
    height: 50,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 5,
  },

  groupHeader: {
    flex: 1,
    margin: 0,
    padding: 0,
  },

  groupContent: {
    marginLeft: 10,
  },

  groupName: {
    fontSize: 17,
  },

  memberCount: {
    fontSize: 11,
  },
});
