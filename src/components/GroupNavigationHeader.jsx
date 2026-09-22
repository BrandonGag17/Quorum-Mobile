import React from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
} from "react-native";

import GroupHeader from "./GroupHeader";

export default function GroupNavigationHeader({
  navigation,
  group,
  memberCount,
  idGrupo,
}) {
  return (
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
  );
}

const styles = StyleSheet.create({
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
