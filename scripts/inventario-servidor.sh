#!/usr/bin/env bash
#
# Inventario del portal smt.gob.ar — RELEVAMIENTO DE SOLO LECTURA
# =============================================================================
# Qué hace: recolecta lo necesario para conectar el rediseño al sistema real
# (versiones, rutas, vistas, controladores, esquema de la base, configuración).
#
# Qué NO hace: no escribe, no modifica, no borra y no reinicia NADA en el
# servidor. No copia contenido de la base: solo el ESQUEMA y los conteos.
# Los valores del .env se redactan — se listan las claves, nunca los secretos.
#
# Uso, parado en el servidor:
#     bash inventario-servidor.sh /ruta/al/proyecto/laravel
#
# Si no pasás la ruta, intenta detectarla sola buscando el archivo 'artisan'.
# Resultado: un directorio ./inventario-smt-FECHA y su .tar.gz
# =============================================================================

set -uo pipefail

RAIZ="${1:-}"
SALIDA="$PWD/inventario-smt-$(date +%Y%m%d-%H%M)"
mkdir -p "$SALIDA"

log() { printf '\n>>> %s\n' "$*"; }

# --- 1. Sistema -------------------------------------------------------------
log "1/9 Sistema operativo y runtimes"
{
  echo "== hostname =="; hostname
  echo; echo "== SO =="; cat /etc/os-release 2>/dev/null || uname -a
  echo; echo "== kernel =="; uname -a
  echo; echo "== PHP CLI =="; php -v
  echo; echo "== modulos PHP =="; php -m
  echo; echo "== PHP disponibles (Plesk / distro) =="
  ls -1 /opt/plesk/php/ 2>/dev/null
  ls -1 /etc/php/ 2>/dev/null
  echo; echo "== nginx =="; nginx -v
  echo; echo "== Apache =="; apache2 -v 2>/dev/null || httpd -v 2>/dev/null
  echo; echo "== MySQL / MariaDB =="; mysql --version
  echo; echo "== composer =="; composer --version
  echo; echo "== git =="; git --version
  echo; echo "== disco =="; df -h
} > "$SALIDA/01-sistema.txt" 2>&1

# --- 2. Ubicación del proyecto ---------------------------------------------
log "2/9 Buscando la raiz del proyecto Laravel"
if [ -z "$RAIZ" ]; then
  RAIZ=$(find /var/www /home /srv -maxdepth 6 -name artisan -type f 2>/dev/null | head -1 | xargs -r dirname)
fi
if [ -z "$RAIZ" ] || [ ! -f "$RAIZ/artisan" ]; then
  {
    echo "ERROR: no encontre la raiz del proyecto (el archivo 'artisan')."
    echo "Volve a correr pasando la ruta:  bash $0 /ruta/al/proyecto"
  } | tee "$SALIDA/02-raiz.txt"
  exit 1
fi
echo "Raiz del proyecto: $RAIZ" | tee "$SALIDA/02-raiz.txt"
{
  echo
  echo "== listado de la raiz =="; ls -la "$RAIZ"
  echo; echo "== control de versiones =="
  if [ -d "$RAIZ/.git" ]; then
    echo "-- ultimos commits --"; git -C "$RAIZ" log --oneline -15
    echo; echo "-- cambios sin commitear --"; git -C "$RAIZ" status --short
    echo; echo "-- remotos --"; git -C "$RAIZ" remote -v
    echo; echo "-- rama actual --"; git -C "$RAIZ" branch --show-current
  else
    echo "NO es repositorio git."
    echo "Los cambios se publican de otra forma (FTP / Plesk / rsync): confirmar cual."
  fi
} >> "$SALIDA/02-raiz.txt" 2>&1

# --- 3. Versiones de framework y paquetes ----------------------------------
log "3/9 Laravel, Voyager y dependencias"
cp "$RAIZ/composer.json" "$SALIDA/03-composer.json" 2>/dev/null
{
  echo "== artisan --version =="
  (cd "$RAIZ" && php artisan --version)
  echo
  echo "== paquetes instalados (nombre + version, de composer.lock) =="
  grep -oE '"name": "[^"]+"|"version": "[^"]+"' "$RAIZ/composer.lock" 2>/dev/null | paste - - | head -120
} > "$SALIDA/03-versiones.txt" 2>&1

# --- 4. Rutas, vistas y controladores actuales ------------------------------
log "4/9 Rutas registradas, plantillas y controladores"
(cd "$RAIZ" && php artisan route:list --json) > "$SALIDA/04-rutas.json" 2>"$SALIDA/04-rutas-error.txt"
(cd "$RAIZ" && php artisan route:list) > "$SALIDA/04-rutas.txt" 2>&1
find "$RAIZ/resources/views" -name '*.blade.php' -printf '%s\t%p\n' 2>/dev/null | sort -k2 > "$SALIDA/04-vistas.txt"
cp "$RAIZ/routes/web.php" "$SALIDA/04-web.php.txt" 2>/dev/null

# Controladores y modelos: son el mapa real de datos -> vista.
mkdir -p "$SALIDA/codigo"
cp -r "$RAIZ/app/Http/Controllers" "$SALIDA/codigo/Controllers" 2>/dev/null
cp -r "$RAIZ/app/Models" "$SALIDA/codigo/Models" 2>/dev/null
find "$RAIZ/app" -maxdepth 1 -name '*.php' -exec cp {} "$SALIDA/codigo/" \; 2>/dev/null

# --- 5. Configuración, con el .env REDACTADO -------------------------------
log "5/9 Configuracion (.env redactado: solo nombres de variable)"
if [ -f "$RAIZ/.env" ]; then
  grep -oE '^[A-Z_0-9]+=' "$RAIZ/.env" | tr -d '=' | sort > "$SALIDA/05-env-CLAVES-SIN-VALORES.txt"
  echo "--- $(wc -l < "$SALIDA/05-env-CLAVES-SIN-VALORES.txt") variables. Los VALORES no se copiaron a proposito. ---" \
    >> "$SALIDA/05-env-CLAVES-SIN-VALORES.txt"
fi
mkdir -p "$SALIDA/config"
cp "$RAIZ"/config/*.php "$SALIDA/config/" 2>/dev/null
grep -rlE "password|secret|token" "$SALIDA/config/" 2>/dev/null > "$SALIDA/05-config-revisar-a-mano.txt"

# --- 6. Esquema de la base, sin contenido ----------------------------------
log "6/9 Esquema de la base (estructura y conteos, sin datos)"

# Lee una variable del .env sin exponerla en la salida.
envget() {
  local v
  v=$(grep -E "^$1=" "$RAIZ/.env" 2>/dev/null | head -1 | cut -d= -f2-)
  v=${v%$'\r'}          # quita retorno de carro de Windows
  v=${v%\"}; v=${v#\"}  # quita comillas dobles
  v=${v%\'}; v=${v#\'}  # quita comillas simples
  printf '%s' "$v"
}

DB_HOST=$(envget DB_HOST)
DB_PORT=$(envget DB_PORT)
DB_NAME=$(envget DB_DATABASE)
DB_USER=$(envget DB_USERNAME)
DB_PASS=$(envget DB_PASSWORD)

if [ -n "$DB_NAME" ]; then
  # Las credenciales van en un archivo temporal con permisos 600, nunca en la
  # linea de comandos: en la linea de comandos serian visibles con 'ps'.
  CNF=$(mktemp)
  chmod 600 "$CNF"
  trap 'rm -f "$CNF"' EXIT
  {
    echo "[client]"
    echo "host=${DB_HOST:-127.0.0.1}"
    echo "port=${DB_PORT:-3306}"
    echo "user=$DB_USER"
    echo "password=$DB_PASS"
  } > "$CNF"

  # Estructura completa, sin una sola fila de contenido.
  mysqldump --defaults-extra-file="$CNF" --no-data --skip-comments "$DB_NAME" \
    > "$SALIDA/06-esquema.sql" 2>"$SALIDA/06-esquema-error.txt"

  # Volumen por tabla, para dimensionar sin exponer contenido.
  mysql --defaults-extra-file="$CNF" -e \
    "SELECT TABLE_NAME AS tabla, TABLE_ROWS AS filas_aprox
     FROM information_schema.TABLES
     WHERE TABLE_SCHEMA='$DB_NAME'
     ORDER BY TABLE_ROWS DESC;" > "$SALIDA/06-conteo-filas.txt" 2>&1

  # Metadatos del CMS Voyager: que entidades administra y con que campos.
  # Es configuracion del panel, no contenido publicado ni datos personales.
  for t in data_types data_rows menus menu_items settings; do
    mysql --defaults-extra-file="$CNF" -e "SELECT * FROM \`$t\`\\G" "$DB_NAME" \
      > "$SALIDA/06-voyager-$t.txt" 2>&1
  done

  rm -f "$CNF"
  trap - EXIT
else
  echo "No pude leer DB_DATABASE del .env. Esta parte hay que correrla a mano." \
    > "$SALIDA/06-esquema-error.txt"
fi

# --- 7. Servidor web y caché ------------------------------------------------
log "7/9 nginx / Plesk / cache"
{
  echo "== vhosts =="
  ls -la /etc/nginx/conf.d/ /etc/nginx/sites-enabled/ 2>/dev/null
  ls -la /var/www/vhosts/system/*/conf/ 2>/dev/null | head -40
  echo
  echo "== hay cache de pagina configurada? =="
  grep -rEn "proxy_cache|fastcgi_cache|expires" /etc/nginx/ /var/www/vhosts/system/*/conf/ 2>/dev/null | head -40
  echo
  echo "== cache compilada de Laravel =="
  ls -la "$RAIZ/bootstrap/cache/" 2>/dev/null
} > "$SALIDA/07-servidor-web.txt" 2>&1

# --- 8. Medios subidos desde el CMS ----------------------------------------
log "8/9 Medios de /storage"
{
  echo "== tamano total =="
  du -sh "$RAIZ/storage/app/public" 2>/dev/null
  du -sh "$RAIZ/public/storage" 2>/dev/null
  echo
  echo "== por carpeta (una por tabla del media manager de Voyager) =="
  du -sh "$RAIZ/storage/app/public"/* 2>/dev/null | sort -h
  echo
  echo "== archivos por extension =="
  find "$RAIZ/storage/app/public" -type f 2>/dev/null | sed 's/.*\.//' | sort | uniq -c | sort -rn | head -20
  echo
  echo "== los 20 mas pesados (candidatos a optimizar) =="
  find "$RAIZ/storage/app/public" -type f -printf '%s\t%p\n' 2>/dev/null | sort -rn | head -20
} > "$SALIDA/08-storage.txt" 2>&1

# --- 9. Empaquetado ---------------------------------------------------------
log "9/9 Empaquetando"
{
  echo "Inventario generado: $(date)"
  echo "Servidor: $(hostname)"
  echo "Raiz del proyecto: $RAIZ"
  echo
  echo "Este paquete NO contiene contrasenas del .env ni contenido de la base."
  echo "Aun asi, revisa config/ y 05-config-revisar-a-mano.txt antes de"
  echo "compartirlo fuera del municipio."
} > "$SALIDA/00-LEEME.txt"

tar -czf "$SALIDA.tar.gz" -C "$(dirname "$SALIDA")" "$(basename "$SALIDA")" 2>/dev/null

echo
echo "============================================================"
echo " LISTO"
echo " Carpeta:  $SALIDA"
echo " Paquete:  $SALIDA.tar.gz"
echo
echo " Revisalo antes de moverlo. Para bajarlo a tu maquina:"
echo "   scp smt-prod:$SALIDA.tar.gz ."
echo "============================================================"
