# Diagnóstico técnico del portal actual — smt.gob.ar

Relevamiento del 14/09/2026, realizado sobre el sitio público (sin acceso aún
a los archivos del servidor). Todo lo afirmado acá proviene de respuestas HTTP,
HTML servido y assets públicos; lo que requiere confirmación en el servidor
está marcado.

## Stack identificado

| Componente | Valor | Evidencia |
|---|---|---|
| Framework | **Laravel** (PHP) | Cookies `XSRF-TOKEN` + `smt_session` (nombre de sesión personalizado) |
| Admin/CMS | **Voyager** (panel Laravel) | Rutas de medios `/storage/{tabla}/{MesAño}/{hash}.{ext}` en `settings`, `banners`, `sliders`, `galeria`, `tramites-items-notas`, `administraciones` — patrón inequívoco del media manager de Voyager |
| PHP | **7.4.33 (EOL)** | Cabecera `X-Powered-By` |
| Servidor | **nginx + Plesk (Linux)** | Cabeceras `Server: nginx`, `PleskLin` |
| Plantilla frontend | **"Statex" de ThemePure (ThemeForest)**, base Bootstrap 5.2.3 | iconfont `flaticon_statex`, prefijo de clases `tp-`, índice "JS INDEX" de ThemePure en `main.js` |
| Analytics | Google Analytics 4 (`G-LJ5M7XKZ0F`) + widget de clima tutiempo.net | Scripts en la home |
| Panel admin | **No expuesto en `/admin`** (404): movido de prefijo o restringido | A confirmar en servidor |

## Rutas y contenido

- Patrones: `/tramite/{slug}/{id}` (categorías), `/nota/{slug}/{id}` (fichas),
  `/area/{slug}/{id}` (gobierno), `/galeria/imagenes`, `/search/result?q=`,
  `/catalogo/catalogo-de-emprendedores`, `/emprendimiento/{id}[/{PRODUCTO}]`
  y ~12 rutas custom sueltas (`/SUBEM`, `/cortes`, `/memorial`, …).
- **El ruteo resuelve solo por `id` e ignora el slug** (`/tramite/x/12` sirve
  la categoría 12): riesgo de contenido duplicado para SEO.
- Categorías de trámites existentes: 1-8, 10-13, 16, 18 (9, 14, 15 y 17
  devuelven 404: huecos de IDs en el CMS).
- Errata **en el registro del CMS**: categoría 18 = "Catrastro y Edificación".
- `/area/{id}` inexistente devuelve **HTTP 500** (falta `findOrFail`/`abort(404)`).
- No existen `robots.txt` ni `sitemap.xml` (404). La página 404 propia no
  tiene `<title>` y queda indexable (`robots: index, follow`).

## Peso y rendimiento del frontend actual

- **13 hojas CSS** (main.css: 310 KB) y **26 archivos JS** en cada página.
- **jQuery cargado dos veces**: 3.6.0 y luego 1.11.0, que la pisa (riesgo de
  incompatibilidades reales con plugins).
- El `@import` de Google Fonts está comentado: la tipografía efectiva es el
  fallback del sistema; las variables siguen declarando DM Sans/Marcellus.
- **Font Awesome Pro** servido localmente: revisar licencia.
- Código muerto del template (módulos e-commerce, `ajax-form.js` apuntando a
  un formulario inexistente).
- Imágenes de galería sin `alt` y sin dimensiones declaradas.

## Ecosistema de sistemas (verificado por HTTP)

| Sistema | URL | Stack observado | Estado |
|---|---|---|---|
| CiDiTuc / Ciudad Digital | ciudaddigital.smt.gob.ar (+ cidituc.smt.gob.ar) | SPA JS, nginx/Plesk; login CUIL+contraseña | Verificado (login visto en navegador) |
| Guía de Trámites | guiadetramites.smt.gob.ar | App propia (aparente Laravel/Voyager), PHP 8.2.33 | Verificado |
| Noticias | **comunicacionsmt.gob.ar** (dominio aparte, sin punto) | "Medios CMS" (tercero), tras Cloudflare; **sin RSS ni API pública** | Verificado |
| DIM (tributos) | www.dimsmt.gob.ar | **IIS 10 + ASP.NET** (stack distinto) | Verificado |
| Tesorería/Proveedores | tesoreria.smt.gob.ar | Apache 2.4.58 **Windows** + PHP 8.2.12; login | Verificado (http→https 302) |
| Expedientes | expediente.smt.gob.ar/index.jsp | Login; extensión .jsp pero servidor PHP (contradictorio) | Verificado |
| Personal (RRHH) | personal.smt.gob.ar | Apache Windows + PHP 8.2.12 | Verificado |
| Webmail | webmail.smt.gob.ar | **Horde** sobre PHP 7.4.33 | Verificado |
| Mapa | mapa.smt.gob.ar | SPA Leaflet 1.9.4 + OSM (bundle Vite, datos empaquetados en el JS); embebible (sin X-Frame-Options) | Verificado |
| SMT en Datos | smtendatos.gob.ar | WordPress, PHP 8.2.33, hosting "hcdn" | Verificado |
| Licitaciones | licitaciones.smt.gob.ar | SPA JS, nginx/Plesk | Responde; detalle pendiente (render JS) |
| Boletín Oficial | boletinoficial.smt.gob.ar | SPA JS | Responde; detalle pendiente |
| Atención Ciudadana | atencionciudadana.smt.gob.ar | SPA JS | Responde; detalle pendiente |
| Presupuesto Participativo | presupuestoparticipativo.smt.gob.ar | **Node.js/Express** (stack distinto) | Responde; detalle pendiente |
| Transparencia (Contaduría) | transparencia.smt.gob.ar | Mismo stack PHP 7.4/Plesk (posible 2ª instancia Laravel) | Verificado |
| Mi Feria Digital (SPA) | miferiadigital.smt.gob.ar | React + Vite + **Firebase/Firestore** | Verificado |

## Hallazgos que requieren decisión o validación del municipio

1. **Doble implementación de Mi Feria Digital**: catálogo Blade en el portal
   (datos Voyager) y SPA React con Firestore, con datos divergentes (8 ferias
   vs 7; IDs distintos para el mismo emprendimiento). Definir fuente de verdad.
2. **Noticias sin integración posible hoy**: no hay RSS/API en Medios CMS.
   Para el bloque "Actualidad" de la nueva home hay que pedir un feed al
   proveedor o mantener enlace saliente.
3. **Documentos institucionales en Google Drive personal/compartido**:
   digestos normativos, Código de Planeamiento, planillas de edificación,
   Ordenanza Tributaria 2026, cartelería de obra, listado de fumigadoras.
   Riesgo de pérdida; migrar a `/storage/` del servidor.
4. **Micrositios de patrimonio en Google Sites** (~60 fichas de edificios,
   monumentos y obras de arte) fuera del control del servidor.
5. **Datos contradictorios a unificar**: dirección 9 de Julio **598** (header)
   vs **570** (footer y fichas); email con errata
   `ordenamientoyconvivnecia@smt.gob.ar`; email de reclamos en Gmail
   (`direccionderespuestarapida@gmail.com`); enlace roto al portal de datos
   (`www.smtendatos.com.ar`, dominio caído) desde la categoría Transparencia;
   formulario de Participación Ciudadana enlazado en modo `/edit` (pide
   permisos) en vez de `/viewform`; botón del Carnet de Sanidad hacia una IP
   sin TLS (`http://181.105.6.205:82/...`); aranceles de licencia de conducir
   posiblemente desactualizados (PDF de 2024).
6. **PHP 7.4 EOL** en el portal principal: sin parches de seguridad desde
   fines de 2022. La renovación de plantillas no lo exige, pero conviene
   planificar la actualización.
