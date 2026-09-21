"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

import {
  CAPAS,
  COLLAGE_MOVIL,
  COLCHON_ZONA_SEGURA,
  FOTO,
  PIEZAS_DE_LA_COLUMNA,
  MOVIL_MS,
  SIN_MOVIMIENTO_MS,
  ZONA_SEGURA_DERECHA,
} from "@/lib/heroTucuman";
import {
  correrEntradaQuieta,
  correrFundido,
  correrRegreso,
  correrTransformacion,
  type CapaMontada,
  type Corrida,
} from "./heroTucuman/transformacion";
import { crearViento, type PiezaViento, type Viento } from "./heroTucuman/viento";

/**
 * El hero de la portada: Tucumán fotográfico que se vuelve stickers.
 *
 * ---- TRES ESTADOS, UNA SOLA VARIABLE ----
 * `intro` -> `transicion` -> `interactivo`. Un solo useState y no cinco
 * booleanos sueltos, porque los estados intermedios imposibles —"ya terminó
 * pero todavía no es interactivo"— son justo los que rompen este tipo de
 * componente. El salto a `interactivo` lo dispara el `finished` de las
 * animaciones, no un setTimeout que adivine cuánto tardaron.
 *
 * La física del viento NO existe hasta que la fase es `interactivo`. La línea
 * de tiempo y el viento escriben los dos en `transform`, así que no pueden
 * convivir: la transformación cancela sus animaciones al terminar y recién ahí
 * el viento toma posesión del elemento.
 *
 * ---- LA COLUMNA DE LA IZQUIERDA NO SE TOCA ----
 * El buscador y las seis tarjetas más consultadas del portal siguen usables
 * durante toda la transformación: la animación es decorativa y nadie tendría
 * que esperar dos segundos para buscar una licencia de conducir. Por eso el
 * clic que dispara la experiencia vive en la escena, que es HERMANA de la
 * columna y no su ancestro: un clic en el buscador nunca llega a la escena y
 * no hace falta ir tapando propagaciones control por control.
 *
 * ---- ACCESIBILIDAD ----
 * El disparador de verdad es un <button> al pie de la columna. La escena
 * también responde al clic, pero es un extra: no es un botón gigante que
 * envuelva a los otros controles.
 */

type Fase = "intro" | "transicion" | "interactivo";

/**
 * El dispositivo se lee con useSyncExternalStore y no con un useState dentro de
 * un efecto, que es lo que pide la regla react-hooks/set-state-in-effect y lo
 * que ya hacen Tema.tsx y el encabezado. La instantánea es un string de tres
 * letras y no un objeto, porque el hook compara por identidad y un objeto nuevo
 * en cada lectura sería un bucle infinito.
 *
 * ---- SON TRES PREGUNTAS DISTINTAS Y ANTES ERAN DOS ----
 * El ANCHO decide el maquetado, el PUNTERO decide si hay física, y el
 * movimiento reducido decide si hay animación. Antes el ancho y el puntero
 * viajaban juntos en una sola consulta —"(max-width: 63.999rem), (pointer:
 * coarse)"— y eso rompía el hero en cualquier pantalla táctil grande.
 *
 * Qué pasaba: el CSS cambia de maquetado en (min-width: 64rem), a secas. Un
 * iPad en horizontal mide 1024, 1180 o 1366 y tiene puntero grueso, así que
 * caía en los dos lados a la vez: el CSS le daba el hero de escritorio —la
 * escena a sangre, el panel y la columna al 52%— y el JS tomaba la rama móvil,
 * que no monta las quince capas y funde a la lámina aplanada. Esa lámina es de
 * 1440x810 con object-fit: contain, estirada sobre todo el hero y con su mitad
 * izquierda tapada por el panel. Y como el camino móvil resuelve papel en
 * false, nunca se activaba data-papel: el panel oscuro se quedaba encima del
 * fondo crema y la tinta no se daba vuelta. Lo mismo en cualquier notebook con
 * pantalla táctil.
 *
 * Ahora el ancho manda solo en el maquetado, igual que el CSS, y el puntero
 * grueso apaga nada más la física del cursor: un iPad en horizontal ve el
 * collage de escritorio con su entrada completa, y no lo persigue ninguna
 * ráfaga porque no hay cursor que la levante.
 */
const ANGOSTO = "(max-width: 63.999rem)";
const GRUESO = "(pointer: coarse)";
const QUIETO = "(prefers-reduced-motion: reduce)";

function suscribirMedios(avisar: () => void) {
  const consultas = [ANGOSTO, GRUESO, QUIETO].map((q) => window.matchMedia(q));
  for (const c of consultas) c.addEventListener("change", avisar);
  return () => {
    for (const c of consultas) c.removeEventListener("change", avisar);
  };
}
const leerMedios = () =>
  (window.matchMedia(ANGOSTO).matches ? "m" : "d") +
  (window.matchMedia(QUIETO).matches ? "q" : "-") +
  (window.matchMedia(GRUESO).matches ? "g" : "-");
/** En el servidor no hay medios: se asume escritorio, con mouse y movimiento. */
const mediosEnElServidor = () => "d--";

/**
 * Devuelve las capas a su estado de reposo: sin transform y sin opacidad en
 * línea, o sea mandando lo que dice el CSS. Va suelta y no adentro del
 * componente porque se usa en los dos sentidos y porque el compilador de React
 * no deja mutar dentro de un hook algo que llegó como argumento de otro.
 *
 * Limpia las DOS cajas de cada figurita. La de afuera la escribe la línea de
 * tiempo de la transformación; la de adentro, la física. Son dueños distintos
 * de propiedades distintas y ninguno pisa al otro, pero volver al reposo es
 * volver las dos a cero.
 */
function soltarCapas(
  capas: Map<string, HTMLElement>,
  cuerpos: Map<string, HTMLElement>,
  opacidad?: string,
) {
  for (const el of capas.values()) {
    el.style.transform = "";
    el.style.opacity = opacidad ?? "";
  }
  for (const el of cuerpos.values()) {
    el.style.transform = "";
  }
}

/** Falso mientras se hidrata y verdadero después, sin tocar estado. */
const sinCambios = () => () => {};
const enElCliente = () => true;
const enElServidor = () => false;

export function HeroTucuman({ children }: { children: React.ReactNode }) {
  const [fase, setFase] = useState<Fase>("intro");
  const montado = useSyncExternalStore(sinCambios, enElCliente, enElServidor);
  const medios = useSyncExternalStore(suscribirMedios, leerMedios, mediosEnElServidor);
  const modo = {
    /** Maquetado angosto: la banda de foto arriba y la columna debajo. */
    movil: medios[0] === "m",
    quieto: medios[1] === "q",
    /** Sin mouse. No cambia el maquetado: sólo apaga la física del cursor. */
    grueso: medios[2] === "g",
  };
  /** El vecino tocó antes de que estuvieran los recursos. */
  const [esperando, setEsperando] = useState(false);
  /** Lo mismo que `listo`, pero legible desde un callback sin esperar al render. */
  const listoRef = useRef(false);
  /** Tocó temprano y hay que arrancar apenas se pueda. */
  const pendienteRef = useRef(false);
  /**
   * Los WebP ya están. Es estado y no sólo ref porque las capas NO se montan
   * hasta entonces: si el <img> estuviera en el DOM desde la hidratación, el
   * navegador pediría los 2,9 MB en ese momento —verificado: las quince
   * aparecían en el network apenas cargaba la página— y la precarga ociosa no
   * protegería nada, que era justo para lo que estaba.
   */
  const [listo, setListo] = useState(false);
  /**
   * La columna se apoya sobre el crema del collage y no sobre la fotografía.
   *
   * No es lo mismo que fase === "interactivo" y por eso es su propia variable:
   * el fondo cambia en el ms 1800 de una ida que termina en el 2300. Atándolo
   * a la fase, entre esos dos instantes el título y la bajada quedaban en
   * blanco sobre el crema, o sea invisibles —se ve en la captura del ms 1900,
   * donde la bajada directamente no está—. El instante lo marca el metrónomo
   * de la corrida, que corre en el mismo reloj que todo lo demás.
   */
  const [papel, setPapel] = useState(false);
  /**
   * La fase, legible desde los callbacks sin ponerla en sus dependencias.
   * Si `fase` fuera dependencia de transformar y restaurar, esas funciones
   * cambiarían de identidad en cada cambio de estado y el efecto de precarga
   * —que las tiene en sus dependencias— se relanzaría cada vez.
   */
  const faseRef = useRef<Fase>("intro");
  /** Para que un toque temprano pueda adelantar la precarga en vez de esperarla. */
  const arrancarPrecargaRef = useRef<(() => void) | null>(null);

  const heroRef = useRef<HTMLElement>(null);
  const escenaRef = useRef<HTMLDivElement>(null);
  const fotoRef = useRef<HTMLImageElement>(null);
  const ondaRef = useRef<HTMLDivElement>(null);
  /** El panel de la columna. Se apaga y se enciende DENTRO de la línea de
      tiempo, junto con la fotografía; el CSS sólo declara su estado en reposo. */
  const panelRef = useRef<HTMLDivElement>(null);
  /** La columna. El viento la necesita para saber dónde tiene que aquietarse. */
  const columnaRef = useRef<HTMLDivElement>(null);
  const collageRef = useRef<HTMLImageElement>(null);
  const capasRef = useRef<Map<string, HTMLElement>>(new Map());
  /**
   * La caja INTERIOR de cada figurita, que es donde escribe la física.
   *
   * Existe para que dos animaciones no se peleen el mismo `transform`. La
   * línea de tiempo de la transformación escribe el de `.ht__capa`; el bucle
   * físico, el de `.ht__cuerpo`. Antes convivían en el mismo elemento y la
   * única defensa era temporal —la física no arrancaba hasta que la entrada
   * terminara, y había que cancelar las animaciones a mano para que su
   * `fill: both` soltara la propiedad—. Ahora no pueden pisarse ni por error.
   *
   * De paso sale gratis lo otro: como la caja de afuera no se mueve durante la
   * física, su rectángulo ES la posición de reposo y medirla no requiere
   * descontarle el desplazamiento del cuadro anterior.
   */
  const cuerposRef = useRef<Map<string, HTMLElement>>(new Map());
  const vientoRef = useRef<Viento | null>(null);
  const animacionesRef = useRef<Animation[]>([]);
  /**
   * Candado de dirección. No es "ya se usó": es "hay una transición corriendo".
   * Mientras vale true no entra ni la ida ni la vuelta, así que un clic repetido
   * o un doble clic a mitad de camino no hacen nada. La que decide qué puede
   * pasar es la fase, no el candado.
   */
  const ocupadoRef = useRef(false);

  /** Arranca la experiencia. Idempotente por el candado. */
  const transformar = useCallback(
    (punto?: { x: number; y: number }) => {
      if (ocupadoRef.current || faseRef.current !== "intro") return;
      if (!listoRef.current) {
        // Todavía no están los WebP. Se anota el pedido, se avisa en el botón
        // —sin un spinner encima de la fotografía— y se le mete prisa a la
        // precarga: si estaba esperando un hueco de inactividad, ya no espera.
        pendienteRef.current = true;
        setEsperando(true);
        arrancarPrecargaRef.current?.();
        return;
      }
      const hero = heroRef.current;
      const foto = fotoRef.current;
      if (!hero || !foto) return;

      // Las animaciones de la corrida anterior siguen vivas: las de la escena
      // —la foto y la onda— llevan fill: forwards, que es lo que sostiene el
      // estado final, así que no se cancelan al terminar. Ciclando ida y vuelta
      // se acumulaban una por corrida: medido, once después de cuatro idas y
      // tres vueltas. Se sueltan acá, justo antes de crear las nuevas: en el
      // mismo tick, sin que el navegador llegue a pintar el estado intermedio.
      for (const a of animacionesRef.current) a.cancel();
      animacionesRef.current = [];

      ocupadoRef.current = true;
      setEsperando(false);
      faseRef.current = "transicion";
      setFase("transicion");

      // Si venimos de una vuelta, las capas quedaron con la opacidad y el
      // transform que les dejó aquella animación. Se limpian antes de arrancar
      // para que la ida empiece siempre desde el mismo lugar.
      soltarCapas(capasRef.current, cuerposRef.current);

      const caja = hero.getBoundingClientRect();
      const clic = punto ?? { x: caja.width * 0.62, y: caja.height * 0.5 };

      let corrida: Corrida;

      if (modo.movil) {
        // Teléfono: se cruza hacia el collage aplanado.
        const collage = collageRef.current;
        corrida = collage
          ? correrFundido(foto, collage, MOVIL_MS, !modo.quieto)
          : { terminado: Promise.resolve(), animaciones: [], animacionesDeCapas: [], papel: Promise.resolve(false) };
      } else if (modo.quieto) {
        // Escritorio con movimiento reducido: aparecen las quince capas ya en
        // su sitio, sin un solo desplazamiento.
        //
        // Antes esto fundía UNA capa —la primera que devolviera el Map, o sea
        // cualquiera— y encendía las otras catorce de golpe con un style. Se
        // veía una figurita entrando suave y catorce apareciendo de una. Ahora
        // el fundido lo hacen las quince, con la misma animación y a la vez.
        const capas: CapaMontada[] = [];
        for (const capa of CAPAS) {
          const el = capasRef.current.get(capa.id);
          if (el) capas.push({ capa, el });
        }
        corrida = correrEntradaQuieta(foto, panelRef.current, capas, SIN_MOVIMIENTO_MS);
      } else {
        const capas: CapaMontada[] = [];
        for (const capa of CAPAS) {
          const el = capasRef.current.get(capa.id);
          if (el) capas.push({ capa, el });
        }
        corrida = correrTransformacion(
          { hero, foto, onda: ondaRef.current!, panel: panelRef.current, capas },
          clic,
        );
      }

      animacionesRef.current = corrida.animaciones;
      corrida.papel.then((llego) => {
        if (llego) setPapel(true);
      });
      corrida.terminado.then(() => {
        // Sólo las de las capas: su `fill: both` retiene el `transform` y el
        // viento no podría escribir sobre el mismo elemento. Las de la escena
        // conservan su estado final —la foto tiene que quedarse en opacidad 0—.
        for (const a of corrida.animacionesDeCapas) a.cancel();
        soltarCapas(capasRef.current, cuerposRef.current, "1");
        ocupadoRef.current = false;
        faseRef.current = "interactivo";
        setFase("interactivo");
      });
    },
    [modo.movil, modo.quieto],
  );

  /**
   * La vuelta al estado inicial.
   *
   * Lo primero que hace es matar el viento A MANO, y no esperar a que lo haga
   * la limpieza del efecto: esa limpieza corre recién después del próximo
   * render, y mientras tanto el bucle seguiría escribiendo `transform` sobre
   * los mismos elementos que la animación de regreso quiere animar. Son los dos
   * sistemas peleándose la propiedad, que es exactamente lo que no puede pasar.
   */
  const restaurar = useCallback(() => {
    if (ocupadoRef.current || faseRef.current !== "interactivo") return;
    const foto = fotoRef.current;
    if (!foto) return;

    // Las animaciones de la corrida anterior siguen vivas: las de la escena
    // —la foto y la onda— llevan fill: forwards, que es lo que sostiene el
    // estado final, así que no se cancelan al terminar. Ciclando ida y vuelta
    // se acumulaban una por corrida: medido, once después de cuatro idas y
    // tres vueltas. Se sueltan acá, justo antes de crear las nuevas: en el
    // mismo tick, sin que el navegador llegue a pintar el estado intermedio.
    for (const a of animacionesRef.current) a.cancel();
    animacionesRef.current = [];

    ocupadoRef.current = true;
    // El viento se mata A MANO y no se espera a la limpieza del efecto: esa
    // limpieza corre recién después del próximo render, y mientras tanto el
    // bucle seguiría escribiendo.
    //
    // Pero NO se borra el desplazamiento de las figuritas, y eso es nuevo. La
    // animación de regreso anima la caja de AFUERA —se van hacia abajo,
    // encogiéndose y con desenfoque— y la de adentro conserva el
    // desplazamiento que tuviera. O sea que cada figurita se desvanece desde
    // donde quedó y no desde el lugar donde nació: borrándolo, las quince
    // pegaban un salto al sitio original justo antes de empezar a irse.
    // Lo limpia soltarCapas al final, cuando ya son invisibles.
    vientoRef.current?.destruir();
    vientoRef.current = null;

    faseRef.current = "transicion";
    setFase("transicion");

    let corrida: Corrida;
    if (modo.movil) {
      const collage = collageRef.current;
      corrida = collage
        ? correrFundido(collage, foto, MOVIL_MS, !modo.quieto)
        : { terminado: Promise.resolve(), animaciones: [], animacionesDeCapas: [], papel: Promise.resolve(false) };
    } else {
      const capas: CapaMontada[] = [];
      for (const capa of CAPAS) {
        const el = capasRef.current.get(capa.id);
        if (el) capas.push({ capa, el });
      }
      corrida = correrRegreso(foto, panelRef.current, capas, !modo.quieto);
    }

    animacionesRef.current = corrida.animaciones;
    corrida.papel.then((llego) => {
      if (llego) setPapel(false);
    });
    corrida.terminado.then(() => {
      for (const a of corrida.animacionesDeCapas) a.cancel();
      // Las capas vuelven a estar invisibles, como manda el CSS en reposo, y
      // recién acá se borra el desplazamiento que la física les había dejado.
      soltarCapas(capasRef.current, cuerposRef.current);
      ocupadoRef.current = false;
      faseRef.current = "intro";
      setFase("intro");
    });
  }, [modo.movil, modo.quieto]);

  // Precarga. La foto inicial es el LCP y ya la pidió el navegador solo; esto
  // es lo de después, y arranca recién cuando la portada terminó de pintar.
  useEffect(() => {
    if (!montado) return;
    let vivo = true;
    /**
     * "Ya se pidió", pero SÓLO para esta corrida del efecto.
     *
     * Antes era una ref del componente, o sea una bandera que sobrevivía a
     * todas las corridas y que nadie bajaba nunca. Bastaba con que cambiara un
     * medio mientras los 2,9 MB estaban en vuelo —arrastrar el borde de la
     * ventana cruzando 64rem, rotar una tablet, conectar una pantalla táctil,
     * activar "reducir movimiento"— para romper el hero por el resto de la
     * visita: la limpieza ponía vivo=false y el .then de la corrida vieja se
     * abortaba sin tocar listoRef ni setListo, y la corrida NUEVA se encontraba
     * la bandera en true y no pedía nada. Las quince capas no se montaban
     * jamás y el botón quedaba clavado en "Preparando…" sin reintento ni
     * forma de salir salvo recargar.
     *
     * Siendo local, cada corrida vuelve a pedir —y con el juego de archivos
     * correcto, que puede haber cambiado a COLLAGE_MOVIL—. Lo que evita pedir
     * dos veces de más es listoRef, que es la verdad duradera: si la precarga
     * ya terminó alguna vez, no se vuelven a decodificar los quince WebP.
     *
     * Las tres llamadas que compiten —requestIdleCallback, el reloj de respaldo
     * y arrancarPrecargaRef— viven todas dentro de la misma corrida, así que
     * comparten esta misma bandera y siguen protegidas.
     */
    let lanzada = false;
    const archivos = modo.movil
      ? [COLLAGE_MOVIL]
      : CAPAS.map((c) => `/hero-tucuman/capas/${c.archivo}`);

    const pedir = () => {
      if (lanzada || listoRef.current || !vivo) return;
      lanzada = true;
      return Promise.all(
        archivos.map(
          (src) =>
            new Promise<void>((resolver) => {
              const img = new Image();
              img.src = src;
              // decode() deja el bitmap listo, así que la transformación no se
              // traba en el primer cuadro decodificando quince WebP.
              img.decode().then(
                () => resolver(),
                () => resolver(),
              );
            }),
        ),
      ).then(() => {
        if (!vivo) return;
        listoRef.current = true;
        // Si tocó temprano, arranca sola. Llamarla desde el then de una promesa
        // no es "setState dentro de un efecto": el pedido lo hizo la persona.
        //
        // Pero PRIMERO hay que montar las quince capas, y por eso va flushSync.
        // setListo no es síncrono: React agenda el render y lo aplica DESPUÉS
        // de esta pila, así que transformar() leía capasRef vacío, armaba la
        // corrida con cero figuritas y no se creaba ni una animación. Se veía
        // la fotografía desvanecerse sobre la lámina vacía durante 2,3
        // segundos y recién al final aparecían las quince de golpe, sin
        // entrada, sin escalonado y sin viajar desde su equivalente
        // fotográfico. Justo en el camino que el componente diseñó a propósito
        // para quien toca antes de tiempo.
        //
        // flushSync aplica el render acá mismo, así que los ref callbacks de
        // las capas ya corrieron cuando arranca la línea de tiempo. No es un
        // uso indebido: sólo está prohibido llamarlo durante el render o el
        // commit, y esto es el then de una promesa.
        if (pendienteRef.current) {
          pendienteRef.current = false;
          flushSync(() => setListo(true));
          transformar();
        } else {
          setListo(true);
        }
      });
    };
    arrancarPrecargaRef.current = pedir;

    // DOS disparadores, y no uno.
    //
    // requestIdleCallback es el bueno: los 2,9 MB de capas no deberían pelearle
    // ancho de banda a la fotografía del hero, que es el LCP. Pero en una
    // pestaña OCULTA no dispara nunca —verificado en el navegador: con
    // visibilityState "hidden" no llega ni a los 1500 ms del timeout—, y una
    // pestaña abierta en segundo plano es de lo más común: clic del medio,
    // "abrir en pestaña nueva", una sesión restaurada. Sin el respaldo, quien
    // volviera a esa pestaña y tocara el hero se quedaba en "Preparando…" para
    // siempre.
    //
    // Así que va también un reloj. El que llegue primero gana; el segundo se
    // encuentra con la guarda de arriba y no hace nada.
    const id = window.requestIdleCallback?.(pedir, { timeout: 1500 });
    const reloj = window.setTimeout(pedir, 1800);
    return () => {
      vivo = false;
      arrancarPrecargaRef.current = null;
      if (id !== undefined && window.cancelIdleCallback) window.cancelIdleCallback(id);
      window.clearTimeout(reloj);
    };
  }, [montado, modo.movil, transformar]);

  // El viento: sólo en escritorio, sólo con movimiento permitido y sólo cuando
  // la transformación terminó del todo.
  useEffect(() => {
    // El puntero grueso entra ACÁ y en ningún otro lado: en una pantalla
    // táctil el collage se arma igual, con su entrada completa, y lo único que
    // no existe es la física del cursor. No hay cursor que levante una ráfaga,
    // y un bucle de rAF corriendo para nadie es batería regalada.
    if (fase !== "interactivo" || modo.movil || modo.quieto || modo.grueso) return;
    const hero = heroRef.current;
    if (!hero) return;

    // ---- Las quince figuritas, con el modelo libre ----
    // Escriben en la caja de ADENTRO y se miden por la de afuera: la de afuera
    // es de la línea de tiempo de la transformación y no se mueve mientras
    // corre la física, así que su rectángulo es la posición de reposo sin
    // tener que descontarle nada.
    const piezas: PiezaViento[] = [];
    for (const capa of CAPAS) {
      const el = capasRef.current.get(capa.id);
      const cuerpo = cuerposRef.current.get(capa.id);
      if (el && cuerpo) {
        piezas.push({
          el: cuerpo,
          ancla: el,
          fisica: capa.fisica,
          modelo: "libre",
          rol: capa.rol,
          respetaZonaSegura: true,
          seAquieta: false,
          propiedad: "transform",
          limpiaAlDestruir: false,
        });
      }
    }

    // ---- La columna entera también ondea ----
    // Con el MISMO bucle que las figuritas pero con la otra ley: resorte
    // amortiguado, que es la que tenía todo el hero antes. Ondean cuando pasa
    // una ráfaga y vuelven enseguida a su renglón, y tienen que volver: son
    // texto que se lee y controles que se apuntan. La libertad del modelo
    // nuevo —irse y quedarse donde quedó— es justo lo que acá no se puede.
    //
    // Además llevan el pozo de calma: la fuerza se apaga cuando el cursor entra
    // en la columna. Sin eso el empuje ALEJA del cursor y las tarjetas se
    // escaparían justo cuando alguien va a tocarlas —son los seis destinos más
    // consultados, el primero con 831 visitas por día—. Se eligió entre cuatro
    // modelos probándolos con un cronómetro, no discutiéndolos.
    const columna = columnaRef.current;
    if (columna) {
      for (const { selector, fisica } of PIEZAS_DE_LA_COLUMNA) {
        for (const el of columna.querySelectorAll<HTMLElement>(selector)) {
          piezas.push({
            el,
            fisica,
            modelo: "resorte",
            respetaZonaSegura: false,
            seAquieta: true,
            propiedad: "translate",
            limpiaAlDestruir: true,
          });
        }
      }
    }

    // El Map se toma acá y no en la limpieza: es siempre el MISMO objeto —los
    // ref callbacks le hacen set y delete, nunca lo reemplazan— así que leerlo
    // ahora o después da lo mismo, y de paso la regla exhaustive-deps se queda
    // tranquila en vez de avisar por un .current leído en una limpieza.
    const cuerpos = cuerposRef.current;

    /**
     * Hasta dónde puede llegar el borde izquierdo de una figurita.
     *
     * El 43% del hero solo no alcanza, y está medido: la columna mide
     * min(52,6%, 38rem), así que entre 1024 y ~1330px de ancho el 43% cae
     * ADENTRO de ella. El contenido queda expuesto 56px a 1024, 60 a 1100 y
     * 51 a 1200; recién desde 1366 el porcentaje va por fuera. En ese tramo
     * una figurita se podía parar encima del título y de la bajada, que en
     * modo lámina no tienen panel detrás ni fondo propio.
     *
     * Así que el tope es el mayor de los dos: el porcentaje —que sigue
     * mandando en pantallas anchas, donde la columna se queda fija en 608px y
     * dejaría demasiado campo libre— y el borde derecho REAL del contenido.
     *
     * Se mide el contenido y no la caja de la columna: a 1024 la caja termina
     * en 531 y el contenido en 490, o sea que usar la caja regalaría 41px de
     * campo de juego sin motivo. Los selectores son los mismos que ondean con
     * el modelo resorte, así que no hay una segunda lista que mantener.
     *
     * Corre en medir(), no por cuadro: al encender y cuando el ResizeObserver
     * avisa.
     */
    const limite = () => {
      const caja = hero.getBoundingClientRect();
      const porPorcentaje = (caja.width * (ZONA_SEGURA_DERECHA + COLCHON_ZONA_SEGURA)) / 100;
      const columna = columnaRef.current;
      if (!columna) return porPorcentaje;
      let contenido = 0;
      for (const { selector } of PIEZAS_DE_LA_COLUMNA) {
        for (const el of columna.querySelectorAll<HTMLElement>(selector)) {
          const r = el.getBoundingClientRect();
          if (r.width > 0) contenido = Math.max(contenido, r.right - caja.left);
        }
      }
      const colchon = (caja.width * COLCHON_ZONA_SEGURA) / 100;
      return Math.max(porPorcentaje, contenido + colchon);
    };

    const viento = crearViento(hero, piezas, limite, () => columnaRef.current);
    vientoRef.current = viento;
    viento.encender();

    // Fuera de pantalla o con la pestaña oculta no hay nada que animar.
    //
    // Los dos eventos deciden lo MISMO, así que la condición vive en un solo
    // lugar y el estado de la intersección se guarda. Antes cada uno decidía
    // por su lado y el de visibilidad no podía consultar al otro: volver a la
    // pestaña con el hero varias pantallas más arriba reencendía el bucle, y
    // el observador no lo corregía porque sólo dispara cuando el cruce CAMBIA.
    let aLaVista = true;
    const decidir = () => (aLaVista && !document.hidden ? viento.encender() : viento.apagar());

    const observador = new IntersectionObserver(
      ([e]) => {
        aLaVista = e.isIntersecting;
        decidir();
      },
      { threshold: 0 },
    );
    observador.observe(hero);

    document.addEventListener("visibilitychange", decidir);

    // Los límites se recalculan con un ResizeObserver y no con el resize de
    // la ventana, que era lo que había. No es lo mismo: el hero puede cambiar
    // de tamaño sin que la ventana se mueva —al terminar de cargar las fuentes,
    // al abrirse el desplegable de sugerencias, al aparecer una barra de
    // desplazamiento— y con el oyente de ventana todo eso pasaba inadvertido y
    // las quince figuritas quedaban midiendo contra un hero que ya no existía.
    //
    // Mira las dos cajas que importan: el hero, de donde salen los bordes, y la
    // columna, de donde sale el límite de la zona segura y el pozo de calma.
    const medidor = new ResizeObserver(() => viento.medir());
    medidor.observe(hero);
    if (columna) medidor.observe(columna);

    return () => {
      observador.disconnect();
      medidor.disconnect();
      document.removeEventListener("visibilitychange", decidir);
      viento.destruir();
      vientoRef.current = null;

      // ---- Y el desplazamiento, si no hay quién se lo lleve ----
      // destruir() NO borra el transform de las figuritas a propósito: cuando
      // esta limpieza viene de restaurar(), la animación de regreso las
      // desvanece desde donde quedaron y soltarCapas limpia al final.
      //
      // Pero esta limpieza también corre por un cambio de medio —alguien activa
      // "reducir movimiento", conecta una pantalla táctil, angosta la ventana
      // por debajo de 64rem— y ahí NO hay animación de regreso ninguna. Sin
      // esto, las quince quedaban congeladas fuera de su sitio justo cuando se
      // pidió que no hubiera movimiento, y al volver a habilitarlo el viento
      // nuevo medía desde el ancla, arrancaba en cero y las quince pegaban un
      // salto al origen en un solo cuadro.
      //
      // ocupadoRef distingue los dos casos sin necesidad de una bandera nueva:
      // vale true exactamente mientras hay una transición corriendo, y
      // restaurar() lo pone en true justo antes de matar el viento.
      if (!ocupadoRef.current) {
        for (const cuerpo of cuerpos.values()) cuerpo.style.transform = "";
      }
    };
  }, [fase, modo.movil, modo.quieto, modo.grueso]);

  return (
    <section
      className="ht"
      ref={heroRef}
      data-fase={fase}
      data-papel={papel ? "" : undefined}
      aria-labelledby="titulo-buscar"
    >
      {/* La escena es hermana de la columna, no su ancestro: por eso un clic
          en el buscador o en una tarjeta no dispara nunca la transformación. */}
      <div
        className="ht__escena"
        ref={escenaRef}
        onClick={(e) => {
          if (fase === "intro") {
            const caja = e.currentTarget.getBoundingClientRect();
            transformar({ x: e.clientX - caja.left, y: e.clientY - caja.top });
          } else if (fase === "interactivo") {
            restaurar();
          }
          // En "transicion" no pasa nada: es lo que bloquea el doble disparo.
        }}
      >
        {/* El fondo claro del collage, que queda detrás de todo y se descubre
            a medida que la fotografía se va. */}
        <div className="ht__fondo" aria-hidden="true" />

        <picture>
          <source srcSet={FOTO.avif} type="image/avif" />
          <img
            className="ht__foto"
            ref={fotoRef}
            src={FOTO.webp}
            alt={FOTO.alt}
            width={FOTO.ancho}
            height={FOTO.alto}
            /* Es el elemento LCP de la portada. */
            fetchPriority="high"
            loading="eager"
            decoding="async"
          />
        </picture>

        <div className="ht__onda" ref={ondaRef} aria-hidden="true" />

        {/* Las capas se montan recién en el cliente: en el teléfono no se
            piden nunca, y en escritorio no tienen por qué viajar en el HTML. */}
        {montado && !modo.movil && listo && (
          <div className="ht__capas" aria-hidden="true">
            {CAPAS.map((capa) => (
              <div
                key={capa.id}
                className="ht__capa"
                data-capa={capa.id}
                ref={(el) => {
                  if (el) capasRef.current.set(capa.id, el);
                  else capasRef.current.delete(capa.id);
                }}
                style={
                  {
                    "--x": `${capa.final.x}%`,
                    "--y": `${capa.final.y}%`,
                    "--w": `clamp(${capa.final.minPx}px, ${capa.final.anchoVw}vw, ${capa.final.maxPx}px)`,
                    zIndex: capa.z,
                  } as React.CSSProperties
                }
              >
                {/* La caja de adentro. Existe para repartir la propiedad
                    `transform`: la de afuera es de la línea de tiempo de la
                    transformación —la entrada y la salida— y ésta es de la
                    física. Dos dueños, dos elementos, cero conflicto. */}
                <div
                  className="ht__cuerpo"
                  ref={(el) => {
                    if (el) cuerposRef.current.set(capa.id, el);
                    else cuerposRef.current.delete(capa.id);
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element --
                      Las quince capas NO pasan por next/image a proposito: ya vienen
                      optimizadas del paquete (WebP con alfa, ~1400px, 2,9 MB las quince),
                      el optimizador las volveria a comprimir sin ganancia, y cada <Image>
                      agrega un envoltorio con posicion propia que pelearia con el transform
                      que les escriben la linea de tiempo y la fisica. */}
                  <img src={`/hero-tucuman/capas/${capa.archivo}`} alt="" aria-hidden="true" />
                </div>
              </div>
            ))}
          </div>
        )}

        {montado && modo.movil && (
          /* eslint-disable-next-line @next/next/no-img-element -- mismo motivo que las capas */
          <img className="ht__collage" ref={collageRef} src={COLLAGE_MOVIL} alt="" aria-hidden="true" />
        )}
      </div>

      {/* El panel que le da fondo conocido a la columna. Sin esto el texto
          blanco caería sobre la fotografía —medido: el píxel más claro de la
          franja izquierda es blanco puro, o sea 1:1— y después sobre el fondo
          casi blanco del collage, donde desaparecería del todo. */}
      <div className="ht__panel" ref={panelRef} aria-hidden="true" />

      <div className="ht__columna" ref={columnaRef}>
        {children}
        {/* Un solo botón para los dos sentidos. Antes quedaba deshabilitado
            para siempre después de usarse, y el foco de quien lo había
            activado con Enter se quedaba sobre un control invisible y muerto.
            Ahora cambia de nombre y sigue siendo el mismo destino de foco. */}
        <button
          type="button"
          className="ht__disparador"
          onClick={() => (fase === "interactivo" ? restaurar() : transformar())}
          /* aria-disabled y no disabled, y no es un detalle de purista.
             Con el atributo nativo, el mismo render que lo apaga se lo aplica
             al elemento que TIENE el foco, y la regla de arreglo de foco del
             HTML lo manda al <body>: quien llegó por teclado se queda sin foco
             en ningún lado durante los 2,3 segundos de la ida, y al volver el
             botón a habilitarse el foco no se restituye. Hay que tabular otra
             vez desde el principio del documento —salto de contenido,
             encabezado, menú y toda la columna— para llegar al mismo control.
             Y de paso no se anuncia que el botón pasó a llamarse "Volver a la
             foto".

             Dejarlo clicable es seguro: el doble disparo ya lo bloquean los
             refs, no el atributo. transformar() sale en su primera línea si
             ocupadoRef está puesto o si la fase no es "intro", y restaurar()
             tiene la guarda simétrica. */
          aria-disabled={fase === "transicion"}
          aria-describedby="ht-ayuda"
        >
          {esperando
            ? "Preparando…"
            : fase === "interactivo"
              ? "Volver a la foto"
              : "Descubrí Tucumán"}
        </button>
        <p className="visualmente-oculto" id="ht-ayuda">
          Cambia entre la fotografía de la ciudad y una lámina de figuritas. Es
          decorativo: el buscador y los accesos siguen funcionando igual. Tocar
          la imagen hace lo mismo.
        </p>
        {/* Que el cambio no se comunique SÓLO por el movimiento. Va en polite
            para no interrumpir a quien esté leyendo las tarjetas. */}
        <p className="visualmente-oculto" role="status" aria-live="polite">
          {fase === "interactivo"
            ? "La fotografía de Tucumán se transformó en una lámina de figuritas."
            : ""}
        </p>
      </div>
    </section>
  );
}
