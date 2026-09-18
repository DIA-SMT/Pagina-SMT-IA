/**
 * La transformación: la fotografía se vuelve stickers.
 *
 * Todo con Web Animations API y nada más. No hace falta una librería: WAAPI ya
 * da escalonado por `delay`, curvas propias y un `finished` que avisa cuándo
 * terminó de verdad. Meter Framer Motion serían unos 50 kB comprimidos en un
 * portal que hoy no tiene ninguna dependencia de cliente más allá de React.
 *
 * ---- LA ILUSIÓN ----
 * La Imagen 1 es una fotografía aplanada: no hay forma de hacer un morph real
 * de píxeles. Lo que se hace es aparecer cada sticker EXACTAMENTE encima de su
 * equivalente fotográfico, al tamaño que tiene ahí, y recién entonces dejarlo
 * viajar. Como la foto se desvanece al mismo tiempo, el ojo lee que el objeto
 * se despegó de la escena.
 *
 * ---- POR QUÉ LAS POSES SE CALCULAN EN CADA CORRIDA ----
 * Las poses de entrada están guardadas en porcentaje de la FOTO, no del hero.
 * Con object-fit: cover el recorte depende de la proporción de la ventana: a
 * 1440x900 el hero es 1,71:1 y la foto 1,78:1, así que sobra foto a los
 * costados; a 1440x700 el hero es 2,06:1 y lo que sobra es arriba y abajo. Si
 * las poses se guardaran en coordenadas del hero, los stickers aparecerían
 * corridos de su objeto en cuanto alguien cambiara el alto de la ventana.
 *
 * ---- POR QUÉ EL FONDO SE REVELA CON OPACIDAD Y NO CON UNA MÁSCARA ----
 * Una máscara radial que crece obliga a repintar una capa del tamaño del hero
 * en cada cuadro, que es justo lo que las restricciones de rendimiento piden
 * evitar. La sensación orgánica la da la onda de la fase A, que es un solo
 * elemento chico animado con transform.
 */

import { CAPAS, FASES, ESCALONADO_MS, FOTO, type CapaHero } from "@/lib/heroTucuman";

/** Salida de un sticker: el elemento y la capa que le corresponde. */
export type CapaMontada = { capa: CapaHero; el: HTMLElement };

type Piezas = {
  hero: HTMLElement;
  foto: HTMLElement;
  onda: HTMLElement;
  /**
   * El panel de la columna. Viaja acá y no lo maneja el CSS porque tiene que
   * apagarse EXACTAMENTE cuando se apaga la fotografía, y eso es un instante
   * que sólo conoce esta línea de tiempo.
   *
   * Colgado de data-fase se apagaba tarde: la foto llega a opacidad 0 en el
   * ms 1900 y la fase recién pasa a "interactivo" en el 2300, cuando termina
   * el asentamiento de la fase E. En esos 400ms —y en los 800 anteriores,
   * mientras la foto se va— quedaba una pared oscura encima del fondo crema,
   * que es justo lo que este cambio venía a sacar.
   *
   * Es null en teléfono, donde el panel no existe.
   */
  panel: HTMLElement | null;
  capas: CapaMontada[];
};

/**
 * Dónde cae realmente la fotografía dentro del hero, con object-fit: cover.
 * Devuelve la escala y el desplazamiento para pasar de coordenadas de la foto
 * a píxeles del hero.
 */
export function encuadreDeLaFoto(anchoHero: number, altoHero: number) {
  const propFoto = FOTO.ancho / FOTO.alto;
  const propHero = anchoHero / altoHero;
  const escala = propHero > propFoto ? anchoHero / FOTO.ancho : altoHero / FOTO.alto;
  return {
    escala,
    dx: (anchoHero - FOTO.ancho * escala) / 2,
    dy: (altoHero - FOTO.alto * escala) / 2,
  };
}

/** Un punto en porcentaje de la foto, llevado a píxeles del hero. */
function puntoDeLaFoto(
  encuadre: ReturnType<typeof encuadreDeLaFoto>,
  xPct: number,
  yPct: number,
) {
  return {
    x: encuadre.dx + (xPct / 100) * FOTO.ancho * encuadre.escala,
    y: encuadre.dy + (yPct / 100) * FOTO.alto * encuadre.escala,
  };
}

/** Curva con un poco de sobrepaso: el sticker llega y se asienta. */
const ASENTAR = "cubic-bezier(0.22, 1.18, 0.36, 1)";
const SALIDA = "cubic-bezier(0.32, 0, 0.67, 0)";

/**
 * Cuánto tarda el panel en cruzar, en milisegundos, en los dos sentidos.
 *
 * Es el único tramo en que ni la tinta clara ni la oscura llegan a 4,5:1, así
 * que es corto a propósito. La tinta cruza en el medio, con la transición de
 * --t-rapida (150ms), así que la ventana floja queda en unos 150ms.
 */
const CRUCE_MS = 200;

/**
 * Las animaciones vuelven separadas en dos grupos a propósito. Al terminar hay
 * que cancelar SÓLO las de las capas, porque su `fill: both` retiene el
 * `transform` y el viento no podría escribir sobre el mismo elemento. Las de la
 * escena —la foto que se fue, la onda— tienen que conservar su estado final.
 */
export type Corrida = {
  terminado: Promise<void>;
  animaciones: Animation[];
  animacionesDeCapas: Animation[];
  /**
   * El instante EXACTO en que la columna cambia de fondo, para que el texto
   * cambie de tinta ahí y no cuando termina todo lo demás.
   *
   * Por qué hace falta un instante propio: detrás de la columna el fondo pasa
   * de oscuro —foto con el panel encima— a claro —el crema del collage—, y no
   * existe ningún color de letra que aguante los dos. Para 4,5:1 sobre el
   * fondo con panel (luminancia 0,115) hace falta una tinta con luminancia
   * ≤0,012, o sea casi negro puro; y ese mismo casi negro sobre el fondo
   * oscuro da 3,3:1. No es que no lo encontramos: no existe. El cruce es
   * inevitable y lo único que se puede hacer es que sea corto y que las dos
   * puntas —el panel y la tinta— crucen JUNTAS.
   *
   * Se resuelve con false si la corrida se canceló antes de llegar, que es lo
   * que pasa cuando alguien dispara otra corrida a mitad de camino.
   */
  papel: Promise<boolean>;
};

/**
 * Un metrónomo: una animación sin efecto, sólo para tener un instante del
 * MISMO reloj que todo lo demás.
 *
 * No es un setTimeout a propósito. Un setTimeout corre contra el reloj del
 * navegador y no contra document.timeline, así que se desincroniza si el
 * navegador ralentiza la pestaña, y sobre todo no se cancela cuando se
 * cancelan las animaciones: quedaría disparando un cambio de color de una
 * corrida que ya no existe.
 */
function metronomo(el: HTMLElement, ms: number) {
  return el.animate([{ opacity: 1 }, { opacity: 1 }], { duration: Math.max(1, ms) });
}

export function correrTransformacion(
  { hero, foto, onda, panel, capas }: Piezas,
  clic: { x: number; y: number },
): Corrida {
  const caja = hero.getBoundingClientRect();
  const encuadre = encuadreDeLaFoto(caja.width, caja.height);
  const animaciones: Animation[] = [];
  const animacionesDeCapas: Animation[] = [];

  // ---- Fase A: la onda desde el punto del clic y el respingo de la foto ----
  onda.style.left = `${clic.x}px`;
  onda.style.top = `${clic.y}px`;
  // La onda tiene que llegar a cubrir el hero desde donde sea que se tocó.
  const alcance = Math.hypot(
    Math.max(clic.x, caja.width - clic.x),
    Math.max(clic.y, caja.height - clic.y),
  );
  animaciones.push(
    onda.animate(
      [
        { transform: "translate(-50%, -50%) scale(0)", opacity: 0.38 },
        { transform: `translate(-50%, -50%) scale(${(alcance / 40).toFixed(2)})`, opacity: 0 },
      ],
      { duration: FASES.A.hasta - FASES.A.desde + 380, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" },
    ),
  );

  animaciones.push(
    foto.animate(
      [
        { transform: "scale(1)", filter: "brightness(1) saturate(1)", opacity: 1, offset: 0 },
        { transform: "scale(1.022)", filter: "brightness(1.06) saturate(1.1)", opacity: 1, offset: FASES.A.hasta / FASES.E.hasta },
        { transform: "scale(1.035)", filter: "brightness(1.02) saturate(0.9)", opacity: 1, offset: FASES.D.desde / FASES.E.hasta },
        { transform: "scale(1.05)", filter: "brightness(1) saturate(0.8)", opacity: 0, offset: FASES.D.hasta / FASES.E.hasta },
        { transform: "scale(1.05)", filter: "brightness(1) saturate(0.8)", opacity: 0, offset: 1 },
      ],
      { duration: FASES.E.hasta, easing: "linear", fill: "forwards" },
    ),
  );

  // El panel se va con la foto, con los mismos dos offsets y en el mismo
  // fotograma: mientras haya fotografía detrás de la columna hace falta, y en
  // cuanto no la haya, sobra.
  // El panel aguanta hasta el final y después se cae rápido, en 200ms.
  //
  // Se probó acompañando a la foto en toda su desaparición (1100 a 1900) y no
  // sirve: en el ms 1900 la bajada directamente no se veía, porque el panel
  // ya no estaba y la letra todavía era blanca sobre el crema. Y al revés
  // tampoco: dejándolo entero hasta el final, quedaba una pared oscura encima
  // de un fondo claro durante casi un segundo, que es justo lo que este cambio
  // venía a sacar.
  //
  // Cayendo al final y rápido, la pared existe sólo mientras hay foto —que es
  // su trabajo— y el cruce dura 200ms. El cambio de tinta va en el medio.
  const MS_PAPEL = FASES.D.hasta - CRUCE_MS / 2;
  if (panel) {
    animaciones.push(
      panel.animate(
        [
          { opacity: 1, offset: 0 },
          { opacity: 1, offset: (FASES.D.hasta - CRUCE_MS) / FASES.E.hasta },
          { opacity: 0, offset: FASES.D.hasta / FASES.E.hasta },
          { opacity: 0, offset: 1 },
        ],
        { duration: FASES.E.hasta, easing: "linear", fill: "forwards" },
      ),
    );
  }
  const relojPapel = metronomo(hero, MS_PAPEL);
  animaciones.push(relojPapel);

  // ---- Fases B, C y D: los stickers ----
  // El punto desde el que emergen los que no existen en la fotografía: el
  // centro del rótulo, que es el corazón de la composición final.
  const rotulo = CAPAS.find((c) => c.id === "titulo-tucuman")!;
  const centroIdentidad = {
    x: (rotulo.final.x / 100) * caja.width,
    y: (rotulo.final.y / 100) * caja.height,
  };

  const porFase = new Map<string, number>();

  for (const { capa, el } of capas) {
    const fase = FASES[capa.fase];
    const orden = porFase.get(capa.fase) ?? 0;
    porFase.set(capa.fase, orden + 1);

    const finalX = (capa.final.x / 100) * caja.width;
    const finalY = (capa.final.y / 100) * caja.height;
    const anchoFinal = el.getBoundingClientRect().width || 1;

    let dx: number, dy: number, escala: number, giro: number;

    if (capa.intro) {
      const p = puntoDeLaFoto(encuadre, capa.intro.x, capa.intro.y);
      dx = p.x - finalX;
      dy = p.y - finalY;
      // El sticker entra del tamaño que tiene su objeto en la fotografía.
      escala = ((capa.intro.anchoPct / 100) * FOTO.ancho * encuadre.escala) / anchoFinal;
      // Giro inicial mínimo, alternado, para que no entren todos igual.
      giro = orden % 2 === 0 ? -1.5 : 1.5;
    } else {
      dx = centroIdentidad.x - finalX;
      dy = centroIdentidad.y - finalY;
      escala = capa.id === "titulo-tucuman" ? 0.72 : 0.45;
      giro = 0;
    }

    const retraso = fase.desde + orden * ESCALONADO_MS;
    // La fase E es el asentamiento: cada capa termina de moverse antes, y el
    // sobrepaso de la curva le da el rebote elástico sin una animación aparte.
    const duracion = Math.max(320, fase.hasta - fase.desde);

    const animacion = el.animate(
        [
          {
            transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${(escala * 0.95).toFixed(3)}) rotate(${giro}deg)`,
            opacity: 0,
            filter: "blur(7px)",
            offset: 0,
          },
          {
            // Aparece sobre su equivalente y se le revela el borde blanco.
            transform: `translate3d(${dx.toFixed(1)}px, ${dy.toFixed(1)}px, 0) scale(${escala.toFixed(3)}) rotate(${giro}deg)`,
            opacity: 1,
            filter: "blur(3.5px)",
            offset: 0.16,
          },
          {
            // Se despega unos píxeles antes de salir de viaje.
            transform: `translate3d(${dx.toFixed(1)}px, ${(dy - 14).toFixed(1)}px, 0) scale(${(escala * 1.04).toFixed(3)}) rotate(${giro}deg)`,
            opacity: 1,
            filter: "blur(2px)",
            offset: 0.3,
          },
          {
            transform: "translate3d(0px, 0px, 0) scale(1) rotate(0deg)",
            opacity: 1,
            filter: "blur(0px)",
            offset: 1,
          },
        ],
        { duration: duracion, delay: retraso, easing: ASENTAR, fill: "both" },
    );
    animaciones.push(animacion);
    animacionesDeCapas.push(animacion);
  }

  const terminado = Promise.all(animaciones.map((a) => a.finished.catch(() => undefined))).then(
    () => undefined,
  );

  return {
    terminado,
    animaciones,
    animacionesDeCapas,
    papel: relojPapel.finished.then(
      () => true,
      () => false,
    ),
  };
}

/**
 * La vuelta: los stickers se van y la fotografía regresa.
 *
 * Es deliberadamente más corta que la ida —620 ms contra 2300— porque volver no
 * es un espectáculo, es deshacer. Y el escalonado va al revés: primero se van
 * los de adelante, que son los que tapan, así que la foto se destapa desde el
 * frente hacia el fondo en vez de aparecer atrás de una pila de figuritas.
 *
 * No se reusa la línea de tiempo de ida al revés: la ida hace aparecer cada
 * sticker sobre su equivalente fotográfico, y ese viaje al revés se vería como
 * quince cosas metiéndose adentro de una foto que todavía no está.
 */
export function correrRegreso(
  foto: HTMLElement,
  panel: HTMLElement | null,
  capas: CapaMontada[],
  conMovimiento: boolean,
): Corrida {
  const animaciones: Animation[] = [];
  const animacionesDeCapas: Animation[] = [];

  // De adelante hacia atrás: el z-index más alto se va primero.
  const porFrente = [...capas].sort((a, b) => b.capa.z - a.capa.z);
  const ESCALONADO = 22;
  const DURACION = conMovimiento ? 420 : 200;

  porFrente.forEach(({ el }, i) => {
    const a = el.animate(
      conMovimiento
        ? [
            { transform: "translate3d(0,0,0) scale(1)", opacity: 1, filter: "blur(0px)" },
            { transform: "translate3d(0, 10px, 0) scale(0.9)", opacity: 0, filter: "blur(5px)" },
          ]
        : [{ opacity: 1 }, { opacity: 0 }],
      { duration: DURACION, delay: i * (conMovimiento ? ESCALONADO : 0), easing: SALIDA, fill: "both" },
    );
    animaciones.push(a);
    animacionesDeCapas.push(a);
  });

  const esperaFoto = conMovimiento ? porFrente.length * ESCALONADO * 0.4 : 0;
  const duracionFoto = conMovimiento ? 520 : 220;

  // El panel vuelve PRIMERO, antes que la foto, y en eso no es simétrico con
  // la ida a propósito: en la ida se va último —cuando ya no hay foto que
  // tapar— y a la vuelta llega primero. Las dos veces por el mismo motivo, que
  // es que un panel de más es feo y un panel de menos deja texto ilegible.
  //
  // Se probó acompañando a la foto, con su misma espera y su misma curva, y
  // no sirve: cubic-bezier(0.16, 1, 0.3, 1) es tan frontal que el panel ya
  // estaba al 90% en el ms 300 —medido— mientras la tinta seguía oscura hasta
  // el 392. Eran casi 400ms de letra azul oscuro sobre un panel oscuro: 2,04:1.
  if (panel) {
    animaciones.push(
      panel.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: CRUCE_MS,
        easing: "linear",
        fill: "forwards",
      }),
    );
  }
  const relojPapel = metronomo(foto, CRUCE_MS / 2);
  animaciones.push(relojPapel);

  animaciones.push(
    foto.animate(
      conMovimiento
        ? [
            { opacity: 0, transform: "scale(1.05)", filter: "brightness(1) saturate(0.8)" },
            { opacity: 1, transform: "scale(1)", filter: "brightness(1) saturate(1)" },
          ]
        : [{ opacity: 0 }, { opacity: 1 }],
      {
        duration: duracionFoto,
        delay: esperaFoto,
        easing: "cubic-bezier(0.16, 1, 0.3, 1)",
        // "both" y no "forwards", y esto se vía: durante los 132ms de espera
        // una animación que sólo rellena hacia adelante no dice nada, así que
        // mandaba el CSS y la foto valía 1. Como restaurar() cancela las
        // animaciones de la ida antes de crear éstas —lo hace para que no se
        // acumulen—, la fotografía volvía de golpe a plena opacidad, se iba a
        // cero cuando arrancaba la animación y recién ahí entraba suave.
        // Rellenando también hacia atrás, el primer fotograma manda desde el
        // milisegundo cero y la espera se ve vacía, que es lo correcto: los
        // stickers todavía están y la foto todavía no.
        fill: "both",
      },
    ),
  );

  return {
    terminado: Promise.all(animaciones.map((a) => a.finished.catch(() => undefined))).then(
      () => undefined,
    ),
    animaciones,
    animacionesDeCapas,
    papel: relojPapel.finished.then(
      () => true,
      () => false,
    ),
  };
}

/**
 * Movimiento reducido en escritorio: la composición final aparece entera, de
 * una, sin un solo desplazamiento. Las quince capas se funden a la vez y la
 * fotografía se va al mismo tiempo.
 *
 * Existe como función aparte y no como un correrFundido sobre una capa porque
 * son quince elementos, no uno: fundir sólo el primero del Map y encender los
 * otros catorce con un style dejaba una figurita entrando suave y catorce
 * apareciendo de golpe.
 */
export function correrEntradaQuieta(
  foto: HTMLElement,
  panel: HTMLElement | null,
  capas: CapaMontada[],
  ms: number,
): Corrida {
  const animaciones: Animation[] = [];
  const animacionesDeCapas: Animation[] = [];

  for (const { el } of capas) {
    const a = el.animate([{ opacity: 0 }, { opacity: 1 }], {
      duration: ms,
      easing: "linear",
      fill: "both",
    });
    animaciones.push(a);
    animacionesDeCapas.push(a);
  }

  animaciones.push(
    foto.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: "linear", fill: "forwards" }),
  );
  if (panel) {
    animaciones.push(
      panel.animate([{ opacity: 1 }, { opacity: 0 }], { duration: ms, easing: "linear", fill: "forwards" }),
    );
  }
  const relojPapel = metronomo(foto, ms * 0.5);
  animaciones.push(relojPapel);

  return {
    terminado: Promise.all(animaciones.map((a) => a.finished.catch(() => undefined))).then(
      () => undefined,
    ),
    animaciones,
    animacionesDeCapas,
    papel: relojPapel.finished.then(
      () => true,
      () => false,
    ),
  };
}

/** El camino corto: un fundido y listo. Para teléfonos y para reduced-motion. */
export function correrFundido(
  desde: HTMLElement,
  hacia: HTMLElement,
  ms: number,
  conMovimiento: boolean,
): Corrida {
  const animaciones: Animation[] = [
    desde.animate(
      conMovimiento
        ? [
            { opacity: 1, transform: "scale(1)", filter: "blur(0px)" },
            { opacity: 0, transform: "scale(1.04)", filter: "blur(6px)" },
          ]
        : [{ opacity: 1 }, { opacity: 0 }],
      { duration: ms, easing: SALIDA, fill: "forwards" },
    ),
    hacia.animate(
      conMovimiento
        ? [
            { opacity: 0, transform: "scale(1.03)" },
            { opacity: 1, transform: "scale(1)" },
          ]
        : [{ opacity: 0 }, { opacity: 1 }],
      { duration: ms, easing: "cubic-bezier(0.16, 1, 0.3, 1)", fill: "forwards" },
    ),
  ];
  return {
    terminado: Promise.all(animaciones.map((a) => a.finished.catch(() => undefined))).then(
      () => undefined,
    ),
    animaciones,
    animacionesDeCapas: [],
    // En teléfono la columna no se apoya nunca sobre el crema: va debajo de la
    // banda, sobre el azul del propio hero, así que no hay papel al que pasar.
    papel: Promise.resolve(false),
  };
}
