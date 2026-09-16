"use client";

import { useCallback, useEffect, useRef, useState } from "react";

const SEGUNDOS = 6;

/**
 * Carrusel de los banners de campaña.
 *
 * Por qué carrusel y no la grilla que había: los banners vienen del CMS en
 * siete proporciones distintas, de 1:1 (960x960, "Escucha la radio") a 10,78:1
 * (970x90, "Portal de Datos"). Puestos en una grilla de dos columnas, cada
 * fila quedaba de una altura distinta y el bloque se veía desprolijo. Acá
 * todos comparten un cajón del mismo tamaño y cada uno entra completo adentro,
 * sin recortarse ni estirarse.
 *
 * El arreglo de fondo no es este: es que el municipio genere los banners en
 * una medida única. Mientras tanto, esto los ordena.
 *
 * El desplazamiento es el nativo del navegador con scroll-snap, no una
 * animación propia: así funcionan gratis el arrastre con el dedo, la rueda del
 * mouse y el teclado.
 */
export function CarruselBanners({
  children,
  cantidad,
}: {
  children: React.ReactNode;
  cantidad: number;
}) {
  const pista = useRef<HTMLDivElement>(null);
  const [actual, setActual] = useState(0);
  const [pausado, setPausado] = useState(false);
  /* Distinto de `pausado`: esta es la pausa de mientras alguien mira o navega
     con el teclado, y se deshace sola. La otra es la del botón, que es una
     decisión de la persona y se respeta hasta que la cambie. */
  const [enUso, setEnUso] = useState(false);

  const menosMovimiento = () =>
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /**
   * El índice se calcula SIEMPRE desde el scroll real y nunca desde el estado
   * de React.
   *
   * No es purismo: el estado llega tarde. Si alguien arrastra con el dedo, o
   * si la flecha se aprieta dos veces seguidas antes de que React repinte, el
   * contador queda atrasado y la flecha salta al lugar equivocado. Medido: al
   * llegar al final, la flecha derecha se quedaba trabada en vez de volver al
   * principio.
   */
  const indiceReal = useCallback(() => {
    const p = pista.current;
    if (!p || p.children.length === 0) return 0;
    const slides = [...p.children] as HTMLElement[];

    /* Al final del recorrido, los últimos banners comparten la misma pantalla:
       el scroll se termina antes de que el último llegue a apoyarse en el
       borde. Sin este caso aparte, el indicador nunca encendía el último punto
       y la flecha derecha se quedaba trabada en vez de volver al principio. */
    if (p.scrollLeft >= p.scrollWidth - p.clientWidth - 2) return slides.length - 1;

    const izquierda = p.scrollLeft;
    let cerca = 0;
    let mejor = Infinity;
    slides.forEach((s, i) => {
      const d = Math.abs(s.offsetLeft - p.offsetLeft - izquierda);
      if (d < mejor) {
        mejor = d;
        cerca = i;
      }
    });
    return cerca;
  }, []);

  const irA = useCallback((indice: number) => {
    const p = pista.current;
    if (!p) return;
    const slide = p.children[indice] as HTMLElement | undefined;
    if (!slide) return;
    p.scrollTo({
      left: slide.offsetLeft - p.offsetLeft,
      behavior: menosMovimiento() ? "auto" : "smooth",
    });
    setActual(indice);
  }, []);

  /* El indicador sigue al scroll, venga de donde venga: de las flechas, del
     dedo o de la rueda del mouse. */
  useEffect(() => {
    const p = pista.current;
    if (!p) return;
    let pendiente = 0;
    const alScrollear = () => {
      cancelAnimationFrame(pendiente);
      pendiente = requestAnimationFrame(() => setActual(indiceReal()));
    };
    p.addEventListener("scroll", alScrollear, { passive: true });
    return () => {
      p.removeEventListener("scroll", alScrollear);
      cancelAnimationFrame(pendiente);
    };
  }, [indiceReal]);

  /* Pasaje automático. No arranca si el sistema pide menos movimiento: un
     bloque que se mueve solo es justamente lo que esa preferencia evita. */
  useEffect(() => {
    if (pausado || enUso || cantidad < 2 || menosMovimiento()) return;
    const reloj = setInterval(() => irA((indiceReal() + 1) % cantidad), SEGUNDOS * 1000);
    return () => clearInterval(reloj);
  }, [pausado, enUso, cantidad, irA, indiceReal]);

  if (cantidad === 0) return null;

  const mover = (paso: number) => irA((indiceReal() + paso + cantidad) % cantidad);

  return (
    <div
      className="carrusel"
      role="group"
      aria-roledescription="carrusel"
      aria-label="Campañas y accesos del municipio"
      onMouseEnter={() => setEnUso(true)}
      onMouseLeave={() => setEnUso(false)}
    >
      <div
        className="carrusel__pista"
        ref={pista}
        /* El foco frena el pasaje sólo acá adentro, donde están los banners: si
           esto colgara del contenedor entero, apretar "Reanudar" dejaría el
           foco en ese botón y el carrusel no volvería a arrancar nunca. */
        onFocusCapture={() => setEnUso(true)}
        onBlurCapture={() => setEnUso(false)}
        /* Mientras pasa solo, el lector de pantalla no debe anunciar cada
           cambio: sería una interrupción constante. Pausado sí, porque
           entonces el cambio lo provocó la persona. */
        aria-live={pausado ? "polite" : "off"}
      >
        {children}
      </div>

      <div className="carrusel__controles">
        <button
          type="button"
          className="carrusel__flecha"
          onClick={() => mover(-1)}
          aria-label="Banner anterior"
        >
          <span aria-hidden="true">‹</span>
        </button>

        {/* Sin la palabra al lado: es un círculo del mismo tamaño que las
            flechas, para que los tres controles lean como una sola fila.
            El nombre accesible cambia con el estado y no lleva aria-pressed:
            es el patrón de un reproductor, donde la etiqueta dice qué va a
            pasar al apretarlo. Con los dos a la vez, el lector de pantalla
            anuncia el estado dos veces. */}
        <button
          type="button"
          className="carrusel__flecha"
          onClick={() => setPausado((p) => !p)}
          aria-label={pausado ? "Reanudar el pasaje automático" : "Pausar el pasaje automático"}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" aria-hidden="true" focusable="false">
            {pausado ? (
              <path d="M3 1.5 12.5 7 3 12.5Z" fill="currentColor" />
            ) : (
              <>
                <rect x="2.5" y="1.5" width="3.5" height="11" rx="1" fill="currentColor" />
                <rect x="8" y="1.5" width="3.5" height="11" rx="1" fill="currentColor" />
              </>
            )}
          </svg>
        </button>

        <ol className="carrusel__puntos">
          {Array.from({ length: cantidad }, (_, i) => (
            <li key={i}>
              <button
                type="button"
                onClick={() => irA(i)}
                aria-label={`Ir al banner ${i + 1} de ${cantidad}`}
                aria-current={i === actual ? "true" : undefined}
              />
            </li>
          ))}
        </ol>

        <button
          type="button"
          className="carrusel__flecha"
          onClick={() => mover(1)}
          aria-label="Banner siguiente"
        >
          <span aria-hidden="true">›</span>
        </button>
      </div>
    </div>
  );
}
