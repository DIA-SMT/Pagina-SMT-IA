# Sitemap y metadatos

## Estado actual

`https://smt.gob.ar/robots.txt` y `https://smt.gob.ar/sitemap.xml` devuelven
**404**: el portal no publica ninguno de los dos. La página 404 propia además
no tiene `<title>` y sigue siendo indexable (`robots: index, follow`).

## Lo que ya resuelve el rediseño

- Cada plantilla define `<title>` propio, `meta description`, `canonical`
  (`url()->current()`) y Open Graph con imagen.
- La página 404 lleva `noindex, nofollow` y título propio.
- Los resultados de búsqueda llevan `noindex, follow`.
- La guía de estilo interna lleva `noindex, nofollow`.
- Redirección 301 al slug canónico: una sola URL indexable por contenido
  (hoy cualquier slug resuelve con 200 y genera duplicados).
- `public/robots.txt` propuesto, listo para subir.

## Sitemap: cómo generarlo al integrar

El sitemap debe salir del CMS, no de una lista fija, para que se mantenga solo
cuando el equipo publica contenido. Una ruta que lo genere:

```php
// routes/web.php
Route::get('/sitemap.xml', function () {
    $urls = collect();

    $urls->push(['loc' => url('/'), 'priority' => '1.0', 'changefreq' => 'daily']);

    // Categorías, notas y áreas: reemplazar por los modelos reales de Voyager
    foreach (Categoria::all() as $c) {
        $urls->push([
            'loc' => url('/tramite/' . $c->slug . '/' . $c->id),
            'lastmod' => optional($c->updated_at)->toAtomString(),
            'priority' => '0.8',
        ]);
    }
    foreach (Nota::all() as $n) {
        $urls->push([
            'loc' => url('/nota/' . $n->slug . '/' . $n->id),
            'lastmod' => optional($n->updated_at)->toAtomString(),
            'priority' => '0.7',
        ]);
    }
    foreach (Area::all() as $a) {
        $urls->push([
            'loc' => url('/area/' . $a->slug . '/' . $a->id),
            'lastmod' => optional($a->updated_at)->toAtomString(),
            'priority' => '0.5',
        ]);
    }

    // Páginas fijas y rutas custom del CMS
    foreach ([
        '/historia', '/circuitos-turisticos', '/circuitosturisticospie',
        '/busturistico', '/lugares-de-interes', '/galeria/imagenes',
        '/parques_smt', '/memorial', '/catalogo/catalogo-de-emprendedores',
        '/SUBEM', '/sube', '/colectivos', '/cortes', '/talleres',
        '/turno-asistencia', '/portalproveedores', '/jovenesporelclima',
        '/recomendaciones_sanitarias', '/presupuestoparticipativo',
        '/gestiononlinecatastro', '/PlandeContingenciaanteInundaciones',
    ] as $ruta) {
        $urls->push(['loc' => url($ruta), 'priority' => '0.6']);
    }

    return response()
        ->view('sitemap', compact('urls'))
        ->header('Content-Type', 'application/xml');
})->name('sitemap');
```

Con una vista `resources/views/sitemap.blade.php`:

```blade
<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
@foreach ($urls as $u)
    <url>
        <loc>{{ $u['loc'] }}</loc>
        @isset($u['lastmod'])<lastmod>{{ $u['lastmod'] }}</lastmod>@endisset
        @isset($u['changefreq'])<changefreq>{{ $u['changefreq'] }}</changefreq>@endisset
        <priority>{{ $u['priority'] }}</priority>
    </url>
@endforeach
</urlset>
```

Notas:

- No incluir `/search/result` ni la guía de estilo.
- Las fichas de Mi Feria Digital (`/emprendimiento/{id}`) pueden sumarse si el
  municipio quiere que los emprendimientos aparezcan en buscadores; son
  cientos de URLs, así que conviene un sitemap índice separado.
- Cachear el sitemap (por ejemplo `Cache::remember(..., 3600, ...)`) si la
  cantidad de registros lo hace pesado.
