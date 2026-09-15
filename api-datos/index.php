<?php

declare(strict_types=1);

/**
 * API de datos del portal de la Municipalidad de San Miguel de Tucuman.
 *
 * Expone en JSON el contenido que hoy administra Voyager, para que el
 * frontend nuevo (Next.js en Vercel) lo consuma sin tocar el sitio actual.
 *
 * - Es de SOLO LECTURA: el usuario de base tiene unicamente permiso SELECT.
 * - Vive en su propio vhost: no comparte un solo archivo con httpdocs.
 * - No expone datos personales: ver la nota de privacidad en recursos.php.
 */

require __DIR__ . '/lib.php';
require __DIR__ . '/recursos.php';

/* ---- CORS ---------------------------------------------------------- */

$origen = $_SERVER['HTTP_ORIGIN'] ?? '';
$permitidos = cfg()['cors'] ?? [];

if ($origen !== '' && in_array($origen, $permitidos, true)) {
    header('Access-Control-Allow-Origin: ' . $origen);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Authorization, Content-Type');
    header('Access-Control-Allow-Methods: GET, OPTIONS');
    header('Access-Control-Max-Age: 86400');
}

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') === 'OPTIONS') {
    http_response_code(204);
    exit;
}

/* ---- Solo lectura -------------------------------------------------- */

if (($_SERVER['REQUEST_METHOD'] ?? 'GET') !== 'GET') {
    header('Allow: GET, OPTIONS');
    responder_error(405, 'metodo_no_permitido', 'Esta API es de solo lectura: unicamente acepta GET.');
}

/* ---- Autenticacion por token --------------------------------------- */

function token_presentado(): string
{
    $cab = $_SERVER['HTTP_AUTHORIZATION'] ?? '';
    if ($cab === '' && function_exists('apache_request_headers')) {
        $h = apache_request_headers();
        $cab = $h['Authorization'] ?? $h['authorization'] ?? '';
    }
    if (preg_match('/^Bearer\s+(.+)$/i', trim((string) $cab), $m)) {
        return trim($m[1]);
    }
    return '';
}

$esperado = (string) (cfg()['token'] ?? '');
$ruta = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?? '/';
$ruta = '/' . trim($ruta, '/');

// El indice queda abierto para poder comprobar que la API responde.
$rutaPublica = ($ruta === '/' || $ruta === '/v1' || $ruta === '/salud');

if (!$rutaPublica) {
    // hash_equals evita filtrar informacion por el tiempo de comparacion.
    if ($esperado === '' || !hash_equals($esperado, token_presentado())) {
        responder_error(401, 'no_autorizado', 'Falta el encabezado Authorization: Bearer <token>.');
    }
}

/* ---- Enrutado ------------------------------------------------------ */

$segmentos = array_values(array_filter(explode('/', $ruta), static fn ($s) => $s !== ''));

// Se acepta con y sin el prefijo /v1 para que sea comodo de probar.
if (($segmentos[0] ?? '') === 'v1') {
    array_shift($segmentos);
}

$recurso = $segmentos[0] ?? '';
$arg     = $segmentos[1] ?? null;
$sub     = $segmentos[2] ?? null;

switch ($recurso) {
    case '':
        responder([
            'api'     => 'Datos del portal de San Miguel de Tucuman',
            'version' => '1.0',
            'lectura' => true,
            'auth'    => 'Authorization: Bearer <token> en todos los recursos',
            'recursos' => [
                'GET /v1/categorias'                  => 'Categorias de tramites y servicios',
                'GET /v1/categorias/{id}'             => 'Categoria con sus items',
                'GET /v1/items/{id}/fichas'           => 'Fichas de un item',
                'GET /v1/fichas/{id}'                 => 'Ficha de tramite completa',
                'GET /v1/notas'                       => 'Notas paginadas (?pagina&por_pagina)',
                'GET /v1/notas/{slug}'                => 'Nota por slug',
                'GET /v1/areas'                       => 'Todas las areas de gobierno',
                'GET /v1/areas/{id}'                  => 'Area con autoridad y dependencias',
                'GET /v1/galerias'                    => 'Galerias de imagenes',
                'GET /v1/galerias/{id}'               => 'Fotos de una galeria',
                'GET /v1/sliders'                     => 'Sliders de portada',
                'GET /v1/banners'                     => 'Banners',
                'GET /v1/emergencias'                 => 'Telefonos de emergencia',
                'GET /v1/feria/ferias'                => 'Ferias municipales',
                'GET /v1/feria/rubros'                => 'Rubros',
                'GET /v1/feria/emprendimientos'       => 'Catalogo (?feria&rubro&q&producto&pagina)',
                'GET /v1/feria/emprendimientos/{id}'  => 'Emprendimiento con productos',
                'GET /v1/buscar?q='                   => 'Busqueda en contenidos publicos',
            ],
        ]);
        // no alcanzable

    case 'salud':
        $ok = consultar_una('SELECT 1 AS ok');
        responder(['estado' => $ok ? 'ok' : 'sin_base', 'hora' => date('c')]);

    case 'categorias':
        responder($arg === null ? recurso_categorias() : recurso_categoria((int) $arg));

    case 'items':
        if ($arg !== null && $sub === 'fichas') {
            responder(recurso_fichas_de_item((int) $arg));
        }
        responder_error(404, 'no_encontrado', 'Ruta no reconocida.');

    case 'fichas':
        if ($arg === null) {
            responder_error(400, 'falta_id', 'Indica el id de la ficha.');
        }
        responder(recurso_ficha((int) $arg));

    case 'notas':
        responder($arg === null ? recurso_notas() : recurso_nota((string) $arg));

    case 'areas':
        responder($arg === null ? recurso_areas() : recurso_area((int) $arg));

    case 'galerias':
        responder($arg === null ? recurso_galerias() : recurso_galeria((int) $arg));

    case 'sliders':
        responder(recurso_sliders());

    case 'banners':
        responder(recurso_banners());

    case 'emergencias':
        responder(recurso_emergencias());

    case 'feria':
        switch ($arg) {
            case 'ferias':
                responder(recurso_ferias());
            case 'rubros':
                responder(recurso_rubros());
            case 'emprendimientos':
                responder($sub === null
                    ? recurso_emprendimientos()
                    : recurso_emprendimiento((int) $sub));
            default:
                responder_error(404, 'no_encontrado', 'Ruta no reconocida dentro de /feria.');
        }

    case 'buscar':
        responder(recurso_buscar());

    default:
        responder_error(404, 'no_encontrado', 'Ese recurso no existe. Consulta el indice en /v1.');
}
