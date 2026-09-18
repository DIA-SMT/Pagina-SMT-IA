/**
 * Las quince capas del hero de stickers.
 *
 * De dónde sale cada número:
 *
 * - `final` y `fisica` vienen del manifiesto del paquete de recursos, que está
 *   copiado sin tocar en public/hero-tucuman/manifest-original.json. Se pasan a
 *   TypeScript para que el compilador avise si falta una, no para cambiarlos.
 *
 * - `intro` NO viene en el paquete y lo pusimos a ojo, mirando la fotografía y
 *   buscando dónde cae el objeto equivalente. Son porcentajes de la FOTO, no
 *   del hero, y eso importa: la foto se recorta distinto según el alto de la
 *   ventana, así que el componente traduce de foto a pantalla en cada resize.
 *   Es la misma clase de calibración a mano que se hizo con los hitos del mapa;
 *   están puestos para verse bien, no medidos con un instrumento.
 *
 * Cuatro capas tienen `intro: null` porque no existen en la fotografía: el
 * rótulo, el mapa, el mate con el bombo y las decoraciones. Ésas no se
 * desprenden de nada, emergen al final desde el centro.
 */

export type FaseEntrada = "B" | "C" | "D";

export type CapaHero = {
  id: string;
  archivo: string;
  /** Posición final: centro del sticker en porcentaje del hero. */
  final: { x: number; y: number; anchoVw: number; minPx: number; maxPx: number };
  /** Dónde está su equivalente en la fotografía, en porcentaje de la foto. */
  intro: { x: number; y: number; anchoPct: number } | null;
  fase: FaseEntrada;
  z: number;
  fisica: {
    /** Cuánto la empuja el viento. Más de 1 es primer plano. */
    profundidad: number;
    radioPx: number;
    maxDesplazamientoPx: number;
    maxGiroGrados: number;
    resorte: number;
    amortiguacion: number;
  };
};

/**
 * El 42% izquierdo es de la columna de texto y no se toca.
 *
 * No es sólo texto: ahí viven el buscador y las seis tarjetas más consultadas
 * del portal, que son controles reales. Ninguna ráfaga puede empujar un sticker
 * encima de ellos, así que el sistema de viento recorta el desplazamiento
 * contra este límite, no sólo contra el borde del hero.
 */
export const ZONA_SEGURA_DERECHA = 42;

/** Un punto de colchón sobre la zona segura, para que nada la roce. */
export const COLCHON_ZONA_SEGURA = 1;

export const CAPAS: CapaHero[] = [
  {
    id: "paisajes-tafi-cadillal",
    archivo: "06-paisajes-tafi-cadillal.webp",
    // y de 8 a 16: con 8 el borde superior quedaba en -6% y el sticker
    // aparecia cortado contra el encabezado. Un sticker cortado deja de
    // leerse como sticker, porque lo que lo define es el borde blanco.
    final: { x: 63, y: 16, anchoVw: 25, minPx: 280, maxPx: 500 },
    // El valle y el lago ocupan casi toda la mitad superior de la foto; se
    // toma el centro de esa región y no su ancho completo, que sería el 60%.
    intro: { x: 56, y: 16, anchoPct: 40 },
    fase: "B",
    z: 8,
    fisica: { profundidad: 0.28, radioPx: 180, maxDesplazamientoPx: 12, maxGiroGrados: 1, resorte: 0.095, amortiguacion: 0.91 },
  },
  {
    id: "cristo-bendicente",
    archivo: "04-cristo-bendicente.webp",
    final: { x: 91, y: 17, anchoVw: 11, minPx: 120, maxPx: 220 },
    intro: { x: 20, y: 14, anchoPct: 18 },
    fase: "B",
    z: 20,
    fisica: { profundidad: 0.5, radioPx: 190, maxDesplazamientoPx: 20, maxGiroGrados: 2, resorte: 0.09, amortiguacion: 0.89 },
  },
  {
    id: "casa-gobierno",
    archivo: "03-casa-gobierno.webp",
    final: { x: 53, y: 23, anchoVw: 19, minPx: 210, maxPx: 380 },
    intro: { x: 15, y: 46, anchoPct: 21 },
    fase: "B",
    z: 24,
    fisica: { profundidad: 0.62, radioPx: 210, maxDesplazamientoPx: 23, maxGiroGrados: 2.2, resorte: 0.086, amortiguacion: 0.88 },
  },
  {
    id: "casa-historica",
    archivo: "02-casa-historica.webp",
    final: { x: 78, y: 24, anchoVw: 20, minPx: 220, maxPx: 390 },
    intro: { x: 48, y: 48, anchoPct: 33 },
    fase: "B",
    z: 30,
    fisica: { profundidad: 0.72, radioPx: 220, maxDesplazamientoPx: 26, maxGiroGrados: 2.5, resorte: 0.082, amortiguacion: 0.87 },
  },
  {
    id: "monumento-bicentenario",
    archivo: "05-monumento-bicentenario.webp",
    final: { x: 92, y: 47, anchoVw: 8, minPx: 92, maxPx: 155 },
    // En la foto son dos columnas finas; el sticker trae además la base y los
    // árboles, así que el ancho de entrada es algo mayor que el de las columnas.
    intro: { x: 74, y: 47, anchoPct: 9 },
    fase: "B",
    z: 28,
    fisica: { profundidad: 0.66, radioPx: 190, maxDesplazamientoPx: 24, maxGiroGrados: 2.5, resorte: 0.086, amortiguacion: 0.88 },
  },
  {
    id: "ruinas-quilmes",
    archivo: "07-ruinas-quilmes.webp",
    final: { x: 82, y: 68, anchoVw: 21, minPx: 230, maxPx: 420 },
    intro: { x: 89, y: 42, anchoPct: 23 },
    fase: "B",
    z: 18,
    fisica: { profundidad: 0.45, radioPx: 205, maxDesplazamientoPx: 18, maxGiroGrados: 1.8, resorte: 0.09, amortiguacion: 0.89 },
  },
  {
    id: "locro",
    archivo: "10-locro.webp",
    // La x del manifiesto era 48 y su borde izquierdo caía en 41,5%, medio
    // punto adentro de la zona segura; con su ráfaga de 42px llegaba a 38,6%,
    // o sea encima de las tarjetas. Corrido a 52 queda en 45,5% en reposo y en
    // 42,6% con la ráfaga entera. El recorte del sistema de viento lo cubre
    // igual, pero un sticker no debería depender de un recorte para no tapar
    // un control.
    final: { x: 52, y: 76, anchoVw: 13, minPx: 150, maxPx: 260 },
    intro: { x: 21, y: 79, anchoPct: 23 },
    fase: "C",
    z: 58,
    fisica: { profundidad: 1.12, radioPx: 230, maxDesplazamientoPx: 42, maxGiroGrados: 4.5, resorte: 0.073, amortiguacion: 0.85 },
  },
  {
    id: "empanadas",
    archivo: "08-empanadas.webp",
    final: { x: 60, y: 79, anchoVw: 18, minPx: 205, maxPx: 360 },
    intro: { x: 45, y: 80, anchoPct: 25 },
    fase: "C",
    z: 65,
    fisica: { profundidad: 1.22, radioPx: 245, maxDesplazamientoPx: 48, maxGiroGrados: 5.5, resorte: 0.07, amortiguacion: 0.84 },
  },
  {
    id: "tamal-humita",
    archivo: "11-tamal-humita.webp",
    final: { x: 76, y: 86, anchoVw: 16, minPx: 180, maxPx: 320 },
    intro: { x: 68, y: 76, anchoPct: 22 },
    fase: "C",
    z: 60,
    fisica: { profundidad: 1.16, radioPx: 235, maxDesplazamientoPx: 45, maxGiroGrados: 5, resorte: 0.072, amortiguacion: 0.84 },
  },
  {
    id: "sanguche-milanesa",
    archivo: "09-sanguche-milanesa.webp",
    final: { x: 91, y: 84, anchoVw: 17, minPx: 190, maxPx: 335 },
    intro: { x: 90, y: 81, anchoPct: 20 },
    fase: "C",
    z: 70,
    fisica: { profundidad: 1.3, radioPx: 250, maxDesplazamientoPx: 52, maxGiroGrados: 6, resorte: 0.068, amortiguacion: 0.83 },
  },
  {
    id: "naturaleza-tucumana",
    archivo: "12-naturaleza-tucumana.webp",
    final: { x: 92, y: 63, anchoVw: 14, minPx: 160, maxPx: 285 },
    // El sticker junta limones, lapacho y caña. En la foto los tres están
    // repartidos por los bordes; se elige la caña de la derecha porque es la
    // que queda más cerca de su posición final y evita un viaje largo.
    intro: { x: 94, y: 67, anchoPct: 12 },
    fase: "C",
    z: 44,
    fisica: { profundidad: 0.92, radioPx: 220, maxDesplazamientoPx: 36, maxGiroGrados: 4.5, resorte: 0.078, amortiguacion: 0.86 },
  },
  {
    id: "titulo-tucuman",
    archivo: "01-titulo-tucuman.webp",
    final: { x: 68, y: 47, anchoVw: 35, minPx: 360, maxPx: 680 },
    intro: null,
    fase: "D",
    z: 50,
    fisica: { profundidad: 1, radioPx: 260, maxDesplazamientoPx: 34, maxGiroGrados: 3, resorte: 0.075, amortiguacion: 0.86 },
  },
  {
    id: "mapa-tucuman",
    archivo: "14-mapa-tucuman.webp",
    // x de 46 a 49: con 46 el borde izquierdo quedaba exactamente en 43%,
    // o sea pegado al limite de la zona segura y sin un milimetro para que el
    // viento lo mueva hacia ese lado.
    final: { x: 49, y: 48, anchoVw: 8, minPx: 90, maxPx: 155 },
    intro: null,
    fase: "D",
    z: 34,
    fisica: { profundidad: 0.76, radioPx: 195, maxDesplazamientoPx: 27, maxGiroGrados: 3.5, resorte: 0.084, amortiguacion: 0.87 },
  },
  {
    id: "mate-bombo",
    archivo: "13-mate-bombo.webp",
    // x de 95 a 93: con 95 el borde derecho se iba a 101,2% del hero.
    final: { x: 93, y: 31, anchoVw: 12, minPx: 135, maxPx: 240 },
    intro: null,
    fase: "D",
    z: 40,
    fisica: { profundidad: 0.85, radioPx: 215, maxDesplazamientoPx: 32, maxGiroGrados: 4, resorte: 0.08, amortiguacion: 0.87 },
  },
  {
    id: "decoraciones",
    archivo: "15-decoraciones.webp",
    // y de 11 a 16, por lo mismo: el borde de arriba caia en -2%.
    final: { x: 73, y: 16, anchoVw: 23, minPx: 250, maxPx: 450 },
    intro: null,
    fase: "D",
    z: 12,
    fisica: { profundidad: 0.35, radioPx: 205, maxDesplazamientoPx: 16, maxGiroGrados: 1.5, resorte: 0.092, amortiguacion: 0.9 },
  },
];

/**
 * La fotografía inicial. Sus proporciones hacen falta para traducir las poses
 * de entrada: con object-fit: cover el recorte depende del alto de la ventana.
 */
export const FOTO = {
  webp: "/hero-tucuman/foto-inicial.webp",
  avif: "/hero-tucuman/foto-inicial.avif",
  ancho: 1672,
  alto: 941,
  alt:
    "Postal de Tucumán: el Cristo Bendicente sobre el cerro, la Casa de Gobierno, " +
    "la Casa Histórica de la Independencia, el Monumento al Bicentenario, el valle " +
    "y el dique, y en primer plano locro, empanadas, tamales, humita y sánguche de milanesa",
};

export const COLLAGE_MOVIL = "/hero-tucuman/collage-movil.webp";

/** Las fases de la transformación, en milisegundos desde el clic. */
export const FASES = {
  /** Respuesta al clic: la onda y el respingo de la foto. */
  A: { desde: 0, hasta: 300 },
  /** Monumentos y paisajes se desprenden. */
  B: { desde: 250, hasta: 1200 },
  /** La gastronomía, que está en primer plano. */
  C: { desde: 500, hasta: 1500 },
  /** Identidad: rótulo, mapa, mate y decoraciones. */
  D: { desde: 1100, hasta: 1900 },
  /** Asentamiento elástico y limpieza de desenfoques. */
  E: { desde: 1900, hasta: 2300 },
} as const;

/** Escalonado entre capas de una misma fase. */
export const ESCALONADO_MS = 60;

/** La transición móvil es corta y sin viajes. */
export const MOVIL_MS = 650;

/** Con prefers-reduced-motion sólo hay un fundido. */
export const SIN_MOVIMIENTO_MS = 320;

/**
 * La física de las seis tarjetas de la columna.
 *
 * Las tarjetas no son figuritas: son los seis enlaces más consultados del
 * portal, y el primero se lleva 831 visitas por día. Por eso no pueden usar el
 * viento tal cual. El motor empuja en la dirección que ALEJA del cursor —es lo
 * que las hace sentir vivas— y sobre un enlace eso significa que el blanco se
 * corre justo cuando alguien va a tocarlo.
 *
 * La salida es el pozo de calma: mismo viento, pero la fuerza se apaga cuando
 * el cursor entra en la columna. Ondean mientras la ráfaga pasa por el campo de
 * figuritas y se asientan cuando se acerca la mano. Se eligió probando los
 * cuatro modelos con un cronómetro, no en el papel.
 *
 * Los números son más chicos que los de las figuritas del primer plano: la
 * comida llega a 45px de desplazamiento, la tarjeta a 26. Alcanza para que se
 * lea como movimiento y no tanto como para que el renglón se corra de lugar.
 */
export const FISICA_TARJETA = {
  profundidad: 0.85,
  radioPx: 200,
  maxDesplazamientoPx: 26,
  /** Poco giro: cualquier rotación le saca el suavizado subpíxel al texto. */
  maxGiroGrados: 1.8,
  resorte: 0.09,
  amortiguacion: 0.88,
} as const;

/**
 * TODA la columna ondea, no sólo las tarjetas.
 *
 * El orden es el del marcado y las profundidades bajan de a poco hacia arriba:
 * las tarjetas son lo más cercano —26px de recorrido— y el rótulo lo más lejano
 * —9px—. Es el mismo reparto por planos que ordena las quince figuritas, con
 * los números divididos por tres: acá abajo hay texto que se lee, no una lámina
 * que se mira, y un título de 45px corriéndose 26 se lee como un error de
 * maquetado y no como viento.
 *
 * El buscador entra por .buscador-vivo y NO por .buscador-hero, que es el
 * formulario. El envoltorio es el que ancla el desplegable de sugerencias
 * (position: relative en el bloque 21): moviendo el formulario, la lista de
 * sugerencias se quedaría clavada en su sitio mientras el campo se corre.
 *
 * Las seis tarjetas van por selector y no por una lista propia a propósito:
 * los destinos salen de DESTACADOS en lib/navegacion.ts, y si mañana son cinco
 * o siete, esto no se entera.
 */
export const PIEZAS_DE_LA_COLUMNA: { selector: string; fisica: CapaHero["fisica"] }[] = [
  { selector: ".hero__titulo", fisica: { profundidad: 0.55, radioPx: 210, maxDesplazamientoPx: 14, maxGiroGrados: 0.7, resorte: 0.092, amortiguacion: 0.88 } },
  { selector: ".hero__bajada", fisica: { profundidad: 0.45, radioPx: 200, maxDesplazamientoPx: 11, maxGiroGrados: 0.6, resorte: 0.094, amortiguacion: 0.88 } },
  { selector: ".buscador-vivo", fisica: { profundidad: 0.60, radioPx: 210, maxDesplazamientoPx: 13, maxGiroGrados: 0.5, resorte: 0.090, amortiguacion: 0.88 } },
  { selector: ".hero__rotulo", fisica: { profundidad: 0.40, radioPx: 195, maxDesplazamientoPx: 9, maxGiroGrados: 0.8, resorte: 0.095, amortiguacion: 0.89 } },
  { selector: ".destino", fisica: FISICA_TARJETA },
  { selector: ".ht__disparador", fisica: { profundidad: 0.50, radioPx: 200, maxDesplazamientoPx: 12, maxGiroGrados: 1.0, resorte: 0.092, amortiguacion: 0.88 } },
];

/**
 * A cuántos píxeles de la columna el viento ya está del todo apagado.
 *
 * No es un interruptor: es una rampa, para que no se note el borde. A 70px de
 * la columna el viento vale la mitad, pegado a ella vale cero. Setenta es algo
 * más que el alto de una tarjeta, así que quien viene bajando por la lista las
 * encuentra quietas antes de llegar.
 */
export const RAMPA_DE_CALMA_PX = 70;
