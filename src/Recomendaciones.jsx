import { useEffect, useState } from 'react'
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    Image,
    ActivityIndicator,
    TouchableOpacity,
    TextInput
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useNavigation } from '@react-navigation/native'
import Navbar from './Utilidades/Navbar'
import supabase from './supabaseClient'
import { obtenerLugares } from '../services/geoapifyService'
import Feather from '@expo/vector-icons/Feather'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'

export default function Recomendaciones() {
    const navigation = useNavigation()

    const [lugares, setLugares] = useState([])
    const [cargando, setCargando] = useState(true)
    const [error, setError] = useState(false)
    const [busqueda, setBusqueda] = useState('')

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
                const centroide = localidad?.centroide || localidad?.centroid
                const nuevaLat = centroide?.lat ?? centroide?.latitude ??
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
                Recomendación de lugares
            </Text>

            <View style={styles.buscador}>
                <Feather name="search" size={22} color="#808080" />

                <TextInput
                    style={styles.inputBuscador}
                    placeholder="Buscar lugares"
                    placeholderTextColor="#808080"
                    value={busqueda}
                    onChangeText={setBusqueda}
                />
            </View>

            <FlatList
                data={lugares}
                numColumns={2}
                columnWrapperStyle={styles.fila}
                keyExtractor={(item) => item.id}
                showsVerticalScrollIndicator={false}
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
                            source={
                                item.imagen
                                    ? { uri: item.imagen }
                                    : require('../assets/img/Placeholders/laHormiga.png')
                            }
                            style={styles.fotoCard}
                        />

                        <View style={styles.info}>
                            <Text numberOfLines={1} style={styles.nombre}>
                                {item.nombre}
                            </Text>

                            <View style={styles.direccionContainer}>
                                <FontAwesome6
                                    name="location-dot"
                                    size={11}
                                    color="#B6B6B6"
                                    style={{ marginRight: 6 }}
                                />
                                <Text numberOfLines={1} style={styles.direccion}>
                                    {item.address_line2 || item.formatted}
                                </Text>
                            </View>
                        </View>

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
        paddingBottom: 90,
    },
    titulo: {
        color: 'white',
        fontFamily: 'CashMarket',
        fontSize: 24,
        marginBottom: 10,
        marginTop: 7
    },
    fila: {
        justifyContent: 'space-between',
    },

    card: {
        width: '48%',
        backgroundColor: '#66278F',
        borderRadius: 12,
        overflow: 'hidden',
        marginBottom: 16,
    },

    fotoCard: {
        width: '100%',
        height: 120,
    },

    info: {
        padding: 10,
    },

    nombre: {
        color: 'white',
        fontSize: 16,
        fontWeight: 'bold',
    },

    direccionContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 4,
    },

    direccion: {
        flex: 1,
        color: '#E7D8FF',
        fontSize: 12,
        fontFamily: 'Utendo',
    },
    buscador: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#373749',
        borderRadius: 16,
        paddingHorizontal: 15,
        height: 52,
        marginBottom: 30,
        marginTop: 20,
        borderWidth: 1,
        borderColor: '#726c79',
    },
    inputBuscador: {
        flex: 1,
        color: 'white',
        fontFamily: 'Utendo',
        marginLeft: 10,
        fontSize: 16,
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#15151C'
    },
})  