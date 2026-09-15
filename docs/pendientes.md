# Pendientes, con su causa

Lo que falta para pasar de prototipo a portal en producción, y por qué falta.

## A. Bloqueado por falta de acceso al sistema real

| Pendiente | Causa | Qué se necesita |
|---|---|---|
| Conectar las vistas a los modelos reales de Voyager | El directorio de trabajo estaba vacío: no hubo acceso al código ni a la base del servidor | Copia del proyecto Laravel productivo (o acceso SSH/SFTP) y un dump de la base |
| Confirmar nombres de tablas y campos del CMS | Solo se pudieron inferir de las rutas `/storage/{tabla}/...` | Acceso al panel Voyager o al esquema de la base |
| Confirmar la URL real del panel de administración | `/admin` y `/admin/login` devuelven 404: fue movido o restringido | Dato del área de Innovación Tecnológica |
| Verificar si existe caché de página en nginx/Plesk | No se pudo inspeccionar la configuración del servidor | Acceso a la configuración del dominio en Plesk |
| Versión exacta de Laravel productiva | No se expone públicamente | `composer.json` del proyecto real. Las vistas usan Blade clásico, compatible desde Laravel 6 |
| Probar que una edición en Voyager se refleja en el frontend nuevo | Requiere el sistema real | Entorno de pruebas con copia de código y base |

## B. Requiere decisión o dato del municipio

| Pendiente | Detalle |
|---|---|
| **Noticias en la home** | El portal de noticias (`comunicacionsmt.gob.ar`, "Medios CMS" de un tercero) **no publica RSS ni API**: `/feed` y `/rss` dan 404. Hay que pedirle al proveedor un endpoint JSON/RSS. Mientras tanto la home enlaza al portal sin inventar publicaciones (la plantilla ya contempla el estado vacío). |
| **Mi Feria Digital duplicada** | Coexisten el catálogo Blade del portal (datos en Voyager) y una SPA React con Firestore (`miferiadigital.smt.gob.ar`), con datos divergentes: 8 ferias vs 7 (Plaza Sur y Plaza Congresales solo en Blade; Creadores Digitales solo en la SPA) e IDs distintos para el mismo emprendimiento. Definir la fuente de verdad y si el portal enlaza a la SPA o mantiene su catálogo. |
| **Dirección oficial** | El sitio actual publica "9 de Julio **598** Sur" en el header y "9 de Julio **570**" en el footer y las fichas. El rediseño usa 598 en el footer por ser la más repetida en la home; hay que confirmar cuál corresponde. |
| **Teléfonos y emails a validar** | Email con errata `ordenamientoyconvivnecia@smt.gob.ar` (Secretaría de Ordenamiento y Convivencia); reclamos publicados en un Gmail no institucional (`direccionderespuestarapida@gmail.com`); fichas de área sin teléfono cargado (el campo existe pero está vacío en todas). |
| **Aranceles y requisitos** | Los valores de licencia de conducir ($8.142 anual, CENAT $10.150) provienen de un PDF de 2024. Deben validarse con Movilidad Urbana antes de publicarse. Ningún dato de este tipo fue inventado ni completado por suposición. |
| **Enlaces rotos o mal apuntados del sitio actual** | `www.smtendatos.com.ar` (dominio caído) enlazado desde Transparencia — el correcto es `smtendatos.gob.ar`; formulario de Participación Ciudadana enlazado en modo `/edit` de Google Forms en vez de `/viewform`; Carnet de Sanidad apunta a `http://181.105.6.205:82/...` (IP sin dominio ni TLS); menú con `http://tesoreria.smt.gob.ar` sin TLS (el servidor ya redirige a https). Corregidos en el rediseño donde era inequívoco; los demás requieren confirmación del área. |
| **Documentos en Google Drive** | Digestos normativos 1ª y 2ª parte, Código de Planeamiento Urbano, planillas de edificación y uso, Ordenanza Tributaria 2026, cartelería de obra y listado de empresas de fumigación viven en Drive con enlaces `?usp=sharing`. Recomendación: migrarlos a `/storage/` del servidor. Decisión del municipio. |
| **Micrositios en Google Sites** | Unas 60 fichas de patrimonio (edificios, próceres, obras de arte del Parque 9 de Julio) están en `sites.google.com/smt.gob.ar`. El rediseño conserva los enlaces; integrarlas al portal es un proyecto aparte. |
| **Categorías huérfanas** | La categoría 16 (Justicia Municipal) tiene un solo ítem y la 13 (Patrimonio Cultural) contiene contenido cultural, no trámites. Vale revisar la taxonomía con las áreas. |
| **Duplicación con la Guía de Trámites** | `guiadetramites.smt.gob.ar` tiene el contenido operativo real (requisitos, costos, pasos) y el portal tiene fichas mayormente descriptivas del mismo tema. Definir una fuente de verdad. |

## C. Trabajo de diseño/desarrollo restante

| Pendiente | Estado |
|---|---|
| Plantillas maquetadas | Home, categoría de trámites, ficha de trámite, ficha de área, página editorial de "La ciudad", galería, catálogo de feria, ficha de emprendedor, ficha de producto, resultados de búsqueda y 404: **completas**. |
| Páginas custom heredadas | `/SUBEM`, `/cortes`, `/sube`, `/colectivos`, `/talleres`, `/turno-asistencia`, `/portalproveedores`, `/jovenesporelclima`, `/recomendaciones_sanitarias`, `/presupuestoparticipativo`, `/gestiononlinecatastro`, `/PlandeContingenciaanteInundaciones`, `/Registros _Transporte…`: **rutas conservadas**, hoy con plantilla editorial genérica y aviso de contenido pendiente. Al integrar toman su contenido real del CMS y usan esa misma plantilla. |
| Textos alternativos de la galería | Las imágenes del sitio actual no tienen `alt`. La plantilla nueva los muestra; hay que **cargarlos en el CMS** (tarea de contenido, no de código). |
| `robots.txt` y `sitemap.xml` | No existen hoy (404). Propuestos en `docs/propuesta-tecnica.md`; el sitemap conviene generarlo desde el CMS al integrar. |
| Filtro de la galería por categoría | Implementado server-side por URL (`?categoria=`). Requiere confirmar el campo de categoría en el BREAD de galería (hoy el filtro es client-side con Isotope). |
| Optimización de imágenes | Las fotos de `/storage/` se sirven en su tamaño original (hasta 180 KB). Recomendado: generar variantes y usar `srcset` al integrar. |
| Actualización de PHP 7.4 → 8.x | No lo exige el rediseño, pero 7.4 está sin soporte desde 2022. Proyecto aparte. |

## D. Verificación cubierta hasta ahora

- Relevamiento: 215 filas en `docs/matriz-funcional.md` — 184 verificadas, 19 pendientes de verificación (SPAs que no pudieron inspeccionarse sin navegador y enlaces no visitados), 12 rotas aparentes.
- Preview: todas las rutas del preview responden 200 (o 404 correcto cuando corresponde); sin errores en consola; navegación por teclado, menú móvil y filtros de la feria probados en navegador.
- Pendiente de probar sobre el sistema real: edición desde Voyager reflejada en el frontend, formularios con datos reales, compilación de vistas en el Laravel productivo.
