import { StyleSheet, Text, View, Image, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRoute } from "@react-navigation/native";
import Navbar from "../Utilidades/Navbar";
import BotonVolver from "../Utilidades/BotonVolver";
import Iconos from "../Utilidades/Iconos";
import Ionicons from "@expo/vector-icons/Ionicons";
import Entypo from "@expo/vector-icons/Entypo";

export default function InfoRecomendaciones() {
    const route = useRoute();
    const { lugar } = route.params;

    function obtenerCategoria(categorias) {
        if (!categorias) return "Lugar";

        if (categorias.includes("catering.restaurant"))
            return "Restaurante";

        if (categorias.includes("catering.cafe"))
            return "Cafetería";

        if (categorias.includes("catering.bar"))
            return "Bar";

        return "Gastronomía";
    }

    return (
        <SafeAreaView style={styles.fondo}>
            <ScrollView showsVerticalScrollIndicator={false}>

                <BotonVolver />

                <Image
                    source={require("../../assets/img/Placeholders/laHormiga.png")}
                    style={styles.imagen}
                />

                <Text style={styles.titulo}>
                    {lugar.nombre}
                </Text>

                <View style={styles.ratingContainer}>

                    <View style={styles.rating}>
                        <Text style={styles.ratingTexto}>
                            ⭐ Sin valoraciones
                        </Text>
                    </View>

                    <View style={styles.categoria}>
                        <Text style={styles.categoriaTexto}>
                            {obtenerCategoria(lugar.categoria)}
                        </Text>
                    </View>

                </View>


                <Iconos
                    titulo="Ubicación"
                    size={36}
                    icono={
                        <Entypo
                            name="location-pin"
                            size={24}
                            color="#000"
                        />
                    }
                />

                <View style={styles.card}>

                    <View style={styles.filaInfo}>
                        <Entypo
                            name="location-pin"
                            size={20}
                            color="#57C7A3"
                        />

                        <Text style={styles.infoTexto}>
                            {lugar.direccion}
                        </Text>

                    </View>

                </View>


                <Iconos
                    titulo="Información"
                    size={36}
                    icono={
                        <Ionicons
                            name="information-circle"
                            size={24}
                            color="#000"
                        />
                    }
                />

                <View style={styles.card}>

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Ciudad</Text>

                        <Text style={styles.valor}>
                            {lugar.properties.city || "-"}
                        </Text>
                    </View>

                    <View style={styles.separador} />

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Provincia</Text>

                        <Text style={styles.valor}>
                            {lugar.properties.state || "-"}
                        </Text>
                    </View>

                    <View style={styles.separador} />

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>Código Postal</Text>

                        <Text style={styles.valor}>
                            {lugar.properties.postcode || "-"}
                        </Text>
                    </View>

                    <View style={styles.separador} />

                    <View style={styles.infoRow}>
                        <Text style={styles.label}>País</Text>

                        <Text style={styles.valor}>
                            {lugar.properties.country || "-"}
                        </Text>
                    </View>

                </View>


                {(lugar.properties.datasource?.raw?.phone ||
                    lugar.properties.datasource?.raw?.website ||
                    lugar.properties.datasource?.raw?.email) && (

                        <>
                            <Iconos
                                titulo="Contacto"
                                size={36}
                                icono={
                                    <Ionicons
                                        name="call"
                                        size={24}
                                        color="#000"
                                    />
                                }
                            />

                            <View style={styles.card}>

                                {lugar.properties.datasource?.raw?.phone && (

                                    <>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.label}>
                                                Teléfono
                                            </Text>

                                            <Text style={styles.valor}>
                                                {lugar.properties.datasource.raw.phone}
                                            </Text>
                                        </View>

                                        <View style={styles.separador} />
                                    </>

                                )}

                                {lugar.properties.datasource?.raw?.website && (

                                    <>
                                        <View style={styles.infoRow}>
                                            <Text style={styles.label}>
                                                Sitio web
                                            </Text>

                                            <Text style={styles.valor}>
                                                {lugar.properties.datasource.raw.website}
                                            </Text>
                                        </View>

                                        <View style={styles.separador} />
                                    </>

                                )}

                                {lugar.properties.datasource?.raw?.email && (

                                    <View style={styles.infoRow}>
                                        <Text style={styles.label}>
                                            Email
                                        </Text>

                                        <Text style={styles.valor}>
                                            {lugar.properties.datasource.raw.email}
                                        </Text>
                                    </View>

                                )}

                            </View>
                        </>

                    )}


                <TouchableOpacity style={styles.botonMaps}>

                    <Ionicons
                        name="navigate"
                        size={22}
                        color="#000"
                    />

                    <Text style={styles.textoBoton}>
                        Abrir en Google Maps
                    </Text>

                </TouchableOpacity>

            </ScrollView>

            <Navbar pantallaActual="Recomendaciones" />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    fondo: {
        flex: 1,
        backgroundColor: "#15151C",
        padding: 25,
        paddingBottom: 90,
    },

    imagen: {
        width: "100%",
        height: 220,
        borderRadius: 18,
        marginTop: 15,
    },

    titulo: {
        color: "white",
        fontFamily: "CashMarket",
        fontSize: 28,
        marginTop: 18,
    },

    ratingContainer: {
        flexDirection: "row",
        alignItems: "center",
        marginTop: 14,
        marginBottom: 28,
    },

    rating: {
        backgroundColor: "#FFE28A",
        borderRadius: 25,
        paddingHorizontal: 14,
        paddingVertical: 8,
        marginRight: 10,
    },

    ratingTexto: {
        color: "#000",
        fontFamily: "CashMarket",
        fontSize: 13,
    },

    categoria: {
        backgroundColor: "#57C7A3",
        borderRadius: 25,
        paddingHorizontal: 14,
        paddingVertical: 8,
    },

    categoriaTexto: {
        color: "#000",
        fontFamily: "CashMarket",
        fontSize: 13,
    },

    card: {
        backgroundColor: "#23232D",
        borderRadius: 18,
        padding: 18,
        marginTop: 12,
        marginBottom: 26,
    },

    filaInfo: {
        flexDirection: "row",
        alignItems: "center",
    },

    infoTexto: {
        color: "white",
        fontFamily: "Utendo",
        fontSize: 15,
        marginLeft: 10,
        flex: 1,
        lineHeight: 22,
    },

    infoRow: {
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        paddingVertical: 12,
    },

    label: {
        color: "#BDBDC7",
        fontFamily: "CashMarket",
        fontSize: 14,
    },

    valor: {
        color: "white",
        fontFamily: "Utendo",
        fontSize: 14,
        flex: 1,
        textAlign: "right",
        marginLeft: 20,
    },

    separador: {
        height: 1,
        backgroundColor: "#39394A",
    },

    botonMaps: {
        backgroundColor: "#57C7A3",
        borderRadius: 16,
        height: 58,
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "row",
        marginBottom: 30,
    },

    textoBoton: {
        color: "#000",
        fontFamily: "CashMarket",
        fontSize: 16,
        marginLeft: 10,
    },
});