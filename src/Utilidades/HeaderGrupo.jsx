import { useEffect, useState, useRef } from 'react'
import {
    View,
    Text,
    Pressable,
    Modal,
    FlatList,
    StyleSheet,
    ActivityIndicator,
    TouchableOpacity,
    ScrollView,
    Animated,
    Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

import { useRoute, useNavigation } from '@react-navigation/native'
import supabase from '../supabaseClient'

import Navbar from './Navbar'
import Iconos from './Iconos'
import CardJuntadas from './CardJuntadas'
import BotonVolver from './BotonVolver'

import { IconBulbFilled, IconCalendarEventFilled } from '@tabler/icons-react-native';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons'
import Ionicons from '@expo/vector-icons/Ionicons';

function HeaderGrupo({
    grupo,
    cantidadMiembros = 0
}) {
    const navigation = useNavigation()

    return (
        <View style={styles.container}>
            <View style={styles.headerGrupo}>
                <BotonVolver />

                <TouchableOpacity
                    style={styles.infoGrupo}
                    onPress={() =>
                        navigation.navigate(
                            'InfoGrupo',
                            {
                                idGrupo: grupo.id
                            }
                        )
                    }
                >
                    <Image
                        source={
                            grupo?.foto_perfil
                                ? { uri: grupo.foto_perfil }
                                : require('../../assets/img/amiguis.jpg')
                        }
                        style={styles.fotoGrupo}
                    />

                    <View>
                        <Text
                            style={styles.nombreGrupo}
                            numberOfLines={1}
                        >
                            {grupo?.nombre}
                        </Text>

                        <Text
                            style={styles.miembrosGrupo}
                        >
                            {cantidadMiembros} participantes
                        </Text>
                    </View>
                </TouchableOpacity>
            </View>
        </View>
    )
}

const styles = StyleSheet.create({
    container: {
    height: 80,
    marginBottom: 15,
},
    headerGrupo: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.08)',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
    },
    infoGrupo: {
        flexDirection: 'row',
        alignItems: 'center',
        marginLeft: 14,
        flex: 1,
    },

    fotoGrupo: {
        width: 50,
        height: 50,
        borderRadius: 27,
        marginRight: 14,
    },

    nombreGrupo: {
        fontSize: 17,
        color: '#FFFFFF',
        fontFamily: 'CashMarket',
    },

    miembrosGrupo: {
        marginTop: 2,
        fontSize: 11,
        color: '#A1A1AA',
        fontFamily: 'Utendo',
    },
})

export default HeaderGrupo