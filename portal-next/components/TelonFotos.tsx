import Image from "next/image";

/** Una foto del telón, venga de public/hero o de una galería del CMS. */
export type FotoDelTelon = {
  src: string;
  /** Recorte preferido cuando el cajón es más alto que la foto. */
  posicion?: string;
};

/**
 * Las fotografías del telón, que se van turnando con el SCROLL.
 *
 * ---- POR QUÉ ESTO ES UN COMPONENTE Y NO CINCO REGLAS EN main.css ----
 * Antes eran cinco fotos fijas y cinco bloques de @keyframes escritos a mano,
 * con los porcentajes calculados para cinco. Funcionaba mientras la cantidad
 * fuera cinco. Ahora las fotos salen de un sorteo entre las locales y las de
 * las galerías del CMS, así que la cantidad la decide el municipio: con
 * porcentajes fijos, el día que sean seis quedaría una foto sin turno y un
 * hueco en negro. Es el mismo razonamiento que ya había en FondoFotos.
 *
 * ---- LOS TURNOS ----
 * Cada foto ocupa su parte del recorrido, con un cruce a cada lado que se
 * superpone con el de la vecina. El cruce es del 20% de la ventana y como
 * mucho 4 puntos: con cinco fotos da exactamente 4, que son los mismos
 * porcentajes que estaban escritos a mano, así que este generador reproduce
 * el comportamiento anterior sin cambiar un píxel.
 *
 * ---- POR QUÉ LAS REGLAS VIENEN CON SUS GUARDAS ----
 * El animation-name NO va en un style en línea. Tiene que quedar adentro del
 * @supports y del @media de movimiento reducido, porque sin línea de tiempo
 * una animación con nombre y sin duración salta directo a su fotograma final
 * —opacidad 0 para todas menos la primera— y el telón se apagaría. Un estilo
 * en línea no se puede envolver en una guarda; una regla sí.
 */
export function TelonFotos({ fotos }: { fotos: FotoDelTelon[] }) {
  if (fotos.length === 0) return null;

  const total = fotos.length;
  const paso = 100 / total;
  // 20% de la ventana, con techo de 4 puntos. Con cinco fotos da 4 justo.
  const cruce = Math.min(4, paso * 0.2);
  const pct = (v: number) => `${Math.max(0, Math.min(100, v)).toFixed(2)}%`;

  let hoja = "";
  if (total > 1) {
    for (let i = 0; i < total; i++) {
      const entra = [i * paso - cruce, i * paso + cruce];
      const sale = [(i + 1) * paso - cruce, (i + 1) * paso + cruce];
      const tramos =
        i === 0
          ? `0%,${pct(sale[0])}{opacity:1}${pct(sale[1])},100%{opacity:0}`
          : i === total - 1
            ? `0%,${pct(entra[0])}{opacity:0}${pct(entra[1])},100%{opacity:1}`
            : `0%,${pct(entra[0])}{opacity:0}${pct(entra[1])},${pct(sale[0])}{opacity:1}` +
              `${pct(sale[1])},100%{opacity:0}`;
      hoja += `@keyframes telon-turno-${i + 1}{${tramos}}`;
    }
    hoja +=
      `@supports (animation-timeline: view()){@media (prefers-reduced-motion: no-preference){` +
      fotos
        .map(
          (_, i) =>
            `.telon__fotos img:nth-of-type(${i + 1})` +
            `{animation-name:telon-respirar,telon-turno-${i + 1}}`,
        )
        .join("") +
      `}}`;
  }

  return (
    <div className="telon__fotos">
      {hoja ? <style>{hoja}</style> : null}

      {fotos.map((foto) => (
        <Image
          key={foto.src}
          src={foto.src}
          alt=""
          fill
          /* El telón está bien debajo de la línea de flotación. */
          loading="lazy"
          /* No es 100vw: las fotos son apaisadas y el cajón es alto, así que
             object-fit cover las agranda hasta tapar el ALTO y quedan pintadas
             mucho más anchas que la pantalla. En un teléfono de 360x800 se
             pintan a 2400px de ancho, y con 100vw el navegador elegía el
             archivo de 750w: 6,4 veces estirado. Con 200vw baja a 3,3 y se
             paga medio archivo más. No se pide el tamaño exacto a propósito:
             serían 500 KB de fondo decorativo en móvil, que es el 60% del
             tráfico. */
          sizes="(max-width: 48rem) 200vw, 100vw"
          style={foto.posicion ? { objectPosition: foto.posicion } : undefined}
        />
      ))}

      {/* El velo. No es lo que sostiene el contraste del texto —eso lo hace la
          marquesina, que es opaca y no depende de la foto— sino lo que le da
          unidad de color a fotografías que ahora pueden venir de cualquier
          galería del CMS. */}
      <div className="telon__velo" aria-hidden="true" />
    </div>
  );
}
