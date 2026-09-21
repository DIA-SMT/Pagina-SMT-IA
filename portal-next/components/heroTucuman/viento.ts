/**
 * El viento del hero.
 *
 * Un solo `requestAnimationFrame` mueve dos clases de pieza con dos modelos
 * distintos, y eso es a propósito: no hay dos bucles compitiendo, hay uno con
 * dos leyes.
 *
 * ---- "resorte": la columna de la izquierda ----
 * Es el modelo original y no cambió. El título, la bajada, el buscador, las
 * seis tarjetas y el botón ondean cuando pasa una ráfaga por el campo de
 * figuritas y vuelven enseguida a su renglón. Tienen que volver: son texto que
 * se lee y controles que se apuntan. Además llevan el pozo de calma, que apaga
 * el viento cuando el cursor se acerca, para que el blanco no se corra justo
 * cuando alguien va a tocarlo.
 *
 * ---- "libre": las quince figuritas ----
 * Es el modelo nuevo. No hay resorte al origen mientras alguien está mirando:
 * la figurita recibe la ráfaga, se va, y se queda donde quedó. La única fuerza
 * que la devuelve entra a los ocho segundos y medio de silencio, con rampa.
 *
 * El puntero no empuja: mueve AIRE. En cada punto del hero el aire vale
 * `vPuntero · caida(distancia) · acopleAire · movilidad`, y cada figurita
 * acelera hacia esa velocidad. Perseguir una velocidad se limita solo; sumar
 * una fuerza se acumula, y con el cursor dando vueltas encima de una figurita
 * se dispararía. De ahí salen solas las tres cosas pedidas: despacio casi no
 * mueve aire, rápido levanta una ráfaga, y al frenar el aire se apaga y la
 * figurita sigue de largo con lo que traía.
 *
 * ---- Dónde escribe cada cosa ----
 * Las figuritas tienen DOS cajas: `.ht__capa` afuera y `.ht__cuerpo` adentro.
 * La línea de tiempo de la transformación escribe el `transform` de la de
 * afuera; esta física escribe el de la de adentro. Nunca se pisan, y por eso
 * la medición de la posición de reposo puede leer la caja de afuera tal cual:
 * el `transform` de un hijo no mueve la caja del padre.
 *
 * Las piezas de la columna no tienen esa caja interior —son el título y los
 * controles de verdad— así que escriben `translate` y `rotate`, que son
 * propiedades independientes, y le dejan `transform` al `:hover`.
 *
 * Todo esto corre fuera de React: nada de acá provoca un render.
 */

import { FISICA, RAMPA_DE_CALMA_PX, type CapaHero, type RolDeCapa } from "@/lib/heroTucuman";

/* ---------------------------------------------------------------- *
 *  El modelo viejo, sólo para la columna. Sus constantes quedan acá
 *  porque no las usa nadie más.
 * ---------------------------------------------------------------- */
/** Cuánto empuja la cercanía pura, sin contar la velocidad del cursor. */
const EMPUJE_BASE = 0.55;
/** Cuánto arrastra la velocidad del cursor. */
const ARRASTRE = 0.22;
/** Velocidad de cursor, en px por cuadro, que ya cuenta como ráfaga máxima. */
const VELOCIDAD_MAXIMA = 45;
/** Suavizado de la velocidad del cursor, para que un salto no pegue un tirón. */
const SUAVIZADO = 0.25;
/** Amplitud de la flotación ambiente, en píxeles, antes de la profundidad. */
const FLOTACION_PX = 5;

/** Pulsación de la flotación más lenta, en radianes por milisegundo. */
const OMEGA = (2 * Math.PI) / FISICA.flotacionPeriodoMs;

export type ModeloFisico = "resorte" | "libre";

/**
 * Una pieza que el viento mueve. Las diferencias entre una figurita y una
 * tarjeta están declaradas acá adentro en vez de repartidas en ifs por el
 * bucle.
 */
export type PiezaViento = {
  /** Dónde se escribe el desplazamiento. */
  el: HTMLElement;
  /**
   * Dónde se mide la posición de reposo, si no es el mismo elemento.
   *
   * Para una figurita es la caja de afuera: como la física escribe adentro, la
   * de afuera nunca se mueve y su rectángulo ES la posición de reposo, sin
   * tener que descontarle nada. Para las piezas de la columna no hay ancla y
   * hay que descontarle lo último que se escribió.
   */
  ancla?: HTMLElement;
  fisica: CapaHero["fisica"];
  modelo: ModeloFisico;
  /** Sólo para el modelo libre: cuánta libertad tiene. */
  rol?: RolDeCapa;
  /**
   * Si el recorte de la zona segura le aplica.
   *
   * Las figuritas sí: ninguna puede meterse encima de la columna. Las piezas de
   * la columna VIVEN adentro de ella, o sea del lado prohibido, así que el
   * mismo recorte las expulsaría al 43% del hero en el primer cuadro.
   */
  respetaZonaSegura: boolean;
  /**
   * Si el viento se apaga cuando el cursor se acerca a la columna.
   *
   * Es lo que hace que una tarjeta se pueda tocar. El empuje del modelo resorte
   * ALEJA del cursor —es lo que la hace sentir viva— y sobre un enlace eso
   * significa que el blanco se corre justo cuando alguien va a apuntarle.
   */
  seAquieta: boolean;
  propiedad: "transform" | "translate";
  /**
   * Si `destruir()` tiene que borrarle lo que escribió.
   *
   * Las piezas de la columna sí: son el título y los controles de verdad, no
   * las tiene nadie en un Map y sin esto se quedaban con el último
   * desplazamiento puesto para siempre después de volver a la fotografía.
   *
   * Las figuritas no, y es a propósito. Al volver a la fotografía la animación
   * de regreso anima su caja de AFUERA mientras la de adentro conserva el
   * desplazamiento: así cada una se desvanece desde donde quedó. Borrándoselo
   * acá, las quince pegaban un salto a su sitio original justo antes de
   * empezar a irse. Lo limpia el componente con soltarCapas cuando ya son
   * invisibles.
   */
  limpiaAlDestruir: boolean;
};

type Estado = {
  p: PiezaViento;
  el: HTMLElement;
  ancla: HTMLElement;
  /** Desplazamiento actual, en píxeles, respecto de su lugar en la lámina. */
  x: number; y: number;
  /** Velocidad. En el modelo libre va en px/s; en el resorte, en px por cuadro. */
  vx: number; vy: number;
  /** Lo último que se ESCRIBIÓ, que no es lo mismo que x e y: incluye la flotación. */
  px: number; py: number;
  /** Giro actual en grados y su velocidad angular. */
  giro: number; vGiro: number;
  /** Centro de reposo dentro del hero, en píxeles. Se recalcula al redimensionar. */
  cx: number; cy: number;
  /** Medias medidas, para recortar contra los bordes. */
  media: number; mediaAlto: number;
  /** Radio de contacto, para la separación entre figuritas. */
  radio: number;
  /** Masa aproximada, de la raíz del área. */
  masa: number;
  /** Movilidad efectiva: profundidad de la capa por la de su rol, sobre la masa. */
  movilidad: number;
  /** Hasta dónde puede alejarse antes de que aparezca la correa. */
  recorridoMax: number;
  /** Aceleración de separación acumulada en la pasada previa del cuadro. */
  sepX: number; sepY: number;
  /** Período y fase propios de la flotación. */
  wx: number; wy: number; fase: number;
};

export type Viento = {
  /** Arranca el bucle. Idempotente. */
  encender(): void;
  /** Frena el bucle y deja las piezas donde están. */
  apagar(): void;
  /** Recalcula centros, masas y límites. Llamar al redimensionar. */
  medir(): void;
  /** Saca todos los listeners y cancela el cuadro pendiente. */
  destruir(): void;
};

export function crearViento(
  contenedor: HTMLElement,
  piezas: PiezaViento[],
  limiteIzquierdoPx: () => number,
  /** La columna: donde se apaga el viento de las piezas que se aquietan. */
  zonaDeCalma: () => HTMLElement | null,
): Viento {
  const estados: Estado[] = piezas.map((p, i) => ({
    p,
    el: p.el,
    ancla: p.ancla ?? p.el,
    x: 0, y: 0, vx: 0, vy: 0,
    px: 0, py: 0,
    giro: 0, vGiro: 0,
    cx: 0, cy: 0, media: 0, mediaAlto: 0,
    radio: 0, masa: 1, movilidad: 1, recorridoMax: 0,
    sepX: 0, sepY: 0,
    // Períodos primos entre sí y una fase distinta por pieza: así ninguna
    // pareja vuelve a coincidir dentro de una visita. Los dos ejes salen del
    // mismo período de FISICA y no de números sueltos, para que la constante
    // sirva de verdad para ajustar la flotación.
    wx: OMEGA * (1 + i * 0.0812),
    wy: OMEGA * (1.2414 + i * 0.06207),
    fase: i * 1.7,
  }));

  /** Sólo las figuritas, que son las que se separan entre sí. */
  const libres = estados.filter((e) => e.p.modelo === "libre");
  /**
   * Distancia a la que estaba cada par EN REPOSO. La separación nunca empuja
   * más allá de esto, así que el collage diseñado no se desarma solo.
   */
  const enReposo = new Float64Array(libres.length * libres.length);

  let cursorX = -9999, cursorY = -9999, hayCursor = false;
  /** Velocidad del puntero en px/s, suavizada. */
  let velX = 0, velY = 0;
  /** Y la del modelo viejo, en px por cuadro. */
  let velCuadroX = 0, velCuadroY = 0;
  let ultX = 0, ultY = 0, ultoMs = 0;
  let cuadro = 0, andando = false, anterior = 0;
  /**
   * El tiempo de la flotación, en ms, contando SÓLO los cuadros que se
   * dibujaron. No es performance.now(): ver el comentario en paso().
   */
  let reloj = 0;
  /** Milisegundos desde la última vez que el puntero movió aire. */
  let silencioMs = 0;
  let limite = 0, anchoHero = 0, altoHero = 0;
  /** La caja de la columna en coordenadas del hero, o null si no hay. */
  let calma: { izq: number; der: number; arr: number; aba: number } | null = null;

  function medir() {
    const caja = contenedor.getBoundingClientRect();
    limite = limiteIzquierdoPx();
    anchoHero = caja.width;
    altoHero = caja.height;
    const col = zonaDeCalma();
    if (col) {
      const c = col.getBoundingClientRect();
      calma = {
        izq: c.left - caja.left,
        der: c.right - caja.left,
        arr: c.top - caja.top,
        aba: c.bottom - caja.top,
      };
    } else {
      calma = null;
    }

    for (const e of estados) {
      const c = e.ancla.getBoundingClientRect();
      // Si el ancla es OTRO elemento —la caja de afuera de una figurita— su
      // rectángulo ya es la posición de reposo: el transform de un hijo no
      // mueve la caja del padre. Si el ancla es el mismo elemento en el que se
      // escribe, hay que descontarle lo que tenga puesto AHORA. Y ojo: no es
      // e.x, que es sólo la parte de la física; lo que está escrito es px, o
      // sea la física MÁS la flotación MÁS lo que corrieron los recortes.
      const propio = e.ancla === e.el ? 1 : 0;
      e.cx = c.left - caja.left + c.width / 2 - e.px * propio;
      e.cy = c.top - caja.top + c.height / 2 - e.py * propio;
      e.media = c.width / 2;
      e.mediaAlto = c.height / 2;
      e.radio = Math.hypot(e.media, e.mediaAlto) * FISICA.radioDeContacto;

      // La masa se mide contra el área del HERO y no contra un número fijo de
      // píxeles: las figuritas se dimensionan en vw, así que en una pantalla
      // ancha son más grandes, y con una referencia fija engordaban con la
      // ventana y la misma ráfaga las movía menos.
      const referencia = Math.max(1, anchoHero * altoHero * FISICA.fraccionDeReferencia);
      e.masa = Math.min(
        FISICA.masaMaxima,
        Math.max(FISICA.masaMinima, Math.sqrt((c.width * c.height) / referencia)),
      );
      const rol = e.p.rol ?? "cuerpo";
      e.movilidad = (e.p.fisica.profundidad * FISICA.movilidadPorRol[rol]) / e.masa;
      // El recorrido sale del maxDesplazamientoPx de la capa, que es la
      // calibración del manifiesto, y el rol sólo le pone un techo. Antes era
      // el techo a secas y las doce de rol "cuerpo" merodeaban los mismos
      // 150px sin importar si eran una empanada o la Casa de Gobierno.
      e.recorridoMax = Math.min(
        e.p.fisica.maxDesplazamientoPx * FISICA.multiplicadorRecorrido,
        FISICA.recorridoPx * FISICA.recorridoPorRol[rol],
      );
    }

    // Las distancias de reposo, una sola vez por medición.
    for (let i = 0; i < libres.length; i++) {
      for (let j = i + 1; j < libres.length; j++) {
        const d = Math.hypot(libres[i].cx - libres[j].cx, libres[i].cy - libres[j].cy);
        enReposo[i * libres.length + j] = d;
        enReposo[j * libres.length + i] = d;
      }
    }
  }

  function alMover(ev: PointerEvent) {
    const caja = contenedor.getBoundingClientRect();
    const nx = ev.clientX - caja.left;
    const ny = ev.clientY - caja.top;
    const ahora = performance.now();

    if (hayCursor) {
      // En px por cuadro, para el modelo resorte, tal como estaba.
      velCuadroX += (nx - ultX - velCuadroX) * SUAVIZADO;
      velCuadroY += (ny - ultY - velCuadroY) * SUAVIZADO;

      // Y en px por segundo, para el modelo libre. El suavizado es por TIEMPO
      // y no por evento: un mouse de 1000Hz manda diez veces más eventos que
      // uno de 125Hz y con un factor fijo el mismo gesto daría velocidades
      // distintas según el mouse.
      const dt = Math.max(1, ahora - ultoMs);
      const k = 1 - Math.exp(-dt / FISICA.suavizadoPunteroMs);
      velX += (((nx - ultX) / dt) * 1000 - velX) * k;
      velY += (((ny - ultY) / dt) * 1000 - velY) * k;
    }

    ultX = nx; ultY = ny; ultoMs = ahora;
    cursorX = nx; cursorY = ny;
    hayCursor = true;
    silencioMs = 0;
  }

  function alSalir() {
    hayCursor = false;
    cursorX = -9999; cursorY = -9999;
    velX = 0; velY = 0;
    velCuadroX = 0; velCuadroY = 0;
  }

  /* ---------------------------------------------------------------- *
   *  El modelo viejo: resorte amortiguado, por cuadro. La columna.
   * ---------------------------------------------------------------- */
  function pasoResorte(e: Estado, quietud: number, rapidez: number, ambiente: number) {
    const f = e.p.fisica;
    let fx = 0, fy = 0;

    if (hayCursor && quietud > 0) {
      const dx = e.cx - cursorX;
      const dy = e.cy - cursorY;
      const d = Math.hypot(dx, dy) || 0.001;
      if (d < f.radioPx) {
        const caida = (1 - d / f.radioPx) ** 2;
        const ux = dx / d, uy = dy / d;
        const empuje = (EMPUJE_BASE + rapidez) * caida * f.profundidad * quietud;
        fx += ux * empuje * f.maxDesplazamientoPx * 0.09;
        fy += uy * empuje * f.maxDesplazamientoPx * 0.09;
        fx += velCuadroX * caida * f.profundidad * ARRASTRE * quietud;
        fy += velCuadroY * caida * f.profundidad * ARRASTRE * quietud;
      }
    }

    fx += -e.x * f.resorte;
    fy += -e.y * f.resorte;

    e.vx = (e.vx + fx) * f.amortiguacion;
    e.vy = (e.vy + fy) * f.amortiguacion;
    e.x += e.vx;
    e.y += e.vy;

    const tope = f.maxDesplazamientoPx;
    const largo = Math.hypot(e.x, e.y);
    if (largo > tope) {
      e.x = (e.x / largo) * tope;
      e.y = (e.y / largo) * tope;
    }

    e.giro = Math.max(-f.maxGiroGrados, Math.min(f.maxGiroGrados, e.vx * 0.55 * f.profundidad));

    return {
      flx: Math.sin(reloj * e.wx + e.fase) * FLOTACION_PX * f.profundidad * ambiente * quietud,
      fly: Math.cos(reloj * e.wy + e.fase * 1.3) * FLOTACION_PX * f.profundidad * ambiente * quietud,
    };
  }

  /* ---------------------------------------------------------------- *
   *  El modelo nuevo: aire, inercia y recomposición lenta. Las figuritas.
   * ---------------------------------------------------------------- */
  function pasoLibre(e: Estado, dt: number) {
    const f = e.p.fisica;
    // Dónde está AHORA, que no es dónde nació.
    const x = e.cx + e.x;
    const y = e.cy + e.y;

    let ax = e.sepX, ay = e.sepY;

    if (hayCursor) {
      const dx = x - cursorX;
      const dy = y - cursorY;
      const d = Math.hypot(dx, dy) || 0.001;

      // ---- La corriente de aire ----
      if (d < FISICA.radioInfluenciaPx) {
        const caida = (1 - d / FISICA.radioInfluenciaPx) ** FISICA.caidaExponente;
        const acople = FISICA.acopleAire * e.movilidad * caida;
        // Acelera HACIA la velocidad del aire, no en la dirección de la
        // distancia: por eso un barrido rápido la empuja para donde va el
        // cursor, que es lo que se pidió, y no en estrella.
        ax += (velX * acople - e.vx) * FISICA.arrastre * caida;
        ay += (velY * acople - e.vy) * FISICA.arrastre * caida;
      }

      // ---- Y el cuerpo del cursor, que no la atraviesa ----
      // También persigue una velocidad, no suma una fuerza. Y se abre con la
      // rapidez del puntero: es una separación de "al PASAR el cursor por
      // encima", así que un cursor apoyado y quieto no empuja nada.
      if (d < FISICA.radioSeparacionPx) {
        const apertura = Math.min(
          1,
          Math.hypot(velX, velY) / FISICA.punteroParaSeparacionPx,
        );
        if (apertura > 0) {
          const ux = dx / d, uy = dy / d;
          const objetivo =
            FISICA.velocidadSeparacionPx *
            (1 - d / FISICA.radioSeparacionPx) ** 2 *
            apertura *
            e.movilidad;
          // Sólo la componente radial: separarse es alejarse del cursor, y lo
          // que la figurita traiga de costado no es asunto de esta fuerza.
          const radial = e.vx * ux + e.vy * uy;
          const falta = (objetivo - radial) * FISICA.arrastreSeparacion;
          ax += ux * falta;
          ay += uy * falta;
        }
      }
    }

    // ---- La correa ----
    // No es un tope duro: aparece pasado el radio de merodeo y crece con el
    // exceso, así que la figurita desacelera sola en vez de chocar contra una
    // pared invisible.
    const lejos = Math.hypot(e.x, e.y);
    if (lejos > e.recorridoMax) {
      const exceso = lejos - e.recorridoMax;
      ax -= (e.x / lejos) * exceso * FISICA.fuerzaCorrea;
      ay -= (e.y / lejos) * exceso * FISICA.fuerzaCorrea;
    }

    // ---- La recomposición ----
    // Recién después del silencio, y entrando por una rampa para que no se vea
    // el instante en que empieza.
    if (silencioMs > FISICA.demoraRecomposicionMs) {
      const rampa = Math.min(
        1,
        (silencioMs - FISICA.demoraRecomposicionMs) / FISICA.rampaRecomposicionMs,
      );
      ax -= e.x * FISICA.fuerzaRecomposicion * rampa;
      ay -= e.y * FISICA.fuerzaRecomposicion * rampa;
    }

    // ---- Integración ----
    e.vx += ax * dt;
    e.vy += ay * dt;
    const roce = FISICA.friccionPorSegundo ** dt;
    e.vx *= roce;
    e.vy *= roce;

    const rapido = Math.hypot(e.vx, e.vy);
    if (rapido > FISICA.velocidadMaximaPx) {
      e.vx = (e.vx / rapido) * FISICA.velocidadMaximaPx;
      e.vy = (e.vy / rapido) * FISICA.velocidadMaximaPx;
    }

    e.x += e.vx * dt;
    e.y += e.vy * dt;

    // ---- Los bordes, con rebote amortiguado ----
    // Se corrige el ESTADO y no sólo lo que se dibuja: corrigiendo el dibujo,
    // la figurita se queda pegada al borde con la velocidad intacta y sale
    // disparada en cuanto el borde se corre.
    // ---- El tope izquierdo frena, no empuja ----
    // El mínimo se topa contra cero, y eso cambia todo. Con el límite medido
    // contra el contenido real de la columna, a 1024-1200px de ancho varias
    // figuritas DESCANSAN con su borde izquierdo ya adentro de esa franja: es
    // la composición que se calibró a ojo y se verificó así. Aplicando el tope
    // en absoluto, el motor las corría hasta 128px de su sitio estando quietas,
    // o sea rediseñaba la lámina en vez de protegerla.
    //
    // Con el Math.min(0, ...), una figurita que ya nace pisando la franja se
    // queda exactamente donde la pusieron y no puede ir NI UN PÍXEL más a la
    // izquierda; y una que nace afuera puede acercarse hasta tocar el límite y
    // no más. En los dos casos el viento no puede empeorar el solape, que es
    // todo lo que el recorte tiene que garantizar.
    const izqPermitido = e.p.respetaZonaSegura ? limite : 0;
    const min = Math.min(0, izqPermitido - (e.cx - e.media));
    const max = anchoHero - (e.cx + e.media);
    if (e.x < min) { e.x = min; if (e.vx < 0) e.vx = -e.vx * FISICA.rebote; }
    else if (e.x > max) { e.x = max; if (e.vx > 0) e.vx = -e.vx * FISICA.rebote; }
    const arr = -(e.cy - e.mediaAlto);
    const aba = altoHero - (e.cy + e.mediaAlto);
    if (e.y < arr) { e.y = arr; if (e.vy < 0) e.vy = -e.vy * FISICA.rebote; }
    else if (e.y > aba) { e.y = aba; if (e.vy > 0) e.vy = -e.vy * FISICA.rebote; }

    // ---- El giro ----
    // Sale del impulso horizontal —una hoja empujada se ladea— y se endereza
    // sola, despacio, para que nada quede torcido para siempre.
    e.vGiro += (ax / e.masa) * FISICA.giroPorImpulso * dt;
    e.vGiro -= e.giro * FISICA.enderezado * dt;
    e.vGiro *= FISICA.friccionGiroPorSegundo ** dt;
    e.giro += e.vGiro * dt;
    if (e.giro > f.maxGiroGrados) { e.giro = f.maxGiroGrados; e.vGiro = 0; }
    else if (e.giro < -f.maxGiroGrados) { e.giro = -f.maxGiroGrados; e.vGiro = 0; }

    // ---- La flotación ambiente ----
    // Permanente: no se apaga con la ráfaga y sobrevive a la recomposición,
    // que es lo que se pidió. Va al dibujo y no a la velocidad; entrando como
    // fuerza, la fricción se la comería y la amplitud dependería de lo que la
    // figurita hubiera hecho antes.
    //
    // Entra por una rampa corta porque con el reloj en cero sin(fase) NO es
    // cero: cada figurita arranca con una fase propia —i·1,7— justamente para
    // que no ondeen todas juntas. Sin la rampa, el primer cuadro seguiría
    // escribiendo sin(fase)·amplitud de una. Se descartó restarle su valor
    // inicial a cada una: eso deja a la figurita oscilando alrededor de un
    // punto corrido unos píxeles de su lugar en la lámina, para siempre.
    const amplitud =
      FISICA.flotacionPx * e.movilidad * Math.min(1, reloj / FISICA.rampaFlotacionMs);
    return {
      flx: Math.sin(reloj * e.wx + e.fase) * amplitud,
      fly: Math.cos(reloj * e.wy + e.fase * 1.3) * amplitud,
    };
  }

  /**
   * La separación entre figuritas, en una pasada aparte porque cada par toca a
   * los dos. Quince piezas son 105 pares: no hace falta ninguna grilla.
   */
  function separar() {
    for (const e of libres) { e.sepX = 0; e.sepY = 0; }
    for (let i = 0; i < libres.length; i++) {
      const a = libres[i];
      for (let j = i + 1; j < libres.length; j++) {
        const b = libres[j];
        const dx = a.cx + a.x - (b.cx + b.x);
        const dy = a.cy + a.y - (b.cy + b.y);
        const d = Math.hypot(dx, dy) || 0.001;
        // Nunca se las separa más de lo que ya estaban en la lámina.
        const minimo = Math.min(a.radio + b.radio, enReposo[i * libres.length + j]);
        if (d >= minimo) continue;
        const empuje = ((minimo - d) / minimo) * FISICA.fuerzaSeparacion;
        const ux = dx / d, uy = dy / d;
        a.sepX += (ux * empuje) / a.masa;
        a.sepY += (uy * empuje) / a.masa;
        b.sepX -= (ux * empuje) / b.masa;
        b.sepY -= (uy * empuje) / b.masa;
      }
    }
  }

  function escribir(e: Estado, px: number, py: number) {
    e.px = px;
    e.py = py;
    if (e.p.propiedad === "transform") {
      e.el.style.transform =
        `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0) rotate(${e.giro.toFixed(2)}deg)`;
    } else {
      e.el.style.translate = `${px.toFixed(2)}px ${py.toFixed(2)}px`;
      e.el.style.rotate = `${e.giro.toFixed(2)}deg`;
    }
  }

  function paso(ahora: number) {
    if (!andando) return;

    // El paso de tiempo, con techo. Volviendo de otra pestaña el primer cuadro
    // trae segundos enteros y sin techo las quince figuritas saltarían al otro
    // lado del hero de una.
    const dt = Math.min(FISICA.deltaMaximoMs, ahora - anterior) / 1000;
    anterior = ahora;
    // ---- El reloj de la flotación se ACUMULA, no se copia ----
    // Antes decía `reloj = ahora`, o sea la marca absoluta del rAF: los
    // milisegundos desde que cargó la página. Como la flotación la usa de fase
    // —sin(reloj·w + fase)— el primer cuadro de física escribía un valor
    // cualquiera dentro de ±amplitud, de golpe, sobre una figurita que la
    // transformación acababa de dejar en cero. Medido corriendo este mismo
    // motor contra un DOM simulado y barriendo el instante del traspaso entre
    // los 3 y los 120 segundos de vida de la página: el salto llegaba a 11px en
    // UN cuadro, con 8 a 10 de las quince saltando más de 4px, cada una para su
    // lado. Y pasaba en todas las aperturas, no en un caso de borde.
    //
    // Lo mismo al reanudar: con la pestaña oculta el reloj seguía corriendo,
    // así que al volver la fase había avanzado 90.000·w radianes y el primer
    // cuadro visible saltaba hasta 16px.
    //
    // Acumulando dt sólo cuando hay cuadros, la fase es continua por
    // construcción: ni el traspaso ni la reanudación pueden dar un salto.
    reloj += dt * 1000;
    silencioMs += dt * 1000;

    // La velocidad del puntero se apaga sola si deja de llegar movimiento; sin
    // esto una ráfaga quedaría soplando para siempre.
    const desvanecido = FISICA.desvanecidoPunteroPorSegundo ** dt;
    velX *= desvanecido;
    velY *= desvanecido;
    velCuadroX *= 0.9;
    velCuadroY *= 0.9;

    // Una sola lectura por cuadro y no una por pieza.
    const conFoco = document.activeElement;
    const rapidez = Math.min(1, Math.hypot(velCuadroX, velCuadroY) / VELOCIDAD_MAXIMA);
    const ambiente = 1 - rapidez;

    if (libres.length > 1) separar();

    for (const e of estados) {
      // ---- El pozo de calma ----
      // Vale 1 lejos de la columna y 0 pegado a ella, con una rampa en el medio
      // para que el borde no se note. Apaga las dos fuentes de movimiento —el
      // empuje y la flotación— y no sólo el empuje: si la tarjeta siguiera
      // respirando, el blanco se seguiría moviendo un par de píxeles justo
      // cuando alguien apunta, que es lo que esto viene a evitar.
      let quietud = 1;
      if (e.p.seAquieta) {
        if (conFoco && (e.el === conFoco || e.el.contains(conFoco))) {
          // Lo que tiene el foco no se mueve, y esto no es un detalle: el campo
          // del buscador es una de estas piezas. Quien está tabulando o
          // escribiendo tiene el mouse en cualquier otro lado —o no lo tiene—,
          // así que el pozo de calma, que sólo mira el cursor, no lo protege.
          // Un campo de texto que deriva mientras se escribe es intolerable.
          quietud = 0;
        } else if (hayCursor && calma) {
          const fuera = Math.hypot(
            Math.max(calma.izq - cursorX, 0, cursorX - calma.der),
            Math.max(calma.arr - cursorY, 0, cursorY - calma.aba),
          );
          quietud = Math.min(1, fuera / RAMPA_DE_CALMA_PX);
        }
      }

      const { flx, fly } =
        e.p.modelo === "libre" ? pasoLibre(e, dt) : pasoResorte(e, quietud, rapidez, ambiente);

      let px = e.x + flx;
      let py = e.y + fly;

      // ---- Los recortes del dibujo ----
      // El modelo libre ya corrigió su estado contra los bordes; esto atrapa lo
      // único que queda afuera de esa cuenta, que es la flotación. Para el
      // modelo resorte es el único recorte que hay.
      //
      // Se recorta contra la caja del hero y no contra el clip: el hero tiene
      // overflow: clip, así que una figurita empujada afuera no desborda la
      // página pero SÍ se ve cortada, y una figurita cortada deja de leerse
      // como figurita porque lo que la define es el borde blanco.
      const izq = e.cx - e.media + px;
      const der = e.cx + e.media + px;
      const arr = e.cy - e.mediaAlto + py;
      const aba = e.cy + e.mediaAlto + py;
      if (izq < 0) px -= izq;
      else if (der > anchoHero) px -= der - anchoHero;
      if (arr < 0) py -= arr;
      else if (aba > altoHero) py -= aba - altoHero;

      // Y el que de verdad importa, último para que le gane a los otros: el
      // borde izquierdo no puede entrar en la columna del buscador y las seis
      // tarjetas.
      //
      // Con el mismo tope contra cero que en la integración, y por el mismo
      // motivo: a anchos chicos hay figuritas que ya descansan pisando esa
      // franja, y corregir en absoluto las movía de su sitio con la página
      // quieta. Acá lo único que se corrige es lo que agregaron la física y la
      // flotación.
      if (e.p.respetaZonaSegura) {
        const minPermitido = Math.min(0, limite - (e.cx - e.media));
        if (px < minPermitido) px = minPermitido;
      }

      escribir(e, px, py);
    }

    cuadro = requestAnimationFrame(paso);
  }

  contenedor.addEventListener("pointermove", alMover, { passive: true });
  contenedor.addEventListener("pointerleave", alSalir, { passive: true });

  return {
    encender() {
      if (andando) return;
      andando = true;
      medir();
      // El reloj arranca ACÁ y no en el cuadro anterior: apagar y encender
      // —al volver a la pestaña, al volver a entrar el hero en pantalla— dejaba
      // un hueco de minutos que el primer dt se habría comido entero si no
      // estuviera el techo, y con el techo igual daba un salto de dos cuadros.
      anterior = performance.now();
      cuadro = requestAnimationFrame(paso);
    },
    apagar() {
      andando = false;
      if (cuadro) cancelAnimationFrame(cuadro);
      cuadro = 0;
    },
    medir,
    destruir() {
      this.apagar();
      for (const e of estados) {
        e.px = 0; e.py = 0; e.x = 0; e.y = 0; e.vx = 0; e.vy = 0;
        e.giro = 0; e.vGiro = 0;
        if (!e.p.limpiaAlDestruir) continue;
        if (e.p.propiedad === "transform") {
          e.el.style.transform = "";
        } else {
          e.el.style.translate = "";
          e.el.style.rotate = "";
        }
      }
      contenedor.removeEventListener("pointermove", alMover);
      contenedor.removeEventListener("pointerleave", alSalir);
    },
  };
}
