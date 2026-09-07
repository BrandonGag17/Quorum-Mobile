import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';

export default function BackButton() {
    const navigation = useNavigation();

    return (
        <Pressable
            onPress={() => navigation.goBack()}
            style={styles.button}
            hitSlop={10}
        >
            <Ionicons name="arrow-back-outline" size={24} color="white" />
        </Pressable>
    );
}

const styles = StyleSheet.create({
    button: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 15
    },
});
