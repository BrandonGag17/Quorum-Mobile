import test from 'node:test'
import assert from 'node:assert/strict'
import { combinarResultadosQBot, categoriasPorPedidoQBot, descripcionLugarQBot, filtrarCoincidenciasQBot, resultadosAlternativosQBot, SUGERENCIAS_QBOT } from './qbotFallback.mjs'

function geoapifyMock(features = [], barrio = 'Recoleta') {
  const calls = []
  return {
    calls,
    fetcher: async (url) => {
      calls.push(new URL(url))
      if (url.includes('/v1/geocode/search')) {
        return new Response(JSON.stringify({ results: [{
          suburb: barrio, city: 'Buenos Aires', place_id: `limite-${normalizarBarrio(barrio)}`,
          lat: -34.59, lon: -58.39,
          rank: { confidence: 0.98 },
        }] }), { status: 200 })
      }
      return new Response(JSON.stringify({ features }), { status: 200 })
    },
  }
}
const normalizarBarrio = (value) => value.toLowerCase().replace(/\s+/g, '-')

test('todas las sugerencias predeterminadas se resuelven con y sin barrio', async () => {
  const casos = [
    ['Restaurante elegante', 'catering.restaurant'],
    ['Bar tranquilo', 'catering.bar'],
    ['Lugar para salir con amigos', 'catering.restaurant'],
    ['Boliche para bailar', 'adult.nightclub'],
    ['Sala de juegos', 'entertainment.amusement_arcade'],
  ]
  assert.deepEqual(SUGERENCIAS_QBOT, casos.map(([sugerencia]) => sugerencia))

  for (const [sugerencia, categoria] of casos) {
    assert.ok(categoriasPorPedidoQBot(sugerencia).includes(categoria), `${sugerencia} debe reconocer ${categoria}`)
    const candidato = (id, direccion) => ({ properties: {
      place_id: id, name: `Lugar ${id}`, formatted: direccion, categories: [categoria],
    } })
    const sinBarrio = await resultadosAlternativosQBot(sugerencia, [], {
      apiKey: 'test-key',
      fetcher: async (url) => new Response(JSON.stringify({ features: [candidato(`nacional-${normalizarBarrio(sugerencia)}`, 'Centro, Argentina')] }), { status: 200 }),
    })
    assert.ok(sinBarrio.lugares.some((lugar) => lugar.categoria?.includes(categoria)), `${sugerencia} sin barrio debe ofrecer coincidencias`)

    const conBarrio = await resultadosAlternativosQBot(`${sugerencia} en Recoleta`, [], {
      apiKey: 'test-key', fetcher: geoapifyMock([candidato(`recoleta-${normalizarBarrio(sugerencia)}`, 'Recoleta, Buenos Aires')]).fetcher,
    })
    assert.ok(conBarrio.lugares.some((lugar) => lugar.categoria?.includes(categoria)), `${sugerencia} en Recoleta debe ofrecer coincidencias`)
  }
})

test('al ampliar un pedido de cualquier barrio prioriza lugares de su tipo', async () => {
  const cafe = { properties: {
    place_id: 'cafe-recoleta', name: 'Café Recoleta', formatted: 'Recoleta, Buenos Aires',
    categories: ['catering.cafe'], description: 'Cafetería con pastelería artesanal.', lat: -34.59, lon: -58.39,
  } }
  const parque = { properties: {
    place_id: 'parque-recoleta', name: 'Parque Recoleta', formatted: 'Recoleta, Buenos Aires',
    categories: ['leisure.park'], lat: -34.59, lon: -58.39,
  } }
  const mock = geoapifyMock([parque, cafe])
  const result = await resultadosAlternativosQBot('un café en Recoleta', [], {
    apiKey: 'test-key', fetcher: mock.fetcher,
  })
  assert.equal(result.lugares[0].id, 'cafe-recoleta')
  assert.equal(result.lugares[0].tipoLugar, 'Cafetería')
  assert.equal(result.lugares[0].descripcion, 'Cafetería con pastelería artesanal.')
  assert.doesNotMatch(result.lugares[0].motivo, /Opción cercana al pedido/)
  assert.match(result.mensaje, /Recoleta/)
  assert.equal(mock.calls[0].searchParams.get('text'), 'Recoleta, Ciudad Autónoma de Buenos Aires, Argentina')
  assert.equal(mock.calls[1].searchParams.get('filter'), 'place:limite-recoleta')
})

test('nunca deja la respuesta sin una opción: ofrece una búsqueda en Maps si el catálogo no devuelve lugares', async () => {
  const mock = geoapifyMock([])
  const result = await resultadosAlternativosQBot('Sala de juegos en Palermo', [], {
    apiKey: 'test-key', fetcher: mock.fetcher,
  })
  assert.equal(result.lugares.length, 1)
  assert.equal(result.lugares[0].origen, 'web')
  assert.match(result.lugares[0].fuenteUrl, /google\.com\/maps\/search/)
  assert.match(decodeURIComponent(result.lugares[0].fuenteUrl), /Palermo/)
})

test('usa la localidad guardada cuando el pedido no especifica una zona', async () => {
  const mock = geoapifyMock([], 'Villa Crespo')
  const result = await resultadosAlternativosQBot('recomendame algo divertido', [], {
    apiKey: 'test-key', localidad: 'Villa Crespo', fetcher: mock.fetcher,
  })
  assert.equal(result.lugares.length, 1)
  assert.equal(result.lugares[0].direccion, 'Villa Crespo')
  assert.match(decodeURIComponent(result.lugares[0].fuenteUrl), /Villa Crespo/)
  assert.equal(mock.calls[1].searchParams.get('filter'), 'place:limite-villa-crespo')
})

test('si no hay cafeterías en el barrio, busca cafeterías compatibles en barrios cercanos', async () => {
  const calls = []
  const cafeCercano = { properties: {
    place_id: 'cafe-villa-crespo', name: 'Café Villa Crespo',
    formatted: 'Villa Crespo, Buenos Aires', categories: ['catering.cafe'],
  } }
  const fetcher = async (url) => {
    const parsed = new URL(url)
    calls.push(parsed)
    if (parsed.pathname.includes('/geocode/search')) {
      return new Response(JSON.stringify({ results: [{ suburb: 'Recoleta', place_id: 'limite-recoleta',
        lat: -34.588, lon: -58.393, rank: { confidence: 1 } }] }), { status: 200 })
    }
    const features = parsed.searchParams.get('filter') === 'place:limite-recoleta' ? [] : [cafeCercano]
    return new Response(JSON.stringify({ features }), { status: 200 })
  }
  const result = await resultadosAlternativosQBot('Café temático en Recoleta', [], { apiKey: 'test-key', fetcher })
  assert.deepEqual(result.lugares[0].categoria, ['catering.cafe'])
  assert.match(result.lugares[0].direccion, /Villa Crespo/)
  assert.match(result.mensaje, /barrios cercanos/)
  assert.equal(calls[1].searchParams.get('filter'), 'place:limite-recoleta')
  assert.equal(calls[2].searchParams.get('filter'), 'circle:-58.393,-34.588,5000')
  const combined = combinarResultadosQBot(null, 'Café temático en Recoleta', result)
  assert.match(combined.mensaje, /barrios cercanos/)
})

test('mantiene un resultado alternativo aun si no hay zona ni conexión al proveedor', async () => {
  const result = await resultadosAlternativosQBot('algo para hacer', [], {
    apiKey: 'test-key',
    fetcher: async () => { throw new Error('network unavailable') },
  })
  assert.equal(result.lugares.length, 1)
  assert.equal(result.lugares[0].origen, 'web')
  assert.match(decodeURIComponent(result.lugares[0].fuenteUrl), /algo para hacer/)
})

test('sin localidad de perfil busca lugares en zonas variadas y no inventa "tu perfil"', async () => {
  const llamadas = []
  const fetcher = async (url) => {
    const parsed = new URL(url)
    llamadas.push(parsed)
    const zona = `zona-${llamadas.filter((item) => item.pathname.includes('/v2/places')).length}`
    return new Response(JSON.stringify({ features: [{ properties: {
      place_id: `boliche-${zona}`, name: `Boliche ${zona}`,
      formatted: `Centro, ${zona}`, categories: ['adult.nightclub'],
    } }] }), { status: 200 })
  }
  const result = await resultadosAlternativosQBot('Boliche para bailar', [], { apiKey: 'test-key', fetcher })
  assert.equal(llamadas.filter((url) => url.pathname.includes('/geocode/search')).length, 0)
  assert.equal(llamadas.filter((url) => url.pathname.includes('/v2/places')).length, 5)
  assert.ok(llamadas.every((url) => url.searchParams.get('filter').startsWith('circle:') && url.searchParams.get('filter').endsWith(',20000')))
  assert.equal(result.lugares.length, 5)
  assert.equal(new Set(result.lugares.map((lugar) => lugar.direccion)).size, 5)
  assert.ok(result.lugares.every((lugar) => lugar.categoria.includes('adult.nightclub')))
  assert.ok(result.lugares.every((lugar) => !/tu perfil/i.test(lugar.nombre)))
})

test('un café temático ofrece cafeterías como alternativas cuando no hay zona ni localidad', async () => {
  const llamadas = []
  const fetcher = async (url) => {
    const parsed = new URL(url)
    llamadas.push(parsed)
    const indice = llamadas.filter((item) => item.pathname.includes('/v2/places')).length
    return new Response(JSON.stringify({ features: [{ properties: {
      place_id: `cafe-${indice}`, name: `Café ${indice}`, formatted: `Centro, zona-${indice}`,
      categories: ['catering.cafe'], description: 'Cafetería.',
    } }] }), { status: 200 })
  }
  const result = await resultadosAlternativosQBot('Café temático', [], { apiKey: 'test-key', fetcher })
  assert.equal(result.lugares.length, 5)
  assert.ok(result.lugares.every((lugar) => lugar.categoria.includes('catering.cafe')))
  assert.ok(result.lugares.every((lugar) => !lugar.id.startsWith('qbot-maps-')))
})

test('si no hay coincidencia por categoría no recomienda un lugar irrelevante', async () => {
  const mock = geoapifyMock([{ properties: {
    place_id: 'atraccion', name: 'Atracción turística', categories: ['tourism.attraction'], lat: -34.59, lon: -58.39,
  } }])
  const result = await resultadosAlternativosQBot('sala de juegos en Recoleta', [], {
    apiKey: 'test-key', fetcher: mock.fetcher,
  })
  assert.equal(result.lugares.length, 1)
  assert.equal(result.lugares[0].tipoLugar, 'Búsqueda en Google Maps')
  assert.match(result.mensaje, /No encontré coincidencias exactas/)
})

test('una sala de juegos no se reemplaza por un centro cultural', async () => {
  const mock = geoapifyMock([{ properties: {
    place_id: 'paseo-buen-pastor', name: 'Paseo del Buen Pastor',
    formatted: 'Nueva Córdoba, Córdoba', categories: ['entertainment.culture.arts_centre'],
  } }], 'Córdoba')
  const result = await resultadosAlternativosQBot('Sala de juegos', [], {
    apiKey: 'test-key', localidad: 'Córdoba', fetcher: mock.fetcher,
  })
  assert.equal(result.lugares.length, 1)
  assert.equal(result.lugares[0].id.startsWith('qbot-maps-'), true)
  assert.doesNotMatch(result.lugares[0].nombre, /Paseo del Buen Pastor/)
})

test('natural description hides internal category identifiers', () => {
  const text = descripcionLugarQBot({
    categoria: ['adult.nightclub'],
    motivo: 'Categoria "adult.nightclub" indica que es un lugar para bailar y pasar la noche.',
  })
  assert.equal(text, 'Boliche para bailar y pasar la noche.')
  assert.doesNotMatch(text, /adult\.nightclub|categoria/i)
})

test('appends Google Maps after a short list and omits it when there are five places', () => {
  const initial = { mensaje: 'Opciones encontradas.', lugares: [{ id: 'l1' }, { id: 'l2' }] }
  const alternatives = { mensaje: 'Amplié la búsqueda.', lugares: [{ id: 'l3' }, {
    id: 'qbot-maps-pedido', origen: 'web', fuenteUrl: 'https://www.google.com/maps/search/?api=1&query=pedido',
  }] }
  const result = combinarResultadosQBot(initial, 'pedido', alternatives)
  assert.deepEqual(result.lugares.map((place) => place.id), ['l1', 'l2', 'l3', 'qbot-maps-pedido'])
  assert.match(result.lugares.at(-1).fuenteUrl, /google\.com\/maps/)

  const enough = combinarResultadosQBot({ lugares: Array.from({ length: 5 }, (_, i) => ({ id: `l${i}` })) }, 'pedido', alternatives)
  assert.equal(enough.lugares.length, 5)
  assert.ok(enough.lugares.every((place) => !place.id.startsWith('qbot-maps-')))
})

test('combining results never reintroduces places rejected for the request', () => {
  const irrelevant = { id: 'paseo', nombre: 'Paseo cultural', direccion: 'Córdoba', categoria: ['entertainment.culture.arts_centre'] }
  const map = { id: 'qbot-maps-juegos', origen: 'web', fuenteUrl: 'https://www.google.com/maps/search/?api=1&query=juegos' }
  const result = combinarResultadosQBot({ lugares: [irrelevant] }, 'Sala de juegos', { lugares: [map] })
  assert.deepEqual(result.lugares.map((lugar) => lugar.id), ['qbot-maps-juegos'])
})
test('boliche queries prioritize nightclubs and discard unrelated attractions', async () => {
  const club = { properties: {
    place_id: 'club-villa-crespo', name: 'Club de Baile', formatted: 'Villa Crespo, Buenos Aires',
    categories: ['adult.nightclub'], lat: -34.6, lon: -58.44,
  } }
  const mural = { properties: {
    place_id: 'mural-gatos', name: 'Mural de Gatos', formatted: 'Villa Crespo, Buenos Aires',
    categories: ['tourism.attraction'], lat: -34.6, lon: -58.44,
  } }
  const mock = geoapifyMock([mural, club], 'Villa Crespo')
  const result = await resultadosAlternativosQBot('Boliche para bailar en Villa Crespo', [], {
    apiKey: 'test-key', fetcher: mock.fetcher,
  })
  assert.equal(mock.calls[1].searchParams.get('categories').split(',')[0], 'adult.nightclub')
  assert.deepEqual(result.lugares.map((place) => place.id), ['club-villa-crespo', 'qbot-maps-boliche-para-bailar-en-villa-crespo'])
  assert.deepEqual(filtrarCoincidenciasQBot([
    { id: 'mural-gatos', direccion: 'Palermo, CABA', categoria: ['tourism.attraction'] },
    { id: 'club-villa-crespo', direccion: 'Villa Crespo, CABA', categoria: ['adult.nightclub'] },
  ], 'Boliche para bailar en Villa Crespo').map((place) => place.id), ['club-villa-crespo'])
})

test('no acepta un geocodificador que devuelve otro barrio con mayor confianza', async () => {
  const mock = geoapifyMock([], 'Palermo')
  const result = await resultadosAlternativosQBot('Boliche para bailar en Villa Crespo', [], {
    apiKey: 'test-key', fetcher: mock.fetcher,
  })
  assert.equal(mock.calls.length, 1)
  assert.equal(result.lugares.length, 1)
  assert.match(decodeURIComponent(result.lugares[0].fuenteUrl), /Villa Crespo/)
})
