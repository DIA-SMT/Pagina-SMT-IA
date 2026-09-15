# Renovación del portal smt.gob.ar

Renovación visual y de experiencia de usuario del portal oficial de la
Municipalidad de San Miguel de Tucumán, conservando funcionalidades, rutas,
contenidos y administración del sistema existente (Laravel + Voyager).

> **Estado: prototipo funcional de alta fidelidad, pendiente de integración.**
> El desarrollo se hizo contra el relevamiento del sitio público (14/09/2026)
> porque los archivos del sistema productivo aún no estuvieron disponibles.
> Las vistas y assets están listos para trasplantarse al Laravel real; los
> datos de este preview son de muestra, tomados del contenido público real.
> No es una migración terminada. Ver `docs/pendientes.md`.

## Estructura

| Carpeta | Contenido |
|---|---|
| `portal-smt/` | Proyecto Laravel de preview. **Lo trasplantable:** `resources/views/smt/` + `resources/views/errors/` (plantillas Blade) y `public/assets_v2/` (CSS, JS, fuentes, imágenes). Lo demás (controlador, rutas, `database/muestra/`) existe solo para previsualizar. |
| `docs/` | Diagnóstico, matriz funcional, propuesta técnica, guía de integración, despliegue y reversión, pendientes. |
| `referencia/` | Material capturado del sitio real: HTML de la home, resultados del relevamiento, fotos y logos oficiales. |

## Cómo levantar el preview

Requisitos: PHP 8.2+ y Composer (el preview usa Laravel 13; las **vistas** son
compatibles con el Laravel del servidor municipal, ver `docs/integracion.md`).

```bash
cd portal-smt
composer install
cp .env.example .env
php artisan key:generate
php artisan serve --port=8123
```

Abrir <http://127.0.0.1:8123>. No necesita base de datos: el contenido de
muestra vive en `database/muestra/*.php`.

## Rutas del preview (espejo de producción)

- `/` — portada renovada
- `/tramite/{slug}/{id}` — categoría de trámites (14 categorías reales)
- `/nota/{slug}/{id}` — ficha de trámite/nota
- `/area/{slug}/{id}` — dependencias de gobierno
- `/historia`, `/circuitos-turisticos`, `/lugares-de-interes`, `/galeria/imagenes`, `/parques_smt`, `/memorial`
- `/catalogo/catalogo-de-emprendedores`, `/emprendimiento/{id}`, `/emprendimiento/{id}/{producto}` — Mi Feria Digital
- `/search/result?q=` — buscador
- Rutas custom heredadas (`/SUBEM`, `/cortes`, `/turno-asistencia`, …) con plantilla provisional marcada como pendiente

## Decisiones clave

1. **Se conserva el backend**: la renovación son plantillas Blade + assets
   nuevos sobre el mismo Laravel/Voyager del servidor municipal. El equipo
   sigue administrando contenido con el panel actual.
2. **Sin build step**: CSS y JS artesanales, 2 hojas + 1 script (el sitio
   actual carga 13 CSS + 26 JS). No requiere Node en el servidor.
3. **Tipografía Encode Sans** autoalojada (la tipografía del Estado argentino,
   licencia OFL). Sin dependencia de Google Fonts en runtime. Elimina además
   el Font Awesome **Pro** actual (licencia a revisar) reemplazado por un
   sprite SVG propio.
4. **Paleta tomada del isologotipo oficial**: azul `#0066FF`, celeste
   `#2EB1FF`, amarillo `#F4DC00` (medidos del PNG oficial), con variantes
   accesibles documentadas en `assets_v2/css/tokens.css`.
5. **URLs conservadas**, incluidas las irregulares (slug `catrastro-y-edificacion`,
   `/Registros _Transporte…`), con mejora de canónico 301 cuando el slug no
   coincide. Ninguna URL pública se elimina.
