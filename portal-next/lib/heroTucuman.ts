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

/**
 * Qué clase de pieza es cada figurita para la física.
 *
 * No todas tienen la misma libertad, y no es un capricho: tres de las quince
 * son estructura de la lámina y no cuerpos sueltos. Si el rótulo "Tucumán" se
 * va flotando, la lámina deja de tener título; si el paisaje del fondo se
 * mueve tanto como una empanada, deja de leerse como fondo.
 *
 * - "cuerpo"   las doce que flotan de verdad
 * - "titulo"   el rótulo: se lee, así que casi no se mueve
 * - "fondo"    el paisaje de atrás: parallax y nada más
 * - "ambiente" las decoraciones: ambientación, movimiento reducido
 */
export type RolDeCapa = "cuerpo" | "titulo" | "fondo" | "ambiente";

export type CapaHero = {
  id: string;
  archivo: string;
  /** Posición final: centro del sticker en porcentaje del hero. */
  final: { x: number; y: number; anchoVw: number; minPx: number; maxPx: number };
  /** Dónde está su equivalente en la fotografía, en porcentaje de la foto. */
  intro: { x: number; y: number; anchoPct: number } | null;
  fase: FaseEntrada;
  rol: RolDeCapa;
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
    rol: "fondo",
    z: 8,
    fisica: { profundidad: 0.28, radioPx: 180, maxDesplazamientoPx: 12, maxGiroGrados: 1, resorte: 0.095, amortiguacion: 0.91 },
  },
  {
    id: "cristo-bendicente",
    archivo: "04-cristo-bendicente.webp",
    final: { x: 91, y: 17, anchoVw: 11, minPx: 120, maxPx: 220 },
    intro: { x: 20, y: 14, anchoPct: 18 },
    fase: "B",
    rol: "cuerpo",
    z: 20,
    fisica: { profundidad: 0.5, radioPx: 190, maxDesplazamientoPx: 20, maxGiroGrados: 2, resorte: 0.09, amortiguacion: 0.89 },
  },
  {
    id: "casa-gobierno",
    archivo: "03-casa-gobierno.webp",
    final: { x: 53, y: 23, anchoVw: 19, minPx: 210, maxPx: 380 },
    intro: { x: 15, y: 46, anchoPct: 21 },
    fase: "B",
    rol: "cuerpo",
    z: 24,
    fisica: { profundidad: 0.62, radioPx: 210, maxDesplazamientoPx: 23, maxGiroGrados: 2.2, resorte: 0.086, amortiguacion: 0.88 },
  },
  {
    id: "casa-historica",
    archivo: "02-casa-historica.webp",
    final: { x: 78, y: 24, anchoVw: 20, minPx: 220, maxPx: 390 },
    intro: { x: 48, y: 48, anchoPct: 33 },
    fase: "B",
    rol: "cuerpo",
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
    rol: "cuerpo",
    z: 28,
    fisica: { profundidad: 0.66, radioPx: 190, maxDesplazamientoPx: 24, maxGiroGrados: 2.5, resorte: 0.086, amortiguacion: 0.88 },
  },
  {
    id: "ruinas-quilmes",
    archivo: "07-ruinas-quilmes.webp",
    final: { x: 82, y: 68, anchoVw: 21, minPx: 230, maxPx: 420 },
    intro: { x: 89, y: 42, anchoPct: 23 },
    fase: "B",
    rol: "cuerpo",
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
    rol: "cuerpo",
    z: 58,
    fisica: { profundidad: 1.12, radioPx: 230, maxDesplazamientoPx: 42, maxGiroGrados: 4.5, resorte: 0.073, amortiguacion: 0.85 },
  },
  {
    id: "empanadas",
    archivo: "08-empanadas.webp",
    final: { x: 60, y: 79, anchoVw: 18, minPx: 205, maxPx: 360 },
    intro: { x: 45, y: 80, anchoPct: 25 },
    fase: "C",
    rol: "cuerpo",
    z: 65,
    fisica: { profundidad: 1.22, radioPx: 245, maxDesplazamientoPx: 48, maxGiroGrados: 5.5, resorte: 0.07, amortiguacion: 0.84 },
  },
  {
    id: "tamal-humita",
    archivo: "11-tamal-humita.webp",
    final: { x: 76, y: 86, anchoVw: 16, minPx: 180, maxPx: 320 },
    intro: { x: 68, y: 76, anchoPct: 22 },
    fase: "C",
    rol: "cuerpo",
    z: 60,
    fisica: { profundidad: 1.16, radioPx: 235, maxDesplazamientoPx: 45, maxGiroGrados: 5, resorte: 0.072, amortiguacion: 0.84 },
  },
  {
    id: "sanguche-milanesa",
    archivo: "09-sanguche-milanesa.webp",
    final: { x: 91, y: 84, anchoVw: 17, minPx: 190, maxPx: 335 },
    intro: { x: 90, y: 81, anchoPct: 20 },
    fase: "C",
    rol: "cuerpo",
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
    rol: "cuerpo",
    z: 44,
    fisica: { profundidad: 0.92, radioPx: 220, maxDesplazamientoPx: 36, maxGiroGrados: 4.5, resorte: 0.078, amortiguacion: 0.86 },
  },
  {
    id: "titulo-tucuman",
    archivo: "01-titulo-tucuman.webp",
    final: { x: 68, y: 47, anchoVw: 35, minPx: 360, maxPx: 680 },
    intro: null,
    fase: "D",
    rol: "titulo",
    z: 50,
    // profundidad de 1 a 0,3 y giro de 3 a 0,7. Es lo único que se lee de la
    // lámina y estaba tratado como una figurita más: con el motor viejo daba
    // igual, porque el resorte lo devolvía enseguida, pero con el motor libre
    // un rótulo con profundidad 1 se iba de viaje y la lámina se quedaba sin
    // título. El rol "titulo" le recorta además el recorrido a 12px.
    fisica: { profundidad: 0.3, radioPx: 260, maxDesplazamientoPx: 34, maxGiroGrados: 0.7, resorte: 0.075, amortiguacion: 0.86 },
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
    rol: "cuerpo",
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
    rol: "cuerpo",
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
    rol: "ambiente",
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
  /*
   * El tamaño SERVIDO, no el del maestro. El PNG maestro de la versión 2 es 4K
   * y pesa 10,8 MB; lo que se sirve son 1920x1080, que salen de
   * scripts/preparar-hero-tucuman.mjs.
   *
   * Estos dos números hacen dos trabajos: son los atributos width y height del
   * <img>, o sea lo que reserva el espacio y evita el salto de maquetación, y
   * son la proporción con la que se traducen las poses de entrada. Si cambia el
   * ancho servido hay que cambiarlos acá.
   *
   * 1920x1080 es 16:9 exacto, que es lo que .ht__escena declara con
   * aspect-ratio. La versión anterior era 1672x941 = 1,7768, algo corrida.
   */
  ancho: 1920,
  alto: 1080,
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
 * ============================================================================
 *  LA FÍSICA DE LA LÁMINA
 * ============================================================================
 *
 * Todos los números del motor libre viven acá, en un solo objeto, para poder
 * subirle o bajarle el efecto sin entrar a leer el bucle. El motor no tiene
 * ninguna constante escrita adentro.
 *
 * ---- EL MODELO, EN UNA FRASE ----
 * El puntero no empuja a las figuritas: mueve AIRE, y las figuritas se dejan
 * arrastrar por el aire. Es la diferencia entre sumar una fuerza —que se acumula
 * y se dispara si el puntero pasa dos veces— y perseguir una velocidad, que se
 * limita sola. En cada punto del hero el aire vale
 *
 *     vAire = vPuntero · caida(distancia) · acopleAire · movilidad
 *
 * y cada figurita acelera hacia ese valor con `arrastre`. De ahí salen solas
 * las tres cosas que se pidieron: moverse despacio casi no mueve el aire,
 * moverse rápido levanta una ráfaga, y al frenar el aire se apaga y la figurita
 * sigue de largo con la velocidad que tenía.
 *
 * ---- POR QUÉ NO HAY RESORTE FUERTE AL ORIGEN ----
 * El motor viejo tenía uno (`resorte`, 0,07 a 0,095) y por eso las figuritas
 * "se sentían fijas": cualquier desplazamiento se deshacía en menos de medio
 * segundo. Acá no hay resorte mientras alguien está mirando; la única fuerza
 * que devuelve al origen entra RECIÉN a los ocho segundos y medio sin cursor,
 * con una rampa de dos segundos y medio para que no se note el arranque.
 */
export const FISICA = {
  /* ---------- El aire que levanta el puntero ---------- */
  /**
   * Hasta dónde llega la corriente.
   *
   * 280 y no los 180-240 del pliego original, porque es la constante que más
   * decide si la lámina se siente viva: no cambia cuánto se mueve UNA figurita,
   * cambia CUÁNTAS se mueven al pasar el cursor. Medido en el banco, con 215px
   * un barrido a velocidad normal de mouse movía tres figuritas más de 30px; con
   * 280 mueve seis. Una sola figurita moviéndose bien se lee como un efecto
   * puntual; media docena a la vez se lee como aire.
   */
  radioInfluenciaPx: 280,
  /**
   * Qué fracción de la velocidad del puntero llega a ser velocidad del aire,
   * en el mejor caso (figurita pegada al cursor, movilidad 1).
   *
   * Es la perilla de intensidad: el recorrido sale casi lineal con este número.
   * La cuenta de fondo es que, con fricción k por segundo, una figurita lanzada
   * a v0 recorre v0/ln(1/k) antes de parar.
   *
   * Curva de respuesta medida en el banco con los valores de acá —el recorrido
   * de la figurita que más se mueve, y entre paréntesis cuántas de las quince
   * pasan de 30px—:
   *
   *     300px/s  (paseo lento)      41px   (4)
   *     600px/s  (mouse normal)     55px   (5)
   *     900px/s  (mouse normal)     77px   (6)
   *    1400px/s  (barrido)          93px   (6)
   *    2200px/s  (manotazo)        123px   (8)
   *
   * La primera calibración se hizo contra un barrido de 1400px/s y quedó corta:
   * a velocidad normal de mouse daba 31-34px, que sobre una figurita de 250px de
   * ancho es un 12% de su propio tamaño y no se lee. Lo que importa es la fila
   * del medio, no la de abajo.
   */
  acopleAire: 0.16,
  /** Qué tan rápido la figurita alcanza la velocidad del aire, en 1/s. */
  arrastre: 20,
  /** Exponente de la caída con la distancia. 2 = cuadrática. */
  caidaExponente: 2,

  /* ---------- Que el cursor no la atraviese ---------- */
  /**
   * Adentro de este radio hay además un empuje que ALEJA del cursor, para que
   * el puntero no pase por encima de una figurita como si no estuviera.
   *
   * Esto también persigue una velocidad en vez de sumar una fuerza, y por el
   * mismo motivo que el aire pero con una lección de por medio: escrito como
   * aceleración constante de 1400px/s² —que parecía razonable— un paseo LENTO
   * por encima de una figurita la corría 106px. La cuenta es que bajo
   * aceleración constante la velocidad terminal es a/ln(1/fricción), o sea
   * 1400/1,204 = 1163px/s, y un cursor que se queda cerca la sostiene todo el
   * tiempo que quiera. Persiguiendo una velocidad no hay nada que acumular.
   */
  radioSeparacionPx: 85,
  /** A qué velocidad, como mucho, se aparta del cursor. En px/s. */
  velocidadSeparacionPx: 150,
  /** Qué tan rápido alcanza esa velocidad, en 1/s. */
  arrastreSeparacion: 7,
  /**
   * Velocidad de puntero a la que la separación ya vale por entero, en px/s.
   *
   * Es lo que hace que la separación sea de "al PASAR el cursor por encima" y
   * no de "estar el cursor por encima". Con el puntero quieto vale cero, así
   * que una figurita no se escapa sola de un cursor apoyado; con el puntero
   * lento vale poco, que es lo que pide la consigna.
   */
  punteroParaSeparacionPx: 600,

  /* ---------- Inercia ---------- */
  /**
   * Qué fracción de la velocidad sobrevive a un segundo.
   *
   * 0,55: al segundo queda el 55%, a los dos el 30% y a los tres el 17%. Medido
   * como recorrido por cada 100ms después de soltar: 6,9px al soltar, 3,9px al
   * segundo, 1,4px a los dos y medio. O sea que planea de verdad y se va
   * apagando, que es lo que se pidió, y no frena.
   *
   * Subirlo alarga el planeo Y aumenta el recorrido total, porque una figurita
   * lanzada a v0 recorre v0/ln(1/k): de 0,3 a 0,55 el mismo impulso llega el
   * doble de lejos.
   */
  friccionPorSegundo: 0.55,
  /** Techo de velocidad, en px/s. Nada se dispara. */
  velocidadMaximaPx: 900,

  /* ---------- Cuánto puede alejarse de su lugar ---------- */
  /**
   * Radio de merodeo de la figurita más liviana, en píxeles. No es un tope
   * duro: pasado ese radio aparece una fuerza que crece con el exceso, así que
   * la figurita se frena sola en vez de chocar contra una pared invisible.
   *
   * Tiene que quedar por encima del recorrido de la ráfaga más fuerte —hoy
   * 123px a 2200px/s— o la correa recorta justo lo que se quiso ganar.
   */
  recorridoPx: 150,
  /** Dureza de esa correa, en 1/s². */
  fuerzaCorrea: 9,
  /**
   * Por cuánto se multiplica el maxDesplazamientoPx de cada capa para sacar su
   * radio de merodeo.
   *
   * Existe porque el motor nuevo había dejado muerta la calibración por capa.
   * El manifiesto trae un recorrido propio para cada figurita —12px el paisaje
   * del fondo, 23 la Casa de Gobierno, 52 el sánguche— y eso no es decoración:
   * es lo que mantiene el orden de planos y lo que evita que una figurita se
   * pare encima de algo. El primer motor libre lo ignoraba y le daba 150px
   * planos a las doce de rol "cuerpo", así que la Casa de Gobierno —que a 1024
   * descansa con su borde izquierdo a 438px y su centro a la altura de la
   * bajada— podía merodear seis veces más de lo previsto.
   *
   * Tres es el número que conserva la intensidad que se buscó —la empanada
   * queda en 144px de correa contra los 123 que recorre una ráfaga fuerte— sin
   * perder las proporciones entre capas.
   */
  multiplicadorRecorrido: 3,
  /**
   * Techo por rol, como fracción de recorridoPx. Es un TOPE, no el valor: el
   * recorrido de cada capa sale de su propio maxDesplazamientoPx y esto sólo
   * lo recorta. Para las tres estructurales el que manda es este techo.
   */
  recorridoPorRol: { cuerpo: 1, titulo: 0.12, fondo: 0.2, ambiente: 0.28 },
  /** Movilidad extra por rol, encima de la profundidad de cada capa. */
  movilidadPorRol: { cuerpo: 1, titulo: 0.35, fondo: 0.5, ambiente: 0.6 },

  /* ---------- Masa ---------- */
  /**
   * Qué fracción del área del hero cuenta como masa 1.
   *
   * Fracción del hero y no un área fija en píxeles, y esto está medido: las
   * figuritas se dimensionan en vw, así que en una pantalla ancha son más
   * grandes en píxeles. Con una referencia fija de 46.000px² la misma ráfaga
   * corría la empanada 46px a 1425 de ancho pero sólo 34 a 1920 y 32 a 2560:
   * la figurita engordaba con la ventana y se volvía perezosa. Contra el área
   * del hero, una figurita que ocupa el mismo porcentaje de la lámina pesa lo
   * mismo en cualquier pantalla y la ráfaga se siente igual.
   *
   * El valor es el que deja intacta la calibración hecha a 1425x862, donde el
   * hero mide 1.228.350px² y la referencia vieja eran 46.000.
   *
   * La masa sale de la RAÍZ del área y no del área: sin la raíz el paisaje
   * pesaría treinta veces más que el mapa y no se movería nunca.
   */
  fraccionDeReferencia: 0.0375,
  /** Piso y techo de la masa, para que ningún extremo se vaya de escala. */
  masaMinima: 0.55,
  masaMaxima: 2.4,

  /* ---------- Giro ---------- */
  /** Cuánto giro levanta un impulso horizontal, en grados por (px/s). */
  giroPorImpulso: 0.055,
  /** Fracción de la velocidad angular que sobrevive a un segundo. */
  friccionGiroPorSegundo: 0.18,
  /** Cuánto tira el giro hacia cero, en 1/s². Muy poco: no es un resorte. */
  enderezado: 2.2,

  /* ---------- Flotación ambiente ---------- */
  /**
   * Permanente y con período propio por figurita, así que no se sincronizan.
   * Se suma al dibujar y no a la velocidad: si entrara como fuerza, la fricción
   * se la comería y el efecto dependería de cuánto se movió antes.
   */
  flotacionPx: 6,
  /**
   * Período de la figurita más lenta, en ms. Las demás salen de éste, cada una
   * un poco más rápida, para que ninguna pareja vuelva a coincidir dentro de
   * una visita: la última va a la mitad de este período.
   */
  flotacionPeriodoMs: 30_000,
  /**
   * Cuánto tarda la flotación en llegar a su amplitud, en ms.
   *
   * Existe porque cada figurita arranca con una fase propia y sin(fase) no es
   * cero: sin rampa, el primer cuadro de física escribía el desplazamiento
   * entero de una. Mil milisegundos alcanzan para que no se vea y son mucho
   * menos que el período más corto, que son catorce segundos.
   */
  rampaFlotacionMs: 1000,

  /* ---------- Que no terminen apiladas ---------- */
  /**
   * El collage está DISEÑADO con solapamientos, así que una separación normal
   * lo desarmaría en el primer cuadro. La distancia mínima de cada par no es la
   * suma de sus radios: es la menor entre esa suma y lo que estaban separadas
   * EN REPOSO. O sea que la separación sólo actúa si se juntaron más de lo que
   * el diseño ya las tenía, y el collage original nunca se empuja a sí mismo.
   *
   * De paso resuelve "no tapar del todo el rótulo": nada puede quedar más
   * encima del rótulo de lo que ya estaba.
   */
  /*
   * 1500 y no 260, que era el primer número: la separación tiene que escalar
   * con el viento. Al subir la intensidad, el aire empezó a ganarle y aparecían
   * pares apilados a 1100, 1280 y 1024 de ancho. Barrido en el banco, 1500 los
   * limpia todos; de ahí para arriba no cambia nada. No afecta al collage en
   * reposo: ahí la penetración es cero por construcción y la fuerza también.
   */
  fuerzaSeparacion: 1500,
  /** Radio de cada figurita como fracción de su media diagonal. */
  radioDeContacto: 0.5,

  /* ---------- La recomposición ---------- */
  /** Cuánto silencio hace falta antes de empezar a recomponer, en ms. */
  demoraRecomposicionMs: 8500,
  /** Cuánto tarda la recomposición en llegar a fuerza plena, en ms. */
  rampaRecomposicionMs: 2500,
  /** Dureza del resorte de recomposición, en 1/s². Flojo a propósito. */
  fuerzaRecomposicion: 0.85,

  /* ---------- Los bordes ---------- */
  /** Qué fracción de la velocidad sobrevive a un rebote. */
  rebote: 0.35,

  /* ---------- El bucle ---------- */
  /**
   * Techo del paso de tiempo, en ms. Volviendo de otra pestaña el primer
   * cuadro puede traer segundos enteros, y sin este techo las quince figuritas
   * saltarían de golpe al otro lado del hero.
   */
  deltaMaximoMs: 34,
  /** Constante de tiempo del suavizado de la velocidad del puntero, en ms. */
  suavizadoPunteroMs: 70,
  /** A qué ritmo se apaga la velocidad del puntero si deja de llegar. */
  desvanecidoPunteroPorSegundo: 0.02,
} as const;

/**
 * A cuántos píxeles de la columna el viento ya está del todo apagado.
 *
 * No es un interruptor: es una rampa, para que no se note el borde. A 70px de
 * la columna el viento vale la mitad, pegado a ella vale cero. Setenta es algo
 * más que el alto de una tarjeta, así que quien viene bajando por la lista las
 * encuentra quietas antes de llegar.
 */
export const RAMPA_DE_CALMA_PX = 70;
