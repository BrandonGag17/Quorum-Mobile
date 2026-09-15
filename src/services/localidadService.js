const LOCALIDADES_API = 'https://apis.datos.gob.ar/georef/api/localidades'

export async function searchLocalidades(nombre, limit = 8) {
  const query = String(nombre || '').trim()
  if (query.length < 3) {
    return { data: [], error: null }
  }

  try {
    const response = await fetch(
      `${LOCALIDADES_API}?nombre=${encodeURIComponent(query)}&campos=nombre,provincia,centroide&max=${limit}`
    )
    if (!response.ok) {
      throw new Error(`No se pudieron cargar las localidades (${response.status})`)
    }
    const payload = await response.json()
    return { data: payload.localidades || [], error: null }
  } catch (error) {
    return { data: [], error }
  }
}
