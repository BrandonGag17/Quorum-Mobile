# 📋 Sistema de Reseñas de Juntadas - Documentación

## ¿Qué se implementó?

Un sistema completo que permite a los usuarios reseñar juntadas pasadas, guardar sus gustos basado en el rating, y mejorar las recomendaciones de lugares automáticamente.

---

## 🔄 Flujo Completo

### 1️⃣ **El usuario asiste a una juntada**
- Se registra en `usuario_evento` con `asistencia = 'voy'`
- La juntada tiene una fecha y un lugar con categoría asociada

### 2️⃣ **Pasan 12 horas desde el inicio de la juntada**
- **Automáticamente** al abrir la app, el sistema detecta juntadas pasadas hace 12+ horas
- Si la juntada no tiene reseña → aparece el PopUp

### 3️⃣ **El usuario reseña con estrellas + comentario opcional**
- 1-2 ⭐: No le gustó → **Elimina el gusto** de `usuario_gusto` (si existía)
- 3 ⭐: Neutral → sin cambios en gustos
- 4-5 ⭐: Le gustó → **Agrega el gusto** a `usuario_gusto` automáticamente

### 4️⃣ **Los gustos mejoran LAS RECOMENDACIONES EN LA PANTALLA "LUGARES"**
- ✨ Las recomendaciones se actualizan automáticamente
- 📍 Los lugares que coinciden con los gustos del usuario aparecen PRIMERO
- 🎯 Cada gusto tiene un peso: más gustos iguales = más relevancia
- 🔄 Se recarga cada vez que el usuario abre la pantalla de recomendaciones

---

## 📁 Archivos Creados/Modificados

### Base de Datos
- **`supabase/migrations/20261007120000_crear_resena_juntada.sql`** (NUEVO)
  - Nueva tabla `resena_juntada` con ID, usuario, evento, calificación (1-5), comentario, fechas

### Servicios
- **`src/services/resenaService.js`** (NUEVO)
  - `mapearCategoriaAGusto()`: Convierte categorías de Geoapify → nombres de gustos
  - `getJuntadasSinResena()`: Obtiene juntadas pasadas 12h+ sin reseña
  - `getProximaJuntadaAResena()`: Devuelve la siguiente a reseñar
  - `guardarResena()`: Guarda la reseña Y actualiza automáticamente `usuario_gusto`
  - `getResena()`: Obtiene una reseña específica

- **`src/services/recomendacionService.js`** (MODIFICADO) ✨ IMPORTANTE
  - **Nueva función**: `obtenerPerfilRecomendacionUsuario()` - Obtiene gustos con peso del usuario
  - **Modificada**: `obtenerRecomendacionesUsuario()` - Ahora ordena lugares por relevancia según gustos
  - Los lugares se puntúan según coincidencia con gustos del usuario
  - Mejor integración con cambios en `usuario_gusto`

### Hooks
- **`src/hooks/useReviewPopup.js`** (NUEVO)
  - Maneja toda la lógica del PopUp de reseñas
  - Detecta si hay juntadas a reseñar
  - Gestiona carga de datos y errores

- **`src/hooks/useRecommendations.js`** (MODIFICADO) ✨ IMPORTANTE
  - **Ahora usa `useFocusEffect`**: Se recarga cuando entra en la pantalla
  - **Mejor manejo de errores** y logs
  - **Refleja cambios inmediatos** en gustos después de reseñar

### Componentes
- **`src/components/PopUpResena.jsx`** (NUEVO)
  - PopUp visual con sistema de estrellas interactivo
  - Campo para comentarios (200 caracteres max)
  - Botones para enviar o saltar
  - Loading states y manejo de errores

### Pantallas
- **`src/screens/Home/Home.jsx`** (MODIFICADO)
  - Integra el hook `useReviewPopup`
  - Renderiza `<PopUpResena>` automáticamente

---

## 🎯 Cómo Funciona el Mapeo de Categorías → Gustos

| Categoría Geoapify | → | Gusto del Usuario |
|---|---|---|
| `leisure.park`, `leisure.park.garden`, `beach` | → | **Naturaleza y aire libre** |
| `catering.restaurant`, `catering.fast_food` | → | **Comida** |
| `catering.cafe`, `catering.cafe.coffee` | → | **Cafés y meriendas** |
| `entertainment.cinema`, `entertainment.culture.theatre` | → | **Cine y espectáculos** |
| `entertainment.culture`, `entertainment.museum` | → | **Arte y cultura** |
| `sport`, `leisure.playground` | → | **Deportes** |
| ... y más en [tiposPorGusto.js](./src/services/tiposPorGusto.js) |  |  |

---

## 🧠 Lógica de Actualización de Gustos

```javascript
// En guardarResena() en resenaService.js

if (calificacion >= 4) {
  // Calificación ALTA: insertar gusto
  // El usuario va a ver más recomendaciones similares
  INSERT INTO usuario_gusto (id_usuario, id_gusto)
  
} else if (calificacion <= 2) {
  // Calificación BAJA: eliminar gusto
  // El usuario verá menos recomendaciones similares
  DELETE FROM usuario_gusto WHERE id_usuario = ? AND id_gusto = ?
  
} else if (calificacion == 3) {
  // Calificación NEUTRAL: sin cambios en gustos
  // Neutral, no afecta recomendaciones
}
```

---

## 📊 Cómo la Pantalla "Lugares" Usa los Gustos

### Antes (sin reseñas):
```
Recomendaciones = Lugares cercanos + categorías por defecto
(parques, cafés, restaurantes aleatorios)
```

### Después (con reseñas):
```
1. Usuario reseña juntada en PARQUE con 5 ⭐
   └─ Sistema agrega "Naturaleza y aire libre" a usuario_gusto

2. Usuario abre pantalla "Lugares"
   └─ Hook useRecommendations se recarga (useFocusEffect)
   └─ recomendacionService obtiene gustos del usuario
   └─ Busca lugares con categorías "leisure.park", "beach", etc
   └─ Ordena por RELEVANCIA (parques primero, luego otros)

3. Usuario ve:
   [Parque 1] ⭐⭐⭐⭐⭐ (7 de 10 puntos - coincide perfecto)
   [Parque 2] ⭐⭐⭐⭐⭐ (7 de 10 puntos)
   [Café]     ⭐⭐⭐⭐  (3 de 10 puntos - no coincide tan bien)
   [Bar]      ⭐⭐⭐   (0 puntos - sin coincidencia)
```

---

## 🔐 Seguridad (Row-Level Security)

La tabla `resena_juntada` tiene políticas RLS:
- ✅ Los usuarios solo **ven** sus propias reseñas
- ✅ Los usuarios solo **crean/editan** sus propias reseñas
- ✅ Los usuarios solo **eliminan** sus propias reseñas

---

## 🚀 Cómo Probar

### Escenario 1: Popup de Reseña
1. **Abre la app** e inicia sesión
2. **Si hace 12+ horas** que asististe a una juntada → aparece el PopUp automáticamente
3. **Puntúa con estrellas** (4-5 estrellas para agregar gusto)
4. **Presiona "Enviar"**
5. ✅ El gusto se agrega automáticamente a `usuario_gusto`

### Escenario 2: Cambios en Recomendaciones
1. Después de reseñar, **abre la pantalla "Lugares"**
2. Los lugares que coinciden con tu reseña deberían aparecer **primero**
3. **Salte/Recargue** → deberían mantenerse arriba
4. Si reseñas con 1-2 ⭐, ese gusto se **elimina** y sus lugares bajan de prioridad

### Verificar en Supabase
```sql
-- Ver reseñas guardadas
SELECT id, id_usuario, id_evento, calificacion, comentario, creada_en 
FROM resena_juntada 
WHERE id_usuario = 'tu-user-id'
ORDER BY creada_en DESC;

-- Ver gustos del usuario
SELECT g.nombre, COUNT(*) 
FROM usuario_gusto ug
JOIN gusto g ON ug.id_gusto = g.id_gusto
WHERE ug.id_usuario = 'tu-user-id'
GROUP BY g.nombre;

-- Verificar categorías de gustos (para debugging)
SELECT * FROM tiposPorGusto;
```

---

## ⚙️ Cambios Técnicos Resumidos

### `recomendacionService.js`
✨ **Nueva función `obtenerPerfilRecomendacionUsuario()`**
```javascript
// Obtiene gustos del usuario con su peso
// Retorna: { gustosConPeso, categoriasConPeso }
// Ejemplo: "Naturaleza y aire libre" = 1 voto, "Comida" = 2 votos
```

✨ **Modificada `obtenerRecomendacionesUsuario()`**
```javascript
// ANTES: obtiene tipos y busca lugares
// AHORA: obtiene tipos, busca lugares, Y LOS ORDENA POR RELEVANCIA
// Los lugares que coinciden con gustos tienen puntaje más alto
```

### `useRecommendations.js`
✨ **Añadido `useFocusEffect`**
```javascript
// Cuando el usuario abre la pantalla, se recarga
// Esto refleja cambios en gustos inmediatamente después de reseñar
```

---

## 🐛 Troubleshooting

### PopUp no aparece
- ✅ Verifica que la juntada tenga `usuario_evento.asistencia = 'voy'`
- ✅ Verifica que pasaron 12+ horas desde `evento.fecha_hora_inicio`
- ✅ Verifica que NO existe una reseña en `resena_juntada`

### Lugares no cambian orden después de reseñar
- ✅ Abre la pantalla "Lugares" nuevamente (useFocusEffect debería recargarlo)
- ✅ Si no se actualiza, haz un Pull-to-Refresh manual (swipe down)
- ✅ Verifica que el gusto se agregó correctamente en Supabase: `SELECT * FROM usuario_gusto`

### Gusto se agrega pero no aparece en recomendaciones
- ✅ Verifica que el lugar tiene un `categoria` en la tabla `lugar`
- ✅ Verifica que la categoría mapea a un gusto en `tiposPorGusto.js`
- ✅ Ejemplo: `leisure.park` debe mapear a "Naturaleza y aire libre"

### Error "categoría no existe"
- Este error no debería ocurrir, pero si pasa:
- ✅ Verifica que `resenaService.js` está llamando a `mapearCategoriaAGusto()` correctamente
- ✅ Verifica que `gusto.nombre` coincida exactamente con las claves en `tiposPorGusto.js`

---

## 📞 Integración con Q-Bot

El Q-Bot **también usa** los gustos del usuario:

```javascript
// En qbotService.js (Front)
consultarQBot("dame opciones para una juntada en parque")

// En supabase/functions/qbot/index.ts (Servidor)
const [perfil, preferencias] = await Promise.all([
  supabase.from('usuario').select('localidad'),
  supabase.from('usuario_gusto').select('gusto(nombre)'), // ← Trae tus gustos
])
// El Q-Bot usa tus gustos para dar mejores recomendaciones conversacionales
```

---

## 📚 Flujo Completo Resumido

```
Usuario asiste juntada
      ↓
    12 horas pasan
      ↓
Abre app → PopUp de reseña
      ↓
Usuario puntúa (4-5 ⭐ generalmente)
      ↓
Sistema agrega gusto a usuario_gusto
      ↓
Usuario abre pantalla "Lugares"
      ↓
useRecommendations se recarga (useFocusEffect)
      ↓
recomendacionService obtiene gustos y ordena lugares
      ↓
Usuario ve lugares relevantes PRIMERO 🎯
```

---

## 🎨 Componentes y Sus Responsabilidades

| Componente | Responsabilidad |
|---|---|
| **PopUpResena.jsx** | Mostrar UI para reseñar (estrellas, comentario, botones) |
| **useReviewPopup.js** | Detectar juntadas a reseñar y manejar estado del popup |
| **resenaService.js** | Guardar reseña Y actualizar gustos automáticamente |
| **recomendacionService.js** | Obtener y ordenar lugares según gustos |
| **useRecommendations.js** | Refrescar recomendaciones cuando entra en pantalla |
| **Home.jsx** | Mostrar popup al abrir la app |
| **Recomendaciones.jsx** | Mostrar lugares ordenados por relevancia |

---

## 🔮 Posibles Mejoras Futuras

1. **Historial de reseñas**: Mostrar todas las reseñas previas
2. **Estadísticas personales**: "Visitaste 47 parques, promedio 4.3 ⭐"
3. **Notificaciones push**: Recordar a las 12 horas exactas para reseñar
4. **Pesos dinámicos**: Reseñas recientes pesan más
5. **Filtros en Lugares**: "Mostrar solo lugares que me gusten"
6. **Comparar gustos**: Ver qué le gusta al grupo vs a ti
7. **Badges**: "Explorador de parques" 🏅


