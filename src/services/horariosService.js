import supabase from './supabaseClient'
import { getSession } from './authService'

function normalizarNombrePersona(usuario) {
    const nombre = typeof usuario?.nombre === 'string' ? usuario.nombre.trim() : ''
    const apellido = typeof usuario?.apellido === 'string' ? usuario.apellido.trim() : ''
    const username = typeof usuario?.username === 'string' ? usuario.username.trim() : ''
    const partes = [nombre, apellido].filter(Boolean)
    if (partes.length > 0) return partes.join(' ')
    return username || 'Integrante'
}

function parseHoraHora(hora) {
    if (typeof hora !== 'string') return null

    const parts = hora.split(':')
    if (parts.length < 2) return null

    const horas = Number(parts[0])
    const minutos = Number(parts[1])
    const segundos = Number(parts[2] || 0)

    if (!Number.isFinite(horas) || !Number.isFinite(minutos) || !Number.isFinite(segundos)) {
        return null
    }

    return { horas, minutos, segundos }
}

function formatearFechaHora(fecha) {
    const dia = String(fecha.getDate()).padStart(2, '0')
    const mes = String(fecha.getMonth() + 1).padStart(2, '0')
    const anio = fecha.getFullYear()
    const horas = String(fecha.getHours()).padStart(2, '0')
    const minutos = String(fecha.getMinutes()).padStart(2, '0')

    return `${dia}/${mes}/${anio} ${horas}:${minutos}`
}

function getDiaSemanaNumero(date) {
    return (date.getDay() + 6) % 7 + 1
}

const MARGEN_ANTES_COMPROMISO_MS = 3 * 60 * 60 * 1000
const MARGEN_DESPUES_COMPROMISO_MS = 1 * 60 * 60 * 1000

function horarioDentroDelMargen(horario, candidatoInicio) {
    const inicioCompromiso = horario.inicio.getTime()
    const finCompromiso = horario.fin.getTime()
    const inicioCandidato = candidatoInicio.getTime()

    if (inicioCandidato < inicioCompromiso) {
        return inicioCompromiso - inicioCandidato < MARGEN_ANTES_COMPROMISO_MS
    }

    return inicioCandidato < finCompromiso + MARGEN_DESPUES_COMPROMISO_MS
}

export async function buscarSugerenciasFechasPorGrupo({
    idGrupo,
    anticipacion = 7,
    horaDesde = '09:00',
    horaHasta = '21:00',
}) {
    if (!idGrupo) {
        return { data: [], error: { message: 'Falta el grupo para sugerir fechas.' } }
    }

    const dias = Number(anticipacion)
    if (!Number.isFinite(dias) || dias <= 0) {
        return { data: [], error: { message: 'La anticipación debe ser mayor a 0.' } }
    }

    const horaInicio = parseHoraHora(horaDesde)
    const horaFin = parseHoraHora(horaHasta)
    if (!horaInicio || !horaFin) {
        return { data: [], error: { message: 'Seleccioná una franja horaria válida.' } }
    }

    const inicioMinutos = horaInicio.horas * 60 + horaInicio.minutos
    const finMinutos = horaFin.horas * 60 + horaFin.minutos
    if (finMinutos <= inicioMinutos) {
        return { data: [], error: { message: 'La hora final debe ser posterior a la de inicio.' } }
    }

    const { data: sessionData, error: sessionError } = await getSession()
    if (sessionError) {
        return { data: [], error: sessionError }
    }

    const userId = sessionData?.session?.user?.id
    if (!userId) {
        return { data: [], error: { message: 'Necesitás iniciar sesión para sugerir fechas.' } }
    }

    const { data: membresias, error: membresiasError } = await supabase
        .from('usuario_grupo')
        .select('id_usuario')
        .eq('id_grupo', idGrupo)

    if (membresiasError) {
        return { data: [], error: membresiasError }
    }

    const idsMiembros = [...new Set((membresias ?? []).map(item => item.id_usuario).filter(Boolean))]
    if (idsMiembros.length === 0) {
        return { data: [], error: { message: 'Este grupo no tiene integrantes cargados.' } }
    }

    const { data: usuarios, error: usuariosError } = await supabase
        .from('usuario')
        .select('id, nombre, apellido, username')
        .in('id', idsMiembros)

    if (usuariosError) {
        return { data: [], error: usuariosError }
    }

    const nombresPorUsuario = Object.fromEntries((usuarios ?? []).map(usuario => [usuario.id, normalizarNombrePersona(usuario)]))

    const { data: horariosPuntuales, error: puntualesError } = await supabase
        .from('horario_usuario')
        .select('id_usuario, fecha_hora_inicio, fecha_hora_fin')
        .in('id_usuario', idsMiembros)

    if (puntualesError) {
        return { data: [], error: puntualesError }
    }

    const { data: horariosRecurrentes, error: recurrentesError } = await supabase
        .from('horario_recurrente')
        .select('id_usuario, hora_inicio, hora_fin, fecha_inicio, fecha_fin, dia_horario_recurrente (dia_semana)')
        .in('id_usuario', idsMiembros)

    if (recurrentesError) {
        return { data: [], error: recurrentesError }
    }

    const horariosPorUsuario = new Map()

    for (const horario of horariosPuntuales ?? []) {
        const inicio = new Date(horario.fecha_hora_inicio)
        const fin = new Date(horario.fecha_hora_fin)
        if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fin.getTime())) continue

        const lista = horariosPorUsuario.get(horario.id_usuario) ?? []
        lista.push({ inicio, fin, tipo: 'puntual' })
        horariosPorUsuario.set(horario.id_usuario, lista)
    }

    const fechaHasta = new Date()
    fechaHasta.setDate(fechaHasta.getDate() + dias)
    fechaHasta.setHours(23, 59, 59, 999)

    for (const horario of horariosRecurrentes ?? []) {
        const idUsuario = horario.id_usuario
        const filasDias = Array.isArray(horario.dia_horario_recurrente)
            ? horario.dia_horario_recurrente
            : (horario.dia_horario_recurrente ? [horario.dia_horario_recurrente] : [])

        const diasSemana = filasDias
            .map((item) => Number(item?.dia_semana ?? item))
            .filter((valor) => Number.isFinite(valor) && valor >= 1 && valor <= 7)

        if (diasSemana.length === 0) continue

        const fechaInicio = horario.fecha_inicio ? new Date(`${horario.fecha_inicio}T00:00:00`) : new Date()
        const fechaFin = horario.fecha_fin ? new Date(`${horario.fecha_fin}T23:59:59`) : fechaHasta

        let cursor = new Date(fechaInicio)
        cursor.setHours(0, 0, 0, 0)

        while (cursor <= fechaFin && cursor <= fechaHasta) {
            const diaSemanaActual = getDiaSemanaNumero(cursor)
            if (diasSemana.includes(diaSemanaActual)) {
                const horaInicioRec = parseHoraHora(horario.hora_inicio)
                const horaFinRec = parseHoraHora(horario.hora_fin)

                if (horaInicioRec && horaFinRec) {
                    const inicio = new Date(cursor)
                    const fin = new Date(cursor)
                    inicio.setHours(horaInicioRec.horas, horaInicioRec.minutos, horaInicioRec.segundos, 0)
                    fin.setHours(horaFinRec.horas, horaFinRec.minutos, horaFinRec.segundos, 0)
                    const lista = horariosPorUsuario.get(idUsuario) ?? []
                    lista.push({ inicio, fin, tipo: 'recurrente' })
                    horariosPorUsuario.set(idUsuario, lista)
                }
            }
            cursor.setDate(cursor.getDate() + 1)
        }
    }

    const usuariosConHorario = [...new Set([...horariosPorUsuario.keys()])]
    if (usuariosConHorario.length === 0) {
        return {
            data: [],
            error: { message: 'Ningún integrante del grupo tiene horarios cargados manualmente.' },
        }
    }

    const sugerencias = []
    const fechaDesde = new Date()
    fechaDesde.setHours(0, 0, 0, 0)

    for (let diaActual = new Date(fechaDesde); diaActual <= fechaHasta; diaActual.setDate(diaActual.getDate() + 1)) {
        for (let minutoActual = inicioMinutos; minutoActual + 60 <= finMinutos; minutoActual += 60) {
            const candidatoInicio = new Date(diaActual)
            candidatoInicio.setHours(Math.floor(minutoActual / 60), minutoActual % 60, 0, 0)
            const candidatoFin = new Date(candidatoInicio.getTime() + 60 * 60 * 1000)

            const disponibles = []
            const conflictos = []

            for (const idUsuario of usuariosConHorario) {
                const horarios = horariosPorUsuario.get(idUsuario) ?? []
                const tieneConflicto = horarios.some((horario) =>
                    horarioDentroDelMargen(horario, candidatoInicio)
                )

                if (tieneConflicto) {
                    conflictos.push(nombresPorUsuario[idUsuario] || 'Integrante')
                } else {
                    disponibles.push(nombresPorUsuario[idUsuario] || 'Integrante')
                }
            }

            sugerencias.push({
                fecha: formatearFechaHora(candidatoInicio),
                fechaHoraInicio: candidatoInicio.toISOString(),
                fechaHoraFin: candidatoFin.toISOString(),
                personasDisponibles: disponibles.length,
                personasConConflicto: conflictos.length,
                nombresDisponibles: disponibles,
                conflictos: [...new Set(conflictos)],
                totalConHorario: usuariosConHorario.length,
                totalIntegrantes: idsMiembros.length,
            })
        }
    }

    sugerencias.sort((a, b) => {
        if (b.personasDisponibles !== a.personasDisponibles) {
            return b.personasDisponibles - a.personasDisponibles
        }
        return new Date(a.fechaHoraInicio).getTime() - new Date(b.fechaHoraInicio).getTime()
    })

    const diasConMejorHorario = []
    const diasIncluidos = new Set()
    for (const sugerencia of sugerencias) {
        const fecha = new Date(sugerencia.fechaHoraInicio)
        const claveDia = `${fecha.getFullYear()}-${fecha.getMonth()}-${fecha.getDate()}`
        if (diasIncluidos.has(claveDia)) continue
        diasIncluidos.add(claveDia)
        diasConMejorHorario.push(sugerencia)
    }

    return {
        data: diasConMejorHorario.slice(0, 5),
        error: null,
    }
}

export async function createHorario({
    userId,
    titulo,
    fechaHoraInicio,
    fechaHoraFin,
    origen = 'manual'
}) {
    const nombre = typeof titulo === 'string' ? titulo.trim() : ''
    if (!userId || !nombre || !fechaHoraInicio || !fechaHoraFin) {
        return { data: null, error: { message: 'Completá los datos del horario' } }
    }

    const inicio = new Date(fechaHoraInicio)
    const fin = new Date(fechaHoraFin)
    if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fin.getTime())) {
        return { data: null, error: { message: 'La fecha o la hora no es válida' } }
    }
    if (fin <= inicio) {
        return {
            data: null,
            error: { message: 'La hora de finalización debe ser posterior a la de inicio' }
        }
    }

    const { data, error } = await supabase
        .from('horario_usuario')
        .insert({
            id_usuario: userId,
            titulo: nombre,
            fecha_hora_inicio: inicio.toISOString(),
            fecha_hora_fin: fin.toISOString(),
            origen
        })
        .select()
        .single()

    return { data, error }
}
export async function createHorarioRecurrente({userId, titulo, horaInicio, horaFin, fechaInicio, dias}) {
    const nombre = typeof titulo === 'string' ? titulo.trim() : ''
    const horaValida = hora => typeof hora === 'string' && /^([01]\d|2[0-3]):[0-5]\d:[0-5]\d$/.test(hora)
    const fecha = typeof fechaInicio === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(fechaInicio)
        ? new Date(fechaInicio + 'T00:00:00Z') : new Date(NaN)
    if (!userId || !nombre) return {data: null, error: {message: 'Completá los datos del horario'}}
    if (!horaValida(horaInicio) || !horaValida(horaFin) || horaFin <= horaInicio)
        return {data: null, error: {message: 'Seleccioná un rango de horas válido'}}
    if (!Number.isFinite(fecha.getTime()) || fecha.toISOString().slice(0,10) !== fechaInicio)
        return {data: null, error: {message: 'Seleccioná una fecha válida'}}
    if (!Array.isArray(dias) || !dias.length || !dias.every(dia => Number.isInteger(dia) && dia >= 1 && dia <= 7))
        return {data: null, error: {message: 'Seleccioná los días de repetición'}}

    return supabase.rpc('crear_horario_recurrente', {
        p_titulo: nombre,
        p_hora_inicio: horaInicio,
        p_hora_fin: horaFin,
        p_fecha_inicio: fechaInicio,
        p_dias: [...new Set(dias)]
    })
}

export async function getHorariosUsuario(userId) {
    if (!userId) return {data: [], error: {message: 'Falta el usuario'}}
    const {data, error} = await supabase.from('horario_usuario')
        .select('id_horario, titulo, fecha_hora_inicio, fecha_hora_fin, origen')
        .eq('id_usuario', userId)
    return {data: data ?? [], error}
}

export async function getHorariosRecurrentesUsuario(userId) {
    if (!userId) return {data: [], error: {message: 'Falta el usuario'}}
    const {data, error} = await supabase.from('horario_recurrente')
        .select('id_horario_recurrente, titulo, hora_inicio, hora_fin, fecha_inicio, fecha_fin, frecuencia, dia_horario_recurrente (dia_semana)')
        .eq('id_usuario', userId)
    return {data: data ?? [], error}
}
