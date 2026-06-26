import { useEffect, useState } from 'react'
import {
    StyleSheet,
    Text,
    View,
    FlatList,
    Image // <- Importante para renderizar la foto
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Navbar from './Utilidades/Navbar'
import supabase from './supabaseClient'

const API_KEY = 'a3b581712a364e97b7c5d371f7f86ee8'

// pegá acá el link de la imagen que vos elijas para todos los lugares
const MI_IMAGEN_ELEGIDA = 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTYGR-KyWBs8T4kE2hXYzGhoVTOPsOtmweh3acdYL7jlzmlTqfSXmpBbr8&s=10';

export default function Recomendaciones() {

    const [lugares, setLugares] = useState([])

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

            const urlFinal = "https://geoapify.com?" + parametros.toString();

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
                Lugares
            </Text>

            <FlatList
                data={lugares}
                keyExtractor={(item) => item.properties.place_id}
                renderItem={({ item }) => (
                    <View style={styles.card}>

                        {/* Inyectamos directamente tu imagen fija elegida */}
                        <Image
                            source={{ uri: MI_IMAGEN_ELEGIDA }}
                            style={styles.fotoCard}
                        />

                        <Text style={styles.nombre}>
                            {item.properties.name}
                        </Text>

                        <Text style={styles.direccion}>
                            {item.properties.address_line2 || item.properties.formatted}
                        </Text>

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
        fontSize: 24,
        fontWeight: 'bold',
        marginBottom: 20
    },
    card: {
        backgroundColor: '#23232C',
        borderRadius: 15,
        padding: 15,
        marginBottom: 15,
        overflow: 'hidden' // Evita que la foto tape el redondeado de la card
    },
    fotoCard: {
        width: '100%',
        height: 140,
        borderRadius: 10,
        marginBottom: 12,
        backgroundColor: '#1A1A22'
    },
    nombre: {
        color: 'white',
        fontSize: 18,
        fontWeight: 'bold'
    },
    direccion: {
        color: '#BDBDBD',
        marginTop: 5
    }
})
