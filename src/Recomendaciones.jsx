import { useEffect, useState } from 'react'
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    Image,
    ActivityIndicator,
    TouchableOpacity
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Navbar from './Utilidades/Navbar'
import supabase from './supabaseClient'
import { obtenerLugares } from '../services/geoapifyService'

const MI_IMAGEN_ELEGIDA =
    'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYGR-KyWBs8T4kE2hXYzGhoVTOPsOtmweh3acdYL7jlzmlTqfSXmpBbr8&s=10'

export default function Recomendaciones() {
    const navigation = useNavigation()

    const [lugares, setLugares] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(false)

    useEffect(() => {
        cargarLugares()
    }, [])

    async function cargarLugares() {

        try {
            setCargando(true)
            setError(false)

            let lat = -34.5996
            let lon = -58.4438

            const {
                data: { user }
            } = await supabase.auth.getUser()

            if (user) {

                const { data: perfil } =
                    await supabase
                        .from('usuario')
                        .select('localidad')
                        .eq('id', user.id)
                        .single()

                let localidad = perfil?.localidad

                if (typeof localidad === 'string') {
                    try {
                        localidad = JSON.parse(localidad)
                    }
                    catch { }
                }

                const centroide =
                    localidad?.centroide ||
                    localidad?.centroid

                const nuevaLat =
                    centroide?.lat ??
                    centroide?.latitude ??
                    (
                        Array.isArray(centroide?.coordinates)
                            ? centroide.coordinates[1]
                            : undefined
                    )

                const nuevaLon =
                    centroide?.lon ??
                    centroide?.longitude ??
                    (
                        Array.isArray(centroide?.coordinates)
                            ? centroide.coordinates[0]
                            : undefined
                    )

                if (
                    nuevaLat !== undefined &&
                    nuevaLon !== undefined
                ) {
                    lat = nuevaLat
                    lon = nuevaLon
                }
            }

            const lugaresEncontrados =
                await obtenerLugares(
                    'catering.restaurant,catering.bar,catering.cafe',
                    lat,
                    lon
                )

            setLugares(lugaresEncontrados)
        }

        catch (e) {
            console.log(e)
            setError(true)
        }

        finally {
            setCargando(false)
        }

    }

    if (cargando) {

        return (

            <SafeAreaView style={styles.loadingContainer}>

                <ActivityIndicator
                    size="large"
                    color="#B514F6"
                />

                <Navbar pantallaActual="Recomendaciones" />

            </SafeAreaView>

        )

    }

    if (error) {

        return (

            <SafeAreaView style={styles.loadingContainer}>

                <Text style={styles.errorTitulo}>
                    No pudimos cargar las recomendaciones.
                </Text>

                <TouchableOpacity
                    style={styles.botonReintentar}
                    onPress={cargarLugares}
                >

                    <Text style={styles.textoBoton}>
                        Reintentar
                    </Text>

                </TouchableOpacity>

                <Navbar pantallaActual="Recomendaciones" />

            </SafeAreaView>

        )

    }

    return (

        <SafeAreaView style={styles.fondo}>

            <Text style={styles.titulo}>
                Lugares cerca tuyo
            </Text>

            <FlatList
                data={lugares}
                keyExtractor={(item) => item.properties.place_id}
                showsVerticalScrollIndicator={false}
                contentContainerStyle={{ paddingBottom: 100 }}
                renderItem={({ item }) => (

                    <TouchableOpacity
                        style={styles.card}
                        onPress={() =>
                            navigation.navigate(
                                'InfoRecomendacion',
                                { lugar: item }
                            )
                        }>

                        <Image
                            source={{
                                uri: MI_IMAGEN_ELEGIDA
                            }}
                            style={styles.fotoCard}
                        />

                        <Text style={styles.nombre}>
                            {item.properties.name}
                        </Text>

                        <Text style={styles.direccion}>
                            {
                                item.properties.address_line2 ||
                                item.properties.formatted
                            }
                        </Text>

                    </TouchableOpacity>

                )}
            />

            <Navbar pantallaActual="Recomendaciones" />

        </SafeAreaView>

    )

}

const styles = StyleSheet.create({

    fondo: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        paddingBottom: 90
    },

    loadingContainer: {
        flex: 1,
        backgroundColor: '#15151C',
        justifyContent: 'center',
        alignItems: 'center'
    },

    titulo: {
        color: 'white',
        fontSize: 28,
        fontFamily: 'CashMarket',
        marginBottom: 20
    },

    card: {
        backgroundColor: '#23232C',
        borderRadius: 18,
        padding: 15,
        marginBottom: 18
    },

    fotoCard: {
        width: '100%',
        height: 150,
        borderRadius: 12,
        marginBottom: 12
    },

    nombre: {
        color: 'white',
        fontSize: 18,
        fontFamily: 'CashMarket'
    },

    direccion: {
        color: '#AFAFAF',
        fontFamily: 'Utendo',
        marginTop: 5
    },

    errorTitulo: {
        color: 'white',
        fontFamily: 'CashMarket',
        fontSize: 20,
        marginBottom: 20,
        textAlign: 'center'
    },

    botonReintentar: {
        backgroundColor: '#57C7A3',
        paddingHorizontal: 22,
        paddingVertical: 12,
        borderRadius: 12
    },

    textoBoton: {
        color: '#000',
        fontFamily: 'CashMarket'
    }

})