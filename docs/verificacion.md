# Evidencias de verificación

Qué se probó, cómo y con qué resultado. Separado entre lo verificado en el
**prototipo** y lo que solo puede verificarse **sobre el sistema real**.

## 1. Relevamiento del sitio actual

- **215 filas** en `docs/matriz-funcional.md`, generadas desde el relevamiento
  automatizado (ver `referencia/relevamiento/` con los resultados en bruto).
- Estados: **184 verificadas** · **19 pendientes de verificación** ·
  **12 rotas aparentes**.
- Las 19 pendientes son, en su mayoría, SPAs que renderizan por JavaScript
  (`licitaciones`, `boletinoficial`, `atencionciudadana`,
  `presupuestoparticipativo`, `catastro`) y enlaces no visitados uno por uno.
  **No se asumió que ninguna dejó de existir**: quedan marcadas para
  verificar con acceso al servidor.
- Las 12 "rotas aparentes" incluyen hallazgos reproducidos: `robots.txt` y
  `sitemap.xml` 404, `/noticias` 404, `/contacto` 404, `/feed` y `/rss` 404,
  categorías 9/14/15/17 inexistentes, `/area/{id}` inexistente → **HTTP 500**,
  `prensa.smt.gob.ar` sin DNS, `comunicacion.smt.gob.ar` con fallo de TLS.

## 2. Rutas del prototipo (smoke test HTTP)

40 rutas probadas con petición real al preview. **Todas 200**, sin errores 5xx:

`/` · las 14 categorías `/tramite/{slug}/{id}` · fichas `/nota/{slug}/{id}` ·
áreas `/area/{slug}/{id}` en los 3 niveles · `/historia` ·
`/circuitos-turisticos` · `/circuitosturisticospie` · `/busturistico` ·
`/lugares-de-interes` · `/parques_smt` · `/memorial` · `/galeria/imagenes`
(con y sin `?categoria=`) · `/catalogo/catalogo-de-emprendedores` (sin
filtros, `?feria=3`, `?keyproducto=miel`, `?keyemprendimiento=gota`,
`?page=99`) · `/emprendimiento/21` · `/emprendimiento/564/AROS` ·
`/search/result` (sin `q`, con `q` vacío, con `q`, en mayúsculas, con tilde) ·
`/guia-estilo` · rutas custom heredadas · `/robots.txt`.

## 3. Casos límite (comportamiento ante error)

| Caso | Sitio actual | Prototipo |
|---|---|---|
| `/area/{id-inexistente}` | **HTTP 500** | **404** con página propia |
| `/tramite/{id-inexistente}` | 404 | 404 |
| `/nota/{id-inexistente}` | 404 | 404 |
| `/emprendimiento/999999` | 404 | 404 |
| `/emprendimiento/21/PRODUCTO-INEXISTENTE` | — | 404 |
| `/tramite/{slug-incorrecto}/1` | 200 (duplicado) | **301** → slug canónico |
| `/nota/{slug-incorrecto}/5` | 200 (duplicado) | **301** → slug canónico |
| `/area/{slug-incorrecto}/1` | 200 (duplicado) | **301** → slug canónico |
| Página 404 | sin `<title>`, indexable | con `<title>` y `noindex, nofollow` |

## 4. Funcionalidad probada en navegador

- **Buscador**: `?q=licencia` devuelve categoría y ficha; sin resultados
  muestra el estado vacío con salidas útiles; insensible a mayúsculas y
  tildes (se normaliza la consulta).
- **Mi Feria Digital**: búsqueda por producto (`?keyproducto=miel` → 3
  productos de 3 emprendimientos distintos, cada uno a su ficha), búsqueda por
  emprendimiento, filtros por feria y rubro combinables, botón "Eliminar
  filtros", paginación que preserva los filtros, y **conservación del estado
  al volver desde una ficha** (el querystring viaja a la ficha y al enlace de
  regreso). Confirmado que no hay carrito ni checkout, igual que el sistema
  actual.
- **Menú móvil**: abre y cierra, acordeones funcionan
  (`aria-expanded` alterna y el panel oculta/muestra), trampa de foco activa,
  cierre con Escape.
- **Consola del navegador**: sin errores de JavaScript.
- **Red**: todos los assets del prototipo cargan 200 (CSS, JS, fuente, logos,
  fotos).
- **Compilación Blade**: `php artisan view:cache` compila las 14 vistas sin
  errores; `route:list` registra 32 rutas.
- **Teléfonos**: los `tel:` generados quedan en formato internacional
  (`tel:+543814516500`), y los de emergencia sin prefijo (`tel:911`).

## 5. Higiene de código

- **103 clases CSS** definidas; todas en uso tras eliminar una decorativa
  muerta (`hero__petalo`).
- Sin funciones de PHP 8 en las vistas: `str_starts_with` y `str_ends_with`
  reemplazados por `strpos`/`substr` para el PHP 7.4 del servidor.
- Sin dependencias externas en runtime: ni CDN, ni Google Fonts, ni npm.

## 6. Auditoría adversarial

Se lanzó una auditoría en cuatro dimensiones (accesibilidad WCAG 2.2 AA,
corrección del Blade/PHP, CSS responsive y fidelidad al relevamiento), con un
pase de verificación adversarial por hallazgo. **Quedó incompleta:** solo las
dimensiones de accesibilidad y corrección Blade/PHP llegaron a devolver
hallazgos; las de CSS responsive y fidelidad, y las 16 verificaciones
independientes, se cortaron al terminar la sesión que las corría.

Los hallazgos que sí se obtuvieron fueron revisados y corregidos a mano
(entre ellos: `@{{ }}` de Blade que imprimía el código en vez del arroba de
Instagram, `str_starts_with`/`str_ends_with` incompatibles con PHP 7.4,
redirecciones 301 que perdían la query string, y una clase CSS muerta).
**Pendiente:** volver a correr la auditoría completa con su pase de
verificación antes de dar el prototipo por auditado.

## 7. Lo que NO se pudo verificar (y por qué)

| Pendiente de verificar | Motivo |
|---|---|
| Que una edición en Voyager se refleje en el frontend nuevo | Sin acceso al sistema real |
| Compilación de las vistas en el Laravel productivo | Sin acceso al sistema real |
| Comportamiento con volúmenes reales (cientos de notas, ~600 emprendimientos) | Sin acceso a la base |
| Caché de página en nginx/Plesk | Sin acceso a la configuración del servidor |
| Funcionamiento interno de las SPAs municipales | Renderizan por JS y algunas requieren login; no se intentó iniciar sesión en ninguna |
| Vigencia de aranceles, requisitos y teléfonos | Requiere validación de cada área responsable |
