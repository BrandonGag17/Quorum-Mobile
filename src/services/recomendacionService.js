import supabase from './supabaseClient'
import tiposPorGusto from './tiposPorGusto'
import {
  obtenerLugares,
  obtenerDetallesLugar,
} from './geoapifyClient'

const DEFAULT_COORDS = {
  lat: -34.5996,
  lon: -58.4438,
}

const DEFAULT_CATEGORIES = [
  'catering.restaurant',
  'catering.cafe',
  'catering.bar',
  'entertainment',
  'leisure.park',
]

function extractCoordinates(localidad) {
  let parsed = localidad

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      return DEFAULT_COORDS
    }
  }

  const centroide = parsed?.centroide || parsed?.centroid

  const lat =
    centroide?.lat ??
    centroide?.latitude ??
    (Array.isArray(centroide?.coordinates)
      ? centroide.coordinates[1]
      : undefined)

  const lon =
    centroide?.lon ??
    centroide?.longitude ??
    (Array.isArray(centroide?.coordinates)
      ? centroide.coordinates[0]
      : undefined)

  if (typeof lat !== 'number' || typeof lon !== 'number') {
    return DEFAULT_COORDS
  }

  return { lat, lon }
}

export async function obtenerTiposUsuario(userId) {
  if (!userId) {
    return []
  }

  const { data, error } = await supabase
    .from('usuario_gusto')
    .select(`
      gusto (
        nombre
      )
    `)
    .eq('id_usuario', userId)

  if (error) {
    return []
  }

  const tipos = (data || []).flatMap((item) => {
    const nombreGusto = item?.gusto?.nombre
    return tiposPorGusto[nombreGusto] || []
  })

  return [...new Set(tipos)]
}

export async function obtenerCoordenadasUsuario(userId) {
  if (!userId) {
    return DEFAULT_COORDS
  }

  const { data, error } = await supabase
    .from('usuario')
    .select('localidad')
    .eq('id', userId)
    .maybeSingle()

  if (error) {
    return DEFAULT_COORDS
  }

  return extractCoordinates(data?.localidad)
}

function normalizarLugarBasico(lugar) {
  return {
    id: lugar.id,
    nombre: lugar.nombre || 'Lugar',
    direccion: lugar.direccion || '-',
    categoria: lugar.categoria || [],
    latitud: lugar.latitud,
    longitud: lugar.longitud,
  }
}

function filtrarLugares(lugares, busqueda) {
  const query = (busqueda || '').trim().toLowerCase()

  if (!query) {
    return lugares
  }

  return lugares.filter((lugar) => {
    const nombre = (lugar.nombre || '').toLowerCase()
    const direccion = (lugar.direccion || '').toLowerCase()
    return nombre.includes(query) || direccion.includes(query)
  })
}

export async function obtenerRecomendacionesUsuario({
  userId,
  busqueda = '',
  limit = 20,
  radio = 3000,
}) {
  const [tipos, coordenadas] = await Promise.all([
    obtenerTiposUsuario(userId),
    obtenerCoordenadasUsuario(userId),
  ])

  const categorias = (tipos.length ? tipos : DEFAULT_CATEGORIES)
    .slice(0, Math.max(limit, 1))
    .join(',')

  const lugares = await obtenerLugares(
    categorias,
    coordenadas.lat,
    coordenadas.lon,
    radio
  )

  const basicos = (lugares || [])
    .slice(0, limit)
    .map(normalizarLugarBasico)

  return filtrarLugares(basicos, busqueda)
}

function normalizarDetalle(baseLugar, detalleLugar) {
  const properties = detalleLugar?.properties || {}
  const raw = properties?.datasource?.raw || {}

  return {
    ...baseLugar,
    descripcion:
      detalleLugar?.descripcion ||
      properties?.description ||
      null,
    ciudad: properties?.city || null,
    provincia: properties?.state || null,
    codigoPostal: properties?.postcode || null,
    pais: properties?.country || null,
    telefono: raw?.phone || null,
    sitioWeb: raw?.website || null,
    email: raw?.email || null,
  }
}

export async function obtenerInfoRecomendacion(lugarBase) {
  if (!lugarBase?.id) {
    return {
      ...lugarBase,
      descripcion: null,
      ciudad: null,
      provincia: null,
      codigoPostal: null,
      pais: null,
      telefono: null,
      sitioWeb: null,
      email: null,
    }
  }

  const detalle = await obtenerDetallesLugar(lugarBase.id)
  return normalizarDetalle(lugarBase, detalle)
}

export function obtenerUrlGoogleMaps(lugar) {
  const consulta = [
    lugar?.nombre,
    lugar?.direccion,
  ]
    .filter(Boolean)
    .join(', ')

  const consultaFinal = consulta || [
    lugar?.latitud,
    lugar?.longitud,
  ]
    .filter(Boolean)
    .join(',')

  return `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consultaFinal)}`
}

export function obtenerCategoriaPrincipal(categorias) {
  const lista = Array.isArray(categorias)
    ? categorias
    : []

  if (lista.includes('catering.restaurant')) {
    return 'Restaurante'
  }

  if (lista.includes('catering.cafe')) {
    return 'Cafetería'
  }

  if (lista.includes('catering.bar')) {
    return 'Bar'
  }

  if (lista.some((item) => item.startsWith('entertainment'))) {
    return 'Entretenimiento'
  }

  if (lista.some((item) => item.startsWith('leisure'))) {
    return 'Aire libre'
  }

  return 'Lugar'
}