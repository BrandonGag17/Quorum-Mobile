import React, { useEffect, useState } from 'react'
import { View, Text, Button } from 'react-native'
import { useRoute, useNavigation } from '@react-navigation/native'
import supabase from '../supabaseClient'

function InicioGrupo() {
    const route = useRoute()
    const navigation = useNavigation()

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

            <Button
                title="Proponer Juntada"
                onPress={() =>
                    navigation.navigate('ProponerJuntada', { id })
                }
            />
        </View>
    )
}

export default InicioGrupo