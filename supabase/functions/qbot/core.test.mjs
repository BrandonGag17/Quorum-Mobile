import test from 'node:test'
import assert from 'node:assert/strict'
import { buscarQBot, coordenadasLocalidad, elegirZona } from './core.mjs'

const perfil = { pedido: 'Un café para estudiar', gustos: ['Cafés y meriendas'], localidad: { nombre: 'Villa Crespo', centroide: { lat: -34.6, lon: -58.44 } } }
const plan = { categorias: ['catering.cafe'], zona: '', pregunta: '' }
const lugar = { properties: { place_id: 'cafe-real', name: 'Café real', formatted: 'Calle 123', categories: ['catering.cafe'], lat: -34.6, lon: -58.44 } }
const recomendacion = { mensaje: 'Encontré este café, pero no puedo confirmar si es tranquilo.', recomendaciones: [{ id: 'cafe-real', motivo: 'Figura como cafetería; no tengo datos de ruido.' }] }
const groq = (data) => ({ choices: [{ finish_reason: 'stop', message: { content: JSON.stringify(data) } }] })
function entorno(respuestas) {
  const llamadas = []
  return {
    llamadas, groqKey: 'test-groq', geoapifyKey: 'test-geo',
    fetcher: async (url, options) => {
      llamadas.push({ url, options })
      assert.ok(respuestas.length, 'No debe haber llamadas extra')
      const next = respuestas.shift()
      if (next instanceof Error) throw next
      return next instanceof Response ? next : new Response(JSON.stringify(next), { status: 200 })
    },
  }
}

test('usa categorías explícitas, conserva datos reales y no envía coordenadas del perfil a Groq', async () => {
  const env = entorno([groq(plan), { features: [lugar] }, groq(recomendacion)])
  const result = await buscarQBot({ ...perfil, gustos: ['Deportes'] }, env)
  assert.equal(result.lugares[0].nombre, 'Café real')
  assert.equal(result.lugares[0].id, 'cafe-real')
  assert.equal(result.lugares[0].datos, undefined)
  assert.equal(new URL(env.llamadas[1].url).searchParams.get('categories'), 'catering.cafe')
  const enviado = JSON.parse(env.llamadas[0].options.body)
  assert.ok(!enviado.messages[1].content.includes('centroide'))
  assert.equal(enviado.response_format.json_schema.strict, true)
})

test('no inventa ubicación si falta en el perfil', async () => {
  const env = entorno([groq(plan)])
  const result = await buscarQBot({ pedido: 'Un café cerca' }, env)
  assert.deepEqual(result.lugares, [])
  assert.match(result.mensaje, /localidad/)
  assert.equal(env.llamadas.length, 1)
})

test('la zona explícita reemplaza la ubicación del perfil', async () => {
  const env = entorno([
    groq({ ...plan, zona: 'Rosario, Santa Fe' }),
    { results: [{ lat: -32.95, lon: -60.65, formatted: 'Rosario, Santa Fe', rank: { confidence: 1 } }] },
    { features: [] },
  ])
  const result = await buscarQBot(perfil, env)
  assert.equal(new URL(env.llamadas[2].url).searchParams.get('filter'), 'circle:-60.65,-32.95,3000')
  assert.deepEqual(result.lugares, [])
  assert.match(result.mensaje, /No encontré/)
  assert.equal(env.llamadas.length, 3)
})

test('zona ambigua requiere aclaración y no vuelve a la del perfil', async () => {
  const env = entorno([groq({ ...plan, zona: 'San Martín' }), { results: [{ lat: 1, lon: 1 }, { lat: 2, lon: 2 }] }])
  const result = await buscarQBot(perfil, env)
  assert.deepEqual(result.lugares, [])
  assert.match(result.mensaje, /provincia/)
})

test('conserva provincia guardada como texto y rechaza geocodificación poco confiable', async () => {
  const env = entorno([groq(plan), { results: [{ lat: 1, lon: 2, rank: { confidence: 0.4 } }] }])
  const result = await buscarQBot({ pedido: 'Un café', localidad: JSON.stringify({ nombre: 'San Martín', provincia: 'Buenos Aires' }) }, env)
  assert.equal(new URL(env.llamadas[1].url).searchParams.get('text'), 'San Martín, Buenos Aires')
  assert.deepEqual(result.lugares, [])
})

test('sin resultados no consume una segunda llamada a Groq', async () => {
  const env = entorno([groq(plan), { features: [] }])
  assert.deepEqual((await buscarQBot(perfil, env)).lugares, [])
  assert.equal(env.llamadas.length, 2)
})

test('rechaza IDs inventados o repetidos', async () => {
  for (const recomendaciones of [
    [{ id: 'inventado', motivo: 'Muy bueno' }],
    [...recomendacion.recomendaciones, ...recomendacion.recomendaciones],
  ]) {
    const env = entorno([groq(plan), { features: [lugar] }, groq({ ...recomendacion, recomendaciones })])
    await assert.rejects(buscarQBot(perfil, env), /verificar/)
  }
})

test('rechaza planes inválidos y respuestas truncadas', async () => {
  for (const respuesta of [
    groq({ ...plan, categorias: ['inventada'] }),
    groq(null),
    { choices: [{ finish_reason: 'length', message: { content: '{}' } }] },
    { choices: [{ finish_reason: 'stop', message: { content: 'no json' } }] },
  ]) await assert.rejects(buscarQBot(perfil, entorno([respuesta])))
})

test('valida pedido y configuración antes de llamar proveedores', async () => {
  for (const pedido of ['', '  ', null, 'x'.repeat(1001)]) {
    await assert.rejects(buscarQBot({ pedido }, entorno([])), { status: 400 })
  }
  await assert.rejects(buscarQBot(perfil, { geoapifyKey: 'test' }), { status: 503 })
})

test('distingue cuota agotada, fallo del proveedor y errores de red sin filtrar secretos', async () => {
  for (const [fallo, status] of [
    [new Response('secret', { status: 429 }), 429],
    [new Response('secret', { status: 500 }), 502],
    [new Error('secret'), 503],
  ]) {
    await assert.rejects(buscarQBot(perfil, entorno([fallo])), (err) => err.status === status && !err.message.includes('secret'))
  }
  await assert.rejects(buscarQBot(perfil, entorno([groq(plan), new Response('secret', { status: 500 })])), /Geoapify/)
})

test('lee formatos de coordenadas válidos y rechaza valores ausentes o fuera de rango', () => {
  assert.deepEqual(coordenadasLocalidad(JSON.stringify(perfil.localidad)), { lat: -34.6, lon: -58.44 })
  assert.deepEqual(coordenadasLocalidad({ centroid: { coordinates: [0, 0] } }), { lat: 0, lon: 0 })
  for (const centroide of [{ lat: null, lon: null }, { lat: '', lon: '' }, { lat: 91, lon: 0 }, { lat: 0, lon: 181 }]) {
    assert.equal(coordenadasLocalidad({ centroide }), null)
  }
})

test('Villa Crespo escrita reutiliza la localidad guardada sin volver a preguntar', async () => {
  const env = entorno([groq({ ...plan, zona: 'villa crespo', pregunta: '¿En qué ciudad?' }), { features: [lugar] }, groq(recomendacion)])
  const result = await buscarQBot(perfil, env)
  assert.equal(result.lugares.length, 1)
  assert.equal(new URL(env.llamadas[1].url).pathname, '/v2/places')
})

test('dos resultados del mismo barrio con confianza igual no son ambigüedad', async () => {
  const env = entorno([groq({ ...plan, zona: 'Villa Crespo' }), { results: [
    { suburb: 'Villa Crespo', lat: -34.6, lon: -58.44, rank: { confidence: 0.9 } },
    { suburb: 'Villa Crespo', lat: -34.601, lon: -58.441, rank: { confidence: 0.9 } },
  ] }, { features: [] }])
  const result = await buscarQBot({ pedido: 'pizzerías por Villa Crespo' }, env)
  assert.match(result.mensaje, /No encontré lugares/)
  assert.equal(env.llamadas.length, 3)
})

test('usa cercanía al perfil para desambiguar pero no elige entre ciudades lejanas', () => {
  const results = [
    { city: 'San Martín', lat: -34.57, lon: -58.53, rank: { confidence: 1 } },
    { city: 'San Martín', lat: -33.08, lon: -68.47, rank: { confidence: 1 } },
  ]
  assert.equal(elegirZona(results, 'San Martín', { lat: -34.6, lon: -58.44 }), results[0])
  assert.equal(elegirZona(results, 'San Martín', null), null)
  assert.equal(elegirZona(results, 'San Martín, Mendoza', { lat: -34.6, lon: -58.44 }), null)
})

test('gustos y localidad llegan a ambas etapas para personalizar pedidos abiertos', async () => {
  const env = entorno([groq(plan), { features: [lugar] }, groq(recomendacion)])
  await buscarQBot({ ...perfil, pedido: 'recomendame lugares' }, env)
  const planContexto = JSON.parse(JSON.parse(env.llamadas[0].options.body).messages[1].content)
  const respuestaContexto = JSON.parse(JSON.parse(env.llamadas[2].options.body).messages[1].content)
  assert.deepEqual(planContexto.gustos, perfil.gustos)
  assert.equal(planContexto.localidad, 'Villa Crespo')
  assert.deepEqual(respuestaContexto.perfil.gustos, perfil.gustos)
  assert.equal(respuestaContexto.perfil.localidad, 'Villa Crespo')
})

test('verifica Villa Crespo completada por IA en Geoapify antes de buscar pizzerías', async () => {
  const env = entorno([
    groq({ ...plan, categorias: ['catering.restaurant.pizza'], zona: 'Villa Crespo', zonaBusqueda: 'Villa Crespo, Ciudad Autónoma de Buenos Aires, Argentina' }),
    { results: [{ suburb: 'Villa Crespo', formatted: 'Villa Crespo, Buenos Aires, Argentina', lat: -34.6, lon: -58.44, rank: { confidence: 1 } }] },
    { features: [] },
  ])
  await buscarQBot({ pedido: 'pizzerías cercanas por villa crespo' }, env)
  assert.equal(new URL(env.llamadas[1].url).searchParams.get('text'), 'Villa Crespo, Ciudad Autónoma de Buenos Aires, Argentina')
  assert.equal(new URL(env.llamadas[2].url).searchParams.get('filter'), 'circle:-58.44,-34.6,3000')
  assert.equal(new URL(env.llamadas[2].url).searchParams.get('categories'), 'catering.restaurant.pizza')
})

test('una interpretación de IA sin coincidencia geográfica no produce lugares', async () => {
  const env = entorno([groq({ ...plan, zona: 'Zona desconocida', zonaBusqueda: 'Zona desconocida, Argentina' }), { results: [] }])
  const result = await buscarQBot({ pedido: 'un café en Zona desconocida' }, env)
  assert.deepEqual(result.lugares, [])
  assert.equal(env.llamadas.length, 2)
})

test('CABA usa el límite de la ciudad y no un círculo o el centro del perfil', async () => {
  const env = entorno([
    groq({ ...plan, zona: 'CABA', zonaBusqueda: 'CABA', alcance: 'zona' }),
    { results: [{ city: 'Autonomous City of Buenos Aires', result_type: 'city', place_id: 'limite-caba', lat: -34.61, lon: -58.39, rank: { confidence: 1 } }] },
    { features: [lugar] }, groq(recomendacion),
  ])
  const result = await buscarQBot({ ...perfil, pedido: 'lugares por CABA' }, env)
  const geo = new URL(env.llamadas[1].url)
  const busqueda = new URL(env.llamadas[2].url)
  assert.equal(geo.searchParams.get('text'), 'Ciudad Autónoma de Buenos Aires, Argentina')
  assert.equal(busqueda.searchParams.get('filter'), 'place:limite-caba')
  assert.equal(busqueda.searchParams.has('bias'), false)
  assert.equal(result.lugares.length, 1)
  const contexto = JSON.parse(JSON.parse(env.llamadas[3].options.body).messages[1].content)
  assert.equal(contexto.perfil.localidad, 'Ciudad Autónoma de Buenos Aires, Argentina')
})

test('no ofrece de nuevo lugares ya mostrados ni los manda a la IA', async () => {
  const nuevo = { properties: { ...lugar.properties, place_id: 'otro-cafe', name: 'Otro café' } }
  const env = entorno([groq(plan), { features: [lugar, nuevo] }, groq({ mensaje: 'Otra opción.', recomendaciones: [{ id: 'otro-cafe', motivo: 'Cafetería.' }] })])
  const result = await buscarQBot({ ...perfil, excluirIds: ['cafe-real'] }, env)
  assert.deepEqual(result.lugares.map((l) => l.id), ['otro-cafe'])
  assert.ok(!env.llamadas[2].options.body.includes('cafe-real'))
})

test('agotados los candidatos nuevos lo informa sin reciclar los anteriores', async () => {
  const env = entorno([groq(plan), { features: [lugar] }])
  const result = await buscarQBot({ ...perfil, excluirIds: ['cafe-real'] }, env)
  assert.deepEqual(result.lugares, [])
  assert.match(result.mensaje, /nuevos/)
})

test('consulta arte y cafés por separado para preservar variedad', async () => {
  const arte = { properties: { ...lugar.properties, place_id: 'arte', categories: ['entertainment.culture.arts_centre'] } }
  const env = entorno([groq({ ...plan, categorias: ['catering.cafe', 'entertainment.culture.arts_centre'] }), { features: [lugar] }, { features: [arte] }, groq(recomendacion)])
  await buscarQBot(perfil, env)
  assert.equal(new URL(env.llamadas[1].url).searchParams.get('categories'), 'catering.cafe')
  assert.equal(new URL(env.llamadas[2].url).searchParams.get('categories'), 'entertainment.culture.arts_centre')
  const contexto = JSON.parse(JSON.parse(env.llamadas[3].options.body).messages[1].content)
  assert.equal(contexto.lugaresDisponibles.length, 2)
})

test('rechaza una lista de exclusión excesiva antes de consultar', async () => {
  await assert.rejects(buscarQBot({ ...perfil, excluirIds: Array(31).fill('id') }, entorno([])), { status: 400 })
})

const planWeb = { ...plan, categorias: [], zona: 'CABA', requiereWeb: true }

test('la búsqueda específica no requiere claves de pago ni búsquedas externas', async () => {
  const env = entorno([groq(planWeb), { results: [] }])
  const result = await buscarQBot({ pedido: 'lugares para pintar cerámica en CABA' }, env)
  assert.equal(env.llamadas.length, 2)
  assert.deepEqual(result.lugares, [])
  assert.match(result.mensaje, /No pude ubicar|No encontré|resultados consultados|catálogo/)
})

test('sin clave web no falla el flujo ni informa que no existan lugares', async () => {
  const env = entorno([groq(planWeb), { results: [] }])
  const result = await buscarQBot({ pedido: 'pintar cerámica en CABA' }, env)
  assert.equal(env.llamadas.length, 2)
  assert.deepEqual(result.lugares, [])
  assert.match(result.mensaje, /No pude ubicar|No encontré|resultados consultados|catálogo/)
})

test('cuando el mapa no ofrece candidatos informa un vacío claro sin depender de web externa', async () => {
  const env = entorno([groq(plan), { features: [] }])
  const result = await buscarQBot(perfil, env)
  assert.deepEqual(result.lugares, [])
  assert.match(result.mensaje, /No encuentré|No encontré|resultados consultados|catálogo/)
})

test('si el pedido pide actividad específica y no marca web, no se rompe el flujo', async () => {
  const env = entorno([
    groq({ ...plan, zona: 'CABA', zonaBusqueda: 'CABA', alcance: 'zona', requiereWeb: false }),
    { results: [] },
  ])
  const result = await buscarQBot({ pedido: 'lugares para pintar cerámica en CABA' }, env)
  assert.equal(env.llamadas.length, 2)
  assert.deepEqual(result.lugares, [])
  assert.match(result.mensaje, /No pude ubicar|No encontré|resultados consultados|catálogo/)
})
