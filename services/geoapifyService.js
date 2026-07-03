import { obtenerImagenLugar } from "./unsplashService";

const API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_KEY
const BASE_URL =
    "https://api.geoapify.com/v2/places"

export async function obtenerLugares(
    categorias,
    lat,
    lon,
    radio = 3000
) {

    try {

        const parametros =
            new URLSearchParams({

                categories: categorias,

                filter: `circle:${lon},${lat},${radio}`,

                limit: "20",

                apiKey: API_KEY

            })

        const response = await fetch(
            `${BASE_URL}?${parametros}`
        )

        const data = await response.json()

        if (!data.features)
            return []

        const lugares = await Promise.all(
            data.features.map(async lugar => {

                const imagen = await obtenerImagenLugar(
                    lugar.properties.name,
                    lugar.properties.formatted
                );

                return {
                    id: lugar.properties.place_id,
                    nombre: lugar.properties.name,
                    direccion: lugar.properties.formatted,
                    latitud: lugar.properties.lat,
                    longitud: lugar.properties.lon,
                    imagen
                };
            })
        );

        return lugares;

    }

    catch (error) {

        console.log(error)

        return []

    }

}