import { createClient } from 'npm:@supabase/supabase-js@2.105.3'
import { buscarQBot, QBotError } from './core.mjs'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}
const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), { status, headers })

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { status: 204, headers })
  if (req.method !== 'POST') return json({ error: 'Método no permitido.' }, 405)
  try {
    const authorization = req.headers.get('Authorization') || ''
    if (!authorization.startsWith('Bearer ')) return json({ error: 'Iniciá sesión para usar Q-bot.' }, 401)
    const supabase = createClient(Deno.env.get('SUPABASE_URL')!, Deno.env.get('SUPABASE_ANON_KEY')!, {
      global: { headers: { Authorization: authorization } },
      auth: { persistSession: false, autoRefreshToken: false },
    })
    const { data: { user }, error: authError } = await supabase.auth.getUser(authorization.slice(7))
    if (authError || !user) return json({ error: 'Tu sesión venció. Volvé a iniciar sesión.' }, 401)
    // Limitar el cuerpo incluso si el cliente omite Content-Length.
    const reader = req.body?.getReader()
    if (!reader) return json({ error: 'Falta el pedido.' }, 400)
    let body = ''
    let bytes = 0
    const decoder = new TextDecoder()
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      bytes += value.length
      if (bytes > 40000) { await reader.cancel(); return json({ error: 'El pedido es demasiado largo.' }, 413) }
      body += decoder.decode(value, { stream: true })
    }
    body += decoder.decode()
    let input
    try { input = JSON.parse(body) } catch { return json({ error: 'El pedido no es válido.' }, 400) }
    const pedido = input?.pedido
    if (typeof pedido !== 'string' || !pedido.trim() || pedido.trim().length > 1000) {
      return json({ error: 'Escribí un pedido de entre 1 y 1000 caracteres.' }, 400)
    }
    // El perfil proviene del usuario autenticado; se mantienen las políticas RLS.
    const [perfil, preferencias] = await Promise.all([
      supabase.from('usuario').select('localidad').eq('id', user.id).maybeSingle(),
      supabase.from('usuario_gusto').select('gusto(nombre)').eq('id_usuario', user.id),
    ])
    if (perfil.error || preferencias.error) return json({ error: 'No pudimos cargar tus preferencias.' }, 503)
    const gustos = (preferencias.data || []).flatMap((fila) =>
      [fila.gusto].flat().map((gusto) => gusto?.nombre).filter(Boolean))
    return json(await buscarQBot({ pedido, gustos, localidad: perfil.data?.localidad, excluirIds: input.excluirIds || [] }, {
      groqKey: Deno.env.get('GROQ_API_KEY'), geoapifyKey: Deno.env.get('GEOAPIFY_API_KEY'),
      model: Deno.env.get('GROQ_MODEL') || 'openai/gpt-oss-20b',
    }))
  } catch (error) {
    // No devolver errores crudos de proveedores: pueden incluir URLs con claves.
    if (error instanceof QBotError) return json({ error: error.message }, error.status)
    return json({ error: 'No pudimos procesar tu pedido. Intentá nuevamente.' }, 500)
  }
})
