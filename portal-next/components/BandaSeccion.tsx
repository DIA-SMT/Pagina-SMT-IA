import Image from "next/image";

import { BANDAS_SECCION } from "@/lib/hero";

/**
 * Banda fotográfica de sección, arriba del título de una página índice.
 *
 * Va antes de las migas y no entre las migas y el título: lo primero que
 * necesita quien entra es saber dónde está, y un bloque decorativo metido en
 * el medio de la orientación la corta al pedo.
 *
 * Es `priority` porque está sobre la línea de flotación en toda pantalla: sin
 * eso el navegador la descubre tarde y la banda aparece azul y después salta
 * a la foto, que es peor que no tenerla.
 */
export function BandaSeccion({ seccion }: { seccion: keyof typeof BANDAS_SECCION }) {
  const foto = BANDAS_SECCION[seccion];

  // Una sección sin foto asignada no rompe la página: simplemente no lleva
  // banda, que es el estado de las páginas de utilidad.
  if (!foto) return null;

  return (
    <div className="banda-seccion">
      <Image
        src={foto.src}
        alt={foto.alt}
        fill
        priority
        sizes="100vw"
        // El origen es un recorte a 1800x270 hecho a medida de esta banda, así
        // que no hace falta pedirle a next/image variantes más grandes.
      />
      <div className="banda-seccion__velo" aria-hidden="true" />
    </div>
  );
}
