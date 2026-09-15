# Q-bot con Groq

La app envía `pedido` y hasta 30 IDs de lugares ya mostrados a esta Edge Function. La función valida la sesión,
lee localidad y gustos con las políticas RLS del usuario, interpreta el pedido con
Groq, busca en Geoapify y solicita hasta cinco recomendaciones basadas en esos datos.
Valida que todos los identificadores devueltos existan en los resultados reales.

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
