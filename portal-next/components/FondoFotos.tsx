import Image from "next/image";

import type { Foto } from "@/lib/tipos";

/** Segundos que se queda cada foto antes de pasar a la siguiente. */
const SEGUNDOS = 7;

/**
 * Fondo de fotos que se van pasando, para una sección oscura.
 *
 * Las fotos salen de las galerías del CMS: el municipio las carga y la portada
 * las muestra sola. Cuáles entran lo decide `fotosParaElFondo` en
 * app/page.tsx, que se queda con las que tienen descripción y además miden lo
 * suficiente para no verse estiradas.
 *
 * El pasaje es una animación CSS y no JavaScript: son capas apiladas con la
 * opacidad animada y el arranque escalonado. No cuesta ni un byte de
 * JavaScript en el cliente.
 *
 * Las fotos son decorativas —alt vacío—: la descripción del CMS ya se publica
 * en la galería, que es donde informa. Acá repetir "Plaza Independencia"
 * mientras alguien lee los títulos de la sección sería ruido.
 */
export function FondoFotos({ fotos }: { fotos: Foto[] }) {
  if (fotos.length === 0) return null;

  const total = fotos.length;

  /**
   * Los tiempos se calculan acá y no se escriben en la hoja de estilos porque
   * la cantidad de fotos la decide el CMS: si el municipio sube una foto
   * grande más, son seis, y si borra una son tres. Con porcentajes fijos, el
   * día que cambie la cantidad quedarían huecos en negro entre foto y foto.
   *
   * Cada una está visible su parte del ciclo, con un cruce de 2% a cada lado
   * que se superpone con el de la vecina.
   */
  const ventana = 100 / total;
  const cruce = Math.min(2, ventana / 4);
  const fotogramas =
    total === 1
      ? null
      : `@keyframes pasar-fotos-${total}{` +
        `0%{opacity:0}` +
        `${cruce.toFixed(2)}%{opacity:1}` +
        `${(ventana - cruce).toFixed(2)}%{opacity:1}` +
        `${ventana.toFixed(2)}%{opacity:0}` +
        `100%{opacity:0}}`;

  return (
    <div className="fondo-fotos" aria-hidden="true">
      {fotogramas ? <style>{fotogramas}</style> : null}

      {fotos.map((foto, i) => (
        <Image
          key={foto.id}
          src={foto.imagen ?? ""}
          alt=""
          fill
          sizes="100vw"
          /* La sección está bien debajo de la línea de flotación: las fotos se
             piden recién cuando alguien baja hasta acá, así que la portada
             carga igual de liviana que antes para quien no llega. */
          loading="lazy"
          style={
            total === 1
              ? { opacity: 1 }
              : {
                  animationName: `pasar-fotos-${total}`,
                  animationDuration: `${total * SEGUNDOS}s`,
                  animationDelay: `${i * SEGUNDOS}s`,
                }
          }
        />
      ))}

      {/* El velo es lo que garantiza el contraste del título y la bajada pase
          la foto que pase, incluida una clara que el municipio suba mañana. */}
      <div className="fondo-fotos__velo" />
    </div>
  );
}
