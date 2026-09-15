import type { MetadataRoute } from "next";

import { SITIO } from "@/lib/sitio";

/**
 * robots.txt del portal.
 *
 * Hoy /robots.txt recibe 643 pedidos diarios y ninguno se contesta como
 * corresponde: en el sitio actual la ruta comodín de Laravel se traga
 * cualquier URL de un solo segmento y le devuelve al rastreador el 404
 * maquetado del sitio. Como archivo de convención del App Router, Next lo
 * resuelve antes que cualquier página y el problema desaparece.
 */

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",

      // No hay Disallow. El candidato natural era /buscar, que arma una URL
      // distinta por consulta, pero bloquearlo sería contraproducente: la
      // página ya se declara `noindex` (app/buscar/page.tsx) y un rastreador
      // que tiene prohibido entrar nunca llega a leer esa directiva. El
      // resultado sería el peor de los dos mundos: la URL igual puede
      // aparecer en el índice —alcanza con que alguien la enlace— y el
      // buscador no se entera nunca de que no debe publicarla. Dejándolo
      // pasar, lee el noindex y la descarta. El presupuesto de rastreo no es
      // argumento acá: el sitio tiene poco más de doscientas URLs.
    },

    // Los 71 pedidos diarios a /sitemap.xml, /sitemap_index.xml y
    // /sitemap-news.xml son rastreadores adivinando rutas. Declarando la
    // verdadera dejan de adivinar.
    sitemap: `${SITIO}/sitemap.xml`,
  };
}

/*
 * Lo que deliberadamente NO se bloquea:
 *
 * - /_next/: son el CSS y el JavaScript del build. Bloquearlos le impide al
 *   buscador renderizar las páginas como las ve el vecino, que es justamente
 *   con lo que evalúa el sitio.
 * - Las URLs del esquema viejo (/nota/..., /area/..., /tramite/..., y los
 *   slugs de nota colgados de la raíz): son redirecciones 308 a su equivalente
 *   nuevo (next.config.ts). Bloquearlas evitaría que el rastreador las siga y
 *   el posicionamiento acumulado no pasaría a las URLs nuevas.
 * - /api: la API vive detrás del mismo dominio por proxy, pero exige token y
 *   no devuelve nada indexable. Un Disallow no agrega seguridad —un robots.txt
 *   es público y se cumple por convención— y solo sumaría ruido.
 * - La 404: Next ya le inyecta `noindex` a las respuestas 404
 *   (app/not-found.tsx), que es lo que corresponde; no hay una ruta fija que
 *   listar acá.
 */
