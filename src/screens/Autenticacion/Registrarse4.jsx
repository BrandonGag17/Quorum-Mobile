import { View, Text, TouchableOpacity, ActivityIndicator, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useEffect, useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'

import Button from '../../components/BotonesIntro'
import ErrorMessage from '../../components/MensajeError'
import { useRegistration } from '../../hooks/useRegistration'
import supabase from '../../services/supabaseClient'

function Registrarse4() {
    const navigation = useNavigation()
    const route = useRoute()
    const { completeRegistration, loading, error, setError } = useRegistration()

    const {
        email,
        username,
        password,
        nombre,
        apellido,
        fecha_nacimiento,
        barrio,
        fotoUri,
    } = route.params || {}

    const [gustos, setGustos] = useState([])
    const [gustosSeleccionados, setGustosSeleccionados] = useState([])
    const [cargandoGustos, setCargandoGustos] = useState(true)
    const [mensaje, setMensaje] = useState('')

    useEffect(() => {
        cargarGustos()
    }, [])

    const cargarGustos = async () => {
        try {
            const { data, error } = await supabase
                .from('gusto')
                .select('id_gusto, nombre')
                .order('id_gusto')

            if (error) {
                setMensaje('No se pudieron cargar los gustos')
                return
            }

            setGustos(data || [])
        } catch (error) {
            setMensaje('No se pudieron cargar los gustos')
        } finally {
            setCargandoGustos(false)
        }
    }

    const toggleGusto = (idGusto) => {
        setMensaje('')
        setError('')

        setGustosSeleccionados((actuales) => {
            if (actuales.includes(idGusto)) {
                return actuales.filter((id) => id !== idGusto)
            }

            if (actuales.length >= 5) {
                return actuales
            }

            return [...actuales, idGusto]
        })
    }

    const handleSubmit = async () => {
        setMensaje('')
        setError('')

        if (gustosSeleccionados.length === 0) {
            setMensaje('Seleccioná al menos un gusto')
            return
        }

        const result = await completeRegistration({
            email,
            username,
            password,
            nombre,
            apellido,
            fecha_nacimiento,
            barrio,
            gustos: gustosSeleccionados,
            fotoUri,
        })

        if (!result.ok) {
            setMensaje(result.message)
            return
        }

        navigation.replace('Exito')
    }

    return (
        <SafeAreaView style={styles.fondo}>
            <Text style={styles.titulo}>Registrarse</Text>
            <Text style={styles.subtitulo}>¿Qué cosas te gustan?</Text>
            <Text style={styles.descripcion}>Elegí hasta 5 gustos para personalizar tus recomendaciones.</Text>

            {cargandoGustos ? (
                <ActivityIndicator size="large" color="#A846E9" />
            ) : (
                <View style={styles.grid}>
                    {gustos.map((gusto) => {
                        const seleccionado = gustosSeleccionados.includes(gusto.id_gusto)

                        return (
                            <TouchableOpacity
                                key={gusto.id_gusto}
                                activeOpacity={0.8}
                                onPress={() => toggleGusto(gusto.id_gusto)}
                                style={[styles.chip, seleccionado && styles.chipActivo]}
                            >
                                <Text style={[styles.chipTexto, seleccionado && styles.chipTextoActivo]}>
                                    {gusto.nombre}
                                </Text>
                            </TouchableOpacity>
                        )
                    })}
                </View>
            )}

            <Text style={styles.contador}>{gustosSeleccionados.length}/5 seleccionados</Text>

            {mensaje ? <ErrorMessage mensaje={mensaje} /> : null}
            {error ? <ErrorMessage mensaje={error} /> : null}

            <Button
                nombre={loading ? 'Guardando...' : 'Continuar'}
                onPress={handleSubmit}
                disabled={cargandoGustos || loading}
            />
        </SafeAreaView>
    )
}

const styles = StyleSheet.create({
    fondo: {
        flex: 1,
        backgroundColor: '#15151C',
        padding: 25,
        justifyContent: 'center',
    },
    titulo: {
        fontFamily: 'CashMarket',
        color: 'white',
        fontSize: 40,
        textAlign: 'center',
        marginBottom: 10,
    },
    subtitulo: {
        fontFamily: 'Utendo',
        color: 'white',
        fontSize: 24,
        marginBottom: 12,
        textAlign: 'center',
    },
    descripcion: {
        color: '#D0D0D0',
        fontFamily: 'Utendo',
        fontSize: 16,
        textAlign: 'center',
        marginBottom: 20,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        marginBottom: 20,
    },
    chip: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 999,
        backgroundColor: '#2A2A2E',
        borderWidth: 1,
        borderColor: '#4F4F55',
        marginRight: 8,
        marginBottom: 8,
    },
    chipActivo: {
        backgroundColor: '#5E2D82',
        borderColor: '#8C60B8',
    },
    chipTexto: {
        color: '#FFFFFF',
        fontFamily: 'Utendo',
        fontSize: 14,
    },
    chipTextoActivo: {
        color: '#FFFFFF',
        fontWeight: '700',
    },
    contador: {
        color: '#BDBDBD',
        fontFamily: 'Utendo',
        fontSize: 16,
        marginBottom: 20,
        textAlign: 'center',
    },
})

export default Registrarse4
