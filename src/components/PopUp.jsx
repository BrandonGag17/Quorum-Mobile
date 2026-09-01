import React from 'react';
import {
    Modal,
    Pressable,
    Text,
    TouchableOpacity,
    StyleSheet,
} from 'react-native';

export default function CustomPopup({
    visible,
    onClose,
    title,
    option1,
    option2,
}) {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onClose}
        >
            <Pressable style={styles.overlay} onPress={onClose}>
                <Pressable
                    style={[
                        styles.modal,
                        { paddingTop: title ? 28 : 52 }
                    ]}
                >
                        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
                        <Text style={styles.closeText}>✕</Text>
                    </TouchableOpacity>

                    {title && <Text style={styles.title}>{title}</Text>}

                    <TouchableOpacity
                        style={styles.button}
                        onPress={option1.onPress}
                    >
                        <Text style={styles.buttonText}>{option1.label}</Text>
                    </TouchableOpacity>

                    <Text style={styles.separator}>o</Text>

                    <TouchableOpacity
                        style={styles.button}
                        onPress={option2.onPress}
                    >
                        <Text style={styles.buttonText}>{option2.label}</Text>
                    </TouchableOpacity>
                </Pressable>
            </Pressable>
        </Modal>
    )
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.45)',
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 20,
    },
    modal: {
        width: '100%',
        backgroundColor: '#23232D',
        borderRadius: 24,
        paddingVertical: 28,
        paddingHorizontal: 22,
        alignItems: 'center',
        position: 'relative',
    },
    closeButton: {
        position: 'absolute',
        top: 12,
        right: 16,
    },
    closeText: {
        color: 'white',
        fontSize: 22,
        fontWeight: 'bold',
    },
    title: {
        color: 'white',
        fontSize: 21,
        textAlign: 'center',
        marginBottom: 24,
        fontFamily: 'CashMarket',
        marginTop: 20
    },
    button: {
        width: '100%',
        backgroundColor: '#57C7A3',
        borderRadius: 12,
        paddingVertical: 12,
        alignItems: 'center',
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '700',
        textAlign: 'center',
        fontFamily: 'CashMarket'
    },
    separator: {
        color: 'white',
        fontSize: 18,
        fontWeight: '600',
        marginVertical: 14,
    },
})