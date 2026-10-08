import { createClient } from 'npm:@supabase/supabase-js@2.105.3'

const headers = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, content-type, x-webhook-secret',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Content-Type': 'application/json',
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers,
  })

function asRecord(input: unknown): Record<string, unknown> | null {
  if (input && typeof input === 'object' && !Array.isArray(input)) {
    return input as Record<string, unknown>
  }

  return null
}

function isAuthorized(req: Request): boolean {
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim() ?? ''
  const authorization = req.headers.get('Authorization')?.trim() ?? ''
  const webhookSecret = req.headers.get('x-webhook-secret')?.trim() ?? ''
  const configuredWebhookSecret = Deno.env.get('NOTIFICATIONS_WEBHOOK_SECRET')?.trim() ?? ''

  if (serviceRoleKey && authorization === `Bearer ${serviceRoleKey}`) {
    return true
  }

  if (configuredWebhookSecret && webhookSecret === configuredWebhookSecret) {
    return true
  }

  return false
}

function extractNotificationId(body: Record<string, unknown>): string | null {
  const record = asRecord(body.record)
  const candidate =
    body.notification_id ??
    body.notificationId ??
    body.id ??
    record?.id ??
    record?.notification_id ??
    record?.notificationId

  if (
    typeof candidate === 'string' &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate.trim())
  ) {
    return candidate.trim()
  }

  return null
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 204, headers })
  }

  if (req.method !== 'POST') {
    return json({ error: 'Método no permitido.' }, 405)
  }

  if (!isAuthorized(req)) {
    return json({ error: 'No autorizado.' }, 401)
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')?.trim()
  const serviceRoleKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')?.trim()
  if (!supabaseUrl || !serviceRoleKey) {
    return json({ error: 'La función no está configurada correctamente.' }, 503)
  }

  let dispatchClaimed = false
  let dispatchNotificationId: string | null = null
  try {
    const rawBody = await req.text()
    if (rawBody.length > 16000) {
      return json({ error: 'El cuerpo del pedido es demasiado largo.' }, 413)
    }
    let parsedBody: Record<string, unknown> | null = null

    if (rawBody.trim()) {
      try {
        parsedBody = asRecord(JSON.parse(rawBody))
      } catch {
        return json({ error: 'El cuerpo del pedido no es válido.' }, 400)
      }
    }

    if (!parsedBody) {
      return json({ error: 'Falta el cuerpo de la notificación.' }, 400)
    }

    const notificationId = extractNotificationId(parsedBody)
    if (!notificationId) {
      return json({ error: 'Falta la identidad de la notificación.' }, 400)
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      }
    })

    const { data: notification, error: notificationError } = await supabase
      .from('notificacion')
      .select('id, destinatario_id, tipo, titulo, descripcion, payload')
      .eq('id', notificationId)
      .maybeSingle()

    if (notificationError) {
      return json({ error: 'No se pudo consultar la notificación.' }, 500)
    }

    if (!notification) {
      return json({ error: 'La notificación no existe.' }, 404)
    }

    dispatchNotificationId = notification.id
    const { data: claimed, error: claimError } = await supabase.rpc(
      'claim_notificacion_push',
      { p_notificacion_id: notification.id }
    )

    if (claimError) {
      console.error('notification_push_claim_failed', { notificationId: notification.id })
      return json({ error: 'No se pudo reservar el envío de la notificación.' }, 503)
    }

    if (claimed !== true) {
      return json({ status: 'already_processed', notification_id: notification.id }, 200)
    }
    dispatchClaimed = true

    const { data: devices, error: devicesError } = await supabase
      .from('dispositivo_push')
      .select('token, plataforma, activo')
      .eq('id_usuario', notification.destinatario_id)
      .eq('activo', true)

    if (devicesError) {
      await supabase
        .from('notificacion_push_envio')
        .update({ estado: 'fallido', finalizado_en: new Date().toISOString() })
        .eq('notificacion_id', notification.id)
      return json({ error: 'No se pudieron recuperar los dispositivos.' }, 500)
    }

    const tokens = (devices ?? [])
      .map((device) => device.token)
      .filter((token): token is string => typeof token === 'string' && token.length > 0)

    if (tokens.length === 0) {
      await supabase
        .from('notificacion_push_envio')
        .update({
          estado: 'sin_dispositivos',
          total_dispositivos: 0,
          aceptados_por_expo: 0,
          fallidos: 0,
          finalizado_en: new Date().toISOString(),
        })
        .eq('notificacion_id', notification.id)
      dispatchClaimed = false
      return json({ sent: 0, total: 0, skipped: 1, status: 'no_devices' }, 200)
    }

    let acceptedByExpo = 0
    let failed = 0
    const expoAccessToken = Deno.env.get('EXPO_ACCESS_TOKEN')?.trim()

    for (const token of tokens) {
      const notificationPayload = asRecord(notification.payload) ?? {}
      const expoPayload = {
        to: token,
        sound: 'default',
        title: notification.titulo,
        body: notification.descripcion || notification.titulo,
        data: {
          ...notificationPayload,
          notification_id: notification.id,
          notification_type: notification.tipo,
          source: 'quorum-notifications',
        },
      }

      try {
        const response = await fetch('https://exp.host/--/api/v2/push/send', {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'Content-Type': 'application/json',
            ...(expoAccessToken ? { Authorization: `Bearer ${expoAccessToken}` } : {}),
          },
          body: JSON.stringify(expoPayload),
        })

        const responseBody = await response.json().catch(() => null)
        const ticket = Array.isArray(responseBody?.data)
          ? responseBody.data[0]
          : asRecord(responseBody?.data)
        const ticketDetails = asRecord(ticket?.details)
        const rejected = !response.ok || ticket?.status !== 'ok'

        if (rejected) {
          failed += 1
          if (ticketDetails?.error === 'DeviceNotRegistered') {
            const { error: deactivateError } = await supabase
              .from('dispositivo_push')
              .update({ activo: false })
              .eq('id_usuario', notification.destinatario_id)
              .eq('token', token)

            if (deactivateError) {
              console.error('notification_push_token_deactivation_failed', {
                notificationId: notification.id,
              })
            }
          }
          continue
        }

        acceptedByExpo += 1
      } catch {
        failed += 1
      }
    }

    const status =
      acceptedByExpo === tokens.length
        ? 'enviado'
        : acceptedByExpo > 0
          ? 'parcial'
          : 'fallido'
    const { error: dispatchUpdateError } = await supabase
      .from('notificacion_push_envio')
      .update({
        estado: status,
        total_dispositivos: tokens.length,
        aceptados_por_expo: acceptedByExpo,
        fallidos: failed,
        finalizado_en: new Date().toISOString(),
      })
      .eq('notificacion_id', notification.id)

    if (dispatchUpdateError) {
      console.error('notification_push_result_persist_failed', { notificationId: notification.id })
    }
    dispatchClaimed = false

    return json(
      {
        accepted_by_expo: acceptedByExpo,
        failed,
        total: tokens.length,
        notification_id: notification.id,
        status,
      },
      acceptedByExpo === 0 && failed > 0 ? 502 : 200
    )
  } catch {
    if (dispatchClaimed && dispatchNotificationId) {
      const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
      })
      const { error } = await supabase
        .from('notificacion_push_envio')
        .update({ estado: 'fallido', finalizado_en: new Date().toISOString() })
        .eq('notificacion_id', dispatchNotificationId)
      if (error) {
        console.error('notification_push_failure_persist_failed', {
          notificationId: dispatchNotificationId,
        })
      }
    }
    console.error('notification_push_unexpected_failure', {
      notificationId: dispatchNotificationId,
    })
    return json({ error: 'No se pudo procesar el envío.' }, 500)
  }
})
