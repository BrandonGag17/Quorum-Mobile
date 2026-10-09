# Quórum Mobile

Quórum es una aplicación móvil/web de planificación social. Permite registrarse, formar grupos, proponer juntadas, votar fecha y hora, confirmar asistencia, dividir gastos, guardar horarios personales, importar una vez los eventos de Google Calendar, descubrir lugares y recibir notificaciones.

Está construida con Expo + React Native, React Navigation y Supabase. El frontend está en `src/`; el código y las migraciones de backend están en `supabase/`.

> Este documento describe el código incluido en este repositorio. Las credenciales no se documentan: se leen de variables `EXPO_PUBLIC_*` en `.env` local, que no se debe versionar.

## Arranque, capas y recorrido de datos

```text
index.js
  -> App.js: fuentes + sesión + callback OAuth
  -> NavigationContainer
       sin sesión: AuthStack
       con sesión: AppTabs -> HomeStack / recomendaciones / notificaciones / ajustes

Pantalla -> hook (estado y acciones) -> service (consulta/integración)
         -> Supabase, Edge Function o API externa
         -> hook actualiza estado -> componentes renderizan resultado
```

Las excepciones a esa regla son pantallas pequeñas que llaman a un servicio directamente y componentes puramente visuales. Los servicios devuelven, por convención, `{ data, error }`; los hooks transforman ese resultado en `loading`, datos y mensajes para la UI.

## Puesta en marcha

1. Instalar dependencias: `npm install`.
2. Crear `.env` local con `EXPO_PUBLIC_SUPABASE_URL`, `EXPO_PUBLIC_SUPABASE_KEY` y, para recomendaciones, `EXPO_PUBLIC_GEOAPIFY_KEY`.
3. Ejecutar `npx expo start` (si se cambia configuración nativa u OAuth, usar `npx expo start --clear`).
4. Aplicar las migraciones en `supabase/migrations/` al proyecto Supabase y desplegar las Edge Functions necesarias.

`package.json` declara los scripts `start`, `android`, `ios` y `web`. `app.json` define nombre, iconos, paquete Android, plugins Expo y el scheme `quorum`, necesario para que un build instalado pueda volver del OAuth. `index.js` registra `App` mediante `registerRootComponent`.

## Flujo de autenticación y Google Calendar

`App.js` espera las fuentes, obtiene `getSession()` y escucha `onAuthStateChange()`. Con sesión muestra `AppTabs`; sin ella, `AuthStack`. Además escucha URLs entrantes: si el deep link contiene `auth/callback`, llama a `completeGoogleOAuth(url)` para canjear el código de Google aunque Expo Go haya reiniciado la app al volver del navegador.

La acción **Conectar con Google Calendar** de `OrganizadorHorarios` llama a `signInWithGoogle({ calendar: true })`. En web Supabase redirige la ventana. En móvil abre el navegador con `WebBrowser.openAuthSessionAsync`, recibe el callback y canjea el código PKCE. Se solicita únicamente `calendar.readonly`. Una vez importados horarios con `origen = 'google'`, el botón queda deshabilitado para evitar una segunda importación. Antes de insertar, la pantalla vuelve a consultar `horario_usuario`, normaliza fecha/título y usa un `Set`: esto evita duplicados aunque Postgres y Google serialicen fechas de manera diferente.

Para que funcione se requiere configurar Google y Supabase: callback de Supabase en Google Cloud, Client ID/Secret en el proveedor Google de Supabase, Redirect URLs de Supabase para `quorum://**`, `exp://**` y los orígenes web usados, API de Google Calendar habilitada y usuarios de prueba autorizados mientras el consentimiento esté en pruebas.

## Estructura completa

```text
src/
  components/        piezas de interfaz reutilizables
  context/           estado transversal de React
  hooks/             estado y casos de uso del cliente
  navigation/        stacks y tabs de React Navigation
  screens/           pantallas completas por área
  services/          Supabase, APIs externas y transformaciones de datos
  utils/             auxiliares sin UI
supabase/
  migrations/        cambios versionados de PostgreSQL, RLS, funciones y triggers
  functions/         Edge Functions ejecutadas en Supabase/Deno
```

---

# `src/`

## `src/context/`

### `ThemeContext.js`

Declara `ThemeContext` y `ThemeProvider`. El proveedor guarda el tema seleccionado y expone el valor al árbol que envuelve `App`. Su propósito es que una pantalla o componente pueda consumir un tema sin pasar props manualmente por todos los niveles. Actualmente centraliza la base para tematizar; no reemplaza los estilos locales que cada pantalla ya declara con `StyleSheet`.

## `src/navigation/`

### `AppTabs.js`

Construye el navegador inferior autenticado. Registra cuatro tabs: `Inicio` (`HomeStack`), `Recomendaciones`, `Notificaciones` y `Configuracion`. La función `screenOptions` decide icono, color y aspecto según `route.name`; por ejemplo, `Inicio` usa `IconHomeFilled`. El tab no contiene datos: es el contenedor de navegación que preserva cada área funcional.

### `AuthStack.js`

Define el stack sin sesión. Inicia en `Introduccion` y registra `IniciarSesion`, los pasos `Registrarse1` a `Registrarse4` y `Exito`. Cada `navigation.navigate(...)` dentro de esas pantallas debe usar exactamente uno de estos nombres; de lo contrario React Navigation no encontrará la ruta.

### `HomeStack.js`

Define las rutas apiladas dentro de la tab Inicio: `Home`, grupo, información de grupo, propuestas, recomendaciones de grupo, votación, creación de evento, juntada, gastos y organizador de horarios. Configura un encabezado oscuro común y oculta el encabezado para rutas que tienen cabecera propia. Es el vínculo entre tarjetas/botones de Inicio y las pantallas de detalle.

## `src/utils/`

### `googleSignIn.js`

Es una fachada pequeña sobre `authService.signInWithGoogle`. `iniciarConexionGoogleCalendar()` ejecuta el inicio OAuth y traduce el resultado a `{ success, data }` o `{ success: false, error }`; también reexporta `signInWithGoogle` para las pantallas existentes. No consulta Calendar: solo inicia autenticación.

### `notificationNavigation.js`

Centraliza a dónde debe ir una notificación. `ROUTES_BY_TYPE` relaciona tipos como `grupo_agregado`, `propuesta_creada`, `votacion_cerrada` o recordatorios con rutas de `HomeStack`. `getNotificationNavigationTarget()` valida IDs/payload y devuelve ruta + parámetros; `navigateFromNotification()` usa ese resultado para navegar. Así `Notificaciones` y las respuestas push no duplican condiciones por tipo.

## `src/services/`

### `supabaseClient.js`

Importa el polyfill de URL para React Native y crea la única instancia de Supabase con URL y key públicas. En web usa `localStorage`; en móvil usa `AsyncStorage`. `persistSession` conserva la sesión, `autoRefreshToken` la refresca y `detectSessionInUrl` solo se activa en web porque móvil procesa el callback explícitamente. Todos los servicios deben importar esta instancia, no crear otra.

### `authService.js`

Agrupa autenticación. `signInWithEmail`, `signUp`, `signOut`, `getSession`, `getCurrentUser` y `onAuthStateChange` delegan en Supabase Auth. `signUp` guarda `username` como metadato. `signInWithGoogle` arma un `redirectTo`: origen actual en web o `Linking.createURL('auth/callback')` en móvil. Si `calendar` es verdadero añade scope de solo lectura y solicita consentimiento/offline access.

En móvil usa `skipBrowserRedirect`, abre el navegador y llama a `completeGoogleOAuth`. Esta última extrae `code`/errores del callback y ejecuta `exchangeCodeForSession`. El mapa `intercambiosOAuthEnCurso` reutiliza la misma promesa para un mismo código: evita que el navegador y el listener de `App` intenten canjearlo dos veces.

### `googleCalendarService.js`

`fetchGoogleCalendarEvents` lee `provider_token` de la sesión Supabase. Si falta, devuelve un error explícito; si existe, consulta el endpoint Google Calendar v3 para el rango por defecto de 90 días previos a 180 futuros, ordenado por inicio y sin eventos cancelados. `normalizarEventoGoogleAHorario` acepta evento all-day o con hora, valida fechas y devuelve título, inicio/fin ISO, origen `google` e ID Google. No inserta registros: la pantalla decide cómo persistirlos.

### `userService.js`

Gestiona perfiles y gustos. `normalizeDateToISO` valida/normaliza fechas; `checkUsernameAvailable` y `checkEmailAvailable` consultan disponibilidad; `createUserProfile` inserta el perfil; `saveUserGustos` sincroniza gustos del usuario. `getCurrentUserProfile` parte de la sesión y busca el perfil asociado; `getUserById` y `searchUsers` alimentan vistas y selector de integrantes. `getGustos` obtiene el catálogo. Las validaciones previas evitan consultas con IDs, textos o fechas vacíos.

### `groupService.js`

Encapsula la entidad `grupo` y `usuario_grupo`. `createGroup` crea el grupo, asocia al creador y añade miembros recibidos; si un paso falla, devuelve el error del backend. `getGroupById`, `getGroupMembers`, `getGroupMemberCount` y `getGroupsForUser` arman datos de lectura. `getUserByUsername` sirve al buscador; `addUserToGroup` y `removeUserFromGroup` cambian membresías. `GROUP_LIST_LIMIT` evita traer una lista ilimitada.

### `eventoService.js`

Trabaja con eventos confirmados. `getUpcomingConfirmedEventsForUser` obtiene los próximos del usuario con límite `EVENT_LIST_LIMIT`. `createEvent` valida campos, crea un evento confirmado y registra asistencia/relaciones requeridas. `getConfirmedEventsByGroupId` y `getPastEventsByGroupId` separan la cronología por estado/fecha para las tarjetas de grupo. La pantalla consume la forma ya enriquecida del servicio, no arma joins por su cuenta.

### `propuestaService.js`

Maneja propuestas antes de confirmar una juntada. `getProposalsByGroupId` trae las encuestas/propuestas activas con un límite fijo. `createProposalJuntada` recibe grupo, creador, pregunta y opciones, valida la entrada y crea el evento/encuesta/opciones necesarias. Los triggers SQL generan notificaciones cuando se insertan opciones.

### `votacionService.js`

Maneja encuestas y votos. `isValidDateSuggestion` rechaza fechas inválidas antes de escribir. `getVotacionByEventId` localiza encuesta/opciones; `getVotosForSurvey` obtiene votos por opción; `toggleVote` agrega o elimina el voto del usuario; `addSurveySuggestion` valida y agrega una opción de fecha/hora. Así una sugerencia nueva puede disparar notificaciones sin que la pantalla conozca SQL.

### `juntadaService.js`

Provee datos y acciones de una juntada. `parseFechaTextoPropuesta` transforma una fecha textual de propuesta. Las funciones `getJuntadaById`, `getJuntadaSurveyByEventId`, `getJuntadaGoingCount`, `getJuntadaGoingUsers` y `getJuntadaUserAttendance` hidratan el detalle. `upsertJuntadaAttendance` guarda `voy`/asistencia. `finalizeJuntadaSurvey` toma la opción ganadora y consolida el evento. El servicio concentra conversiones para que la UI no compare strings de fecha ni estados SQL.

### `horariosService.js`

Implementa agendas manuales y búsqueda de ventanas para grupos. Sus auxiliares convierten horas, fechas y días de semana; `horarioSolapa` determina intersección mediante `inicioA < finB && inicioB < finA`.

`buscarSugerenciasFechasPorGrupo` recupera miembros, horarios puntuales/recurrentes y evalúa la franja solicitada: para cada día candidato descarta los que se solapan y devuelve alternativas. `createHorario` valida título, rango temporal y usuario antes de insertar; `createHorarioRecurrente` valida formato y llama al RPC `crear_horario_recurrente`; los dos getters cargan listas del usuario. El campo `origen` distingue manual de Google.

### `gastoService.js`

El bloque `GASTO_SELECT` define la forma conjunta de gasto, pagador y participantes. `getGastosByEventId`, `getPersonasByEventId` y `getHistorialGastosByEventId` leen los datos para liquidar. `createGasto` valida importe, pagador, participantes y evento, crea el gasto y sus repartos. La pantalla `DivisionGastos` usa los resultados para calcular quién debe a quién.

### `resenaService.js`

Gestiona reseñas post-juntada. `TESTING_MODE` modifica `HORAS_ESPERA`: en pruebas el popup aparece tras 30 segundos; en producción tras 12 horas. `mapearCategoriaAGusto` conecta categorías de la reseña con gustos. `getJuntadasSinResena` filtra juntadas terminadas sin review, `getProximaJuntadaAResena` elige una, `guardarResena` inserta/actualiza evaluación y comentario, y `getResena` obtiene la existente. La tabla impone una reseña por usuario/evento.

### `recomendacionService.js`

Es el motor de recomendaciones. Define coordenadas/categorías de respaldo y dos mapas: `localidadCache` guarda resultados ya resueltos y `localidadPending` comparte una petición en curso para evitar llamadas repetidas. Convierte gustos con `tiposPorGusto`, obtiene coordenadas del perfil o texto, y calcula el centro de un grupo promediando coordenadas.

`obtenerRecomendacionesUsuario` y `obtenerRecomendacionesGrupo` construyen preferencias, coordenadas y filtros; luego llaman Geoapify, normalizan y filtran lugares. `obtenerInfoRecomendacion` complementa un lugar con detalles. `obtenerUrlGoogleMaps` construye un enlace de mapa y `obtenerCategoriaPrincipal` elige la categoría visible. Los fallbacks permiten mostrar resultados aun con localidad incompleta.

### `geoapifyClient.js`

Cliente HTTP de Geoapify. Lee `EXPO_PUBLIC_GEOAPIFY_KEY`; `obtenerLugares` construye `URLSearchParams` con categoría, radio, coordenadas y límite y normaliza el JSON de Places. `obtenerDetallesLugar` consulta Place Details por `placeId`. Si no hay key o la respuesta no es válida, devuelve un error en vez de datos ficticios.

### `localidadService.js`

`searchLocalidades` consulta el API público georef de Argentina. Rechaza texto vacío, codifica el nombre, aplica `limit` y transforma el listado de localidades a una forma útil para formularios. Se usa al completar el perfil/localidad.

### `tiposPorGusto.js`

Es un diccionario estático de gusto de Quórum a categorías Geoapify. No ejecuta red ni consulta Supabase: `recomendacionService` lo usa para traducir preferencias de dominio a tipos buscables.

### `qbotService.js`

`consultarQBot(pedido, excluirIds)` valida que exista pedido y llama `supabase.functions.invoke('qbot')`. Envía IDs de lugares ya mostrados para que el bot pueda excluirlos. Revisa que la respuesta tenga forma esperada y devuelve error si la Edge Function falla; así una pantalla no trata un mensaje incompleto como recomendación válida.

### `notificationService.js`

Define `NOTIFICATION_FIELDS`, límites y autenticación común. `getNotifications` normaliza paginación; `getUnreadNotificationCount` cuenta pendientes; `getNotificationActors` resuelve autores; `markNotificationAsRead`/`markAllNotificationsAsRead` actualizan `leida_en`. `subscribeToNotificationChanges` abre un canal Realtime sobre `notificacion` y entrega cambios/estado mediante callbacks; `unsubscribeFromNotificationChanges` lo cierra.

### `pushNotificationService.js`

Encapsula Expo Notifications. Obtiene `projectId`, usuario autenticado y permiso. `registerForPushNotifications` configura canal Android, pide permisos, obtiene Expo push token y llama al RPC para registrarlo; valida cada paso porque simulador, web o permisos denegados no siempre pueden generar token. `unregisterPushNotifications` lo desactiva/elimina. Los demás exports agregan, recuperan, limpian o remueven listeners de recepción/respuesta.

## `src/hooks/`

### `useSession.js`

Mantiene `loading`, `error` y acciones de sesión. `login` valida credenciales mínimas y usa `signInWithEmail`; `logout` llama `signOut`; expone el resultado para `IniciarSesion` y ajustes. Centraliza mensajes de error para no repetir lógica en pantalla.

### `useRegistration.js`

Guarda el estado multi-paso del registro. Valida el primer paso (email, username, contraseña y términos), consulta disponibilidad mediante `userService`, y conserva los datos para los pasos siguientes. Las pantallas `Registrarse1`–`4` llaman sus validadores/actualizadores para que no se pierdan campos al navegar.

### `useUserProfile.js`

Carga el perfil autenticado, expone estado de carga/error y una función de recarga. Es la capa React sobre `getCurrentUserProfile`, usada por pantallas que necesitan identidad, localidad o gustos.

### `useHome.js`

`useHomeSummary` obtiene la sesión y en paralelo grupos y próximos eventos. Guarda datos, `loading`, error y una recarga; Home decide cómo presentar esas colecciones. Si no hay usuario, evita consultas dependientes de `userId`.

### `useGroupDetail.js`

Recibe `groupId`; cuando cambia, valida el ID y carga grupo, integrantes, contador, eventos/propuestas asociados. Devuelve datos, estados y operaciones de actualización que usa `Grupo`. Evita condiciones de carrera cancelando/ignorando resultados obsoletos durante cambios de grupo.

### `userGroupInfo.js`

`useGroupInfo(groupId)` reúne la información mostrada en `InfoGrupo`: perfil del grupo, miembros, datos del usuario actual y acciones de agregar/quitar integrantes. Usa `groupService`/`userService` y reexpone una interfaz única para la pantalla.

### `useCreateGroup.js`

Mantiene formulario, integrantes seleccionados, carga y error de creación. Antes de llamar `createGroup` revisa nombre/creador y transforma usuarios seleccionados en IDs. Al éxito devuelve el grupo para que `CrearGrupo` limpie o navegue.

### `useCreateProposal.js`

Modela una propuesta: pregunta, opciones de fecha/hora, carga y error. Sus acciones agregan/quitan/validan opciones y luego llaman `createProposalJuntada`. La condición central es no enviar propuesta sin grupo, creador y opciones válidas.

### `useCreateEvent.js`

Gestiona el alta de un evento confirmado. Conserva campos y validaciones, usa `createEvent` y publica `loading/error`. La pantalla se limita a capturar datos de UI y navegar cuando el hook devuelve éxito.

### `useJuntadaDetail.js`

Recibe `eventId`, carga evento, encuesta, asistentes y asistencia del usuario. `formatTimeRemaining` e `isSurveyExpired` convierten/cotejan el cierre de votación; acciones como confirmar asistencia o finalizar encuesta llaman al servicio y luego recargan. El hook expone datos ya listos para `Juntada`.

### `useVotacionDetail.js`

Carga encuesta/opciones/votos para un evento. `buildCounts` agrupa votos por opción; luego el hook deriva opción elegida, total y estado de cierre. `toggleVote` y alta de sugerencia actualizan/recargan el estado para que `VotacionJuntada` no implemente contadores propios.

### `useHorarios.js`

Mantiene dos listas: puntuales y recurrentes. `cargarHorarios` obtiene sesión y ambas listas en paralelo. `agregarHorario` y `agregarHorarioRecurrente` validan rangos, usan el servicio y actualizan estado; el `ref guardando` evita doble envío por toques consecutivos. Expone `limpiarError`, `loading` y recarga al organizador.

### `useGastos.js`

Recibe `eventId`, carga gastos/personas/historial y calcula el estado para `DivisionGastos`. Al crear un gasto vuelve a cargar para que saldos y movimientos no queden desactualizados.

### `useRecommendations.js`

Obtiene recomendaciones personales con perfil/sesión, conserva búsqueda/filtros, carga, error y lugar seleccionado. Delegar a `recomendacionService` permite que la pantalla se concentre en secciones y tarjetas.

### `useGroupRecommendations.js`

Es la variante de recomendaciones para `groupId`: valida que exista grupo, pide preferencias/centro al servicio y expone resultados y recarga. No mezcla preferencias del grupo con las del usuario fuera de ese servicio.

### `useRecommendationDetail.js`

Parte de un lugar base, llama detalles solo cuando hace falta y guarda resultado/error. Esto evita que cada tarjeta descargue todos los detalles: `InfoRecomendaciones` los solicita al abrirla.

### `useQBot.js`

Mantiene el texto del pedido, `loading`, error, último resultado y lugares excluidos. Al enviar, valida que el pedido no sea vacío, llama `consultarQBot` y agrega IDs recibidos a exclusiones para minimizar repeticiones en consultas sucesivas.

### `useNotifications.js`

Carga páginas de notificaciones, contador no leído y actores. Se suscribe a Realtime y a cambios de sesión: ante inserción/actualización actualiza o recarga el feed. Expone marcar una/todas leídas y datos para la lista; limpia suscripciones al desmontar.

### `usePushNotifications.js`

Registra el dispositivo al montarse si corresponde, suscribe recepción/respuesta y transforma la respuesta Expo a una notificación navegable. Si recibe `onNotificationResponse`, delega la navegación; al desmontar remueve listeners para no duplicar callbacks.

### `useReviewPopup.js`

Busca la próxima juntada pendiente de reseña y decide si abrir `PopUpResena`. Al guardar/omitir actualiza el estado local; usa la espera definida en `resenaService`.

## `src/components/`

### `Botones.jsx` y `BotonesIntro.jsx`

Ambos renderizan botones estilizados y reciben texto, `onPress` y `disabled`. `Botones` acepta además `backgroundColor`; `BotonesIntro` está orientado al onboarding. La condición `disabled` altera interacción/estilo para impedir doble envío desde formularios.

### `Input.jsx`

Campo reutilizable con etiqueta, error y props de `TextInput`. Propaga cambios y blur al formulario (`react-hook-form`) y ajusta apariencia cuando `error` existe. No guarda estado de negocio: el valor lo controla la pantalla/hook.

### `MensajeError.jsx`

Recibe `mensaje`; si hay texto, muestra un bloque visible de error. Evita repetir estilos y condiciones como `error && ...` complejas en cada formulario.

### `Loading.jsx`

Renderiza el indicador de carga común. Las pantallas lo muestran cuando el hook conserva `loading = true` mientras consulta o guarda.

### `IndicadorPasos.jsx`

Visualiza progreso del registro. Sus props indican paso actual/total; recorre los pasos y marca los anteriores/activo para que `Registrarse1`–`4` comuniquen avance sin lógica duplicada.

### `Iconos.jsx`

Recibe icono, tamaño y título, y compone iconografía con texto. Se usa como elemento compacto y no realiza navegación ni consultas.

### `CardJuntadas.jsx`

Recibe `evento` y `navigation`. Formatea fecha/estado, muestra información de una juntada próxima y, al tocarse, navega al detalle con el ID pertinente. Su responsabilidad es presentación; el listado se obtiene en hooks/servicios.

### `CardJuntadasPasadas.jsx`

Variante para eventos finalizados. Deriva textos/fecha desde `evento`, enseña contexto de reseña o resultado y mantiene la tarjeta separada de la lógica de filtrado de pasado/confirmado.

### `GroupHeader.jsx`

Cabecera visual de un grupo: nombre, imagen, cantidad/acciones según props. Es reutilizable dentro de pantallas del grupo y no carga datos por sí misma.

### `GroupNavigationHeader.jsx`

Cabecera que combina datos de grupo con acciones de navegación (volver/detalle). Recibe callbacks/ruta desde la pantalla, en lugar de acoplarse a un `groupId` global.

### `UserSearch.jsx`

Selector de usuarios para crear/editar grupos. Conserva el texto buscado, aplica debounce/condiciones mínimas antes de llamar al buscador, muestra resultados y evita repetir IDs ya elegidos mediante `excludeIds`. Devuelve el usuario seleccionado al padre.

### `BuscadorFechas.jsx`

Presenta sugerencias de ventana horaria grupal. Recibe grupo/franja y callbacks, llama/consume resultados de `buscarSugerenciasFechasPorGrupo`, maneja estados sin disponibilidad y comunica la fecha elegida a la pantalla de propuesta.

### `SeccionesRecomendaciones.jsx`

Renderiza selector de secciones/filtros de recomendaciones. `seleccionada` determina estado activo; `onChange` informa elección a la pantalla/hook que sí carga datos.

### `PopUp.jsx`

Modal reutilizable. Recibe visibilidad, título, mensaje y callbacks; solo compone el diálogo y delega la consecuencia de confirmar/cancelar al contenedor.

### `PopUpResena.jsx`

Modal especializado para puntuar una juntada. Controla calificación/comentario visuales, valida que haya puntuación antes de guardar y llama callbacks `onGuardar`/`onCerrar`; el hook/servicio persiste la reseña.

### `CardNoti.jsx`

Renderiza una notificación, actor/avatar, fecha relativa y estado leído. Según `tipo`/payload adapta icono y textos. Al tocarla llama la acción recibida, normalmente `navigateFromNotification`, sin conocer el stack directamente.

## `src/screens/Autenticacion/`

### `Introduccion.jsx`

Pantalla inicial de bienvenida. Presenta la propuesta de la app y navega a iniciar sesión o registro; no hace consultas.

### `IniciarSesion.jsx`

Formulario de email/contraseña con `react-hook-form`. Normaliza errores conocidos, llama `useSession.login` y ofrece Google mediante `signInWithGoogle`. Cuando Supabase emite sesión, `App` sustituye el stack completo por `AppTabs`.

### `Registrarse1.jsx`

Primer paso: email, usuario, contraseña y aceptación de términos. Valida formato local, invoca `useRegistration.validateStepOne` para disponibilidad/reglas y navega al paso 2 si todo es válido. También ofrece Google.

### `Registrarse2.jsx`

Segundo paso del registro: recoge datos personales adicionales y los transporta desde `route.params`/estado de registro al paso siguiente. Usa el indicador de pasos y bloquea avance cuando faltan datos requeridos.

### `Registrarse3.jsx`

Tercer paso: localidad y gustos. Busca localidades y permite seleccionar preferencias; transforma lo elegido en datos que `Registrarse4` guardará. Su condición principal es tener localidad/gustos válidos antes de continuar.

### `Registrarse4.jsx`

Último paso: confirma datos, crea la cuenta/perfil y persiste gustos mediante servicios. Controla carga para impedir envíos dobles; al éxito navega a `Exito` o la sesión activa cambia automáticamente la raíz.

### `Exito.jsx`

Pantalla final visual de registro. Comunica éxito y ofrece continuar; no vuelve a crear usuarios.

## `src/screens/Home/`

### `Home.jsx`

Es la portada autenticada. Usa `useHomeSummary` para mostrar grupos y próximos eventos con tarjetas, dispara navegación hacia creación/grupos/horarios y monta el popup de reseña cuando corresponde.

### `CrearGrupo.jsx`

Formulario de nombre/foto e integrantes. Combina `UserSearch` con `useCreateGroup`; cada selección actualiza la lista local y el hook transforma los usuarios en IDs al guardar. Al éxito navega o notifica al padre mediante `onGrupoCreado`.

### `Grupo.jsx`

Detalle operativo de un grupo. Usa `useGroupDetail`, presenta miembros, propuestas, eventos pasados/futuros y acciones de crear propuesta/evento, ver gastos o recomendaciones. Las condiciones de rol/estado determinan qué CTA se muestra.

### `InfoGrupo.jsx`

Vista de información/membresías. `useGroupInfo` obtiene datos; la pantalla usa `UserSearch` para agregar y acciones del hook para quitar. La UI muestra loading/error sin ejecutar consultas SQL directas.

### `ProponerJuntada.jsx`

Construye una propuesta de fecha/hora. Usa `useCreateProposal`, selector de fechas y `BuscadorFechas`; agrega opciones y las valida antes de crear encuesta/evento de planificación. La inserción de opciones activa triggers de notificaciones en Supabase.

### `VotacionJuntada.jsx`

Muestra opciones y conteos desde `useVotacionDetail`. `OptionCard` recibe opción, votos, selección y condición `disabled`; la pantalla permite votar/sugerir mientras encuesta esté activa y la fecha de cierre no haya vencido.

### `CrearEvento.jsx`

Formulario de evento confirmado para un grupo. Recibe contexto por `route`, controla nombre, fecha/hora y detalles, y delega a `useCreateEvent`. En éxito avisa a padre/navega; el trigger SQL notifica miembros.

### `Juntada.jsx`

Detalle de evento: datos, asistentes, estado de votación, asistencia y acciones de finalizar/cancelar según contexto. Usa `useJuntadaDetail` para que cambios de asistencia y encuesta se recarguen sin manipular consultas en JSX.

### `DivisionGastos.jsx`

Obtiene `eventId` de la ruta, usa `useGastos` y presenta gastos, personas, historial y formulario. La lógica de reparto se actualiza después de `createGasto` y no se guarda solo en interfaz.

### `OrganizadorHorarios.jsx`

Calendario personal. `useHorarios` carga/agrega eventos manuales o recurrentes. `CampoHora` adapta el selector a web/nativo. Al importar Google obtiene token/eventos, normaliza, consulta horarios existentes, deduplica por instante+título e inserta con `origen: 'google'`. Si ya existe un horario Google, deshabilita el botón para impedir una segunda importación.

## `src/screens/Recomendaciones/`

### `Recomendaciones.jsx`

Pantalla de descubrimiento personal. Usa `useRecommendations`, alterna secciones con `SeccionesRecomendaciones`, muestra lugares y abre detalle pasando el lugar seleccionado.

### `RecomendacionesGrupo.jsx`

Equivalente para grupo. Lee `groupId` de navegación, usa `useGroupRecommendations` y presenta resultados calculados a partir de preferencias y centro del grupo.

### `InfoRecomendaciones.jsx`

Detalle de un lugar. Parte de `lugarOverride` o parámetros, usa `useRecommendationDetail` para cargar datos adicionales y ofrece abrir Google Maps mediante URL generada por el servicio.

### `PresentacionQBot.jsx`

UI de conversación Q-Bot. Recibe mensaje, setters/callbacks, resultado, `loading` y error desde el contenedor; renderiza entrada, envío y tarjetas de recomendaciones. No contiene credenciales ni llama Groq directamente.

## `src/screens/Notificaciones/`

### `Notificaciones.jsx`

Usa `useNotifications` y `usePushNotifications`. Lista notificaciones con `CardNoti`, permite marcar leídas y usa `notificationNavigation` al abrir una. La suscripción Realtime mantiene el contador/lista actualizados.

## `src/screens/Configuracion/`

### `Configuracion.jsx`

Muestra perfil/opciones de cuenta y acciones como cerrar sesión. Consume hooks/servicios de sesión en vez de borrar almacenamiento directamente, de modo que `App` reciba el cambio y vuelva a `AuthStack`.

---

# `supabase/`

## `supabase/migrations/`

### `20260918000000_crear_horario_recurrente.sql`

Crea el RPC `public.crear_horario_recurrente`. La función toma título, horas, fecha inicial y arreglo de días; exige `auth.uid()`, título no vacío, horas en orden y días 1–7. Inserta el horario semanal con origen manual, crea una fila por día sin duplicados y devuelve JSON con horario+días. Revoca acceso público y concede ejecución solo a `authenticated`; `horariosService.createHorarioRecurrente` la invoca.

### `20261007120000_crear_resena_juntada.sql`

Crea `resena_juntada`, con referencias a usuario/evento, calificación 1–5, comentario y timestamps. La restricción única `(id_usuario, id_evento)` garantiza una sola reseña por asistencia. Agrega índices y RLS: cada usuario puede seleccionar, insertar, actualizar o borrar exclusivamente sus reseñas. `resenaService` depende de estas reglas.

### `20261008000000_notificaciones_supabase.sql`

Es la migración de notificaciones. Crea `notificacion`, `dispositivo_push` y `notificacion_push_envio`; define checks de tipos, payload JSON, recordatorios y unicidad para no repetir mensajes. Aplica RLS y grants: el cliente autenticado lee/actualiza lo suyo, y `service_role` ejecuta tareas administrativas.

También crea RPCs seguros para reclamar un envío push, crear notificaciones, registrar dispositivo y procesar recordatorios. Los triggers reaccionan a: alta de integrante, opciones de propuesta, cierre de encuesta y creación/cancelación de evento. Las funciones insertan destinatarios del grupo, excluyen al actor, usan índices únicos/on-conflict para idempotencia y añaden `notificacion` a `supabase_realtime`.

## `supabase/functions/send-push-notification/index.ts`

Edge Function Deno que recibe una solicitud de envío push. Define cabeceras CORS y helpers para responder JSON, verificar autorización y extraer un ID de notificación válido. A partir de ese ID reclama el trabajo, busca dispositivos activos, llama al servicio Expo y registra estado/contadores de envío. Su validación evita que un cliente no autorizado envíe notificaciones arbitrarias.

## `supabase/functions/qbot/`

### `index.ts`

Punto de entrada de la Edge Function `qbot`. Define CORS/JSON, verifica request y sesión Supabase, obtiene perfil/localidad/gustos autorizados, lee pedido y exclusiones y delega el trabajo a `buscarQBot`. Devuelve mensaje y lugares normalizados o un error HTTP coherente. Las claves de proveedores permanecen como secretos del backend, nunca en React Native.

### `core.mjs`

Núcleo del bot. Define `QBotError`, categorías aceptadas y esquemas de salida. `jsonRemoto` encapsula fetch/errores de proveedores; `coordenadasLocalidad`, normalizadores y `distancia` convierten/localizan datos. `elegirZona` selecciona resultados cercanos y adecuados. `buscarQBot` compone gustos, pedido, localidad y exclusiones, consulta modelo/Geoapify, valida JSON y devuelve lugares reales; incluye la condición especial de talleres de cerámica y manejo específico de CABA.

### `prompt.mjs`

Contiene las instrucciones de lenguaje de Q-Bot y exporta `construirPromptQBot`. Inserta pedido, gustos, localidad y lugares disponibles en un prompt estructurado. Mantener este archivo separado permite cambiar tono/políticas del modelo sin tocar autenticación ni parsing.

### `core.test.mjs`

Pruebas del núcleo Q-Bot. Simula dependencias/red para verificar validación de esquema, coordenadas, selección de zona, exclusiones y fallos. Sirve como contrato para modificar `core.mjs` sin romper respuestas esperadas.

### `README_Qbot.md`

Documentación específica de despliegue, secretos, contratos y pruebas de la Edge Function Q-Bot. Complementa este README; debe actualizarse cuando cambie el protocolo de la función.

## Reglas de mantenimiento

- UI nueva: `screens/`; pieza reusable: `components/`; estado/caso de uso: `hooks/`; consulta o API: `services/`.
- No incluir secretos, Client Secrets de Google, tokens Expo ni contenido de `.env` en commits o documentación.
- Una tabla, RPC o trigger nuevo debe tener migración versionada y políticas RLS explícitas.
- Si se agrega una ruta, registrarla en el stack/tab correspondiente y mantener los nombres usados por `navigate`.
- Si se modifica una respuesta de Edge Function, actualizar primero/además el servicio cliente que la valida y sus pruebas.
- Antes de publicar Google Calendar, revisar scopes, usuarios de prueba y callbacks. El token de proveedor permite datos externos sensibles.
