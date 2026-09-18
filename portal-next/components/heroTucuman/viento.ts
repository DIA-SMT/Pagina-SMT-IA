/**
 * El viento del hero: el cursor empuja los stickers y ellos vuelven solos.
 *
 * Esto NO es un motor de físicas. Es un resorte amortiguado por capa, integrado
 * a mano, que corre fuera de React: nada de esto pasa por estado ni provoca un
 * render. El bucle escribe `transform` directamente sobre el elemento.
 *
 * Por qué no es "todos siguen al cursor":
 *
 * - La fuerza sale de la distancia al cursor y cae con el cuadrado, así que un
 *   sticker lejano casi no se entera.
 * - La dirección es la que ALEJA del cursor, más un arrastre en la dirección en
 *   la que el cursor se está moviendo. Sin ese arrastre todos se abrirían en
 *   estrella y se notaría el truco.
 * - La velocidad del cursor multiplica: moverse despacio acaricia, moverse
 *   rápido es una ráfaga.
 * - `profundidad` escala todo. La comida está en primer plano (1,12 a 1,3) y
 *   se mueve bastante; el paisaje del fondo está en 0,28 y apenas respira.
 *
 * Y cuando nadie toca nada, cada capa flota con su propio período y su propia
 * fase, para que no se vea un vaivén sincronizado. La flotación se apaga sola
 * mientras hay ráfaga: el viento tiene prioridad, como pide la consigna.
 */

import { RAMPA_DE_CALMA_PX, type CapaHero } from "@/lib/heroTucuman";

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

/**
 * Una pieza que el viento mueve. Puede ser una figurita o una tarjeta, y las
 * tres diferencias entre las dos están declaradas acá adentro en vez de
 * repartidas en ifs por el bucle.
 */
export type PiezaViento = {
  el: HTMLElement;
  fisica: CapaHero["fisica"];
  /**
   * Si el recorte de la zona segura le aplica.
   *
   * Las figuritas sí: ninguna puede meterse encima de la columna. Las tarjetas
   * VIVEN adentro de la columna, o sea del lado prohibido, así que el mismo
   * recorte las expulsaría al 43% del hero en el primer cuadro.
   */
  respetaZonaSegura: boolean;
  /**
   * Si el viento se apaga cuando el cursor se acerca a la columna.
   *
   * Es lo que hace que una tarjeta se pueda tocar. El empuje del motor ALEJA
   * del cursor —esa es la gracia sobre una figurita— y sobre un enlace eso
   * significa que el blanco se corre justo cuando alguien va a apuntarle.
   */
  seAquieta: boolean;
  /**
   * En qué propiedad escribir.
   *
   * Las figuritas van en transform porque su translate ya está ocupado con el
   * -50% -50% que las centra. Las tarjetas van en translate y rotate, que son
   * propiedades independientes, para dejarle transform al :hover: un estilo en
   * línea le gana a cualquier regla de autor sin !important, sin importar la
   * especificidad, así que si el viento escribiera transform el levantarse de
   * 2px al pasar por encima dejaría de existir en silencio.
   */
  propiedad: "transform" | "translate";
};

type Estado = {
  p: PiezaViento;
  el: HTMLElement;
  /** Desplazamiento actual y velocidad, en píxeles. */
  x: number; y: number; vx: number; vy: number;
  /** Lo último que se ESCRIBIÓ en el transform, que no es lo mismo que x e y. */
  px: number; py: number;
  /** Centro de la capa dentro del hero, en píxeles. Se recalcula al redimensionar. */
  cx: number; cy: number;
  /** Medias medidas, para recortar el desplazamiento contra los bordes. */
  media: number;
  mediaAlto: number;
  /** Período y fase propios de la flotación. */
  wx: number; wy: number; fase: number;
};

export type Viento = {
  /** Arranca el bucle. Idempotente. */
  encender(): void;
  /** Frena el bucle y deja las capas donde están. */
  apagar(): void;
  /** Recalcula centros y límites. Llamar al redimensionar. */
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
    x: 0, y: 0, vx: 0, vy: 0,
    px: 0, py: 0,
    cx: 0, cy: 0, media: 0, mediaAlto: 0,
    // Períodos primos entre sí y una fase distinta por capa: así ninguna
    // pareja de stickers vuelve a coincidir dentro de una visita.
    wx: 0.00021 + i * 0.000017,
    wy: 0.00026 + i * 0.000013,
    fase: i * 1.7,
  }));

  let cursorX = -9999, cursorY = -9999, hayCursor = false;
  let velX = 0, velY = 0, ultX = 0, ultY = 0;
  let cuadro = 0, andando = false, reloj = 0;
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
      const c = e.el.getBoundingClientRect();
      // El centro se mide con la capa en reposo, así que hay que descontarle
      // el desplazamiento que tenga puesto AHORA. Y ojo: no es e.x, que es sólo
      // la parte del resorte. Lo que está escrito en el transform es px, o sea
      // el resorte MÁS la flotación ambiente MÁS lo que hayan corrido los
      // recortes. Descontando e.x, cada re-medición dejaba la flotación de ese
      // instante metida en el centro de reposo y las capas iban derivando un
      // poco en cada cambio de tamaño de ventana.
      e.cx = c.left - caja.left + c.width / 2 - e.px;
      e.cy = c.top - caja.top + c.height / 2 - e.py;
      e.media = c.width / 2;
      e.mediaAlto = c.height / 2;
    }
  }

  function alMover(ev: PointerEvent) {
    const caja = contenedor.getBoundingClientRect();
    const nx = ev.clientX - caja.left;
    const ny = ev.clientY - caja.top;
    if (hayCursor) {
      velX += (nx - ultX - velX) * SUAVIZADO;
      velY += (ny - ultY - velY) * SUAVIZADO;
    }
    ultX = nx; ultY = ny;
    cursorX = nx; cursorY = ny;
    hayCursor = true;
  }

  function alSalir() {
    hayCursor = false;
    cursorX = -9999; cursorY = -9999;
    velX = 0; velY = 0;
  }

  function paso(ahora: number) {
    if (!andando) return;
    reloj = ahora;

    // La velocidad del cursor se apaga sola si deja de llegar movimiento; sin
    // esto, una ráfaga quedaría soplando para siempre.
    velX *= 0.9; velY *= 0.9;
    // Una sola lectura por cuadro y no una por pieza.
    const conFoco = document.activeElement;
    const rapidez = Math.min(1, Math.hypot(velX, velY) / VELOCIDAD_MAXIMA);
    const ambiente = 1 - rapidez;

    for (const e of estados) {
      const f = e.p.fisica;
      let fx = 0, fy = 0;

      // ---- El pozo de calma ----
      // Vale 1 lejos de la columna y 0 pegado a ella, con una rampa en el medio
      // para que el borde no se note. Apaga las DOS fuentes de movimiento —el
      // empuje y la flotación ambiente— y no sólo el empuje: si la tarjeta
      // siguiera respirando, el blanco se seguiría moviendo un par de píxeles
      // justo cuando alguien apunta, que es lo que esto viene a evitar.
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

      if (hayCursor && quietud > 0) {
        const dx = e.cx - cursorX;
        const dy = e.cy - cursorY;
        const d = Math.hypot(dx, dy) || 0.001;
        if (d < f.radioPx) {
          // Caída cuadrática: cerca empuja fuerte, lejos casi nada.
          const caida = (1 - d / f.radioPx) ** 2;
          const ux = dx / d, uy = dy / d;
          const empuje = (EMPUJE_BASE + rapidez) * caida * f.profundidad * quietud;
          fx += ux * empuje * f.maxDesplazamientoPx * 0.09;
          fy += uy * empuje * f.maxDesplazamientoPx * 0.09;
          fx += velX * caida * f.profundidad * ARRASTRE * quietud;
          fy += velY * caida * f.profundidad * ARRASTRE * quietud;
        }
      }

      // Resorte de vuelta al origen.
      fx += -e.x * f.resorte;
      fy += -e.y * f.resorte;

      e.vx = (e.vx + fx) * f.amortiguacion;
      e.vy = (e.vy + fy) * f.amortiguacion;
      e.x += e.vx;
      e.y += e.vy;

      // Tope de desplazamiento: ningún sticker se va de paseo.
      const tope = f.maxDesplazamientoPx;
      const largo = Math.hypot(e.x, e.y);
      if (largo > tope) {
        e.x = (e.x / largo) * tope;
        e.y = (e.y / largo) * tope;
      }

      // Flotación ambiente, con período propio, apagándose con la ráfaga.
      const flx = Math.sin(reloj * e.wx + e.fase) * FLOTACION_PX * f.profundidad * ambiente * quietud;
      const fly = Math.cos(reloj * e.wy + e.fase * 1.3) * FLOTACION_PX * f.profundidad * ambiente * quietud;

      let px = e.x + flx;
      let py = e.y + fly;

      // ---- Los recortes ----
      // Primero los cuatro bordes del hero: el hero tiene overflow: clip, así
      // que un sticker empujado afuera no desborda la página pero SÍ se ve
      // cortado, y un sticker cortado deja de leerse como sticker porque lo
      // que lo define es el borde blanco. Se recorta contra la caja, no contra
      // el clip.
      const izq = e.cx - e.media + px;
      const der = e.cx + e.media + px;
      const arr = e.cy - e.mediaAlto + py;
      const aba = e.cy + e.mediaAlto + py;
      if (izq < 0) px -= izq;
      else if (der > anchoHero) px -= der - anchoHero;
      if (arr < 0) py -= arr;
      else if (aba > altoHero) py -= aba - altoHero;

      // Y después el que de verdad importa, que va último para que le gane a
      // los otros: el borde izquierdo no puede entrar en la columna del
      // buscador y las seis tarjetas.
      //
      // Sólo para las figuritas: las tarjetas están adentro de esa columna, o
      // sea del lado prohibido, y aplicarles este recorte las mandaría al 43%
      // del hero en el primer cuadro.
      if (e.p.respetaZonaSegura) {
        const izqFinal = e.cx - e.media + px;
        if (izqFinal < limite) px += limite - izqFinal;
      }

      // El giro sale de la velocidad horizontal: una hoja empujada se ladea.
      const giro = Math.max(-f.maxGiroGrados, Math.min(f.maxGiroGrados, e.vx * 0.55 * f.profundidad));

      e.px = px;
      e.py = py;
      if (e.p.propiedad === "transform") {
        e.el.style.transform = `translate3d(${px.toFixed(2)}px, ${py.toFixed(2)}px, 0) rotate(${giro.toFixed(2)}deg)`;
      } else {
        e.el.style.translate = `${px.toFixed(2)}px ${py.toFixed(2)}px`;
        e.el.style.rotate = `${giro.toFixed(2)}deg`;
      }
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
      // Y se limpia lo que se escribió. Las figuritas las suelta el componente
      // con soltarCapas, pero las tarjetas no están en ese Map: sin esto se
      // quedaban con el último desplazamiento puesto para siempre después de
      // volver a la fotografía.
      for (const e of estados) {
        if (e.p.propiedad === "transform") {
          e.el.style.transform = "";
        } else {
          e.el.style.translate = "";
          e.el.style.rotate = "";
        }
        e.px = 0; e.py = 0; e.x = 0; e.y = 0; e.vx = 0; e.vy = 0;
      }
      contenedor.removeEventListener("pointermove", alMover);
      contenedor.removeEventListener("pointerleave", alSalir);
    },
  };
}
