import { StyleSheet, Text, View, TouchableOpacity, Image } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import { useEffect, useState } from 'react'
import Navbar from './Utilidades/Navbar'
import supabase from './supabaseClient'

export default function Configuracion() {
    const navigation = useNavigation()
    let currentDate = new Date();

    const [usuario, setUsuario] = useState(null)

    useEffect(() => {
        cargarUsuario()
    }, [])

    async function cargarUsuario() {
        const {
            data: { session }
        } = await supabase.auth.getSession()

        if (!session) return

        const { data, error } = await supabase
            .from('usuario')
            .select(`
            username,
            nombre,
            apellido,
            foto_perfil
        `)
            .eq('id', session.user.id)
            .single()

        if (!error) {
            setUsuario(data)
        }
    }

    return (
        <SafeAreaView style={styles.fondo}>
            {usuario && (
                <View style={styles.perfil}>
                    <Image
                        source={
                            usuario.foto_perfil
                                ? { uri: usuario.foto_perfil }
                                : require('../assets/img/amiguis.jpg')
                        }
                        style={styles.fotoPerfil}
                    />

                    <Text style={styles.username}>
                        @{usuario.username}
                    </Text>

                    <Text style={styles.nombreCompleto}>
                        {usuario.nombre} {usuario.apellido}
                    </Text>
                </View>
            )}


            <TouchableOpacity
                onPress={async () => {
                    await supabase.auth.signOut()
                    navigation.replace('Introduccion')
                }}
            >
                <Text style={styles.botones}>Cerrar sesión</Text>
            </TouchableOpacity>

            <Text style={styles.textoCopyVersion}>Copyright &copy; {currentDate.getFullYear()} - Quórum</Text>
            <Text style={styles.textoCopyVersion}>Versión Demo 0.0.0</Text>

            <Navbar pantallaActual="Configuracion" />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    fondo: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        paddingBottom: 90,
        justifyContent: 'center'
    },
    botones: {
        fontFamily: 'Utendo',
        textAlign: 'center',
        color: 'white',
        fontSize: 20,
        backgroundColor: '#2A1A1A',
        borderWidth: 2,
        borderColor: '#d30909',
        borderRadius: 14,
        paddingVertical: 12,
        marginBottom: 20,
        alignItems: 'center',
    },
    textoCopyVersion: {
        color: 'white',
        textAlign: 'center',
        fontFamily: 'Utendo',
        marginBottom: 10,
        fontSize: 15
    },
    perfil: {
        alignItems: 'center',
        marginBottom: 30
    },

    fotoPerfil: {
        width: 100,
        height: 100,
        borderRadius: 55,
        marginBottom: 12
    },

    username: {
        color: 'white',
        fontFamily: 'CashMarket',
        fontSize: 25
    },

    nombreCompleto: {
        color: '#B0B0B0',
        fontFamily: 'Utendo',
        fontSize: 18,
        marginTop: 4
    },
})