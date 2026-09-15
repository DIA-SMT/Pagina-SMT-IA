# Guía de integración al sistema productivo

Cómo llevar el rediseño al Laravel + Voyager real del servidor municipal.
Se trabaja SIEMPRE sobre una copia/entorno de pruebas primero (ver
`docs/despliegue-y-reversion.md`).

## 1. Qué se copia

Desde este repositorio al proyecto Laravel productivo:

| Origen (este repo) | Destino (producción) |
|---|---|
| `portal-smt/resources/views/smt/**` | `resources/views/smt/**` (carpeta nueva; no pisa las vistas actuales) |
| `portal-smt/resources/views/errors/404.blade.php` | `resources/views/errors/404.blade.php` (respaldar la actual) |
| `portal-smt/public/assets_v2/**` | `public/assets_v2/**` (carpeta nueva; no pisa `/assets/`) |

Las vistas usan solo Blade clásico (`@extends`, `@include`, `@foreach`,
`asset()`, `url()`) — compatible con Laravel 6/7/8 (PHP 7.4) sin cambios.
No usan componentes `x-`, Vite ni Mix.

**No se copian**: `app/Http/Controllers/PortalController.php`, `routes/web.php`
ni `database/muestra/` (existen solo para el preview).

## 2. Compatibilidad de sintaxis a revisar

Dos funciones PHP 8 usadas en vistas, a reemplazar si el servidor sigue en 7.4:

- `str_starts_with($a, $b)` → `strpos($a, $b) === 0`
  (en `tramites/categoria.blade.php` y `tramites/ficha.blade.php`)
- `str_ends_with($a, '.pdf')` → `substr($a, -4) === '.pdf'`
  (en `tramites/ficha.blade.php`)

El resto es PHP neutro. `config('portal.*')` requiere copiar
`portal-smt/config/portal.php` **o**, preferible, reemplazar esas lecturas por
las fuentes reales (menús de Voyager, settings). Ver §4.

## 3. Cambiar las vistas que devuelven los controladores

En los controladores existentes, cambiar el nombre de vista devuelto por el
equivalente nuevo (los datos que ya pasan los controladores se adaptan según
el mapa de §4):

| Función actual (por ruta) | Vista nueva |
|---|---|
| `/` | `smt.home` |
| `/tramite/{slug}/{id}` | `smt.tramites.categoria` |
| `/nota/{slug}/{id}` | `smt.tramites.ficha` |
| `/area/{slug}/{id}` | `smt.gobierno.area` |
| `/historia`, `/lugares-de-interes`, `/circuitos-*`, `/busturistico`, `/parques_smt`, `/memorial`, rutas custom | `smt.ciudad.pagina` |
| `/galeria/imagenes` | `smt.ciudad.galeria` |
| `/catalogo/catalogo-de-emprendedores` | `smt.feria.catalogo` |
| `/emprendimiento/{id}` | `smt.feria.emprendedor` |
| `/emprendimiento/{id}/{producto}` | `smt.feria.producto` |
| `/search/result` | `smt.buscar.resultados` |

## 4. Mapa de variables por vista

Nombres de tabla/campo reales a confirmar en el Voyager del servidor
(los patrones `/storage/...` observados sugieren: `banners`, `sliders`,
`galeria`, `tramites-items-notas`, `administraciones`, `settings`).

### `smt.home`
- `$fotoHero` `['src','alt','epigrafe']` — de la tabla `sliders` (elegir 1
  destacado) o un setting de Voyager.
- `$noticias` `[['titulo','url','imagen','fecha','fecha_iso'],…]` — feed del
  portal de noticias si el proveedor lo entrega; si no, pasar `[]` (la vista
  muestra el acceso al portal sin inventar contenido).
- `$lugaresDestacados` `[['titulo','detalle','imagen','alt','etiqueta','url'],…]`
  — curado editorial (3 ítems), administrable como BREAD nuevo o banners.
- Accesos, categorías, sistemas, emergencias, redes: hoy leen de
  `config('portal.*')`; conectar a los menús/tablas de Voyager para que sigan
  siendo administrables (los menús de Voyager viven en `menu_items`).

### `smt.tramites.categoria`
- `$categoria` `['id','slug','titulo','detalle']` — tabla de categorías.
- `$notas` paginador de `['titulo','resumen','slug','id','url','externo']` —
  ítems de la categoría; `url` no nula = enlace directo (externo o ruta
  custom), si no la vista arma `/nota/{slug}/{id}`.

### `smt.tramites.ficha`
- `$nota` `['titulo','resumen','contenido' (HTML del CMS, se imprime sin
  escapar igual que hoy),'pasos'[],'requisitos'[],'documentos'[
  ['titulo','url','tipo','detalle']],'accion'['titulo','detalle','url','boton'],
  'modalidad'[],'contacto'[]]` — todos opcionales salvo `titulo`/`contenido`.
  Si el CMS actual solo tiene un campo HTML, pasar solo `contenido`: la vista
  degrada bien. Los campos estructurados pueden incorporarse gradualmente
  como columnas/campos extra en el BREAD de notas.
- `$categoria` como arriba; `$relacionadas` `[['titulo','slug','id'],…]`.

### `smt.gobierno.area`
- `$area` `['nombre','descripcion','autoridad'['nombre','cargo','foto'],
  'direccion','telefono','email','organigrama','contenido','ruta'
  [[nombre,url],…],'padre'['slug','id','nombre'],'dependencias'
  [['id','slug','nombre','email'],…]]` — tabla `administraciones` + relación
  padre/hijas.

### `smt.ciudad.galeria`
- `$imagenes` paginador de `['miniatura','completa','titulo']` — tabla
  `galeria` (miniatura = variante `-cropped`). **Cargar `alt`/título: hoy las
  imágenes no tienen texto alternativo.**
- `$categorias` `[['slug','nombre'],…]` + `$categoriaActiva` — el filtro hoy
  es client-side (form `#mg-filter` con Isotope); confirmar el campo de
  categoría en la tabla y filtrar server-side con `?categoria=`.

### `smt.feria.*`
- Catálogo: `$ferias` `{id: nombre}` (8 reales), `$rubros` `{id: nombre}`
  (41 reales, IDs no consecutivos), `$filtros` (los 4 parámetros GET
  actuales: `keyemprendimiento`, `keyproducto`, `feria`, `rubro`),
  `$resultados` (paginador: emprendimientos, o productos si hay
  `keyproducto`), `$total`, `$hayFiltros`, `$modoProductos`, `$volver`
  (querystring para conservar el estado al entrar a fichas).
- Fichas: `$emp` `['nombre','emprendedor','feria','rubro','telefono','email',
  'instagram','facebook','logo','productos'[['nombre','fotos'[]],…]]`.
- Mejora incluida: orden estable + paginación sin filtros (hoy aleatorio).

### `smt.buscar.resultados`
- `$consulta` string; `$resultados` paginador de
  `['tipo','titulo','resumen','url']`. Conectar a la búsqueda actual del
  sistema; la vista declara honestamente la cobertura (contenidos públicos
  del portal). Recomendado: comparación sin tildes/mayúsculas en la consulta
  SQL (`COLLATE utf8mb4_unicode_ci` ya lo hace en MySQL).

## 5. Verificaciones tras integrar (en pruebas)

1. Editar un banner/nota/área en Voyager y confirmar que el cambio aparece
   en el nuevo frontend (misma base ⇒ inmediato; si hay caché de Laravel,
   `php artisan view:clear` tras el deploy y revisar si hay caché de
   respuesta en Plesk/nginx).
2. Recorrer la matriz (`docs/matriz-funcional.md`) fila por fila comparando
   con producción actual.
3. `php artisan view:cache` para detectar errores de compilación Blade en el
   Laravel productivo.
4. Probar formularios (buscador, filtros de feria) con datos reales.
5. Lighthouse + navegación por teclado + lector de pantalla en las plantillas
   principales.
