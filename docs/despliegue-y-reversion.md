# Despliegue y reversión

## Requisitos del servidor (confirmados por relevamiento)

- nginx + Plesk (Linux), PHP 7.4.33, Laravel + Voyager ya operativos.
- El rediseño **no agrega requisitos**: sin Node, sin build, sin nuevas
  extensiones PHP, sin servicios externos. Solo archivos Blade + estáticos.

## Preparación (una sola vez)

1. **Respaldo completo previo** (obligatorio):
   - Código: copia del directorio del proyecto Laravel (o commit/tag en el
     repositorio si existe; si no existe repo, crear uno es la primera mejora).
   - Base de datos: `mysqldump` (o el motor que use) con fecha.
   - En Plesk: los backups programados del dominio sirven como red adicional.
2. Montar **entorno de pruebas** (subdominio en el mismo Plesk, p. ej.
   `beta.smt.gob.ar`, o copia local) con copia del código y la base.
3. Integrar ahí las vistas/assets según `docs/integracion.md` y validar la
   matriz completa.

## Publicación en producción

El diseño de la integración hace el cambio **reversible por archivos**:

1. Subir `public/assets_v2/` (carpeta nueva: no toca nada existente).
2. Subir `resources/views/smt/` (carpeta nueva: no toca nada existente).
3. Respaldar y reemplazar `resources/views/errors/404.blade.php`.
4. Aplicar el cambio mínimo en controladores (devolver vistas `smt.*`).
   Idealmente vía un despliegue de código versionado; si es edición directa,
   guardar copia `*.bak` de cada archivo tocado.
5. Limpiar cachés de Laravel:
   ```bash
   php artisan view:clear && php artisan view:cache
   php artisan config:clear
   ```
6. Si Plesk/nginx tiene caché de página o proxy: purgarla.
7. Smoke test inmediato: home, una categoría, una nota, un área, galería,
   feria (+ filtros), buscador, 404, y una edición de prueba en Voyager.

Ventana sugerida: horario de baja demanda; el cambio efectivo (paso 4) toma
minutos.

## Reversión

Como las vistas nuevas viven en carpetas propias, revertir es restaurar los
returns originales de los controladores (o restaurar los `*.bak` / hacer
checkout del tag previo) y `php artisan view:clear`. Tiempo estimado:
< 5 minutos. La base de datos no se modifica en ningún paso, así que no
requiere restauración.

Si algo falla a nivel servidor, restaurar el backup de Plesk del punto 1.

## Redirecciones

No se elimina ninguna URL pública: no hacen falta redirecciones masivas.
Las únicas redirecciones nuevas son los 301 al slug canónico cuando el slug
de la URL no coincide con el real (mejora SEO), implementadas en los
controladores. Si en el futuro el municipio decide corregir URLs irregulares
(p. ej. `/Registros _Transporte…` o el slug `catrastro`), hacerlo con 301
específico en `routes/web.php`, nunca redirigiendo todo al inicio.
