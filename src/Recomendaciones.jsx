import { useEffect, useState } from 'react'
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    TextInput,
    Image
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Navbar from './Utilidades/Navbar'
import supabase from './supabaseClient'
import Feather from '@expo/vector-icons/Feather'
import FontAwesome6 from '@expo/vector-icons/FontAwesome6'

const API_KEY = 'a3b581712a364e97b7c5d371f7f86ee8'

// pegá acá el link de la imagen que vos elijas para todos los lugares
const MI_IMAGEN_ELEGIDA = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYGR-KyWBs8T4kE2hXYzGhoVTOPsOtmweh3acdYL7jlzmlTqfSXmpBbr8&s=10';

export default function Recomendaciones() {

    const [lugares, setLugares] = useState([])
    const [busqueda, setBusqueda] = useState('')

    useEffect(() => {
        (async () => {
            try {
                let lon = -58.4438
                let lat = -34.5996

                let user = null
                if (supabase.auth.getUser) {
                    const { data } = await supabase.auth.getUser()
                    user = data?.user
                } else if (supabase.auth.user) {
                    user = supabase.auth.user()
                }

                if (user) {
                    const { data: perfil } = await supabase
                        .from('usuario')
                        .select('localidad')
                        .eq('id', user.id)
                        .single()

                    let localidadObj = perfil?.localidad

                    if (typeof localidadObj === 'string') {
                        try {
                            localidadObj = JSON.parse(localidadObj)
                        } catch (e) {
                            console.log('Error parseando localidad JSON:', e)
                        }
                    }

                    console.log('Perfil recuperado (localidad):', localidadObj)

                    const centroide = localidadObj?.centroide || localidadObj?.centroid || localidadObj?.centroide

                    const latC = centroide?.lat ?? centroide?.latitude ?? (Array.isArray(centroide?.coordinates) ? centroide.coordinates[1] : undefined)
                    const lonC = centroide?.lon ?? centroide?.longitude ?? (Array.isArray(centroide?.coordinates) ? centroide.coordinates[0] : undefined)

                    if (latC !== undefined && lonC !== undefined) {
                        lat = latC
                        lon = lonC
                        console.log('Usando centroide de localidad:', { lat, lon })
                    } else {
                        console.log('No se encontró centroide válido en perfil; usando fallback', { lat, lon })
                    }
                }

                cargarRestaurantes(lon, lat)
            } catch (error) {
                console.log('Error obtaining localidad del usuario:', error)
                cargarRestaurantes()
            }
        })()
    }, [])

    async function cargarRestaurantes(lon = -58.4438, lat = -34.5996) {
        try {
            const parametros = new URLSearchParams({
                categories: 'catering.restaurant,catering.cafe,catering.bar',
                filter: `circle:${lon},${lat},1500`,
                limit: '15',
                apiKey: API_KEY
            });

            const urlFinal = "https://api.geoapify.com/v2/places?" + parametros.toString();

            console.log("URL generada con éxito:", urlFinal);

            const response = await fetch(urlFinal);
            const data = await response.json();

            if (data && data.features) {
                const conNombre = data.features.filter(item => item.properties?.name);
                setLugares(conNombre);
            }

        } catch (error) {
            console.log("Error real en el fetch:", error);
        }
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
                keyExtractor={(item) => item.properties.place_id}
                showsVerticalScrollIndicator={false}
                renderItem={({ item }) => (
                    <View style={styles.card}>

                        <Image
                            source={{ uri: MI_IMAGEN_ELEGIDA }}
                            style={styles.fotoCard}
                        />

                        <View style={styles.info}>
                            <Text numberOfLines={1} style={styles.nombre}>
                                {item.properties.name}
                            </Text>

                            <Text numberOfLines={1} style={styles.direccion}>
                                <FontAwesome6
                                    name="location-dot"
                                    size={11}
                                    color="#B6B6B6" 
                                />
                                {item.properties.address_line2 || item.properties.formatted}
                            </Text>
                        </View>

                    </View>
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
    titulo: {
        color: 'white',
        fontFamily: 'CashMarket',
        fontSize: 24,
        marginBottom: 5,
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

    direccion: {
        color: '#E7D8FF',
        fontSize: 12,
        marginTop: 4,
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
})  