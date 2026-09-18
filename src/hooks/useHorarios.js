import { useCallback, useEffect, useRef, useState } from 'react'
import { getSession } from '../services/authService'
import {
    createHorario,
    createHorarioRecurrente,
    getHorariosUsuario,
    getHorariosRecurrentesUsuario
} from '../services/horariosService'
export function useHorarios() {
    const guardando = useRef(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)

    const [horarios, setHorarios] = useState([])
    const [horariosRecurrentes, setHorariosRecurrentes] = useState([])

    const limpiarError = useCallback(() => setError(null), [])

    const cargarHorarios = useCallback(async () => {
        setError(null)
        try {
            const { data: sessionData, error: sessionError } = await getSession()

            if (sessionError) {
                setError(sessionError.message)
                return
            }

            const userId = sessionData?.session?.user?.id

            if (!userId) {
                setHorarios([])
                setHorariosRecurrentes([])
                return
            }

            const [normalesRes, recurrentesRes] = await Promise.all([
                getHorariosUsuario(userId),
                getHorariosRecurrentesUsuario(userId)
            ])

            if (normalesRes.error) {
                setError(normalesRes.error.message)
                return
            }

            if (recurrentesRes.error) {
                setError(recurrentesRes.error.message)
                return
            }

            setHorarios(normalesRes.data)
            setHorariosRecurrentes(recurrentesRes.data)

        } catch (err) {
            setError(err?.message || 'No se pudieron cargar los horarios')
        }
    }, [])
    useEffect(() => {
        cargarHorarios()
    }, [cargarHorarios])
    const agregarHorario = async ({ titulo, anio, mes, dia, horaInicio, horaFin }) => {
        if (guardando.current) {
            return { data: null, error: { message: 'Ya se está guardando un horario' } }
        }

        guardando.current = true
        setLoading(true)
        setError(null)

        try {
            if (typeof titulo !== 'string' || !titulo.trim()) {
                throw new Error('Ingresá un nombre para el evento')
            }
            if (!Number.isInteger(anio) || !Number.isInteger(mes) ||
                !Number.isInteger(dia) || mes < 0 || mes > 11 || dia < 1) {
                throw new Error('Seleccioná una fecha válida')
            }

            const fecha = new Date(anio, mes, dia)
            if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes || fecha.getDate() !== dia) {
                throw new Error('Seleccioná una fecha válida')
            }
            if (![horaInicio, horaFin].every(hora =>
                hora instanceof Date && Number.isFinite(hora.getTime())
            )) {
                throw new Error('Seleccioná horarios válidos')
            }

            const minutosInicio =
                horaInicio.getHours() * 60 + horaInicio.getMinutes()

            const minutosFin =
                horaFin.getHours() * 60 + horaFin.getMinutes()

            if (minutosFin <= minutosInicio) {
                throw new Error(
                    'La hora de finalización debe ser posterior a la de inicio'
                )
            }

            const { data: sessionData, error: sessionError } = await getSession()
            if (sessionError) throw sessionError

            const userId = sessionData?.session?.user?.id
            if (!userId) throw new Error('No se pudo determinar el usuario activo')

            const conHora = hora => new Date(
                anio, mes, dia, hora.getHours(), hora.getMinutes()
            ).toISOString()

            const { data, error: horarioError } = await createHorario({
                userId,
                titulo,
                fechaHoraInicio: conHora(horaInicio),
                fechaHoraFin: conHora(horaFin)
            })
            if (horarioError) throw horarioError

            setHorarios(prev => [...prev, data])
            return { data, error: null }
        } catch (err) {
            const error = { message: err?.message || 'No se pudo crear el horario' }
            setError(error.message)
            return { data: null, error }
        } finally {
            guardando.current = false
            setLoading(false)
        }
    }

    const agregarHorarioRecurrente = async ({
        titulo,
        anio,
        mes,
        dia,
        horaInicio,
        horaFin,
        dias
    }) => {
        if (guardando.current) {
            return { data: null, error: { message: 'Ya se está guardando un horario' } }
        }

        guardando.current = true
        setLoading(true)
        setError(null)

        try {
            if (typeof titulo !== 'string' || !titulo.trim()) {
                throw new Error('Ingresá un nombre para el evento')
            }
            if (!Number.isInteger(anio) || !Number.isInteger(mes) ||
                !Number.isInteger(dia) || mes < 0 || mes > 11 || dia < 1) {
                throw new Error('Seleccioná una fecha válida')
            }
            const fecha = new Date(anio, mes, dia)
            if (fecha.getFullYear() !== anio || fecha.getMonth() !== mes || fecha.getDate() !== dia) {
                throw new Error('Seleccioná una fecha válida')
            }
            if (![horaInicio, horaFin].every(hora =>
                hora instanceof Date && Number.isFinite(hora.getTime())
            )) {
                throw new Error('Seleccioná horarios válidos')
            }
            const minutosInicio =
                horaInicio.getHours() * 60 + horaInicio.getMinutes()

            const minutosFin =
                horaFin.getHours() * 60 + horaFin.getMinutes()

            if (minutosFin <= minutosInicio) {
                throw new Error(
                    'La hora de finalización debe ser posterior a la de inicio'
                )
            }
            if (!Array.isArray(dias) || !dias.length ||
                !dias.every(dia => Number.isInteger(dia) && dia >= 1 && dia <= 7)) {
                throw new Error('Seleccioná los días de repetición')
            }
            const { data: sessionData, error: sessionError } = await getSession()

            if (sessionError) {
                setError(sessionError.message)
                return { data: null, error: sessionError }
            }

            const userId = sessionData?.session?.user?.id

            if (!userId) {
                const userError = {
                    message: 'No se pudo determinar el usuario activo'
                }

                setError(userError.message)
                return { data: null, error: userError }
            }

            const fechaInicio =
                `${anio}-${String(mes + 1).padStart(2, '0')}-${String(dia).padStart(2, '0')}`

            const formatearHora = (fecha) => {
                const horas = String(fecha.getHours()).padStart(2, '0')
                const minutos = String(fecha.getMinutes()).padStart(2, '0')

                return `${horas}:${minutos}:00`
            }

            const { data, error: horarioError } =
                await createHorarioRecurrente({
                    userId,
                    titulo,
                    horaInicio: formatearHora(horaInicio),
                    horaFin: formatearHora(horaFin),
                    fechaInicio,
                    dias: [...new Set(dias)]
                })

            if (horarioError) {
                setError(horarioError.message)
                return { data: null, error: horarioError }
            }

            setHorariosRecurrentes(prev => [...prev, { ...data.horario, dia_horario_recurrente: data.dias }])
            return { data, error: null }
        } catch (err) {
            const error = { message: err?.message || 'No se pudo crear el horario recurrente' }
            setError(error.message)
            return { data: null, error }
        } finally {
            guardando.current = false
            setLoading(false)
        }
    }
    return {
        agregarHorario,
        agregarHorarioRecurrente,
        horarios,
        horariosRecurrentes,
        cargarHorarios,
        limpiarError,
        loading,
        error
    }


}
