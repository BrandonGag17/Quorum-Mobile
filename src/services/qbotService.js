import supabase from './supabaseClient'

export async function consultarQBot(pedido, excluirIds = []) {
  const { data, error } = await supabase.functions.invoke('qbot', { body: { pedido, excluirIds } })
  if (error) {
    let mensaje
    try { mensaje = (await error.context?.json())?.error } catch { /* Error de red o de gateway. */ }
    throw new Error(mensaje || 'No pudimos conectar con Q-bot. Verificá tu conexión e intentá nuevamente.')
  }
  if (typeof data?.mensaje !== 'string' || !Array.isArray(data?.lugares)) {
    throw new Error('Q-bot devolvió una respuesta inválida. Intentá nuevamente.')
  }
  return data
}
