const ACCESS_KEY = process.env.EXPO_PUBLIC_UNSPLASH_KEY;

export async function obtenerImagenLugar(nombre, direccion = "") {
    try {
        const query = `${nombre} ${direccion}`;

        const response = await fetch(
            `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=1&orientation=landscape`,
            {
                headers: {
                    Authorization: `Client-ID ${ACCESS_KEY}`
                }
            }
        );

        const data = await response.json();

        if (data.results.length > 0) {
            return data.results[0].urls.small;
        }

        return null;
    } catch (error) {
        console.log(error);
        return null;
    }
}