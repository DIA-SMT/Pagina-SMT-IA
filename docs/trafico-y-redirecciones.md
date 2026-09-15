# Tráfico real del portal y preservación de URLs

Medido sobre `access_ssl_log.webstat` del servidor de producción, **lunes
14/09/2026**, día hábil completo, con los bots excluidos por user-agent
(`bot|crawl|spider|slurp|uptimerobot|python-requests|curl`) y sin contar
archivos estáticos. Es la primera medición del tráfico del portal que queda
documentada; los números que circulaban antes en las notas de diseño eran
estimaciones y estaban mal asignados.

## Qué mira la gente

| Contenido | Vistas/día | URL vieja | URL nueva |
|---|---:|---|---|
| Portada | 2.210 | `/` | `/` |
| Fichas de trámite | **1.845** | `/nota/{slug}/{id}` | `/fichas/{id}` |
| Páginas de contenido | **704** | `/{slug}` | `/p/{slug}` |
| Áreas de gobierno | 567 | `/area/{slug}/{id}` | `/gobierno/{id}` |
| Categorías de trámites | 425 | `/tramite/{slug}/{id}` | `/tramites/{id}` |
| Feria de emprendedores | 87 | `/emprendimiento/…`, `/catalogo/…` | — (proyecto aparte) |
| Buscador | 28 | `/search/result?q=` | `/buscar?q=` |
| Galerías | 9 | `/galeria/imagenes` | `/galeria` |

Además, 45.863 pedidos diarios a `/storage/**` (las imágenes y documentos del
CMS) y 147.246 a `/assets/**` (los archivos del template viejo, que mueren con
él).

**El trámite manda.** Fichas más categorías suman 2.270 vistas diarias contra
704 de las páginas de contenido. Una nota de diseño anterior decía lo
contrario; el error venía de que la tabla del CMS que guarda las páginas de
contenido se llama `notas`, pero la URL `/nota/{slug}/{id}` sirve **fichas de
trámite**. Contar por `/nota` mezcla las dos cosas.

## Las diez páginas más vistas del sitio

| # | Página | Vistas/día |
|---:|---|---:|
| 1 | Licencia de conducir (ficha 8) | 831 |
| 2 | Emisión del carnet de sanidad (ficha 14) | 217 |
| 3 | Turnos de Asistencia Pública | 200 |
| 4 | Recorridos de colectivos | 161 |
| 5 | Servicio de población animal (ficha 81) | 85 |
| 6 | Consulta y pago de infracciones (ficha 70) | 82 |
| 7 | Portal de atención ciudadana (ficha 7) | 70 |
| 8 | Ciudadano Digital (ficha 77) | 60 |
| 9 | Tarjeta SUBE | 54 |
| 10 | Recorrido de colectivos (ficha 17) | 51 |

## Las páginas de contenido, una por una

```
200  turno-asistencia        25  concurso
161  colectivos              10  portalproveedores
 54  Sube                     9  busturistico
 44  Registros _Transporte…   8  cortes
 40  lugares-de-interes       6  parques_smt
 38  circuitos-turisticos     5  sube  ·  4 turismo  ·  4 jovenesporelclima
 37  SUBEM                    4  circuitosturisticospie  ·  3 talleres
 29  historia                 3  recomendaciones_sanitarias  ·  3 memorial
```

Dos lecturas que importan para el diseño:

1. **El transporte público es el agujero.** `colectivos` (161) + `Sube` (54+5) +
   `SUBEM` (37) + `Registros _Transporte _Individual_Pasajeros` (44) suman
   **301 vistas diarias**, más la ficha `recorrido-de-colectivos` (51). El
   portal nuevo no enlaza ninguna de esas páginas desde ningún lado.
2. **Lo que sí enlaza pesa menos.** Los tres botones de "Conocé la ciudad"
   (historia 29, circuitos-turísticos 38, lugares-de-interés 40) suman 107.

## Páginas que no existen y la gente pide igual

| URL pedida | Pedidos/día | Respuesta actual |
|---|---:|---|
| `/robots.txt` | **643** | 404 |
| `/sitemap.xml` | 28 | 404 |
| `/sitemap_index.xml` | 22 | 404 |
| `/sitemap-news.xml` | 21 | 404 |
| `/contacto` | 6 | 404 |

Los 404 de `robots.txt` y `sitemap.xml` no son un descuido menor: son
buscadores intentando indexar el portal municipal todos los días. La causa está
documentada en `hallazgos-servidor.md`: la ruta comodín
`Route::get('/{slug}', 'NotaController@show')` del Laravel viejo se traga
cualquier URL de un solo segmento que no sea un archivo real.

## Preservación de URLs

El portal nuevo cambia el esquema de URLs de **todo** el contenido. Sin
redirecciones, esas ~3.600 visitas diarias caen en 404 el día que el dominio
apunte a Vercel, y se pierde el posicionamiento acumulado.

Las reglas están en `portal-next/next.config.ts`. Son 38 y ninguna manda a la
portada: cada URL vieja va a su equivalente exacto.

| Regla | Cubre |
|---|---|
| `/nota/:slug/:id(\d+)` → `/fichas/:id` | 1.845 vistas/día |
| `/area/:slug/:id(\d+)` → `/gobierno/:id` | 567 |
| `/tramite/:slug/:id(\d+)` → `/tramites/:id` | 425 |
| 31 reglas `/{slug}` → `/p/{slug}` | 704 |
| `/search/result` y `/search` → `/buscar` | 28 (el `?q=` viaja solo) |
| `/galeria/imagenes` → `/galeria` | 9 |
| `/index.php` → `/` | 9 |

Cuatro decisiones que conviene tener anotadas:

- **Son 308, no 301.** Es lo que emite Next con `permanent: true`. El 301 hacía
  que históricamente algunos navegadores convirtieran un POST en GET; el 308
  preserva el método. Para un buscador las dos significan "movido para
  siempre" y transfieren igual el posicionamiento.
- **La lista de slugs está congelada a propósito.** Sólo necesitan redirección
  las URLs que ya están indexadas. Una página que el municipio cargue después
  de la mudanza nace directamente en `/p/{slug}` y nunca tuvo URL vieja.
- **`/galeria` queda afuera.** Hay una página de contenido con ese slug, pero
  `/galeria` es el índice de galerías del portal nuevo y las redirecciones se
  evalúan antes del sistema de archivos: redirigirla dejaría las galerías
  inaccesibles. Esa página no registra tráfico.
- **Una entrada cubre mayúsculas y minúsculas.** Next compara las rutas de
  redirección sin distinguir mayúsculas, igual que MariaDB con su colación `ci`.
  `/sube` y `/Sube` terminan los dos en `/p/Sube`.

La feria (`/emprendimiento/…`, `/catalogo/…`, 87 vistas diarias) **no** tiene
redirección: es un proyecto aparte y todavía no hay URL destino. Va a devolver
404 hasta que se defina.

### Verificación

Barrido de las 80 URLs viejas siguiendo cada redirección hasta la página final:
**80 terminan en 200, cero fallas.**

## Corregido: la API no decodificaba la ruta

`datos.smt.gob.ar/index.php` armaba la ruta desde `REQUEST_URI` pero **no
decodificaba los segmentos**, así que un slug con caracteres que viajan
percent-encoded nunca matcheaba contra la base.

Afectaba a una sola página, `Registros _Transporte _Individual_Pasajeros`
(44 vistas diarias), cuyo slug tiene espacios. El fixture capturado para esa
página había quedado con el error de la API adentro, así que también fallaba
en desarrollo.

Aplicado el **15/09/2026** con autorización expresa. Respaldo del archivo
original en `index.php.bak-antes-rawurldecode`, en el mismo directorio.

```php
// Los segmentos se decodifican DESPUES de partir por barra, nunca antes: al
// reves, un %2F codificado inventaria un segmento de ruta que no existe.
$segmentos = array_map(
    'rawurldecode',
    array_values(array_filter(explode('/', $ruta), static fn ($s) => $s !== ''))
);
```

El orden importa por seguridad: decodificar **después** de partir por `/`
impide que un `%2F` codificado invente un segmento de ruta que no existe.

Verificación posterior al cambio:

- La página que fallaba devuelve 200.
- Regresión sobre los 19 endpoints: todos 200.
- Sin token, 401. Con `POST`, 403. Con `..%2F..%2Fetc%2Fpasswd`, 404.
- Auditado que ningún segmento decodificado llega al sistema de archivos: los
  únicos `require` de la API son constantes literales, y los segmentos sólo se
  usan como parámetros de consultas preparadas.
- Fixture `nota-Registros _Transporte _Individual_Pasajeros.json` recapturado
  (id 34, 14.772 caracteres de texto).
