import supabase from './supabaseClient'
import { combinarResultadosQBot, filtrarCoincidenciasQBot, resultadosAlternativosQBot } from './qbotFallback.mjs'

async function obtenerLocalidadPerfil() {
  try {
    const { data: { user } = {} } = await supabase.auth.getUser()
    if (!user) return ''
    const { data } = await supabase.from('usuario').select('localidad').eq('id', user.id).maybeSingle()
    return typeof data?.localidad === 'string' ? data.localidad.trim() : ''
  } catch {
    return ''
  }
}

async function completarResultados(data, pedido, excluirIds = []) {
  const iniciales = filtrarCoincidenciasQBot(Array.isArray(data?.lugares) ? data.lugares : [], pedido)
  if (iniciales.length >= 5) return { ...data, lugares: iniciales.slice(0, 5) }

  const excluir = [...new Set([...excluirIds, ...iniciales.map((lugar) => lugar.id).filter(Boolean)])]
  const localidad = await obtenerLocalidadPerfil()
  const alternativas = await resultadosAlternativosQBot(pedido, excluir, { localidad })
  return combinarResultadosQBot(data, pedido, alternativas)
}

export async function consultarQBot(pedido, excluirIds = []) {
  let data
  let error
  try {
    ({ data, error } = await supabase.functions.invoke('qbot', { body: { pedido, excluirIds } }))
  } catch {
    return completarResultados(null, pedido, excluirIds)
  }
  if (error) {
    return completarResultados(null, pedido, excluirIds)
  }
  if (typeof data?.mensaje !== 'string' || !Array.isArray(data?.lugares)) {
    return completarResultados(null, pedido, excluirIds)
  }
  return completarResultados(data, pedido, excluirIds)
}
