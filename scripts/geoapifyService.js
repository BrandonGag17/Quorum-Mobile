const API_KEY = "a3b581712a364e97b7c5d371f7f86ee8";

const BASE_URL = "https://api.geoapify.com/v2/places";

export async function obtenerLugares(categoria) {
    try {

        const url =
            `${BASE_URL}?categories=${categoria}` +
            `&filter=circle:-58.3816,-34.6037,7000` +
            `&limit=20` +
            `&apiKey=${API_KEY}`;

        const response = await fetch(url);

        const data = await response.json();

        return data.features.map(lugar => ({
            id: lugar.properties.place_id,
            nombre: lugar.properties.name,
            direccion: lugar.properties.formatted,
            categoria,
            latitud: lugar.properties.lat,
            longitud: lugar.properties.lon
        }));

    } catch (error) {
        console.error(error);
        return [];
    }
}