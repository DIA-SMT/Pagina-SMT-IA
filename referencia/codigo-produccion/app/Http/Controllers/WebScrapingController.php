<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use GuzzleHttp\Client;
use Symfony\Component\DomCrawler\Crawler;

class WebScrapingController extends Controller
{
    public function scrapeWebsite()
    {
        // URL de la página
        $url = 'https://comunicacionsmt.gob.ar/';

        // Crear una instancia de Guzzle para hacer la solicitud HTTP
        $client = new Client();
         $response = $client->request('GET', $url);

        // Obtener el contenido HTML de la respuesta
        $html = $response->getBody()->getContents();

        // Crear una instancia del Crawler para analizar el HTML
        $crawler = new Crawler($html);

        // Array para almacenar los datos
        $articles = [];

        // Buscar todos los elementos con la clase "post__titulo" dentro de la sección con la clase "bloque noticias-superior cant3"
        $crawler->filter('section.bloque.noticias-encabezado.cant3 article.post__noticia')->each(function ($node) use (&$articles) {
            // Obtener el título
            $titulo = $node->filter('h2.post__titulo a')->text();

            // Obtener el enlace
            $enlace = $node->filter('a.post__imagen')->attr('href');

            // Obtener la imagen
            $imagen = $node->filter('img')->attr('data-src');

            // Obtener el texto
            $texto = $node->filter('p.post__detalle')->text();

            // Agregar los datos al array
            $articles[] = [
                'titulo' => $titulo,
                'enlace' => $enlace,
                'imagen' => $imagen,
                'texto' => $texto,
            ];
        });

        // Devolver los datos obtenidos
        return $articles;
    }
}
