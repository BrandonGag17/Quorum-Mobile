import { useState } from 'react'
import { getSession } from '../services/authService'
import { createProposalJuntada } from '../services/propuestaService'

export default function useCreateProposal() {
    const [cargando, setCargando] = useState(false)
    const [error, setError] = useState('')

    const crearPropuesta = async ({
        idGrupo,
        nombre,
        descripcion,
        opcionesFechas,
        opcionesLugares,
        fechaCierre
    }) => {

        setCargando(true)
        setError('')

        try {
            const {
                data: { session },
                error: errorUsuario
            } = await getSession()

            if (errorUsuario) {
                throw errorUsuario
            }

            const user = session?.user

            if (!user) {
                throw new Error('No se pudo obtener el usuario')
            }
            
            const {
                data,
                error: errorPropuesta
            } = await createProposalJuntada({
                idGrupo,
                idCreador: user.id,
                nombre,
                descripcion,
                opcionesFechas,
                opcionesLugares,
                fechaCierre
            })

            if (errorPropuesta) {
                throw errorPropuesta
            }

            return {
                data,
                error: null
            }

        } catch (error) {

            console.error(
                'Error al crear propuesta:',
                error
            )

            const mensaje =
                error?.message ||
                'No se pudo crear la propuesta'

            setError(mensaje)

            return {
                data: null,
                error
            }

        } finally {
            setCargando(false)
        }
    }

    const limpiarError = () => {
        setError('')
    }

    return {
        crearPropuesta,
        cargando,
        error,
        limpiarError
    }
}