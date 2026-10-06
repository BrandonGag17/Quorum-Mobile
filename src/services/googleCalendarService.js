import supabase from './supabaseClient'

export async function fetchGoogleCalendarEvents({
  rangeStart,
  rangeEnd,
} = {}) {
  const { data: sessionData, error: sessionError } = await supabase.auth.getSession()

  if (sessionError) {
    return { data: [], error: sessionError }
  }

  const token = sessionData?.session?.provider_token

  if (!token) {
    return {
      data: [],
      error: {
        message: 'Todavía no hay una sesión de Google conectada. Conectá Google Calendar desde el calendario antes de sincronizar.',
      },
    }
  }

  const now = new Date()
  const start = rangeStart || new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString()
  const end = rangeEnd || new Date(now.getTime() + 180 * 24 * 60 * 60 * 1000).toISOString()

  const url = new URL('https://www.googleapis.com/calendar/v3/calendars/primary/events')
  url.searchParams.set('timeMin', start)
  url.searchParams.set('timeMax', end)
  url.searchParams.set('singleEvents', 'true')
  url.searchParams.set('orderBy', 'startTime')

  const response = await fetch(url.toString(), {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  })

  const json = await response.json().catch(() => ({}))

  if (!response.ok) {
    return {
      data: [],
      error: {
        message: json?.error?.message || 'No se pudieron obtener los eventos de Google Calendar.',
      },
    }
  }

  const items = Array.isArray(json.items) ? json.items : []
  const eventosValidos = items.filter((evento) => evento?.status !== 'cancelled')

  return {
    data: eventosValidos,
    error: null,
  }
}

export function normalizarEventoGoogleAHorario(evento) {
  if (!evento || !evento.start || !evento.end) {
    return null
  }

  const inicioRaw = evento.start.dateTime || evento.start.date
  const finRaw = evento.end.dateTime || evento.end.date

  if (!inicioRaw || !finRaw) {
    return null
  }

  const inicio = new Date(inicioRaw)
  const fin = new Date(finRaw)

  if (!Number.isFinite(inicio.getTime()) || !Number.isFinite(fin.getTime())) {
    return null
  }

  return {
    titulo: evento.summary || 'Evento de Google Calendar',
    fechaHoraInicio: inicio.toISOString(),
    fechaHoraFin: fin.toISOString(),
    origen: 'google',
    googleEventId: evento.id || null,
  }
}
