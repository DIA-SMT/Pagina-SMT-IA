<?php

declare(strict_types=1);

/**
 * API de datos del portal SMT — utilidades comunes.
 *
 * Esta API es de SOLO LECTURA. El usuario de base tiene unicamente permiso
 * SELECT, asi que aunque hubiera un error de programacion no puede escribir.
 *
 * No vive dentro del sitio actual: corre en su propio vhost y no comparte
 * un solo archivo con httpdocs.
 */

const CONFIG_PATH = '/var/www/vhosts/smt.gob.ar/datos-api-config/config.php';

function cfg(): array
{
    static $cache = null;
    if ($cache === null) {
        if (!is_readable(CONFIG_PATH)) {
            responder_error(500, 'configuracion_ausente', 'No se pudo leer la configuracion.');
        }
        $cache = require CONFIG_PATH;
    }
    return $cache;
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $d = cfg()['db'];
        try {
            $pdo = new PDO(
                "mysql:host={$d['host']};port={$d['puerto']};dbname={$d['base']};charset=utf8mb4",
                $d['usuario'],
                $d['clave'],
                [
                    PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
                    PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
                    PDO::ATTR_EMULATE_PREPARES   => false,
                ]
            );
        } catch (PDOException $e) {
            // Nunca se devuelve el mensaje de PDO: filtraria host, usuario y esquema.
            error_log('API datos — fallo de conexion: ' . $e->getMessage());
            responder_error(503, 'base_no_disponible', 'La base de datos no esta disponible.');
        }
    }
    return $pdo;
}

/** Ejecuta una consulta preparada y devuelve todas las filas. */
function consultar(string $sql, array $params = []): array
{
    try {
        $st = db()->prepare($sql);
        $st->execute($params);
        return $st->fetchAll();
    } catch (PDOException $e) {
        error_log('API datos — fallo de consulta: ' . $e->getMessage());
        responder_error(500, 'consulta_fallida', 'No se pudo completar la consulta.');
    }
}

function consultar_una(string $sql, array $params = []): ?array
{
    $filas = consultar($sql, $params);
    return $filas[0] ?? null;
}

/**
 * Convierte una ruta guardada en la base ('notas/April2024/x.jpg') en una URL
 * absoluta hacia el servidor que sirve los medios.
 */
function medio(?string $ruta): ?string
{
    if ($ruta === null || trim($ruta) === '') {
        return null;
    }
    $ruta = trim($ruta);
    // Si ya viene absoluta (algunos registros guardan URLs completas), se respeta.
    if (preg_match('#^https?://#i', $ruta)) {
        return $ruta;
    }
    return rtrim(cfg()['medios'], '/') . '/' . ltrim($ruta, '/');
}

/**
 * Voyager guarda los campos de ARCHIVO distinto que los de imagen: en vez de
 * una ruta suelta, guarda un JSON con forma
 *     [{"download_link":"notas\/March2025\/x.pdf","original_name":"Plan.pdf"}]
 * y, cuando esta vacio, el string literal "[]".
 *
 * Devuelve una lista de ['url' => ..., 'nombre' => ..., 'extension' => ...],
 * o un arreglo vacio si no hay archivo. El nombre original sirve para
 * etiquetar la descarga en la interfaz.
 */
function archivos(?string $crudo): array
{
    if ($crudo === null) {
        return [];
    }
    $crudo = trim($crudo);
    if ($crudo === '' || $crudo === '[]' || $crudo === 'null') {
        return [];
    }

    $lista = json_decode($crudo, true);

    // Algunos registros guardan una ruta suelta en vez del JSON.
    if (!is_array($lista)) {
        $url = medio($crudo);
        return $url === null ? [] : [[
            'url'       => $url,
            'nombre'    => basename($crudo),
            'extension' => strtolower(pathinfo($crudo, PATHINFO_EXTENSION)),
        ]];
    }

    $salida = [];
    foreach ($lista as $item) {
        $ruta = is_array($item) ? ($item['download_link'] ?? null) : (is_string($item) ? $item : null);
        if (!is_string($ruta) || trim($ruta) === '') {
            continue;
        }
        $url = medio($ruta);
        if ($url === null) {
            continue;
        }
        $nombre = (is_array($item) ? ($item['original_name'] ?? null) : null) ?: basename($ruta);
        $salida[] = [
            'url'       => $url,
            'nombre'    => $nombre,
            'extension' => strtolower(pathinfo($ruta, PATHINFO_EXTENSION)),
        ];
    }

    return $salida;
}

/** Normaliza texto para buscar sin distinguir tildes ni mayusculas. */
function normalizar(string $texto): string
{
    $texto = mb_strtolower($texto, 'UTF-8');
    return strtr($texto, [
        'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u',
        'ü' => 'u', 'ñ' => 'n',
    ]);
}

function entero(string $clave, int $defecto, int $min, int $max): int
{
    $v = filter_input(INPUT_GET, $clave, FILTER_VALIDATE_INT);
    if ($v === false || $v === null) {
        return $defecto;
    }
    return max($min, min($max, $v));
}

function texto_get(string $clave, int $maxLargo = 120): string
{
    $v = $_GET[$clave] ?? '';
    if (!is_string($v)) {
        return '';
    }
    return mb_substr(trim($v), 0, $maxLargo);
}

/* ------------------------------------------------------------------ */
/* Salida                                                              */
/* ------------------------------------------------------------------ */

function cabeceras_base(): void
{
    header('Content-Type: application/json; charset=utf-8');
    header('X-Content-Type-Options: nosniff');
    // Los datos cambian poco: se permite cachear en el borde. Next.js usa esto
    // ademas de su propio ISR.
    header('Cache-Control: public, max-age=60, s-maxage=300, stale-while-revalidate=600');
}

function responder(array $datos, int $codigo = 200): never
{
    http_response_code($codigo);
    cabeceras_base();
    echo json_encode(
        $datos,
        JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_PRETTY_PRINT
    );
    exit;
}

function responder_error(int $codigo, string $clave, string $mensaje): never
{
    http_response_code($codigo);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode(
        ['error' => ['codigo' => $clave, 'mensaje' => $mensaje]],
        JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT
    );
    exit;
}

/** Envuelve un listado con metadatos de paginacion. */
function paginar(array $filas, int $total, int $pagina, int $porPagina): array
{
    return [
        'datos' => $filas,
        'paginacion' => [
            'pagina'      => $pagina,
            'por_pagina'  => $porPagina,
            'total'       => $total,
            'paginas'     => (int) ceil($total / max(1, $porPagina)),
        ],
    ];
}
