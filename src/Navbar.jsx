import { StyleSheet, Text, View } from 'react-native'
import { IconHomeFilled, IconCompassFilled, IconSettingsFilled } from '@tabler/icons-react-native';

export default function Navbar() {
    return (
        <View style={styles.navbar}>
            <View style={styles.navItem}>
                <IconHomeFilled color="#FFFFFF" size={28} />
                <Text style={styles.navText}>Inicio</Text>
            </View>
            <View style={styles.navItem}>
                <IconCompassFilled color="#FFFFFF" size={28} />
                <Text style={styles.navText}>Explorar</Text>
            </View>
            <View style={styles.navItem}>
                <IconSettingsFilled color="#FFFFFF" size={28} />
                <Text style={styles.navText}>Ajustes</Text>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    navbar: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        flexDirection: 'row',
        justifyContent: 'space-around',
        alignItems: 'center',
        height: 70,
        backgroundColor: '#2B206E',
        borderTopLeftRadius: 25,
        borderTopRightRadius: 25,
    },
    navItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: 3,
    },
    navText: {
        color: '#FFFFFF',
        fontSize: 11,
        textAlign: 'center',
        fontFamily: 'Utendo',
    }
})