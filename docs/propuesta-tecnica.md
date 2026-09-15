# Propuesta técnica

## Decisión de arquitectura

**Renovar las plantillas Blade y los assets sobre el sistema Laravel + Voyager
existente.** No se propone frontend separado, ni Next.js/Node, ni otro CMS.

Fundamentos:

1. **La administración ya funciona.** El personal municipal carga banners,
   sliders, notas, categorías, áreas y galería desde Voyager; los medios viven
   en `/storage/`. Cambiar de CMS obligaría a migrar datos y re-capacitar sin
   beneficio para el objetivo (renovación visual/UX).
2. **La infraestructura es nginx + Plesk + PHP 7.4.** Blade corre ahí hoy
   mismo; un frontend Node/SSR agregaría un runtime nuevo al servidor
   municipal y un segundo punto de fallo, contra el requisito de evitar
   dependencias externas.
3. **Las rutas se conservan naturalmente**: mismas rutas, mismos
   controladores, mismos datos; solo cambian las vistas que renderizan.
4. **Cero build step**: los assets nuevos son CSS/JS artesanales estáticos.
   No hace falta Node ni compilación en el servidor ni en el flujo de
   publicación. (El sistema actual tampoco compila assets.)

## Qué se entrega y qué se reemplaza

| Capa | Hoy | Propuesta |
|---|---|---|
| Vistas | Blade del template "Statex" (ThemeForest) adaptado | Blade propias (`resources/views/smt/`), diseñadas para el municipio |
| CSS | 13 hojas (~400 KB+) de librerías encadenadas | 2 hojas propias: `tokens.css` (design tokens) + `main.css` (~30 KB sin comprimir) |
| JS | 26 archivos (jQuery ×2, GSAP, sliders, isotope, código muerto) | 1 archivo vanilla (`smt.js`, ~5 KB): menú accesible, acordeones, aparición progresiva |
| Tipografía | Fallback del sistema (Google Fonts comentado) + FA **Pro** | Encode Sans variable autoalojada (54 KB, OFL) + sprite SVG propio (MIT) |
| Iconos | Font Awesome Pro + flaticon del template | Sprite SVG inline de una sola familia |
| Rutas/controladores | Laravel existente | **Sin cambios**, con dos mejoras puntuales (abajo) |
| Admin | Voyager | **Sin cambios** |

## Mejoras de comportamiento propuestas (mínimas, en controladores)

Cambios de pocas líneas en el código productivo, documentados en
`docs/integracion.md`:

1. `abort(404)` cuando el id no existe (hoy `/area/{id}` inexistente da 500).
2. Redirección **301 al slug canónico** cuando el slug de la URL no coincide
   (hoy cualquier slug resuelve: contenido duplicado para SEO). Conserva
   todas las URLs históricas.
3. Catálogo de la Feria: orden determinístico y paginación también sin
   filtros (hoy el orden es aleatorio por request y no hay paginador).
4. Página 404 con `<title>` y `noindex`.
5. `robots.txt` + `sitemap.xml` generado desde el CMS.
6. Cache-Control con expiración larga para `/assets_v2/` y `/storage/`.

## Sistema visual

- **Tokens** en `public/assets_v2/css/tokens.css`: paleta medida del logo
  oficial (azul `#0066FF`, celeste `#2EB1FF`, amarillo `#F4DC00`, gris
  `#333333`), con escalas derivadas y variantes de contraste AA
  (azul-700 `#0052CC` para enlaces, 6.8:1 sobre blanco; texto `#17293C`).
  Espaciado en escala de 4 px, radios, sombras suaves, timings de animación.
- **Tipografía**: Encode Sans (Omnibus-Type; la familia del sistema de diseño
  del Estado argentino), variable 100-900, subsets latin + latin-ext.
- **Identidad**: formas de pétalo del isologotipo aplicadas con moderación
  (iconos de categoría, contadores de pasos, kickers de sección, radios
  asimétricos del hero); amarillo solo como acento (subrayado del hero,
  números de emergencia); fotografías municipales reales de
  `/storage/galeria/` y `/storage/sliders/`.
- **Accesibilidad (objetivo WCAG 2.2 AA)**: foco visible en todo elemento
  interactivo, skip-link, navegación 100 % operable por teclado (desplegables
  con `aria-expanded`/Escape, panel móvil con trampa de foco), contraste
  verificado, `prefers-reduced-motion` respetado, formularios con `label`,
  migas con `aria-current`, HTML semántico.
- **Rendimiento**: 2 CSS + 1 JS diferido, fuente variable con `preload`,
  imágenes con `loading="lazy"` y dimensiones declaradas, animaciones solo
  con IntersectionObserver.

## Contenidos y fuente de verdad

El preview usa `database/muestra/*.php` con contenido real relevado, como
sustituto temporal de la base. **En la integración, cada vista se conecta a
los modelos reales de Voyager** (mapa de variables en `docs/integracion.md`)
y los archivos de muestra se descartan: no queda ninguna copia manual de
contenido.

Para el bloque "Actualidad" de la home: no existe RSS/API del portal de
noticias (Medios CMS). Opciones, en orden de preferencia:
1. Pedir al proveedor de Medios CMS un endpoint JSON/RSS y consumirlo
   server-side con caché (la vista ya contempla el estado vacío).
2. Mientras tanto, la home enlaza al portal de noticias sin inventar
   publicaciones (comportamiento ya implementado si `$noticias` está vacío).
