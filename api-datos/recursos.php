<?php

declare(strict_types=1);

/**
 * API de datos del portal SMT — implementacion de los recursos.
 *
 * REGLA DE PRIVACIDAD: las consultas listan columnas de forma explicita.
 * Nunca se usa SELECT *. En particular, tbl_emprendedor contiene DNI,
 * domicilio particular, localidad y codigo postal de personas reales:
 * esos campos NO se exponen por ninguna via. Solo salen los datos de
 * contacto que el propio emprendedor publica en su ficha del sitio.
 */

/* ------------------------------------------------------------------ */
/* Tramites y servicios                                                */
/* ------------------------------------------------------------------ */

function recurso_categorias(): array
{
    $filas = consultar(
        'SELECT ts.id, ts.title AS titulo, ts.texto, ts.icon AS icono, ts.orden,
                (SELECT COUNT(*) FROM tramites_servicios_items i WHERE i.tramite_id = ts.id) AS items
         FROM tramites_servicios ts
         ORDER BY COALESCE(ts.orden, 9999), ts.id'
    );

    return array_map(static fn (array $f): array => [
        'id'     => (int) $f['id'],
        'titulo' => $f['titulo'],
        'texto'  => $f['texto'],
        'icono'  => $f['icono'],
        'orden'  => $f['orden'] === null ? null : (int) $f['orden'],
        'items'  => (int) $f['items'],
        'slug'   => slugificar($f['titulo']),
    ], $filas);
}

function recurso_categoria(int $id): array
{
    $cat = consultar_una(
        'SELECT id, title AS titulo, texto, icon AS icono, orden
         FROM tramites_servicios WHERE id = :id',
        ['id' => $id]
    );
    if (!$cat) {
        responder_error(404, 'no_encontrado', 'No existe esa categoria.');
    }

    $items = consultar(
        'SELECT id, title AS titulo, texto, icon AS icono, link, `order` AS orden
         FROM tramites_servicios_items
         WHERE tramite_id = :id
         ORDER BY COALESCE(`order`, 9999), id',
        ['id' => $id]
    );

    return [
        'id'     => (int) $cat['id'],
        'titulo' => $cat['titulo'],
        'texto'  => $cat['texto'],
        'icono'  => $cat['icono'],
        'slug'   => slugificar($cat['titulo']),
        'items'  => array_map(static function (array $i): array {
            // 'link' no vacio => el item sale a una URL propia (externa o ruta
            // suelta del sitio). Si esta vacio, el destino es su ficha.
            return [
                'id'      => (int) $i['id'],
                'titulo'  => $i['titulo'],
                'texto'   => $i['texto'],
                'icono'   => $i['icono'],
                'enlace'  => $i['link'] !== null && trim($i['link']) !== '' ? trim($i['link']) : null,
                'orden'   => $i['orden'] === null ? null : (int) $i['orden'],
            ];
        }, $items),
    ];
}

function recurso_ficha(int $id): array
{
    $f = consultar_una(
        'SELECT id, tramite_id, item_id, title AS titulo, image AS imagen,
                excerpt AS bajada, body AS cuerpo, file AS archivo, updated_at
         FROM tramites_items_notas WHERE id = :id',
        ['id' => $id]
    );
    if (!$f) {
        responder_error(404, 'no_encontrado', 'No existe esa ficha.');
    }

    return [
        'id'         => (int) $f['id'],
        'categoria'  => (int) $f['tramite_id'],
        'item'       => (int) $f['item_id'],
        'titulo'     => $f['titulo'],
        'bajada'     => $f['bajada'],
        'cuerpo'     => $f['cuerpo'],          // HTML administrado desde el CMS
        'imagen'     => medio($f['imagen']),
        'archivos'    => archivos($f['archivo']),
        'actualizado'=> $f['updated_at'],
    ];
}

function recurso_fichas_de_item(int $itemId): array
{
    $filas = consultar(
        'SELECT id, title AS titulo, excerpt AS bajada, image AS imagen, file AS archivo
         FROM tramites_items_notas WHERE item_id = :id ORDER BY id',
        ['id' => $itemId]
    );

    return array_map(static fn (array $f): array => [
        'id'      => (int) $f['id'],
        'titulo'  => $f['titulo'],
        'bajada'  => $f['bajada'],
        'imagen'  => medio($f['imagen']),
        'archivos' => archivos($f['archivo']),
    ], $filas);
}

/* ------------------------------------------------------------------ */
/* Notas (paginas sueltas: historia, SUBEM, memorial, etc.)            */
/* ------------------------------------------------------------------ */

function recurso_notas(): array
{
    $pagina    = entero('pagina', 1, 1, 10000);
    $porPagina = entero('por_pagina', 20, 1, 100);
    $offset    = ($pagina - 1) * $porPagina;

    $total = (int) (consultar_una('SELECT COUNT(*) AS n FROM notas')['n'] ?? 0);

    // LIMIT/OFFSET interpolados a proposito (ver nota en recurso_emprendimientos).
    $filas = consultar(
        "SELECT id, titulo, bajada, imagen, slug, status, updated_at
         FROM notas ORDER BY id DESC LIMIT $porPagina OFFSET $offset"
    );

    $datos = array_map(static fn (array $n): array => [
        'id'          => (int) $n['id'],
        'titulo'      => $n['titulo'],
        'bajada'      => $n['bajada'],
        'slug'        => $n['slug'],
        'estado'      => $n['status'],
        'imagen'      => medio($n['imagen']),
        'actualizado' => $n['updated_at'],
    ], $filas);

    return paginar($datos, $total, $pagina, $porPagina);
}

function recurso_nota(string $slug): array
{
    $n = consultar_una(
        'SELECT id, titulo, bajada, texto, imagen, file AS archivo, slug, status, updated_at
         FROM notas WHERE slug = :slug LIMIT 1',
        ['slug' => $slug]
    );
    if (!$n) {
        responder_error(404, 'no_encontrado', 'No existe esa nota.');
    }

    return [
        'id'          => (int) $n['id'],
        'titulo'      => $n['titulo'],
        'bajada'      => $n['bajada'],
        'texto'       => $n['texto'],          // HTML administrado desde el CMS
        'slug'        => $n['slug'],
        'estado'      => $n['status'],
        'imagen'      => medio($n['imagen']),
        'archivos'     => archivos($n['archivo']),
        'actualizado' => $n['updated_at'],
    ];
}

/* ------------------------------------------------------------------ */
/* Gobierno: areas y autoridades                                       */
/* ------------------------------------------------------------------ */

function recurso_areas(): array
{
    // Una consulta trae las 112 areas con su autoridad; la jerarquia se arma
    // en memoria con la tabla pivote. Evita el N+1 del sistema actual.
    $areas = consultar(
        'SELECT a.id, a.area AS nombre,
                ad.nombre AS autoridad, ad.foto, ad.domicilio, ad.telefono,
                ad.email, ad.archivo AS organigrama, ad.descripcion
         FROM areas_gobiernos a
         LEFT JOIN administraciones ad ON ad.area_id = a.id
         ORDER BY a.id'
    );

    $pivote = consultar(
        'SELECT area_id, related_id, orden FROM administraciones_pivote
         ORDER BY area_id, COALESCE(orden, 9999), id'
    );

    $hijas = [];
    foreach ($pivote as $p) {
        $hijas[(int) $p['area_id']][] = (int) $p['related_id'];
    }

    return array_map(static function (array $a) use ($hijas): array {
        $id = (int) $a['id'];
        return [
            'id'           => $id,
            'nombre'       => $a['nombre'],
            'autoridad'    => $a['autoridad'],
            'foto'         => medio($a['foto']),
            'domicilio'    => $a['domicilio'],
            'telefono'     => $a['telefono'],
            'email'        => $a['email'],
            'descripcion'  => $a['descripcion'],
            'organigrama'  => archivos($a['organigrama'])[0]['url'] ?? null,
            'dependencias' => $hijas[$id] ?? [],
            'slug'         => slugificar((string) $a['nombre']),
        ];
    }, $areas);
}

function recurso_area(int $id): array
{
    $a = consultar_una(
        'SELECT a.id, a.area AS nombre,
                ad.nombre AS autoridad, ad.foto, ad.domicilio, ad.telefono,
                ad.email, ad.archivo AS organigrama, ad.descripcion
         FROM areas_gobiernos a
         LEFT JOIN administraciones ad ON ad.area_id = a.id
         WHERE a.id = :id',
        ['id' => $id]
    );
    if (!$a) {
        responder_error(404, 'no_encontrado', 'No existe esa area.');
    }

    $hijas = consultar(
        'SELECT g.id, g.area AS nombre, ad.nombre AS autoridad, ad.email, p.orden
         FROM administraciones_pivote p
         JOIN areas_gobiernos g ON g.id = p.related_id
         LEFT JOIN administraciones ad ON ad.area_id = g.id
         WHERE p.area_id = :id
         ORDER BY COALESCE(p.orden, 9999), p.id',
        ['id' => $id]
    );

    $padre = consultar_una(
        'SELECT g.id, g.area AS nombre
         FROM administraciones_pivote p
         JOIN areas_gobiernos g ON g.id = p.area_id
         WHERE p.related_id = :id LIMIT 1',
        ['id' => $id]
    );

    return [
        'id'          => (int) $a['id'],
        'nombre'      => $a['nombre'],
        'slug'        => slugificar((string) $a['nombre']),
        'autoridad'   => $a['autoridad'],
        'foto'        => medio($a['foto']),
        'domicilio'   => $a['domicilio'],
        'telefono'    => $a['telefono'],
        'email'       => $a['email'],
        'descripcion' => $a['descripcion'],
        'organigrama' => archivos($a['organigrama'])[0]['url'] ?? null,
        'padre'       => $padre ? ['id' => (int) $padre['id'], 'nombre' => $padre['nombre'], 'slug' => slugificar((string) $padre['nombre'])] : null,
        'dependencias'=> array_map(static fn (array $h): array => [
            'id'        => (int) $h['id'],
            'nombre'    => $h['nombre'],
            'slug'      => slugificar((string) $h['nombre']),
            'autoridad' => $h['autoridad'],
            'email'     => $h['email'],
        ], $hijas),
    ];
}

/* ------------------------------------------------------------------ */
/* Galeria                                                             */
/* ------------------------------------------------------------------ */

function recurso_galerias(): array
{
    $filas = consultar(
        'SELECT g.id, g.name AS nombre,
                (SELECT COUNT(*) FROM galerias_fotos f WHERE f.galeria_id = g.id) AS fotos
         FROM galerias g ORDER BY g.id'
    );

    return array_map(static fn (array $g): array => [
        'id'     => (int) $g['id'],
        'nombre' => $g['nombre'],
        'slug'   => slugificar((string) $g['nombre']),
        'fotos'  => (int) $g['fotos'],
    ], $filas);
}

function recurso_galeria(int $id): array
{
    $g = consultar_una('SELECT id, name AS nombre FROM galerias WHERE id = :id', ['id' => $id]);
    if (!$g) {
        responder_error(404, 'no_encontrado', 'No existe esa galeria.');
    }

    $fotos = consultar(
        'SELECT id, foto, descripcion FROM galerias_fotos WHERE galeria_id = :id ORDER BY id',
        ['id' => $id]
    );

    return [
        'id'     => (int) $g['id'],
        'nombre' => $g['nombre'],
        'slug'   => slugificar((string) $g['nombre']),
        'fotos'  => array_map(static function (array $f): array {
            $ruta = (string) $f['foto'];
            // El sitio guarda la version recortada agregando '-cropped' antes
            // de la extension; se ofrecen las dos para que el front elija.
            $mini = preg_replace('/(\.[A-Za-z]+)$/', '-cropped$1', $ruta);
            return [
                'id'          => (int) $f['id'],
                'descripcion' => $f['descripcion'],
                'imagen'      => medio($ruta),
                'miniatura'   => medio($mini),
            ];
        }, $fotos),
    ];
}

/* ------------------------------------------------------------------ */
/* Portada: sliders, banners, telefonos                                */
/* ------------------------------------------------------------------ */

function recurso_sliders(): array
{
    $filas = consultar('SELECT * FROM sliders ORDER BY id');
    return array_map(static function (array $s): array {
        $salida = ['id' => (int) $s['id']];
        foreach ($s as $col => $val) {
            if ($col === 'id') {
                continue;
            }
            // Las columnas que guardan rutas de archivo se absolutizan.
            $salida[$col] = (is_string($val) && preg_match('#^[\w-]+/[A-Za-z]+\d{4}/#', $val))
                ? medio($val)
                : $val;
        }
        return $salida;
    }, $filas);
}

function recurso_banners(): array
{
    $filas = consultar('SELECT * FROM banners ORDER BY id');
    return array_map(static function (array $b): array {
        $salida = ['id' => (int) $b['id']];
        foreach ($b as $col => $val) {
            if ($col === 'id') {
                continue;
            }
            $salida[$col] = (is_string($val) && preg_match('#^[\w-]+/[A-Za-z]+\d{4}/#', $val))
                ? medio($val)
                : $val;
        }
        return $salida;
    }, $filas);
}

function recurso_emergencias(): array
{
    $filas = consultar('SELECT id, name, phone FROM emergency_phones ORDER BY id');
    return array_map(static fn (array $e): array => [
        'id'     => (int) $e['id'],
        'nombre' => $e['name'],
        'numero' => (string) $e['phone'],
    ], $filas);
}

/* ------------------------------------------------------------------ */
/* Mi Feria Digital                                                    */
/* ------------------------------------------------------------------ */

/*
 * NOTA sobre la columna 'estado' de las tablas tbl_*: NO es un indicador de
 * publicacion. El sistema actual (FeriaController) no la filtra nunca, y en
 * la base casi todos los registros valen 0. Filtrar por estado = 1 dejaba el
 * catalogo vacio. Se replica el comportamiento de produccion: no se filtra,
 * y se expone el valor para que el frontend decida si algun dia hace falta.
 */

function recurso_ferias(): array
{
    $filas = consultar('SELECT id_feria, feria, domicilio, estado FROM tbl_ferias ORDER BY feria');
    return array_map(static fn (array $f): array => [
        'id'        => (int) $f['id_feria'],
        'nombre'    => $f['feria'],
        'domicilio' => $f['domicilio'],
        'estado'    => (int) $f['estado'],
    ], $filas);
}

function recurso_rubros(): array
{
    $filas = consultar('SELECT id_rubro, rubro FROM tbl_rubro ORDER BY rubro');
    return array_map(static fn (array $r): array => [
        'id'     => (int) $r['id_rubro'],
        'nombre' => $r['rubro'],
    ], $filas);
}

function recurso_emprendimientos(): array
{
    $pagina    = entero('pagina', 1, 1, 10000);
    $porPagina = entero('por_pagina', 12, 1, 60);
    $offset    = ($pagina - 1) * $porPagina;
    $feria     = entero('feria', 0, 0, 999999);
    $rubro     = entero('rubro', 0, 0, 999999);
    $busqueda  = texto_get('q');
    $producto  = texto_get('producto');

    // Sin filtro de estado, igual que el sistema actual (ver nota mas arriba).
    // 'solo_con_logo' replica el whereHas('logo') del FeriaController, que es
    // lo que hace que el catalogo actual muestre solo los que tienen imagen.
    $where  = ['1 = 1'];
    $params = [];

    if (texto_get('solo_con_logo') === '1') {
        $where[] = 't.logo IS NOT NULL AND t.logo <> ""';
    }

    if ($feria > 0) {
        $where[] = 'c.id_feria = :feria';
        $params['feria'] = $feria;
    }
    if ($rubro > 0) {
        $where[] = 'EXISTS (SELECT 1 FROM tbl_emprendimiento_deta d
                            WHERE d.id_emprendimiento = c.id_emprendimiento AND d.id_rubro = :rubro)';
        $params['rubro'] = $rubro;
    }
    if ($busqueda !== '') {
        $where[] = '(c.nombre_empre LIKE :q OR e.nombre LIKE :q OR e.apellido LIKE :q)';
        $params['q'] = '%' . $busqueda . '%';
    }
    if ($producto !== '') {
        $where[] = 'EXISTS (SELECT 1 FROM galerias_productos gp
                            JOIN tbl_producto p ON p.id_producto = gp.producto_id
                            WHERE gp.emprendimiento_id = c.id_emprendimiento
                              AND p.producto LIKE :producto)';
        $params['producto'] = '%' . $producto . '%';
    }

    $filtro = implode(' AND ', $where);

    // OJO privacidad: de tbl_emprendedor solo salen nombre, apellido y los
    // contactos que se publican en la ficha. Nunca dni, domicilio, localidad
    // ni codigo postal.
    $sqlFrom = 'FROM tbl_emprendimiento_cabe c
                JOIN tbl_emprendedor e ON e.id_emprendedor = c.id_emprendedor
                LEFT JOIN tbl_ferias f ON f.id_feria = c.id_feria
                LEFT JOIN emprendimiento_tele t ON t.id_emprendimiento = c.id_emprendimiento';
    $sqlWhere = "WHERE $filtro";

    $total = (int) (consultar_una(
        "SELECT COUNT(*) AS n $sqlFrom $sqlWhere",
        $params
    )['n'] ?? 0);

    // LIMIT/OFFSET van interpolados y no como parametros: con
    // EMULATE_PREPARES desactivado MySQL los recibiria como texto y fallaria.
    // Son seguros porque entero() ya los valido y acoto a un rango.
    $filas = consultar(
        "SELECT c.id_emprendimiento, c.nombre_empre, c.id_feria, c.finicio,
                e.nombre, e.apellido, e.telefono, e.email, e.instagram, e.facebook,
                f.feria, t.logo
         $sqlFrom $sqlWhere
         ORDER BY c.nombre_empre
         LIMIT $porPagina OFFSET $offset",
        $params
    );

    $datos = array_map(static fn (array $c): array => [
        'id'           => (int) $c['id_emprendimiento'],
        'nombre'       => $c['nombre_empre'],
        'emprendedor'  => trim(($c['apellido'] ?? '') . ', ' . ($c['nombre'] ?? '')),
        'feria'        => ['id' => (int) $c['id_feria'], 'nombre' => $c['feria']],
        'logo'         => medio($c['logo']),
        'contacto'     => [
            'telefono'  => $c['telefono'],
            'email'     => $c['email'] !== null ? mb_strtolower($c['email']) : null,
            'instagram' => $c['instagram'],
            'facebook'  => $c['facebook'],
        ],
    ], $filas);

    return paginar($datos, $total, $pagina, $porPagina);
}

function recurso_emprendimiento(int $id): array
{
    $c = consultar_una(
        'SELECT c.id_emprendimiento, c.nombre_empre, c.id_feria, c.finicio,
                e.nombre, e.apellido, e.telefono, e.email, e.instagram, e.facebook,
                f.feria, f.domicilio AS feria_domicilio, t.logo
         FROM tbl_emprendimiento_cabe c
         JOIN tbl_emprendedor e ON e.id_emprendedor = c.id_emprendedor
         LEFT JOIN tbl_ferias f ON f.id_feria = c.id_feria
         LEFT JOIN emprendimiento_tele t ON t.id_emprendimiento = c.id_emprendimiento
         WHERE c.id_emprendimiento = :id',
        ['id' => $id]
    );
    if (!$c) {
        responder_error(404, 'no_encontrado', 'No existe ese emprendimiento.');
    }

    $rubros = consultar(
        'SELECT r.id_rubro, r.rubro
         FROM tbl_emprendimiento_deta d
         JOIN tbl_rubro r ON r.id_rubro = d.id_rubro
         WHERE d.id_emprendimiento = :id
         ORDER BY r.rubro',
        ['id' => $id]
    );

    // Los productos con foto se resuelven por galerias_productos, que es lo
    // que une emprendimiento + producto + imagen.
    $productos = consultar(
        'SELECT p.id_producto, p.producto, gp.imagen, gp.orden
         FROM galerias_productos gp
         JOIN tbl_producto p ON p.id_producto = gp.producto_id
         WHERE gp.emprendimiento_id = :id
         ORDER BY COALESCE(gp.orden, 9999), gp.id',
        ['id' => $id]
    );

    $agrupados = [];
    foreach ($productos as $p) {
        $pid = (int) $p['id_producto'];
        if (!isset($agrupados[$pid])) {
            $agrupados[$pid] = ['id' => $pid, 'nombre' => $p['producto'], 'fotos' => []];
        }
        $url = medio($p['imagen']);
        if ($url !== null) {
            $agrupados[$pid]['fotos'][] = $url;
        }
    }

    return [
        'id'          => (int) $c['id_emprendimiento'],
        'nombre'      => $c['nombre_empre'],
        'emprendedor' => trim(($c['apellido'] ?? '') . ', ' . ($c['nombre'] ?? '')),
        'desde'       => $c['finicio'],
        'logo'        => medio($c['logo']),
        'feria'       => [
            'id'        => (int) $c['id_feria'],
            'nombre'    => $c['feria'],
            'domicilio' => $c['feria_domicilio'],
        ],
        'rubros'      => array_map(static fn (array $r): array => [
            'id'     => (int) $r['id_rubro'],
            'nombre' => $r['rubro'],
        ], $rubros),
        'contacto'    => [
            'telefono'  => $c['telefono'],
            'email'     => $c['email'] !== null ? mb_strtolower($c['email']) : null,
            'instagram' => $c['instagram'],
            'facebook'  => $c['facebook'],
        ],
        'productos'   => array_values($agrupados),
    ];
}

/* ------------------------------------------------------------------ */
/* Buscador                                                            */
/* ------------------------------------------------------------------ */

function recurso_buscar(): array
{
    $q = texto_get('q');
    if (mb_strlen($q) < 2) {
        responder_error(400, 'consulta_corta', 'La busqueda necesita al menos dos caracteres.');
    }
    $like = '%' . $q . '%';

    $resultados = [];

    // Con EMULATE_PREPARES desactivado, MySQL no permite reusar el MISMO
    // parametro con nombre dos veces en una consulta: por eso van :q1 y :q2.
    foreach (consultar(
        'SELECT id, titulo, bajada, slug FROM notas WHERE titulo LIKE :q1 OR bajada LIKE :q2 LIMIT 20',
        ['q1' => $like, 'q2' => $like]
    ) as $n) {
        $resultados[] = [
            'tipo'   => 'nota',
            'id'     => (int) $n['id'],
            'titulo' => $n['titulo'],
            'bajada' => $n['bajada'],
            'slug'   => $n['slug'],
        ];
    }

    foreach (consultar(
        'SELECT id, title AS titulo, excerpt AS bajada, tramite_id
         FROM tramites_items_notas WHERE title LIKE :q1 OR excerpt LIKE :q2 LIMIT 20',
        ['q1' => $like, 'q2' => $like]
    ) as $f) {
        $resultados[] = [
            'tipo'      => 'ficha',
            'id'        => (int) $f['id'],
            'titulo'    => $f['titulo'],
            'bajada'    => $f['bajada'],
            'categoria' => (int) $f['tramite_id'],
        ];
    }

    foreach (consultar(
        'SELECT a.id, a.area AS titulo, ad.nombre AS autoridad
         FROM areas_gobiernos a
         LEFT JOIN administraciones ad ON ad.area_id = a.id
         WHERE a.area LIKE :q LIMIT 15',
        ['q' => $like]
    ) as $a) {
        $resultados[] = [
            'tipo'      => 'area',
            'id'        => (int) $a['id'],
            'titulo'    => $a['titulo'],
            'autoridad' => $a['autoridad'],
        ];
    }

    return ['consulta' => $q, 'total' => count($resultados), 'resultados' => $resultados];
}

/* ------------------------------------------------------------------ */

function slugificar(?string $texto): string
{
    if ($texto === null) {
        return '';
    }
    $s = normalizar($texto);
    $s = preg_replace('/[^a-z0-9]+/', '-', $s) ?? '';
    return trim($s, '-');
}
