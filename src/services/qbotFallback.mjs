const normalizar = (value) => String(value || '')
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, ' ')
  .trim()

const BARRIOS_CABA = new Set([
  'agronomia', 'almagro', 'balvanera', 'barracas', 'belgrano', 'boedo', 'caballito',
  'chacarita', 'coghlan', 'colegiales', 'constitucion', 'flores', 'floresta', 'la boca',
  'liniers', 'mataderos', 'monte castro', 'monserrat', 'nueva pompeya', 'nunez',
  'palermo', 'parque avellaneda', 'parque chacabuco', 'parque chas', 'parque patricios',
  'paternal', 'puerto madero', 'recoleta', 'retiro', 'saavedra', 'san cristobal',
  'san nicolas', 'san telmo', 'versalles', 'velez sarsfield', 'villa crespo',
  'villa devoto', 'villa general mitre', 'villa lugano', 'villa luro', 'villa ortuzar',
  'villa pueyrredon', 'villa real', 'villa riachuelo', 'villa santa rita', 'villa soldati',
  'villa urquiza',
])

const CATEGORIAS_AMPLIAS = [
  'adult.nightclub', 'entertainment', 'catering', 'leisure', 'tourism', 'sport', 'commercial', 'activity', 'education',
]
const ZONAS_VARIADAS = [
  { nombre: 'Buenos Aires', lon: -58.3816, lat: -34.6037 },
  { nombre: 'Córdoba', lon: -64.1888, lat: -31.4201 },
  { nombre: 'Rosario', lon: -60.6393, lat: -32.9442 },
  { nombre: 'Mendoza', lon: -68.8458, lat: -32.8895 },
  { nombre: 'Mar del Plata', lon: -57.5426, lat: -38.0055 },
]
export const SUGERENCIAS_QBOT = [
  'Restaurante elegante',
  'Bar tranquilo',
  'Lugar para salir con amigos',
  'Boliche para bailar',
  'Sala de juegos',
]
const NOMBRES_CATEGORIA = {
  'entertainment.amusement_arcade': 'Arcade',
  'entertainment.bowling_alley': 'Bowling',
  'entertainment.escape_game': 'Sala de escape',
  'entertainment.activity_park': 'Parque de juegos y actividades',
  'entertainment.miniature_golf': 'Minigolf',
  'entertainment.cinema': 'Cine',
  'adult.nightclub': 'Boliche',
  'adult.nightclub': 'Boliche',
  'entertainment.museum': 'Museo',
  'entertainment.culture.arts_centre': 'Centro cultural',
  'entertainment.culture.gallery': 'Galería de arte',
  'entertainment.culture.theatre': 'Teatro',
  'catering.cafe': 'Cafetería',
  'catering.restaurant.pizza': 'Pizzería',
  'catering.fast_food.pizza': 'Pizzería',
  'catering.restaurant': 'Restaurante',
  'catering.bar': 'Bar',
  'catering.pub': 'Pub',
  'catering.fast_food': 'Comida rápida',
  'leisure.park': 'Parque',
  'commercial.shopping_mall': 'Centro comercial',
  'tourism.attraction': 'Atracción turística',
  'activity.community_center': 'Centro comunitario',
  'education': 'Institución educativa',
  'sport': 'Lugar deportivo',
  'entertainment': 'Lugar de entretenimiento',
}

const REGLAS_CATEGORIA = [
  { patron: /\b(?:lugar|plan|algo)\s+para\s+salir\s+con\s+amigos\b/, categorias: ['catering.restaurant', 'catering.bar', 'catering.pub', 'catering.cafe', 'entertainment.cinema'] },
  { patron: /\b(?:boliches?|discotecas?|night\s*clubs?|dance\s*clubs?|club(?:es)?\s+nocturnos?|bailar|pista\s+de\s+baile)\b/, categorias: ['adult.nightclub'] },
  { patron: /\b(?:salas?|salones?)\s*de\s*juego|arcade|fichin|videojuego|jueguito|bowling|escape room|mini golf/, categorias: ['entertainment.amusement_arcade', 'entertainment.bowling_alley', 'entertainment.escape_game', 'entertainment.activity_park', 'entertainment.miniature_golf'] },
  { patron: /\bcafes?|cafeteria|merienda/, categorias: ['catering.cafe'] },
  { patron: /\b(?:restaurante|comer|gastronomia|cena|almuerzo)/, categorias: ['catering.restaurant'] },
  { patron: /\bpizzeria|pizza/, categorias: ['catering.restaurant.pizza', 'catering.fast_food.pizza'] },
  { patron: /\b(?:parque|plaza|aire libre)/, categorias: ['leisure.park'] },
  { patron: /\b(?:museo|arte|cultura|galeria)/, categorias: ['entertainment.museum', 'entertainment.culture'] },
  { patron: /\b(?:bar|tragos|cerveza|pub)/, categorias: ['catering.bar', 'catering.pub'] },
  { patron: /\b(?:deporte|gimnasio|futbol)/, categorias: ['sport'] },
  { patron: /\b(?:shopping|centro comercial|compras|locales comerciales)/, categorias: ['commercial.shopping_mall'] },
  { patron: /\b(?:playa|mar|costa)/, categorias: ['beach'] },
  { patron: /\b(?:atraccion turistica|monumento|punto turistico|visitar)/, categorias: ['tourism.attraction'] },
]

export function categoriasPorPedidoQBot(pedido) {
  const texto = normalizar(pedido)
  return REGLAS_CATEGORIA.find((regla) => regla.patron.test(texto))?.categorias || []
}

export function filtrarCoincidenciasQBot(lugares, pedido) {
  const preferidas = categoriasPorPedidoQBot(pedido)
  const zona = zonaDelPedido(pedido)
  const zonaNormalizada = normalizar(zona.split(',')[0])
  return lugares.filter((lugar) => {
    const categorias = Array.isArray(lugar.categoria) ? lugar.categoria : []
    const coincideCategoria = !preferidas.length || categorias.some((categoria) =>
      preferidas.some((preferida) => categoria === preferida || categoria.startsWith(`${preferida}.`)))
    if (!coincideCategoria) return false
    if (!zona) return true
    const direccion = normalizar(lugar.direccion)
    if (/^(?:caba|capital federal|ciudad autonoma de buenos aires)$/.test(zonaNormalizada)) {
      return direccion.includes('buenos aires') || direccion.includes('capital federal')
    }
    return direccion.includes(zonaNormalizada)
  })
}

function zonaDelPedido(pedido) {
  const coincidencia = String(pedido || '').match(/\b(?:en|por|cerca de)\s+(.+)$/i)
  if (coincidencia?.[1]) {
    const textoZona = normalizar(coincidencia[1])
    if (/^(?:mi|mi casa|casa|cualquier lugar|cualquier zona|cualquier barrio|cualquier lado|toda la ciudad|por la ciudad|donde sea|mi zona)$/.test(textoZona)) return ''
    return coincidencia[1].trim().replace(/(^|\s)([a-záéíóúñ])/gi, (_, espacio, letra) => `${espacio}${letra.toUpperCase()}`)
  }
  // No inferir localidad a partir de frases como "tu perfil" del mensaje.
  return ''
}

function textoZona(zona) {
  if (!zona) return ''
  if (zona.includes(',')) return zona
  return BARRIOS_CABA.has(normalizar(zona))
    ? `${zona}, Ciudad Autónoma de Buenos Aires, Argentina`
    : `${zona}, Argentina`
}

function resultadoMapa(pedido, zona) {
  const consulta = [pedido, zona && !normalizar(pedido).includes(normalizar(zona)) ? zona : ''].filter(Boolean).join(' ')
  const ubicacion = zona ? ` en ${zona}` : ''
  return {
    mensaje: `No encontré coincidencias exactas en el catálogo. Abrí esta búsqueda para ver opciones actuales${ubicacion}:`,
    lugares: [{
      id: `qbot-maps-${normalizar(consulta).replace(/\s+/g, '-') || 'lugares'}`,
      origen: 'web',
      nombre: `Ver resultados para ${consulta}`,
      direccion: zona || '',
      categoria: [],
      tipoLugar: 'Búsqueda en Google Maps',
      descripcion: 'Abrí el enlace para ver resultados actuales de este pedido en la zona.',
      motivo: 'La búsqueda abre resultados actualizados en Google Maps.',
      fuenteUrl: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(consulta)}`,
    }],
  }
}

export function tarjetaMapsQBot(pedido, zona) {
  return resultadoMapa(pedido, zona).lugares[0]
}

export function combinarResultadosQBot(data, pedido, alternativas) {
  const iniciales = filtrarCoincidenciasQBot(Array.isArray(data?.lugares) ? data.lugares : [], pedido)
  const adicionales = (alternativas?.lugares || []).filter((lugar) => !lugar.id?.startsWith('qbot-maps-'))
  const mapa = alternativas?.lugares?.find((lugar) => lugar.id?.startsWith('qbot-maps-'))
  const lugares = [...new Map([...iniciales, ...adicionales].map((lugar) => [lugar.id, lugar])).values()].slice(0, 5)
  if (lugares.length < 5) lugares.push(mapa || tarjetaMapsQBot(pedido, ''))
  return {
    mensaje: /barrios cercanos/i.test(alternativas?.mensaje || '')
      ? alternativas.mensaje
      : lugares.length > 1 && lugares.some((lugar) => lugar.id?.startsWith('qbot-maps-'))
        ? 'Estas son las opciones que pude encontrar. Si querés ver más, al final podés abrir la búsqueda en Google Maps.'
        : alternativas?.mensaje || data?.mensaje || '',
    lugares,
  }
}

function puntajeCategoria(lugar, categoriasPreferidas) {
  const categorias = lugar.categoria || []
  return categoriasPreferidas.reduce((suma, preferida, indice) => {
    if (categorias.some((categoria) => categoria === preferida || categoria.startsWith(`${preferida}.`))) {
      return suma + (categoriasPreferidas.length - indice) * 100
    }
    return suma
  }, 0)
}

export function nombreCategoriaQBot(categorias = []) {
  const lista = Array.isArray(categorias) ? categorias : []
  for (const [categoria, nombre] of Object.entries(NOMBRES_CATEGORIA)) {
    if (lista.some((valor) => valor === categoria || valor.startsWith(`${categoria}.`))) return nombre
  }
  const ultima = lista[0]?.split('.').at(-1)?.replaceAll('_', ' ')
  return ultima ? ultima[0].toUpperCase() + ultima.slice(1) : 'Lugar'
}

export function descripcionLugarQBot(lugar = {}) {
  const descripcion = String(lugar.descripcion || '').trim()
  if (descripcion) return descripcion
  const motivo = String(lugar.motivo || '').trim()
  if (motivo && !/(categor[ií]a|\b(?:adult|entertainment|catering|leisure|commercial|tourism)\.[a-z_.]+\b|seg[uú]n (?:la )?(?:clasificaci[oó]n|categor[ií]a))/i.test(motivo)) return motivo
  const categorias = Array.isArray(lugar.categoria) ? lugar.categoria : []
  const descripciones = [
    [/^adult\.nightclub$/, 'Boliche para bailar y pasar la noche.'],
    [/^entertainment\.amusement_arcade$/, 'Salón de videojuegos arcade.'],
    [/^entertainment\.bowling_alley$/, 'Lugar para jugar al bowling.'],
    [/^entertainment\.escape_game$/, 'Experiencia de juegos de escape.'],
    [/^entertainment\.activity_park/, 'Parque con actividades recreativas.'],
    [/^entertainment\.miniature_golf$/, 'Espacio para jugar al minigolf.'],
    [/^entertainment\.cinema$/, 'Cine para ver películas.'],
    [/^entertainment\.museum$/, 'Museo con exhibiciones para recorrer.'],
    [/^entertainment\.culture\.theatre$/, 'Teatro con espectáculos en vivo.'],
    [/^entertainment\.culture\.gallery$/, 'Galería con exposiciones de arte.'],
    [/^entertainment\.culture\.arts_centre$/, 'Espacio dedicado a actividades culturales y artísticas.'],
    [/^catering\.cafe$/, 'Cafetería.'],
    [/^catering\.restaurant\.pizza$|^catering\.fast_food\.pizza$/, 'Pizzería.'],
    [/^catering\.restaurant$/, 'Restaurante.'],
    [/^catering\.bar$|^catering\.pub$/, 'Bar para tomar algo.'],
    [/^leisure\.park$/, 'Parque para pasear y disfrutar al aire libre.'],
    [/^commercial\.shopping_mall$/, 'Centro comercial con locales y servicios.'],
    [/^tourism\.attraction$/, 'Atracción turística para visitar.'],
    [/^sport$/, 'Espacio para realizar actividades deportivas.'],
  ]
  for (const [patron, texto] of descripciones) {
    if (categorias.some((categoria) => patron.test(categoria))) return texto
  }
  return motivo || 'No hay una descripción disponible para este lugar.'
}

async function json(fetcher, url) {
  try {
    const response = await fetcher(url, { signal: AbortSignal.timeout(12000) })
    if (!response.ok) return null
    return await response.json()
  } catch {
    return null
  }
}

async function buscarGeoapifyEnArea(pedido, area, apiKey, fetcher) {
  if (!area?.filtro || !apiKey) return []
  const preferidas = categoriasPorPedidoQBot(pedido)
  const params = new URLSearchParams({
    categories: (preferidas.length ? preferidas : CATEGORIAS_AMPLIAS).join(','),
    filter: area.filtro,
    limit: '100',
    apiKey,
  })
  const data = await json(fetcher, `https://api.geoapify.com/v2/places?${params}`)
  const features = Array.isArray(data?.features) ? data.features : []
  const lugares = features.map((feature) => {
    const properties = feature.properties || {}
    const categoria = properties.categories || []
    const tipoLugar = nombreCategoriaQBot(categoria)
    const descripcion = String(properties.description || properties.datasource?.raw?.description || '').trim().slice(0, 500)
    return {
      id: properties.place_id,
      nombre: properties.name,
      direccion: properties.formatted || properties.address_line2 || '',
      categoria,
      tipoLugar,
      descripcion,
      latitud: properties.lat,
      longitud: properties.lon,
      motivo: descripcion,
      _score: puntajeCategoria({ categoria }, preferidas),
    }
  }).filter((lugar) => typeof lugar.id === 'string' && lugar.nombre)
  const relevantes = preferidas.length ? lugares.filter((lugar) => lugar._score > 0) : lugares
  return relevantes.sort((a, b) => b._score - a._score)
    .map(({ _score, ...lugar }) => lugar)
}

async function buscarGeoapify(pedido, zona, apiKey, fetcher) {
  if (!zona || !apiKey) return { lugares: [], zonasCercanas: false }
  const geocodeParams = new URLSearchParams({ text: textoZona(zona), format: 'json', limit: '5', apiKey })
  const geocode = await json(fetcher, `https://api.geoapify.com/v1/geocode/search?${geocodeParams}`)
  const results = Array.isArray(geocode?.results) ? geocode.results : []
  const nombreZona = normalizar(zona.split(',')[0])
  const punto = results.find((result) => result.rank?.confidence >= 0.7 &&
    [result.name, result.suburb, result.district, result.city, result.address_line1, result.formatted]
      .some((value) => normalizar(String(value || '').split(',')[0]) === nombreZona))
  const lat = Number(punto?.lat)
  const lon = Number(punto?.lon)
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return { lugares: [], zonasCercanas: false }
  if (punto.place_id) {
    const lugaresZona = await buscarGeoapifyEnArea(pedido, { filtro: `place:${punto.place_id}` }, apiKey, fetcher)
    if (lugaresZona.length) return { lugares: lugaresZona, zonasCercanas: false }
  }
  const lugaresCercanos = await buscarGeoapifyEnArea(
    pedido, { filtro: `circle:${lon},${lat},5000` }, apiKey, fetcher,
  )
  return { lugares: lugaresCercanos, zonasCercanas: lugaresCercanos.length > 0 }
}

export async function resultadosAlternativosQBot(pedido, excluirIds = [], {
  apiKey = process.env.EXPO_PUBLIC_GEOAPIFY_KEY,
  fetcher = fetch,
  localidad = '',
} = {}) {
  const zonaPedido = zonaDelPedido(pedido)
  const zona = zonaPedido || String(localidad || '').trim()
  const exclude = new Set(excluirIds)
  try {
    let encontrados
    let zonasCercanas = false
    if (zona) {
      const busqueda = await buscarGeoapify(pedido, zona, apiKey, fetcher)
      encontrados = busqueda.lugares
      zonasCercanas = busqueda.zonasCercanas
    } else {
      // Sin zona ni localidad del perfil, explorar ciudades diversas en Argentina.
      const porZona = await Promise.all(ZONAS_VARIADAS.map(({ lon, lat }) =>
        buscarGeoapifyEnArea(pedido, { filtro: `circle:${lon},${lat},20000` }, apiKey, fetcher)))
      encontrados = Array.from({ length: Math.max(0, ...porZona.map((lugares) => lugares.length)) }, (_, indice) =>
        porZona.flatMap((lugares) => lugares[indice] ? [lugares[indice]] : [])).flat()
    }
    const nuevos = [...new Map(encontrados.filter((lugar) => !exclude.has(lugar.id))
      .map((lugar) => [lugar.id, lugar])).values()].slice(0, 5)
    if (nuevos.length) {
      const mensaje = zonasCercanas
        ? `No encontré opciones de ese tipo dentro de ${zona}. Estas son opciones compatibles en barrios cercanos:`
        : `No encontré coincidencias exactas en el catálogo inicial. Estas son las opciones más cercanas que pude localizar${zona ? ` en ${zona}` : ''}:`
      return {
        mensaje,
        lugares: nuevos.length < 5 ? [...nuevos, tarjetaMapsQBot(pedido, zona)] : nuevos,
      }
    }
  } catch {
    // El enlace de búsqueda sigue disponible aunque falle el proveedor alternativo.
  }
  return resultadoMapa(pedido, zona)
}
