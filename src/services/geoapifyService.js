const API_KEY = process.env.EXPO_PUBLIC_GEOAPIFY_KEY;

const BASE_URL = "https://api.geoapify.com/v2/places";

export async function obtenerLugares(
    categorias,
    lat,
    lon,
    radio = 3000
) {
    try {

        const parametros = new URLSearchParams({
            categories: categorias,
            filter: `circle:${lon},${lat},${radio}`,
            limit: "20",
            apiKey: API_KEY
        });

        const response = await fetch(
            `${BASE_URL}?${parametros.toString()}`
        );

        const data = await response.json();

        if (!data.features) {
            return [];
        }

        return data.features.map(lugar => ({
            id: lugar.properties.place_id,
            nombre: lugar.properties.name,
            direccion:
                lugar.properties.address_line2 ||
                lugar.properties.formatted,
            categoria: lugar.properties.categories,
            latitud: lugar.properties.lat,
            longitud: lugar.properties.lon,

            // Guardamos TODO por si después queremos usarlo
            properties: lugar.properties
        }));

    }
    catch (error) {
        console.log(error);
        return [];
    }
}