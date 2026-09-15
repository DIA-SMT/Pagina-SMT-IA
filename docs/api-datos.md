# API de datos del portal

API JSON de **solo lectura** que expone el contenido que hoy administra
Voyager, para que el frontend nuevo en Vercel lo consuma sin tocar el sitio
actual.

- **Host**: `datos.smt.gob.ar` (pendiente del registro DNS, ver abajo)
- **Código fuente**: `api-datos/` en este repositorio
- **En el servidor**: `/var/www/vhosts/smt.gob.ar/datos.smt.gob.ar/`
- **Configuración**: `/var/www/vhosts/smt.gob.ar/datos-api-config/config.php`
  (fuera del docroot, permisos 640)

## Como se llega a la API hoy: smt.gob.ar/api

Mientras no exista el registro DNS, la API se alcanza en:

    https://smt.gob.ar/api/v1/...

**No se copio ni un archivo dentro del sitio.** El codigo sigue viviendo solo
en el vhost `datos.smt.gob.ar`; lo que se agrego es un reenvio de nginx en
`/var/www/vhosts/system/smt.gob.ar/conf/vhost_nginx.conf`:

```nginx
location /api/ {
    proxy_pass https://127.0.0.1:7081/;
    proxy_set_header Host datos.smt.gob.ar;
    proxy_ssl_server_name on;
    proxy_ssl_name datos.smt.gob.ar;
    proxy_ssl_verify off;
}
```

Las dos lineas de `proxy_ssl_*` no son decorativas: sin ellas nginx abre el TLS
hacia Apache anunciando `127.0.0.1` mientras manda `Host: datos.smt.gob.ar`, y
Apache rechaza esa discrepancia con un 400.

El sitio actual quedo intacto: `httpdocs` no tiene un solo archivo nuevo ni
modificado, y se verifico antes y despues que la portada, las categorias, las
notas, las areas y la galeria siguen respondiendo 200 con el mismo tamano.

**Para revertir:**

```bash
rm /var/www/vhosts/system/smt.gob.ar/conf/vhost_nginx.conf
plesk sbin httpdmng --reconfigure-domain smt.gob.ar
```

### Esto NO reemplaza al registro DNS

Es una solucion temporal para no quedar bloqueado. Ojo con la consecuencia: el
dia que `smt.gob.ar` apunte a Vercel, **este reenvio deja de funcionar igual que
las imagenes**, porque los dos dependen de que ese nombre resuelva al servidor
viejo. Antes de mover el dominio sigue haciendo falta un nombre propio para el
servidor (`cms.smt.gob.ar` o `datos.smt.gob.ar`), y cambiar dos lineas: la
clave `medios` de la configuracion y `API_BASE` en Vercel.

---

## Garantías de diseño

**No toca el sitio actual.** Vive en su propio vhost, creado con
`plesk bin subdomain --create`. `httpdocs` quedó byte por byte como estaba: no
se modificó, movió ni agregó ningún archivo ahí.

**No puede escribir.** Usa el usuario de base `smt_api_ro@localhost`, que tiene
`GRANT SELECT` y nada más. Verificado: un `CREATE TABLE` devuelve
`command denied`. Aunque hubiera un error de programación, no hay forma de que
modifique datos.

**No expone datos personales.** `tbl_emprendedor` guarda DNI, domicilio
particular, localidad y código postal de 1182 personas. Ninguna consulta usa
`SELECT *` sobre esa tabla: las columnas se listan explícitamente y esos cuatro
campos no salen por ningún endpoint. Hay una prueba automática que lo verifica.

**Solo acepta GET.** Cualquier otro método responde 405.

## Autenticación

Todos los recursos piden un token, salvo `/v1` (el índice) y `/salud`, que
quedan abiertos para poder comprobar que la API responde.

```
Authorization: Bearer <token>
```

El token se generó en el servidor y **no pasó nunca por el chat**. Para leerlo
cuando lo necesites en Vercel:

```bash
ssh smt-prod "grep \"'token'\" /var/www/vhosts/smt.gob.ar/datos-api-config/config.php"
```

## Endpoints

| Método y ruta | Devuelve |
|---|---|
| `GET /v1` | Índice de la API (abierto) |
| `GET /salud` | Estado y conexión a la base (abierto) |
| `GET /v1/categorias` | Las 14 categorías de trámites con su conteo de ítems |
| `GET /v1/categorias/{id}` | Categoría con sus ítems |
| `GET /v1/items/{id}/fichas` | Fichas de un ítem |
| `GET /v1/fichas/{id}` | Ficha de trámite completa (cuerpo HTML, imagen, archivo) |
| `GET /v1/notas` | Notas paginadas (`?pagina`, `?por_pagina`) |
| `GET /v1/notas/{slug}` | Nota por slug — resuelve las URLs sueltas del sitio |
| `GET /v1/areas` | Las 112 áreas de gobierno con autoridad y dependencias |
| `GET /v1/areas/{id}` | Área con autoridad, padre, dependencias y organigrama |
| `GET /v1/galerias` | Galerías con conteo de fotos |
| `GET /v1/galerias/{id}` | Fotos de una galería (imagen y miniatura) |
| `GET /v1/sliders` | Sliders de portada |
| `GET /v1/banners` | Banners |
| `GET /v1/emergencias` | Teléfonos de emergencia |
| `GET /v1/feria/ferias` | Ferias municipales |
| `GET /v1/feria/rubros` | Rubros |
| `GET /v1/feria/emprendimientos` | Catálogo (`?feria`, `?rubro`, `?q`, `?producto`, `?pagina`, `?solo_con_logo=1`) |
| `GET /v1/feria/emprendimientos/{id}` | Emprendimiento con rubros, contacto y productos |
| `GET /v1/buscar?q=` | Búsqueda sobre notas, fichas y áreas |

Las rutas de imagen vienen absolutas: la API convierte
`notas/April2024/x.jpg` en `https://smt.gob.ar/storage/notas/April2024/x.jpg`.
La base se configura en la clave `medios`.

## Decisiones tomadas leyendo el código de producción

**No se filtra por la columna `estado`.** Es una trampa: en las tablas `tbl_*`
casi todos los registros valen `0`, y el `FeriaController` de producción no la
filtra nunca. Filtrar por `estado = 1` dejaba el catálogo completamente vacío.
La API replica el comportamiento real y expone el valor para que el frontend
decida.

**`solo_con_logo=1` replica el catálogo actual.** El sitio de hoy hace
`whereHas('logo')`, así que solo muestra emprendimientos con imagen. El
parámetro lo reproduce; sin él, la API devuelve todos.

**Los productos salen de `galerias_productos`.** Esa tabla es la que une
emprendimiento, producto e imagen. `tbl_producto` es un catálogo por rubro, no
por emprendimiento.

## Pendiente para que funcione desde afuera

**1. El registro DNS.** `datos.smt.gob.ar` todavía no resuelve. El DNS de
`smt.gob.ar` lo manejan `ns1.cloudsector.net` y `ns2.cloudsector.net`, no este
Plesk, así que hay que pedirlo:

> Solicitar el alta de un registro A:
> `datos.smt.gob.ar.  A  199.217.119.207`

Ojo con el comodín: hoy existe `*.smt.gob.ar → 192.168.1.1`, una IP privada
que no sirve desde internet. El registro explícito tiene que tener prioridad
sobre él.

Una vez que resuelva, hay que emitir el certificado:

```bash
plesk bin extension --exec letsencrypt cli.php -d datos.smt.gob.ar
```

**2. Agregar el dominio de Vercel a CORS.** En `config.php`, la clave `cors`
hoy solo tiene `http://localhost:3000`.

**3. Decidir el hostname de los medios.** Las imágenes se sirven desde
`smt.gob.ar/storage/...`. El día que `smt.gob.ar` apunte a Vercel, **todas las
imágenes del sitio se rompen**, porque ese nombre ya no va a estar servido por
el servidor viejo. Antes de mover el DNS del dominio principal hay que:

- dar un hostname propio al vhost actual (por ejemplo `cms.smt.gob.ar`), que
  siga sirviendo `/storage` y el panel de Voyager en `/muni/rootadmin`;
- cambiar la clave `medios` de la configuración a ese hostname.

Es el paso que más fácil se pasa por alto y el que rompe el sitio entero.

## Cambios aplicados al servidor

**15/09/2026 — `index.php` decodifica los segmentos de la ruta.** Con
autorización expresa. Respaldo en `index.php.bak-antes-rawurldecode`.

La ruta se armaba desde `REQUEST_URI` sin decodificar, así que un slug con
caracteres percent-encoded no matcheaba nunca. Afectaba a la nota
`Registros _Transporte _Individual_Pasajeros` (44 vistas diarias), cuyo slug
tiene espacios.

```php
$segmentos = array_map(
    'rawurldecode',
    array_values(array_filter(explode('/', $ruta), static fn ($s) => $s !== ''))
);
```

La decodificación va **después** de partir por `/`: al revés, un `%2F`
codificado inventaría un segmento de ruta. Verificado que `..%2F..%2Fetc%2Fpasswd`
sigue devolviendo 404 y que ningún segmento llega al sistema de archivos.

Regresión: los 19 endpoints responden 200, sin token 401, con `POST` 403.
Detalle completo en `trafico-y-redirecciones.md`.

## Verificación hecha

Probado contra la base real, forzando la resolución del host porque el DNS
todavía no existe:

- Control de acceso: sin token responde 401; el índice y `/salud` abren bien.
- Los 18 recursos responden 200 con datos reales.
- Errores correctos: 404 en id inexistente, 400 en búsqueda corta, 405 en POST.
- Privacidad: `dni`, `domicilio`, `localidad` y `cpostal` ausentes en una
  respuesta de 60 emprendimientos.

## Calidad de datos observada

Cosas que vienen así del origen y que el frontend va a tener que tolerar:

- Hay emprendimientos con `nombre` vacío (por ejemplo el id 817).
- `tbl_ferias` tiene registros de prueba: una feria con domicilio `"PRUEBA"` y
  otra con `estado = 9`.
- Nombres y rubros vienen en mayúsculas y con espacios sobrantes
  (`"ACCESORIOS "`), conviene normalizar al mostrar.
- Los datos de la feria se reescriben enteros cada noche desde el servidor
  municipal: cualquier corrección hay que hacerla en el sistema de origen.
