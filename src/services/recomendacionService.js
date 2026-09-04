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

// En la base los nombres pueden venir decorados (por ejemplo "🎮 Juegos"),
// mientras que tiposPorGusto usa nombres limpios ("Juegos"). Primero probamos
// coincidencia exacta y después comprobamos si termina con una clave conocida.
function obtenerTiposParaGusto(nombreGusto) {
  if (!nombreGusto) {
    return []
  }

  const nombreNormalizado = String(nombreGusto).normalize('NFC').trim()

  if (tiposPorGusto[nombreNormalizado]) {
    return tiposPorGusto[nombreNormalizado]
  }

  const claveEncontrada = Object.keys(tiposPorGusto).find((clave) =>
    nombreNormalizado.endsWith(clave.normalize('NFC'))
  )

  return claveEncontrada ? tiposPorGusto[claveEncontrada] : []
}

function extractCoordinates(localidad) {
  let parsed = localidad

  if (typeof parsed === 'string') {
    try {
      parsed = JSON.parse(parsed)
    } catch {
      return null
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

  const numericLat = Number(lat)
  const numericLon = Number(lon)

  if (!Number.isFinite(numericLat) || !Number.isFinite(numericLon)) {
    return null
  }

  return { lat: numericLat, lon: numericLon }
}

async function obtenerCoordenadasDesdeTexto(localidad) {
  const [nombreLocalidad, ...partesProvincia] = String(localidad || '')
    .split(',')
    .map((parte) => parte.trim())

  const nombre = nombreLocalidad
  const provincia = partesProvincia.join(', ').trim()

  if (!nombre) {
    return null
  }

  try {
    const parametros = new URLSearchParams({
      nombre,
      campos: 'nombre,provincia,centroide',
      max: '1',
    })

    if (provincia) {
      parametros.set('provincia', provincia)
    }

    const response = await fetch(
      `https://apis.datos.gob.ar/georef/api/localidades?${parametros.toString()}`
    )

    if (!response.ok) {
      return null
    }

    const data = await response.json()
    return extractCoordinates(data?.localidades?.[0])
  } catch {
    return null
  }
}

// Resuelve los dos formatos que hoy pueden existir en la base:
// 1. JSON con centroide, usado por los registros nuevos.
// 2. Texto ("localidad, provincia"), usado por cuentas anteriores.
// A diferencia de obtenerCoordenadasUsuario, esta función no aplica un punto
// predeterminado. Así, un miembro sin ubicación no altera el centro del grupo.
async function resolverCoordenadasLocalidad(localidad) {
  return (
    extractCoordinates(localidad) ||
    await obtenerCoordenadasDesdeTexto(localidad)
  )
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
    return obtenerTiposParaGusto(nombreGusto)
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

  const coordenadasResueltas = await resolverCoordenadasLocalidad(
    data?.localidad
  )

  return coordenadasResueltas || DEFAULT_COORDS
}

// Calculamos el promedio de latitudes y longitudes conocidas. Para grupos que
// se mueven dentro de una misma ciudad es una aproximación clara al punto medio
// y evita favorecer la casa de un integrante particular.
function calcularCentroGrupo(coordenadas) {
  if (!coordenadas.length) {
    return DEFAULT_COORDS
  }

  const suma = coordenadas.reduce(
    (acumulado, punto) => ({
      lat: acumulado.lat + punto.lat,
      lon: acumulado.lon + punto.lon,
    }),
    { lat: 0, lon: 0 }
  )

  return {
    lat: suma.lat / coordenadas.length,
    lon: suma.lon / coordenadas.length,
  }
}

// Geoapify puede devolver una categoría más específica que la solicitada.
// Por ejemplo, "entertainment.cinema" también coincide con "entertainment".
function categoriasCoinciden(categoriaLugar, categoriaPreferida) {
  return (
    categoriaLugar === categoriaPreferida ||
    categoriaLugar.startsWith(`${categoriaPreferida}.`) ||
    categoriaPreferida.startsWith(`${categoriaLugar}.`)
  )
}

async function obtenerPerfilRecomendacionGrupo(groupId) {
  if (!groupId) {
    throw new Error('No se recibió el grupo para generar recomendaciones')
  }

  // Primero necesitamos solamente los IDs. Luego hacemos dos consultas
  // agrupadas, en vez de consultar gustos y localidad miembro por miembro.
  const { data: membresias, error: errorMembresias } = await supabase
    .from('usuario_grupo')
    .select('id_usuario')
    .eq('id_grupo', groupId)

  if (errorMembresias) {
    throw errorMembresias
  }

  const idsUsuarios = [...new Set(
    (membresias || [])
      .map((membresia) => membresia.id_usuario)
      .filter(Boolean)
  )]

  if (!idsUsuarios.length) {
    return {
      gustosConPeso: [],
      categoriasConPeso: [],
      centro: DEFAULT_COORDS,
    }
  }

  const [respuestaGustos, respuestaUsuarios] = await Promise.all([
    supabase
      .from('usuario_gusto')
      .select(`
        id_usuario,
        gusto (
          nombre
        )
      `)
      .in('id_usuario', idsUsuarios),
    supabase
      .from('usuario')
      .select('id, localidad')
      .in('id', idsUsuarios),
  ])

  if (respuestaGustos.error) {
    throw respuestaGustos.error
  }

  if (respuestaUsuarios.error) {
    throw respuestaUsuarios.error
  }

  // Cada categoría suma como máximo un voto por integrante. Esto evita que un
  // gusto que se traduce a muchas categorías valga artificialmente más.
  const categoriasPorUsuario = new Map()
  const gustosPorUsuario = new Map()

  for (const fila of respuestaGustos.data || []) {
    const nombreGusto = fila?.gusto?.nombre
    const categorias = obtenerTiposParaGusto(nombreGusto)
    const categoriasUsuario = categoriasPorUsuario.get(fila.id_usuario) || new Set()
    const gustosUsuario = gustosPorUsuario.get(fila.id_usuario) || new Set()

    categorias.forEach((categoria) => categoriasUsuario.add(categoria))

    if (nombreGusto) {
      gustosUsuario.add(nombreGusto)
    }

    categoriasPorUsuario.set(fila.id_usuario, categoriasUsuario)
    gustosPorUsuario.set(fila.id_usuario, gustosUsuario)
  }

  const votosPorCategoria = new Map()
  const votosPorGusto = new Map()

  for (const categoriasUsuario of categoriasPorUsuario.values()) {
    for (const categoria of categoriasUsuario) {
      votosPorCategoria.set(
        categoria,
        (votosPorCategoria.get(categoria) || 0) + 1
      )
    }
  }

  for (const gustosUsuario of gustosPorUsuario.values()) {
    for (const gusto of gustosUsuario) {
      votosPorGusto.set(gusto, (votosPorGusto.get(gusto) || 0) + 1)
    }
  }

  const gustosConPeso = [...votosPorGusto.entries()]
    .map(([gusto, integrantes]) => ({ gusto, integrantes }))
    .sort((a, b) => b.integrantes - a.integrantes)

  const categoriasConPeso = [...votosPorCategoria.entries()]
    .map(([categoria, votos]) => ({ categoria, votos }))
    .sort((a, b) => b.votos - a.votos)

  const coordenadas = (
    await Promise.all(
      (respuestaUsuarios.data || []).map((usuario) =>
        resolverCoordenadasLocalidad(usuario.localidad)
      )
    )
  ).filter(Boolean)

  return {
    gustosConPeso,
    categoriasConPeso,
    centro: calcularCentroGrupo(coordenadas),
  }
}

export async function obtenerRecomendacionesGrupo({
  groupId,
  limit = 5,
  radio = 5000,
  excluirIds = [],
}) {
  const { gustosConPeso, categoriasConPeso, centro } =
    await obtenerPerfilRecomendacionGrupo(groupId)

  // Este log es intencional para poder auditar durante el desarrollo qué
  // preferencias del grupo están participando en cada recomendación.
  console.log(
    '[RecomendacionesGrupo] Gustos considerados:',
    gustosConPeso
  )

  // Si hay gustos pero ninguno se pudo traducir a categorías, no mostramos
  // resultados generales que podrían no tener relación con el grupo.
  if (gustosConPeso.length && !categoriasConPeso.length) {
    throw new Error(
      'Los gustos del grupo no tienen categorías de lugares configuradas'
    )
  }

  // Limitamos la cantidad de categorías enviadas para que la búsqueda siga
  // siendo específica. Si nadie cargó gustos usamos las categorías generales.
  const categoriasBusqueda = (
    categoriasConPeso.length
      ? categoriasConPeso.map((item) => item.categoria)
      : DEFAULT_CATEGORIES
  ).slice(0, 12)

  console.log(
    '[RecomendacionesGrupo] Categorías enviadas a Geoapify:',
    categoriasBusqueda
  )

  const lugares = await obtenerLugares(
    categoriasBusqueda.join(','),
    centro.lat,
    centro.lon,
    radio
  )

  const idsExcluidos = new Set(excluirIds.map(String))

  // Conservamos el orden de Geoapify para desempatar: normalmente ya prioriza
  // resultados cercanos. El puntaje principal representa gustos compartidos.
  return (lugares || [])
    .filter((lugar) => !idsExcluidos.has(String(lugar.id)))
    .map((lugar, indice) => {
      const categoriasLugar = Array.isArray(lugar.categoria)
        ? lugar.categoria
        : []

      const puntajeGustos = categoriasConPeso.reduce(
        (puntaje, preferencia) => {
          const coincide = categoriasLugar.some((categoriaLugar) =>
            categoriasCoinciden(categoriaLugar, preferencia.categoria)
          )

          return puntaje + (coincide ? preferencia.votos : 0)
        },
        0
      )

      return { lugar, indice, puntajeGustos }
    })
    .sort((a, b) =>
      b.puntajeGustos - a.puntajeGustos || a.indice - b.indice
    )
    .slice(0, Math.max(limit, 0))
    .map(({ lugar }) => normalizarLugarBasico(lugar))
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
