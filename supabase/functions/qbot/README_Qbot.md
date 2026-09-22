# Q-bot con Groq

La app envía `pedido` y hasta 30 IDs de lugares ya mostrados a esta Edge Function. La función valida la sesión,
lee localidad y gustos con las políticas RLS del usuario, interpreta el pedido con
Groq, busca en Geoapify y solicita hasta cinco recomendaciones basadas en esos datos.
Valida que todos los identificadores devueltos existan en los resultados reales.

## Cómo funciona Q-bot en general

Q-bot no es un chat persistente ni un buscador libre de la web. Es un pipeline muy específico que hace lo siguiente:

1. La app del usuario arma un payload mínimo con:
   - `pedido`: texto que escribió el usuario.
   - `excluirIds`: hasta 30 IDs de lugares ya vistos para no repetirlos en la misma pantalla.
2. La Edge Function recibe ese payload y valida la sesión con Supabase (`auth.getUser`).
   - Si el token no es válido o venció, devuelve 401.
   - Todo el acceso a la base se hace con el token del usuario autenticado, no con service role.
3. La función consulta la base con RLS:
   - `usuario.localidad`
   - `usuario_gusto` + `gusto(nombre)`
   - Eso permite obtener nombre de localidad y preferencias sin exponer datos sensibles ni hacer bypass de seguridad.
4. Con esos datos, llama a `buscarQBot(...)` en `core.mjs`.
   - En ese punto se arma un perfil de búsqueda: `{ pedido, gustos, localidad }`.
   - `buscarQBot` crea un plan usando Groq para interpretar el requerimiento.
5. Groq decide:
   - Qué categorías buscar (por ejemplo café, restaurante, parque, centro cultural, etc.).
   - Si la búsqueda es por cercanía o por zona.
   - Si la zona viene explícita en el pedido o si se usa la localidad del perfil.
   - Si el pedido requiere comprobación extra o un flujo distinto (por ejemplo talleres/cerámica).
6. Luego Geoapify resuelve la zona y busca lugares reales cerca de esa zona o dentro de sus límites administrativos.
7. Con los lugares obtenidos, se arma un prompt final con los candidatos que potencialmente sirven y se vuelve a consultar a Groq.
8. Groq devuelve una respuesta estructurada con:
   - un `mensaje` de contexto
   - `recomendaciones`: arreglo con `{ id, motivo }`
9. La función valida que cada `id` devuelto exista entre los resultados reales y devuelves esos lugares al cliente.

En resumen: la app manda un texto y un contexto pequeño; la Edge Function hace la validación, obtiene los datos del usuario de Supabase, interpreta el pedido con Groq, consulta lugares reales con Geoapify y devuelve una selección validada.

## De dónde vienen los datos

Los datos que usa Q-bot vienen de tres fuentes principales:

### 1) El usuario / la app

La app envía:

- `pedido`: texto libre del usuario, por ejemplo "un café tranquilo por Villa Crespo".
- `excluirIds`: IDs de lugares ya mostrados para no repetirlos mientras la pantalla esté viva.

Estos datos salen del input del usuario y del estado local de la pantalla. No se guardan como historial conversacional ni se persisten entre sesiones.

### 2) Supabase / perfil del usuario

La Edge Function lee, con la sesión autenticada:

- `usuario.localidad`
- `usuario_gusto` → `gusto(nombre)`

Esto permite personalizar recomendaciones sin pedirle siempre al usuario que vuelva a aclarar gustos o zona. La lectura se hace con RLS, respetando las políticas del usuario actual.

### 3) Servicios externos

- Groq recibe texto del pedido y metadata del perfil/candidatos para interpretar y decidir recomendaciones.
- Geoapify recibe zona, categorías, filtros y coordenadas para buscar lugares reales en la base geográfica.

## A dónde se mandan los datos

### Hacia Supabase

La Edge Function llama a:

- `supabase.auth.getUser(...)` para validar sesión JWT.
- `supabase.from('usuario').select('localidad')...`
- `supabase.from('usuario_gusto').select('gusto(nombre)')...`

Esto se hace del lado del servidor, con el token del usuario. No se usa `service role` ni se exponen claves secretas al cliente.

### Hacia Groq

La función llama a la API de Groq con payloads JSON estructurados. En general se envían:

- `pedido`
- `gustos`
- `localidad` del perfil
- `lugaresDisponibles` (hasta 18 candidatos relevantes)
- el esquema de respuesta esperado (`json_schema`)

La API no recibe email, ID de usuario, ni coordenadas GPS exactas del perfil. La idea es enviar solo lo que hace falta para interpretar la consulta y recomendar lugares.

### Hacia Geoapify

Geoapify recibe:

- zona geográfica resolutiva (por ejemplo "Villa Crespo, CABA, Argentina")
- categorías (por ejemplo `catering.cafe`, `entertainment.culture`)
- filtro por `place_id` si la zona tiene límites administrativos, o `circle:lon,lat,3000` si es por cercanía
- `bias` y proximidad cuando hace falta
- `limit` máximo por consulta

La búsqueda geográfica se hace con datos del mapa y POIs, no con el perfil del usuario más allá de la zona/ubicación relativa.

## Cómo funciona internamente en detalle

### 1) Entrada y validación

En `supabase/functions/qbot/index.ts` se valida:

- método HTTP (solo POST, con OPTIONS para preflight)
- autenticación con `Authorization: Bearer ...`
- longitud del `pedido` (entre 1 y 1000 caracteres)
- límites en `excluirIds` (máximo 30)

Si algo falla, la Edge Function devuelve errores controlados sin exponer detalles internos ni claves.

### 2) Carga del perfil del usuario

La función consulta el usuario autenticado y sus gustos:

- `usuario.localidad`
- `usuario_gusto` + `gusto(nombre)`

Esto se hace dentro del contexto de sesión del usuario y con RLS, por lo que la función solo ve lo que el usuario puede leer.

### 3) Planificación de la búsqueda con Groq

`buscarQBot` en `core.mjs` llama a Groq con un schema llamado `plan_lugares`.

Groq tiene que responder algo como:

- `categorias`: hasta 3 categorías compatibles
- `zona`: zona explícita mencionada en el pedido
- `zonaBusqueda`: zona completada con ciudad/provincia si hace falta
- `pregunta`: si falta algo para buscar
- `alcance`: `cercania` o `zona`
- `requiereWeb`: si hace falta verificar algún dato en páginas web locales

La lógica sigue reglas muy estrictas:

- el pedido explícito tiene prioridad sobre los gustos
- si la zona es CABA / Capital Federal, se interpreta como Ciudad Autónoma de Buenos Aires
- si hay una zona explícita y no es ambigua, se resuelve con geocodificación
- si faltan datos esenciales y no se puede ubicar, se devuelve un mensaje pidiendo aclaración, sin inventar ubicación

### 4) Resolución de la zona con Geoapify

Si hay una zona o localidad, se hace geocodificación con Geoapify usando:

- `text` = zona a resolver
- `bias` = proximidad al perfil si existe
- `limit = 5`

Luego se utiliza `elegirZona(...)` para elegir un resultado válido y no ambiguo. Si la búsqueda es por zona completa, también se intenta obtener el `place_id` para usar límites administrativos del barrio/ciudad.

Esto permite hacer búsquedas por:

- zona completa (`Villa Crespo, CABA`)
- cercanía al centro aproximado del perfil
- sin depender de GPS del usuario

### 5) Búsqueda de lugares reales

Una vez resuelta la zona, se consulta Geoapify con las categorías elegidas:

- `filter` = `circle:lon,lat,3000` para cercanía, o `place:ID` en búsquedas por zona completa
- `categories` = categorías seleccionadas
- `limit` = 60 máximo en total, con partición por categoría para no perder variedad

Se usan varios llamados para aumentar cobertura y evitar que una categoría domine a otra. Luego se deduplican resultados usando `place_id` y se excluyen los últimos 30 ya mostrados.

### 6) Selección final con Groq

Con los candidatos ya filtrados, se arma un prompt con:

- pedido
- gustos
- localidad
- lugares disponibles

Y se vuelve a llamar a Groq con un esquema estructurado de salida:

- `mensaje`: resumen del resultado
- `recomendaciones`: arreglo de `{ id, motivo }`

El sistema le pide a Groq que:

- seleccione hasta 5 lugares
- base su recomendación en datos explícitos
- no invente ambiente, precios, horario ni servicios si no existen en los datos
- no afirme que un centro cultural tiene cerámica si solo aparece la categoría general
- si no hay suficiente evidencia, lo diga claramente y no invente resultados

### 7) Validación final

Antes de devolver nada al cliente, la función hace un chequeo duro:

- cada `id` devuelto debe existir en los resultados reales
- cada motivo debe ser string
- no puede repetir un lugar
- si la respuesta no cumple, devuelve un error controlado

Esto protege contra respuestas de IA no alineadas con los datos reales.

## En pocas palabras

Q-bot funciona como un pipeline híbrido:

- validar al usuario
- leer su perfil
- interpretar el pedido con Groq
- resolver la zona con Geoapify
- encontrar candidatos reales
- volver a pedirle a Groq que elija las mejores opciones
- validar que las recomendaciones correspondan a datos reales

La parte clave es que nunca se “adivina” una respuesta sin verificarla contra un catálogo real de lugares.

## Configuración

1. Crear una API key en https://console.groq.com/keys.
2. En Supabase Dashboard → Edge Functions → Secrets, guardar:
   - `GROQ_API_KEY`: la clave de Groq.
   - `GEOAPIFY_API_KEY`: una clave de Geoapify que permita llamadas desde el servidor.
     Puede ser la ya utilizada por el proyecto si sus restricciones lo permiten.
   - `GROQ_MODEL`: opcional; por defecto `openai/gpt-oss-20b`.
3. Con la CLI de Supabase instalada y autenticada, ejecutar desde la raíz:

   ```sh
   supabase functions deploy qbot --project-ref TU_PROJECT_REF
   ```

Mantener la verificación JWT predeterminada. La función además valida la sesión
mediante `auth.getUser` y consulta la base con el token del usuario, sin service role.
`SUPABASE_URL` y `SUPABASE_ANON_KEY` están disponibles automáticamente en el servidor.
Las políticas RLS deben permitir al usuario leer su fila en `usuario`, sus relaciones
en `usuario_gusto` y los nombres correspondientes en `gusto`.

No agregar `EXPO_PUBLIC_GROQ_API_KEY`: las variables públicas quedan incluidas en la app.
El `.env` de Expo no configura los secretos remotos de Supabase.

## Pruebas

```sh
node --test supabase/functions/qbot/core.test.mjs
```

Para servir localmente, copiar `supabase/functions/.env.example` a
`supabase/functions/.env`, completar sus valores y ejecutar:

```sh
supabase functions serve qbot --env-file supabase/functions/.env
```

Prueba manual con una sesión de la app: buscar un café, abrir un resultado,
cambiar de solapa y volver; buscar una zona explícita, probar un usuario sin
localidad y verificar reintento ante errores. Las consultas no forman un chat:
para responder una aclaración se edita el pedido completo.

## Alcance y límites

- Pedidos de cercanía: 3 km del centro aproximado; pedidos por una zona completa:
  filtro por su límite administrativo verificado en Geoapify. CABA/Capital Federal
  se normalizan a Ciudad Autónoma de Buenos Aires. No se usa GPS.
- Hasta 60 candidatos por búsqueda, con consultas separadas por categoría para
  evitar que gastronomía tape arte u otros gustos. Hasta 18 candidatos se envían
  a Groq para seleccionar hasta cinco opciones y reducir el consumo de tokens.
- Se excluyen los últimos 30 lugares mostrados mientras la pantalla permanece
  montada. No es un historial de conversación ni persiste entre sesiones. Si el
  conjunto consultado no contiene opciones nuevas, se informa sin reciclarlas.
- Los pedidos de talleres se buscan sin aclaraciones redundantes; el catálogo
  puede no registrar la actividad específica. En ese caso se informa la falta de
  evidencia, sin afirmar que un centro cultural ofrece cerámica por su categoría.
- No se usa búsqueda web externa ni servicios pagos. El flujo está pensado para
  funcionar con Groq + Geoapify solamente. Si el catálogo disponible no confirma
  una actividad específica, se informa de forma clara sin inventar resultados.
- Los pedidos explícitos tienen prioridad sobre los gustos. Las zonas ambiguas o
  ausentes requieren aclaración; no se aplica una ubicación predeterminada.
- Hasta dos llamadas a Groq por búsqueda, más geocodificación si hace falta.
  Hasta tres consultas de categorías a Geoapify (máximo 60 lugares en total).
  Las cuotas del proveedor se comparten entre usuarios. Los errores 429 se muestran
  sin reintentos automáticos. No hay limitador persistente por usuario en esta versión.
- Geoapify no garantiza datos de precio, ambiente o disponibilidad. El prompt exige
  aclarar esos datos faltantes; la validación de IDs no garantiza la veracidad de todo
  el texto generado. Evaluar estos casos con respuestas reales antes de publicar.
- Los pedidos, gustos y nombre de localidad se envían a Groq; no se envían email,
  ID de usuario ni coordenadas del perfil. Geoapify recibe zona/coordenadas de búsqueda.

Referencias: [salidas estructuradas de Groq](https://console.groq.com/docs/structured-outputs),
[límites](https://console.groq.com/docs/rate-limits),
[autenticación Supabase](https://supabase.com/docs/guides/functions/auth-legacy-jwt).
