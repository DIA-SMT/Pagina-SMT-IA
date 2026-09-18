"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";

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
 * que ya hacen Tema.tsx y el encabezado. La instantánea es un string de dos
 * letras y no un objeto, porque el hook compara por identidad y un objeto nuevo
 * en cada lectura sería un bucle infinito.
 */
function suscribirMedios(avisar: () => void) {
  const ancho = window.matchMedia("(max-width: 63.999rem), (pointer: coarse)");
  const quieto = window.matchMedia("(prefers-reduced-motion: reduce)");
  ancho.addEventListener("change", avisar);
  quieto.addEventListener("change", avisar);
  return () => {
    ancho.removeEventListener("change", avisar);
    quieto.removeEventListener("change", avisar);
  };
}
const leerMedios = () =>
  (window.matchMedia("(max-width: 63.999rem), (pointer: coarse)").matches ? "m" : "d") +
  (window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "q" : "-");
/** En el servidor no hay medios: se asume escritorio con movimiento. */
const mediosEnElServidor = () => "d-";

/**
 * Devuelve las capas a su estado de reposo: sin transform y sin opacidad en
 * línea, o sea mandando lo que dice el CSS. Va suelta y no adentro del
 * componente porque se usa en los dos sentidos y porque el compilador de React
 * no deja mutar dentro de un hook algo que llegó como argumento de otro.
 */
function soltarCapas(capas: Map<string, HTMLElement>, opacidad?: string) {
  for (const el of capas.values()) {
    el.style.transform = "";
    el.style.opacity = opacidad ?? "";
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
  const modo = { movil: medios[0] === "m", quieto: medios[1] === "q" };
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
  /** La precarga ya se lanzó; no se lanza dos veces. */
  const precargandoRef = useRef(false);
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
      soltarCapas(capasRef.current);

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
        soltarCapas(capasRef.current, "1");
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
    vientoRef.current?.destruir();
    vientoRef.current = null;
    // Y se borran los transform en línea que dejó el viento: la animación de
    // regreso arranca desde la posición de reposo, no desde donde quedó la
    // última ráfaga.
    soltarCapas(capasRef.current, "1");

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
      // Las capas vuelven a estar invisibles, como manda el CSS en reposo.
      soltarCapas(capasRef.current);
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
    const archivos = modo.movil
      ? [COLLAGE_MOVIL]
      : CAPAS.map((c) => `/hero-tucuman/capas/${c.archivo}`);

    const pedir = () => {
      if (precargandoRef.current || !vivo) return;
      precargandoRef.current = true;
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
        setListo(true);
        // Si tocó temprano, arranca sola. Llamarla desde el then de una promesa
        // no es "setState dentro de un efecto": el pedido lo hizo la persona.
        if (pendienteRef.current) transformar();
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
    if (fase !== "interactivo" || modo.movil || modo.quieto) return;
    const hero = heroRef.current;
    if (!hero) return;

    const piezas: PiezaViento[] = [];
    for (const capa of CAPAS) {
      const el = capasRef.current.get(capa.id);
      if (el) {
        piezas.push({
          el,
          fisica: capa.fisica,
          respetaZonaSegura: true,
          seAquieta: false,
          propiedad: "transform",
        });
      }
    }

    // ---- La columna entera también ondea ----
    // Con el mismo viento que las figuritas, que es lo que se pidió, pero con
    // el pozo de calma puesto: la fuerza se apaga cuando el cursor entra en la
    // columna. Sin eso el empuje ALEJA del cursor y las tarjetas se escaparían
    // justo cuando alguien va a tocarlas —son los seis destinos más
    // consultados, el primero con 831 visitas por día—. Se eligió entre cuatro
    // modelos probándolos con un cronómetro, no discutiéndolos.
    const columna = columnaRef.current;
    if (columna) {
      for (const { selector, fisica } of PIEZAS_DE_LA_COLUMNA) {
        for (const el of columna.querySelectorAll<HTMLElement>(selector)) {
          piezas.push({
            el,
            fisica,
            respetaZonaSegura: false,
            seAquieta: true,
            propiedad: "translate",
          });
        }
      }
    }

    const limite = () =>
      (hero.getBoundingClientRect().width * (ZONA_SEGURA_DERECHA + COLCHON_ZONA_SEGURA)) / 100;

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

    const alRedimensionar = () => viento.medir();
    window.addEventListener("resize", alRedimensionar, { passive: true });

    return () => {
      observador.disconnect();
      document.removeEventListener("visibilitychange", decidir);
      window.removeEventListener("resize", alRedimensionar);
      viento.destruir();
      vientoRef.current = null;
    };
  }, [fase, modo.movil, modo.quieto]);

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
          {/* eslint-disable-next-line @next/next/no-img-element --
              Las quince capas NO pasan por next/image a proposito: ya vienen
              optimizadas del paquete (WebP con alfa, ~1400px, 2,9 MB las quince),
              el optimizador las volveria a comprimir sin ganancia, y cada <Image>
              agrega un envoltorio con posicion propia que pelearia con el transform
              que les escriben la linea de tiempo y el viento. */}
                <img src={`/hero-tucuman/capas/${capa.archivo}`} alt="" aria-hidden="true" />
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
          disabled={fase === "transicion"}
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
