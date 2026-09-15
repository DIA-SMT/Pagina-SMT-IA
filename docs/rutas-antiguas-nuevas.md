# Relación de rutas antiguas y nuevas

**Ninguna URL pública cambia.** El rediseño reemplaza las vistas del mismo
Laravel, así que toda ruta actual sigue resolviendo en la misma dirección con
los mismos parámetros. No hacen falta redirecciones masivas.

## Equivalencias (antigua = nueva)

| Ruta actual | Sigue igual | Plantilla nueva |
|---|---|---|
| `/` | ✔ | `smt/home.blade.php` |
| `/tramite/{slug}/{id}` (ids 1-8, 10-13, 16, 18) | ✔ | `smt/tramites/categoria.blade.php` |
| `/nota/{slug}/{id}` | ✔ | `smt/tramites/ficha.blade.php` |
| `/area/{slug}/{id}` | ✔ | `smt/gobierno/area.blade.php` |
| `/historia` | ✔ | `smt/ciudad/pagina.blade.php` |
| `/circuitos-turisticos` | ✔ | `smt/ciudad/pagina.blade.php` |
| `/circuitosturisticospie` | ✔ | `smt/ciudad/pagina.blade.php` |
| `/busturistico` | ✔ | `smt/ciudad/pagina.blade.php` |
| `/lugares-de-interes` | ✔ | `smt/ciudad/pagina.blade.php` |
| `/parques_smt` | ✔ | `smt/ciudad/pagina.blade.php` |
| `/memorial` | ✔ | `smt/ciudad/pagina.blade.php` |
| `/galeria/imagenes` | ✔ | `smt/ciudad/galeria.blade.php` |
| `/catalogo/catalogo-de-emprendedores` | ✔ (mismos parámetros GET `keyemprendimiento`, `keyproducto`, `feria`, `rubro`, `page`) | `smt/feria/catalogo.blade.php` |
| `/emprendimiento/{id}` | ✔ | `smt/feria/emprendedor.blade.php` |
| `/emprendimiento/{id}/{PRODUCTO}` | ✔ | `smt/feria/producto.blade.php` |
| `/search/result?q=` | ✔ | `smt/buscar/resultados.blade.php` |
| `/SUBEM`, `/sube`, `/colectivos`, `/cortes`, `/talleres`, `/turno-asistencia`, `/portalproveedores`, `/jovenesporelclima`, `/recomendaciones_sanitarias`, `/presupuestoparticipativo`, `/gestiononlinecatastro`, `/PlandeContingenciaanteInundaciones`, `/Registros _Transporte _Individual_Pasajeros` | ✔ (incluidas sus irregularidades de escritura) | `smt/ciudad/pagina.blade.php` con el contenido del CMS |
| Assets `/assets/**` del template viejo | ✔ (se conservan; el rediseño usa `/assets_v2/**`) | — |
| Medios `/storage/**` | ✔ sin cambios | — |

## Redirecciones nuevas (301)

Única incorporación, como mejora de SEO, sin romper enlaces existentes:

| Situación | Comportamiento nuevo |
|---|---|
| `/tramite/{slug-incorrecto}/{id}` | 301 → `/tramite/{slug-canónico}/{id}` |
| `/nota/{slug-incorrecto}/{id}` | 301 → `/nota/{slug-canónico}/{id}` |
| `/area/{slug-incorrecto}/{id}` | 301 → `/area/{slug-canónico}/{id}` |

Hoy cualquier slug resuelve y devuelve 200, generando contenido duplicado.
Con el 301 los enlaces viejos siguen funcionando y el buscador consolida una
sola URL por contenido.

## Si en el futuro se corrigen URLs irregulares

Dos candidatas, **hoy conservadas tal cual** porque cambiarlas rompería
enlaces publicados:

| URL irregular | Corrección sugerida | Cómo hacerlo |
|---|---|---|
| `/tramite/catrastro-y-edificacion/18` (errata en el CMS) | `/tramite/catastro-y-edificacion/18` | Corregir el slug en Voyager y agregar `Route::redirect('/tramite/catrastro-y-edificacion/18', '/tramite/catastro-y-edificacion/18', 301)` |
| `/Registros _Transporte _Individual_Pasajeros` (espacios y guiones bajos) | `/registro-transporte-individual-pasajeros` | Nueva ruta + `Route::redirect()` 301 desde la antigua |

En ambos casos: redirección **específica** de la URL vieja a su equivalente
exacta. Nunca redirigir páginas antiguas al inicio.
