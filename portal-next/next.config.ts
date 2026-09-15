import type { NextConfig } from "next";

/**
 * Slugs de las páginas de contenido tal como existen HOY en el sitio viejo.
 *
 * La lista está congelada a propósito y no hace falta mantenerla al día: sólo
 * necesitan redirección las URLs que ya están indexadas y en el historial de
 * alguien. Una nota que el municipio cargue después de la mudanza nace
 * directamente en /p/{slug} y nunca tuvo una URL vieja que preservar.
 *
 * Van con la escritura exacta del CMS. No hace falta agregar las variantes en
 * minúscula que circulan por ahí (/sube además de /Sube, porque MariaDB compara
 * con colación insensible a mayúsculas): Next también compara las rutas de
 * redirección sin distinguir mayúsculas, así que una sola entrada cubre las dos
 * formas y manda al destino con la escritura canónica.
 *
 * Queda afuera "galeria": hay una nota con ese slug, pero /galeria es el
 * índice de galerías del portal nuevo y las redirecciones se evalúan ANTES
 * del sistema de archivos. Redirigirla dejaría las galerías inaccesibles, y
 * esa nota no registra tráfico.
 */
const SLUGS_DE_NOTAS = [
  "Bibliotecadigital",
  "busturistico",
  "ces",
  "circuitos-turisticos",
  "circuitosturisticospie",
  "colectivos",
  "concurso",
  "concurso_confiteria",
  "cortes",
  "gestiononlinecatastro",
  "historia",
  "jovenesporelclima",
  "lugares-de-interes",
  "Meisterplan",
  "Memorial",
  "museoescultorio",
  "ordenanzatributaria",
  "parques_smt",
  "PlandeContingenciaanteInundaciones",
  "plazaswifi",
  "portalproveedores",
  "presupuestoparticipativo",
  "Recomendaciones_sanitarias",
  "Registros _Transporte _Individual_Pasajeros",
  "Sube",
  "SUBEM",
  "Talleres",
  "transporte_publico",
  "turismo",
  "turno-asistencia",
];

const nextConfig: NextConfig = {
  // Las imágenes del contenido siguen viviendo en el servidor municipal.
  // No se copian a Vercel: el navegador las pide directo al origen.
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "smt.gob.ar", pathname: "/storage/**" },
      { protocol: "https", hostname: "cms.smt.gob.ar", pathname: "/storage/**" },
    ],
  },
  poweredByHeader: false,

  /**
   * El portal nuevo cambia el esquema de URLs de todo el contenido. Medido
   * sobre el log del servidor (lunes 14/09/2026, día hábil completo, bots
   * excluidos), eso son unas 3.600 visitas diarias que sin estas reglas
   * caerían en 404 el día que el dominio apunte a Vercel, más todo lo que
   * tienen indexado los buscadores.
   *
   * `permanent: true` emite 308 y no 301. Es deliberado: el 301 hizo que
   * históricamente los navegadores convirtieran un POST en GET, y el 308
   * preserva el método. Para un buscador las dos son "movido para siempre" y
   * transfieren igual el posicionamiento.
   *
   * Nada redirige a la portada: cada URL vieja va a su equivalente exacto.
   * Lo que no tiene equivalente (la feria) devuelve 404, que es honesto.
   */
  async redirects() {
    return [
      // Fichas de trámite: 1.845 visitas diarias, el contenido más visitado
      // del sitio después de la portada. El slug del título se descarta
      // porque el id es lo único estable.
      // El (\\d+) no es decorativo: sin él, /nota/lo-que-sea/hola redirigiría a
      // /fichas/hola, que es un 404 con una parada de más en el medio.
      { source: "/nota/:slug/:id(\\d+)", destination: "/fichas/:id", permanent: true },

      // Áreas de gobierno: 567 visitas diarias.
      { source: "/area/:slug/:id(\\d+)", destination: "/gobierno/:id", permanent: true },

      // Categorías de trámites: 422 visitas diarias.
      { source: "/tramite/:slug/:id(\\d+)", destination: "/tramites/:id", permanent: true },

      // Buscador. Los parámetros de consulta viajan solos: ?q= llega intacto.
      { source: "/search/result", destination: "/buscar", permanent: true },
      { source: "/search", destination: "/buscar", permanent: true },

      // Galerías.
      { source: "/galeria/imagenes", destination: "/galeria", permanent: true },

      // Restos del Laravel viejo.
      { source: "/index.php", destination: "/", permanent: true },

      // Páginas de contenido: 704 visitas diarias repartidas en 31 páginas.
      // En el sitio viejo cuelgan de la raíz por una ruta comodín; en el
      // nuevo viven bajo /p para no volver a tener un comodín que se trague
      // /robots.txt y /sitemap.xml, que es justamente lo que pasa hoy.
      //
      // Se emiten dos reglas por slug porque Next compara la ruta tal como
      // viaja en el pedido: "/Registros _Transporte _Individual_Pasajeros"
      // llega del navegador como "/Registros%20_Transporte%20_Individual_..."
      // y la forma con el espacio literal no engancha. Para los otros 29
      // slugs las dos formas coinciden y el Set deja una sola.
      ...SLUGS_DE_NOTAS.flatMap((slug) =>
        [...new Set([slug, encodeURIComponent(slug)])].map((fuente) => ({
          source: `/${fuente}`,
          destination: `/p/${encodeURIComponent(slug)}`,
          permanent: true,
        })),
      ),
    ];
  },
};

export default nextConfig;
