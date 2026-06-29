import { StyleSheet, Text, View, Image, ScrollView, } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import Navbar from "../Utilidades/Navbar";
import BotonVolver from "../Utilidades/BotonVolver";
import Iconos from "../Utilidades/Iconos";
import Ionicons from "@expo/vector-icons/Ionicons";
import Entypo from "@expo/vector-icons/Entypo";

export default function InfoRecomendaciones() {
    return (
        <SafeAreaView style={styles.fondo}>
            <ScrollView showsVerticalScrollIndicator={false}>
                <BotonVolver />

                <Image
                    source={require("../../assets/img/Placeholders/laHormiga.png")}
                    style={styles.imagen}
                />

                <Text style={styles.titulo}>La Hormiga</Text>

                <Text style={styles.estrellas}>★★★★★</Text>

                <View style={styles.direccionContainer}>
                    <Entypo
                        name="location-pin"
                        size={17}
                        color="#B6B6B6"
                        style={styles.iconoUbicacion}
                    />

                    <Text style={styles.direccion}>
                        Armenia 1680, Palermo
                    </Text>
                </View>

                <Iconos
                    size={36}
                    titulo="Descripción"
                    icono={<Ionicons name="document-text" size={25} color="#000" />}
                />

                <Text style={styles.descripcion}>
                    La Hormiga es un restaurante conocido por su ambiente cálido, rústico
                    y acogedor, con salón de madera. Destaca por sus porciones
                    abundantes, precios razonables y cocina al horno de barro/parrilla.
                </Text>

                <Iconos
                    size={36}
                    titulo="Horarios"
                    icono={<Ionicons name="calendar" size={25} color="#000" />}
                />

                <View style={styles.tabla}>
                    {[
                        ["Lunes", "11:00 AM - 12:00 AM"],
                        ["Martes", "11:00 AM - 12:00 AM"],
                        ["Miércoles", "11:00 AM - 12:00 AM"],
                        ["Jueves", "11:00 AM - 12:00 AM"],
                        ["Viernes", "11:00 AM - 12:00 AM"],
                        ["Sábado", "12:00 PM - 11:00 PM"],
                    ].map((item, index) => (
                        <View
                            key={index}
                            style={[
                                styles.fila,
                                index === 5 && { borderBottomWidth: 0 },
                            ]}
                        >
                            <Text style={styles.dia}>{item[0]}</Text>
                            <Text style={styles.hora}>{item[1]}</Text>
                        </View>
                    ))}
                </View>
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
        borderRadius: 15,
        marginTop: 15,
    },

    titulo: {
        color: 'white',
        alignSelf: 'center',
        fontFamily: 'CashMarket',
        fontSize: 24,
        marginTop: 10,
    },

    estrellas: {
        textAlign: "center",
        color: "#FFD700",
        fontSize: 22,
        letterSpacing: 2,
    },

    direccionContainer: {
        flexDirection: "row",
        justifyContent: "center",
        alignItems: "center",
        marginTop: 8,
        marginBottom: 10,
        width: "100%",
    },

    direccion: {
        color: "#B6B6B6",
        fontSize: 13,
        fontFamily: "Utendo",
        marginLeft: 6,
    },

    descripcion: {
        color: "white",
        marginTop: 7,
        marginBottom: 20,
        fontFamily: 'Utendo'
    },

    tabla: {
        backgroundColor: "#5C3E94",
        borderRadius: 10,
        overflow: "hidden",
        marginTop: 10,
        marginBottom: 30,
    },

    fila: {
        flexDirection: "row",
        justifyContent: "space-between",
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: "rgba(255,255,255,0.2)",
    },

    dia: {
        color: "#FFF",
        fontSize: 15,
        fontFamily: 'Utendo',
        marginTop: 2
    },

    hora: {
        color: "#FFF",
        fontSize: 12,
        fontFamily: 'Utendo',
        marginTop: 5
    },
    iconoUbicacion: {
    marginBottom: 5,
},
});