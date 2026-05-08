import { useEffect, useState } from 'react'
import { useNavigation, useRoute } from '@react-navigation/native'
import { View, Text, TouchableOpacity } from 'react-native'
import supabase from '../supabaseClient'

function InicioGrupo() {
    const navigation = useNavigation()
    const route = useRoute()
    const { id } = route.params
    const [evento, setEvento] = useState(null)

    useEffect(() => {
        traerEvento()
    }, [])

    async function traerEvento() {
        const { data, error } = await supabase
            .from('evento')
            .select('*')
            .eq('id_grupo', id)
            .gt('fecha_hora_inicio', new Date().toISOString())
            .order('fecha_hora_inicio', { ascending: true })
            .limit(1)
            .single()

        if (error) return
        setEvento(data)
    }

    return (
        <View>
            <Text>Próximas juntadas</Text>
            {evento ? (
                <View>
                    <Text>{evento.nombre}</Text>
                </View>
            ) : (
                <Text>No hay juntadas próximas</Text>
            )}
            <TouchableOpacity onPress={() => navigation.navigate('ProponerJuntada', { id })}>
                <Text>Proponer Juntada</Text>
            </TouchableOpacity>
        </View>
    )
}

export default InicioGrupo