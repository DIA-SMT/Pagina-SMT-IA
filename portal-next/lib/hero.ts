/**
 * Fotos del hero de la portada.
 *
 * Las fotos viven en `public/hero/` y no en el CMS. Es una decisión
 * deliberada: son piezas de diseño, panorámicas y optimizadas a medida del
 * layout (WebP, 2000px de ancho, ~300 KB cada una contra los 3 MB de los PNG
 * originales). Las que están cargadas en Voyager son versiones viejas de baja
 * resolución.
 *
 * Si en algún momento el municipio quiere elegir las fotos desde el panel, se
 * cambia `FOTOS_HERO` por una llamada a `getSliders()` de lib/api.ts y listo:
 * el resto del componente no se entera. La contra sería perder el control
 * sobre la proporción y el peso.
 */

export type FotoHero = {
  src: string;
  /** Alt descriptivo: la foto aporta contexto, no es decorativa. */
  alt: string;
  /** Recorte preferido cuando el contenedor es más alto que la foto. */
  posicion?: string;
};

export const FOTOS_HERO: FotoHero[] = [
  {
    src: "/hero/01-san-miguel-de-tucuman.webp",
    alt: "Avenida de San Miguel de Tucumán al atardecer, con los lapachos en flor a ambos lados y el Monumento al Bicentenario al fondo",
    posicion: "center 55%",
  },
  {
    src: "/hero/02-museo-nacional-de-la-independencia.webp",
    alt: "Fachada blanca de la Casa Histórica de la Independencia con su portal barroco y sus puertas azules",
  },
  {
    src: "/hero/03-la-fuente-de-los-leones.webp",
    alt: "La Fuente de los Leones del Parque 9 de Julio iluminada de noche, con sus chorros de agua",
  },
  {
    src: "/hero/04-iglesia-catedral.webp",
    alt: "Vista aérea nocturna de la Catedral de San Miguel de Tucumán iluminada, frente a la Plaza Independencia",
  },
  {
    src: "/hero/06-puente-peatonal.webp",
    alt: "Puente peatonal iluminado en azul sobre una avenida de la ciudad, de noche",
  },
  {
    src: "/hero/11-parque-9-de-julio.webp",
    alt: "Vista del Parque 9 de Julio, el principal espacio verde de la ciudad",
  },
  {
    src: "/hero/12-campus-educativo-ambiental.webp",
    alt: "Campus Educativo Ambiental de San Miguel de Tucumán",
  },
];


/* ------------------------------------------------------------------ *
 * Bandas de sección
 * ------------------------------------------------------------------ */

/**
 * Cada sección del portal lleva una de las siete fotos como banda sobre el
 * título. Las de `public/hero/banda/` son recortes propios a 1800x270, no las
 * del hero: la banda mide 7rem en móvil y 10rem en escritorio, así que
 * arrastrar la foto entera de 2000x667 para que el CSS le recorte dos tercios
 * sería pagar el doble de bytes por píxeles que nadie ve. Pesan entre 43 y
 * 105 KB contra los 165 KB de la original, y `next/image` sirve además la
 * variante angosta a los teléfonos, que son el 60% del tráfico.
 *
 * Se regeneran con sharp desde `public/hero/`:
 *
 *   sharp(origen).resize(1800, 270, { fit: "cover", position: "centre" })
 *                .webp({ quality: 72 })
 *
 * El recorte es al centro y no automático: probamos la estrategia `attention`
 * de sharp y en el puente peatonal se comía el arco, que es justamente el
 * motivo de la foto.
 *
 * Las páginas de utilidad —el buscador, la declaración de accesibilidad— no
 * llevan banda: ahí la foto sería ruido sobre una tarea concreta. Las páginas
 * de detalle tampoco, y eso es deliberado: son el 78% del tráfico del portal
 * y es donde el vecino viene a resolver algo, así que se quedan livianas.
 */
export type BandaSeccion = {
  src: string;
  /**
   * Alt vacío a propósito: la banda es decorativa. El h1 que va justo debajo
   * ya nombra la página, y repetir "Vista aérea nocturna de la Catedral…"
   * arriba de cada título sería ruido para quien usa lector de pantalla. La
   * descripción completa de cada foto vive en FOTOS_HERO, donde sí informa.
   */
  alt: "";
};

const banda = (archivo: string): BandaSeccion => ({
  src: `/hero/banda/${archivo}`,
  alt: "",
});

export const BANDAS_SECCION: Record<string, BandaSeccion> = {
  // Infraestructura y ciudad en movimiento, para la sección de gestiones.
  tramites: banda("06-puente-peatonal.webp"),
  // La Casa Histórica es la imagen institucional por excelencia.
  gobierno: banda("02-museo-nacional-de-la-independencia.webp"),
  // Las páginas de contenido hablan de la ciudad: su parque principal.
  paginas: banda("11-parque-9-de-julio.webp"),
  // La más visual de las siete, para el índice de galerías.
  galeria: banda("03-la-fuente-de-los-leones.webp"),
  // La Catedral sobre la Plaza Independencia: el centro cívico.
  contacto: banda("04-iglesia-catedral.webp"),
  // Obra reciente y reconocible, para el mapa del sitio.
  mapa: banda("12-campus-educativo-ambiental.webp"),
  // 01-san-miguel-de-tucuman queda reservada para el hero de la portada.
};
