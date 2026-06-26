import { useEffect, useState } from 'react'
import {
    StyleSheet,
    Text,
    View,
    FlatList
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import Navbar from './Utilidades/Navbar'

const API_KEY = 'a3b581712a364e97b7c5d371f7f86ee8'

export default function Recomendaciones() {

    const [lugares, setLugares] = useState([])

    useEffect(() => {
        cargarRestaurantes()
    }, [])

    async function cargarRestaurantes() {
        try {
            const parametros = new URLSearchParams({
                categories: 'catering.restaurant,catering.cafe,catering.bar',
                filter: 'circle:-58.4438,-34.5996,1500', // Coordenadas céntricas de Villa Crespo
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
                 Lugares 
            </Text>

            <FlatList
                data={lugares}
                keyExtractor={(item) => item.properties.place_id}
                renderItem={({ item }) => (
                    <View style={styles.card}>

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
        marginBottom: 15
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
