import supabase from './supabaseClient'

export async function createHorario({
    userId,
    titulo,
    fechaHoraInicio,
    fechaHoraFin
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
            origen: 'manual'
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
