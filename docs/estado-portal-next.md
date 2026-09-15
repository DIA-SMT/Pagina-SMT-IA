# Estado del frontend nuevo (portal-next)

Next.js 16.3.5 · React 19.2.8 · App Router · TypeScript · sin Tailwind.

## Cómo levantarlo

```bash
cd portal-next
npm install
npm run dev
```

Sin `API_BASE` configurada, el cliente lee los fixtures de `../fixtures/`
(66 respuestas reales capturadas de la API). Así se desarrolla sin depender de
que el DNS de `datos.smt.gob.ar` resuelva.

Cuando el registro DNS exista, en `.env.local`:

```
API_BASE=https://datos.smt.gob.ar
API_TOKEN=<ssh smt-prod "grep \"'token'\" /var/www/vhosts/smt.gob.ar/datos-api-config/config.php">
```

## Verificación real (no declarativa)

Los tres comandos corridos, con su código de salida:

| Comando | Resultado |
|---|---|
| `npx tsc --noEmit` | exit 0 |
| `npm run lint` | exit 0 |
| `npm run build` | exit 0 — **170 páginas** generadas |

Prerenderizado: 112 áreas de gobierno, 31 notas, 14 categorías de trámites y
5 galerías. `/buscar` y `/fichas/[id]` quedan dinámicas.

Rutas probadas contra `next start`, con el código HTTP real:

```
/ 200 · /tramites 200 · /tramites/1 200 · /tramites/9999 404
/gobierno 200 · /gobierno/1 200 · /gobierno/99999 404
/p 200 · /p/historia 200 · /p/SUBEM 200 · /p/no-existe 404
/galeria 200 · /galeria/3 200 · /buscar?q=licencia 200 · /nada 404
```

Los 404 devuelven 404 de verdad, no 200 con cartel de error.

## Peso: comparación medida, no estimada

Ambos sitios medidos con las cabeceras de compresión que manda un navegador
real (`Accept-Encoding: gzip, deflate, br`). Portada, primera visita, sin caché:

| | Actual | Nuevo |
|---|---|---|
| HTML | 6,5 KB | 13,7 KB |
| CSS | **155 KB** en 13 archivos | **6,4 KB** en 1 archivo |
| JS | **296 KB** en 25 archivos | **185 KB** en 9 archivos |
| **Total** | **447 KB en 39 peticiones** | **200 KB en 11 peticiones** |

Lectura honesta: **55 % menos bytes y 72 % menos peticiones**. La mejora grande
está en el CSS (24 veces más chico) y en la cantidad de conexiones. En JavaScript
la mejora es modesta, porque React y Next tienen un costo propio que el sitio
actual no paga. El HTML crece, por los datos de servidor que Next inlinea.

Una corrección a lo que dije antes: estimé que el tráfico bajaría de 480 GB a
80-120 GB mensuales. Esa cuenta salía de una medición mal hecha — comparé el
sitio actual sin comprimir contra el nuevo comprimido. Con la medición pareja,
la baja esperable es del orden del 50 %, no del 80 %.

## Decisiones tomadas durante la construcción

**`app/loading.tsx` en la raíz se eliminó.** Un `loading.tsx` en la raíz de
`app/` envuelve el sitio entero en `<Suspense>`: Next abre la respuesta con
HTTP 200 y manda el esqueleto antes de renderizar, así que cuando la página
llama a `notFound()` el código de estado ya está comprometido. Resultado:
todos los 404 del portal devolvían 200 con el cartel de error. Medido antes y
después. En un portal de gobierno importa, porque los buscadores toman como
válida una página que no existe.

Se perdió el esqueleto de carga. Cuesta poco: los formularios de búsqueda son
`<form method="get">` con navegación nativa, y el resto de las páginas están
prerenderizadas. Si se quiere de vuelta, el lugar es `app/buscar/loading.tsx`,
nunca la raíz.

**Los slugs no se normalizan.** Las notas tienen mayúsculas inconsistentes
(`SUBEM`, `Sube`, `Talleres`, `Memorial`, `parques_smt`). La búsqueda en la
base es sensible a mayúsculas, así que se usan tal cual. `/p/SUBEM` y
`/p/historia` resuelven distinto y los dos funcionan.

**Los iconos del CMS se mapean al sprite propio.** El CMS guarda clases de
Font Awesome (`fa-solid fa-store`). `iconoDesdeFontAwesome()` las traduce a los
iconos del sprite, así que no hace falta cargar Font Awesome Pro ni revisar su
licencia.

## Accesibilidad verificada sobre el HTML servido

Un solo `<h1>` por página en las 15 que responden 200; ninguna imagen sin
atributo `alt`; sin saltos de nivel de encabezado; `aria-current` en migas y en
los filtros de galería. Los textos alternativos de la galería salen del campo
`descripcion` del CMS, que estaba cargado pero el sitio actual no usa.

## Auditoría de diseño aplicada (15/09/2026)

Nueve de los catorce items de `referencia/plan-diseno.md` están aplicados. Los
cuatro últimos, medidos sobre la página servida:

- **Contrastes (12).** El hero fallaba a 375px: el velo tenía sus paradas en
  porcentajes y el bloque de texto una altura fija en píxeles, así que en
  teléfono el texto caía sobre la parte clara de la foto. Con paradas en `rem`
  y `min-height: 26rem`, las siete fotos dan entre 6,73 y 8,55:1 en blanco y
  entre 4,83 y 6,14:1 en amarillo — AAA y AA respectivamente. Además `a:hover`
  dejó de bajar el contraste (iba de 6,82 a 4,83:1; ahora sube a 9,68).
- **Enlaces externos (11).** La flecha ↗ existía pero vivía dentro del `@media`
  del menú de escritorio. Ahora es global: 19 enlaces marcados en la portada y
  el pie. Regla de comportamiento escrita en el CSS: pestaña nueva sólo en
  sistemas transaccionales con sesión abierta.
- **Táctil (9).** No había ni un `:active` en 1156 líneas contra 26 `:hover`.
  Se agregaron estados de pulsado por color, los `transform` se encerraron en
  `@media (hover: hover)` — en iOS quedaban pegados después del toque — y las
  áreas de toque suben a 44px bajo `@media (pointer: coarse)`, sin tocar
  escritorio. De paso se borró CSS que no ejecuta nadie (`.js .aparece`,
  `.esqueleto`, `.boton--enlace`) y se corrigió `.filtro[aria-pressed]`, que
  no matcheaba nunca porque el JSX usa `aria-current`.
- **Tipografía (8).** A 360px la escala se aplanaba: `--fs-md` y `--fs-lg`
  quedaban a un píxel de distancia. Medido después del cambio, a 360px:
  cuerpo 17 · h3 19 · h2 26 · h1 32; a 1440px no cambia nada (cuerpo 17 ·
  h3 19 · h2 31 · hero 52). Contrapartida: el h1 de las internas pasa a dos
  líneas en teléfono — ver la nota al pie de `referencia/plan-diseno.md`.

Verificación: `tsc --noEmit`, `eslint` y `next build` salen 0, 170 páginas
generadas. Barrido de rutas en 200 sobre `/`, `/tramites`, `/tramites/1`,
`/gobierno`, `/gobierno/1`, `/p`, `/p/[slug]`, `/galeria` y `/buscar`.

## Fixtures completos

Segunda captura, ahora completa: **273 archivos, 1,3 MB**.

| | Capturado |
|---|---|
| Categorias de tramites | 14 |
| Areas de gobierno | 112 |
| Notas (paginas sueltas) | 31 |
| Galerias | 5 |
| Fichas de tramite | 48 |
| Relaciones item-ficha | 48 |
| Busquedas frecuentes | 8 |

La primera captura habia fallado en las notas, fichas e items. La causa no era
la que supuse: el `php` del sistema en el servidor es **5.4.16**, y las
extracciones que usaban el operador `??` (de PHP 7) morian con un error de
sintaxis. Las que no lo usaban funcionaban. Se resolvio usando el binario de
Plesk (`/opt/plesk/php/8.2/bin/php`), que es el que corre el sitio.

Con los datos completos, `/fichas/[id]` y las 112 areas responden 200, y los
404 siguen siendo 404.

## El contenido del CMS viene pegado desde Word

Al revisar las fichas aparecio que el texto administrado trae estilos inline de
Microsoft Word, que peleaban con el sistema visual:

| Estilo | Apariciones |
|---|---|
| `font-family: Poppins` | 844 |
| `color: #000000` | 688 |
| `text-align: justify` | 677 |
| `line-height: 115%` | 228 |
| `font-size: 11pt` | 154 |
| `mso-list`, `mso-fareast-language`, etc. | ~200 |

El justificado sin particion de palabras abre rios de espacio en pantallas
angostas, y el resto forzaba una tipografia que el sitio nuevo ni carga.

Se neutraliza desde el CSS con selectores por atributo, **no** tocando el
contenido: el municipio lo sigue administrando igual y no depende de que
alguien limpie el HTML al cargarlo. Se corrige solo lo que Word impuso: los
15 centrados intencionales quedan intactos, verificado.

Comprobado con estilos computados en `/fichas/8`: los 11 elementos con
`justify` calculan `left`, los 15 con color inline toman `#17293C`, los
enlaces `#0052CC`, y la tipografia es Encode Sans a 17px en vez de Poppins a
11pt. En `/p/Talleres`, el unico centrado sigue centrado.

## Lo que falta

- **El registro DNS de `datos.smt.gob.ar`**, para dejar los fixtures y pasar a
  datos en vivo.
- **Fixtures incompletos**: faltan las fichas de trámite y 106 de las 112
  áreas. Por eso en local `/fichas/[id]` da 404 y varias áreas muestran la
  pantalla de no encontrado. No es un bug: las páginas manejan el caso vacío.
  Se resuelve solo al conectar la API real.
- **El panel de carga** que propuso el equipo: la API es hoy de solo lectura.
  Hace falta un usuario de base con permisos de escritura, endpoints de
  escritura con autenticación, y subida de archivos hacia `/storage`.
- **Contenido a validar con las áreas**: dirección oficial (598 vs 570),
  teléfonos de las fichas de gobierno (el campo existe pero está vacío en las
  112), y los aranceles de licencia de conducir.
