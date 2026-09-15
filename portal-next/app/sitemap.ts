import type { MetadataRoute } from "next";

import {
  getAreas,
  getCategoria,
  getCategorias,
  getFicha,
  getFichasDeItem,
  getGalerias,
  getNotas,
} from "@/lib/api";
import type {
  AreaResumen,
  Categoria,
  CategoriaConItems,
  Ficha,
  FichaResumen,
  GaleriaResumen,
  NotaResumen,
} from "@/lib/tipos";
import { SITIO } from "@/lib/sitio";

/**
 * Sitemap del portal.
 *
 * Para las fichas de trámite esto no es un complemento: es la única forma de
 * que un buscador las encuentre. /fichas/[id] no tiene generateStaticParams y
 * a cada ficha se llega recién después de entrar a una categoría y elegir un
 * ítem, así que ningún índice las enumera. Son 1.845 visitas diarias, el
 * contenido más consultado del sitio después de la portada.
 *
 * Todas las URLs salen de lib/api.ts. Lo único escrito a mano son los índices
 * de sección y las páginas institucionales, que no viven en el CMS.
 */

export const revalidate = 300;

/**
 * Las páginas que no vienen del CMS: los índices de cada sección y las
 * institucionales. Van sin lastModified porque no tienen una fecha de
 * contenido propia; se podría derivar del máximo de lo que listan, pero eso
 * sería un número calculado por nosotros, no un dato del CMS.
 *
 * /buscar no está a propósito: arma una URL distinta por consulta y ya se
 * declara noindex en app/buscar/page.tsx.
 */
const PAGINAS_FIJAS = [
  "/",
  "/tramites",
  "/gobierno",
  "/p",
  "/galeria",
  "/contacto",
  "/accesibilidad",
  "/mapa-del-sitio",
];

/**
 * "2026-07-31 16:12:57" -> "2026-07-31T16:12:57Z".
 *
 * Mismo criterio que `fechaLegible` en app/p/page.tsx: el string del CMS se
 * parte con un regex en lugar de pasarlo por Date. "2026-07-31 16:12:57" no es
 * ISO 8601 —el separador es un espacio, no una T—, así que cada motor lo
 * interpreta en la zona horaria de la máquina: el mismo dato daría un
 * <lastmod> corrido tres horas si el build corre en Tucumán y otro si corre en
 * un servidor en UTC.
 *
 * La Z se agrega porque el CMS guarda estas fechas en UTC. Verificado en el
 * servidor: config/app.php:70 del Laravel de producción declara
 * 'timezone' => 'UTC' y no hay APP_TIMEZONE que lo pise en el .env. Sin zona,
 * <lastmod> queda ambiguo.
 */
function fechaW3C(valor: string | null | undefined): string | undefined {
  if (!valor) return undefined;
  const partes = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?/.exec(valor);
  if (!partes) return undefined;
  const [, anio, mes, dia, hora] = partes;
  return hora ? `${anio}-${mes}-${dia}T${hora}Z` : `${anio}-${mes}-${dia}`;
}

/**
 * Una entrada del sitemap.
 *
 * Sin fecha real, la clave lastModified directamente no se emite. La
 * alternativa cómoda —poner `new Date()`— le mentiría al buscador diciéndole
 * que las 112 áreas de gobierno cambiaron hoy, y en la recorrida siguiente
 * volvería a cambiar: el campo dejaría de significar nada. lastmod es opcional
 * en el protocolo de sitemaps justamente para estos casos.
 *
 * changeFrequency y priority se omiten siempre: no hay ninguna medición en el
 * proyecto de cada cuánto cambia cada tipo de contenido ni de cuál pesa más, y
 * una jerarquía inventada no le agrega información a nadie.
 */
function entrada(ruta: string, actualizado?: string | null): MetadataRoute.Sitemap[number] {
  const url = `${SITIO}${ruta}`;
  const fecha = fechaW3C(actualizado);
  return fecha ? { url, lastModified: fecha } : { url };
}

/**
 * Una colección caída no puede llevarse puesto el sitemap entero: un sitemap
 * con 170 URLs sirve, un 500 no sirve para nada y encima le enseña al buscador
 * a espaciar las visitas. Mismo criterio y misma forma que en app/page.tsx y
 * en app/mapa-del-sitio/page.tsx.
 */
async function sinRomper<T>(promesa: Promise<T>, respaldo: T, que: string): Promise<T> {
  try {
    return await promesa;
  } catch (error) {
    console.error(`Sitemap: no se pudieron cargar ${que}.`, error);
    return respaldo;
  }
}

/**
 * Todas las notas, no solo las primeras cien.
 *
 * `por_pagina` está topeado en 100 del lado de la API. Hoy hay 31 notas y
 * sobra, pero el día que el municipio publique la 101 el resto desaparecería
 * del sitemap sin que nadie se entere. El corte va por `paginacion.paginas` y
 * no por la longitud de lo que llega: en modo fixtures todas las páginas
 * devuelven el mismo archivo y un bucle por longitud no terminaría nunca.
 */
async function todasLasNotas(): Promise<NotaResumen[]> {
  const primera = await getNotas(1, 100);
  const notas = [...primera.datos];

  for (let pagina = 2; pagina <= primera.paginacion.paginas; pagina += 1) {
    const siguiente = await getNotas(pagina, 100);
    notas.push(...siguiente.datos);
  }

  return notas;
}

/**
 * Las fichas de trámite, que se alcanzan en tres saltos: categorías -> ítems
 * -> fichas. Cada nivel se pide en paralelo porque en serie serían más de cien
 * esperas encadenadas.
 *
 * El tercer salto (el detalle de cada ficha) se hace solo por la fecha: el
 * listado de fichas de un ítem no trae `actualizado`, está únicamente en el
 * detalle. Vale el pedido extra porque son las URLs más visitadas del portal y
 * lastmod es lo que le dice al buscador cuáles vale la pena volver a mirar;
 * además la respuesta queda en la misma caché de datos que ya usan las propias
 * páginas de ficha.
 */
async function urlsDeFichas(categorias: Categoria[]): Promise<MetadataRoute.Sitemap> {
  const conItems = await Promise.all(
    categorias.map((categoria) =>
      sinRomper<CategoriaConItems | null>(
        getCategoria(categoria.id),
        null,
        `los ítems de la categoría ${categoria.id}`,
      ),
    ),
  );

  // Se piden las fichas de TODOS los ítems, también los que traen `enlace`.
  //
  // Filtrarlos parecía razonable —un ítem con enlace propio manda afuera— pero
  // los datos dicen otra cosa: de los 46 ítems con enlace, 24 apuntan al propio
  // smt.gob.ar (son URLs absolutas del sitio viejo cargadas a mano en el CMS) y
  // 14 tienen además una ficha en este portal. Ese filtro se llevaba puestas 14
  // fichas de trámite del sitemap, que es exactamente el contenido que el
  // sitemap existe para que un buscador encuentre.
  //
  // Un ítem que de verdad sólo lleva afuera simplemente devuelve una lista
  // vacía de fichas y no aporta ninguna URL.
  const items = conItems.flatMap((categoria) => categoria?.items ?? []);

  const listas = await Promise.all(
    items.map((item) =>
      sinRomper<FichaResumen[] | null>(
        getFichasDeItem(item.id),
        null,
        `las fichas del ítem ${item.id}`,
      ),
    ),
  );

  // Hoy hay una ficha por ítem, pero el modelo admite varias y nada impide que
  // dos ítems compartan una: el Set evita publicar la misma URL dos veces.
  const ids = [...new Set(listas.flatMap((fichas) => fichas ?? []).map((ficha) => ficha.id))];

  const detalles = await Promise.all(
    ids.map((id) => sinRomper<Ficha | null>(getFicha(id), null, `el detalle de la ficha ${id}`)),
  );

  // Si el detalle no llegó, la ficha igual va: quien la enumeró fue el listado
  // del ítem, que es la fuente de verdad de que existe. Lo único que se pierde
  // es la fecha.
  return ids.map((id, orden) => entrada(`/fichas/${id}`, detalles[orden]?.actualizado));
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Las categorías se piden aparte porque sirven dos veces: son URLs propias y
  // son el punto de entrada para llegar a las fichas.
  const categorias = await sinRomper<Categoria[]>(
    getCategorias(),
    [],
    "las categorías de trámites",
  );

  const [fichas, areas, notas, galerias] = await Promise.all([
    sinRomper<MetadataRoute.Sitemap>(urlsDeFichas(categorias), [], "las fichas de trámite"),
    sinRomper<AreaResumen[]>(getAreas(), [], "las áreas de gobierno"),
    sinRomper<NotaResumen[]>(todasLasNotas(), [], "las páginas de contenido"),
    sinRomper<GaleriaResumen[]>(getGalerias(), [], "las galerías"),
  ]);

  return [
    ...PAGINAS_FIJAS.map((ruta) => entrada(ruta)),

    // Categorías, áreas y galerías no tienen ningún campo de fecha en la API:
    // van sin lastModified.
    ...categorias.map((categoria) => entrada(`/tramites/${categoria.id}`)),

    ...fichas,

    ...areas.map((area) => entrada(`/gobierno/${area.id}`)),

    ...notas.flatMap((nota) => {
      // Sin slug no hay URL a la que llevar al vecino: el mismo filtro que
      // aplica app/p/page.tsx para armar el índice.
      const slug = nota.slug?.trim() ? nota.slug : null;
      if (!slug) return [];
      // El slug se codifica igual que en los enlaces del índice y en el
      // canonical de la nota: uno de los 31 tiene espacios ("Registros
      // _Transporte _Individual_Pasajeros", 44 visitas diarias) y sin esto su
      // <loc> saldría inválido.
      return [entrada(`/p/${encodeURIComponent(slug)}`, nota.actualizado)];
    }),

    ...galerias.map((galeria) => entrada(`/galeria/${galeria.id}`)),
  ];
}
