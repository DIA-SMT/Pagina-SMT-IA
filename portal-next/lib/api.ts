import "server-only";
import { promises as fs } from "node:fs";
import path from "node:path";

import type {
  Area,
  AreaResumen,
  Banner,
  Busqueda,
  Categoria,
  CategoriaConItems,
  Emergencia,
  Ficha,
  FichaResumen,
  Galeria,
  GaleriaResumen,
  Nota,
  NotaResumen,
  Paginado,
  Slider,
} from "./tipos";

/**
 * Cliente de datos del portal.
 *
 * ESTE ES EL ÚNICO ARCHIVO ACOPLADO AL ORIGEN DE LOS DATOS. Las páginas
 * consumen las funciones de acá y no saben de dónde sale la información. Si
 * mañana los datos se mudan a otra base, se reescribe este módulo y el resto
 * del sitio queda igual.
 *
 * Tiene dos modos:
 *  - API real: pide a datos.smt.gob.ar con token y revalidación incremental.
 *  - Fixtures: lee los JSON de `fixtures/`, capturados de la API real. Sirve
 *    para desarrollar mientras el DNS de datos.smt.gob.ar no resuelva.
 *
 * El modo se elige solo: si no hay API_BASE configurada, usa fixtures.
 */

const API_BASE = process.env.API_BASE?.replace(/\/$/, "") ?? "";
const API_TOKEN = process.env.API_TOKEN ?? "";
const USAR_FIXTURES = !API_BASE || process.env.USAR_FIXTURES === "1";

/** Cada cuánto Next revalida las páginas. Los contenidos cambian poco. */
export const REVALIDAR = Number(process.env.REVALIDAR ?? 300);

const DIR_FIXTURES = path.join(process.cwd(), "..", "fixtures");

class ErrorApi extends Error {
  constructor(
    message: string,
    readonly estado: number,
  ) {
    super(message);
    this.name = "ErrorApi";
  }
}

/**
 * Traduce una ruta de la API al nombre de archivo del fixture equivalente.
 *
 * Los segmentos se decodifican: la ruta llega percent-encoded porque así viaja
 * a la API, pero los fixtures se guardaron con el nombre literal. Sin esto, la
 * nota cuyo slug tiene espacios ("Registros _Transporte _Individual_Pasajeros",
 * 44 visitas diarias en el sitio actual) buscaría un archivo con "%20" adentro
 * y daría 404 en el build. Un porcentaje mal formado no tira: se usa el
 * segmento crudo y el fixture simplemente no aparece, que es el 404 correcto.
 */
function decodificarSegmento(valor: string): string {
  try {
    return decodeURIComponent(valor);
  } catch {
    return valor;
  }
}

function rutaAFixture(ruta: string): string {
  const [camino, query] = ruta.split("?");
  const partes = camino
    .replace(/^\/v1\/?/, "")
    .split("/")
    .filter(Boolean)
    .map(decodificarSegmento);

  if (partes.length === 0) return "indice.json";

  const [recurso, arg, sub] = partes;

  if (recurso === "buscar") {
    const q = new URLSearchParams(query ?? "").get("q") ?? "";
    return `buscar-${q}.json`;
  }
  if (recurso === "items" && sub === "fichas") return `item-${arg}-fichas.json`;
  if (arg) return `${recurso.replace(/s$/, "")}-${arg}.json`;
  return `${recurso}.json`;
}

async function pedir<T>(ruta: string, revalidar = REVALIDAR): Promise<T> {
  if (USAR_FIXTURES) {
    const archivo = path.join(DIR_FIXTURES, rutaAFixture(ruta));
    try {
      return JSON.parse(await fs.readFile(archivo, "utf8")) as T;
    } catch {
      throw new ErrorApi(`Sin fixture para ${ruta} (${path.basename(archivo)})`, 404);
    }
  }

  const respuesta = await fetch(`${API_BASE}${ruta}`, {
    headers: { Authorization: `Bearer ${API_TOKEN}` },
    next: { revalidate: revalidar },
  });

  if (!respuesta.ok) {
    throw new ErrorApi(`La API respondió ${respuesta.status} en ${ruta}`, respuesta.status);
  }
  return (await respuesta.json()) as T;
}

/**
 * Igual que `pedir`, pero devuelve null cuando el recurso no existe.
 * Las páginas lo usan para llamar a notFound() en vez de romper.
 */
async function pedirOpcional<T>(ruta: string, revalidar = REVALIDAR): Promise<T | null> {
  try {
    return await pedir<T>(ruta, revalidar);
  } catch (e) {
    if (e instanceof ErrorApi && e.estado === 404) return null;
    throw e;
  }
}

/* ---- Trámites y servicios ---- */

export const getCategorias = () => pedir<Categoria[]>("/v1/categorias");

export const getCategoria = (id: number) =>
  pedirOpcional<CategoriaConItems>(`/v1/categorias/${id}`);

export const getFichasDeItem = (itemId: number) =>
  pedirOpcional<FichaResumen[]>(`/v1/items/${itemId}/fichas`);

export const getFicha = (id: number) => pedirOpcional<Ficha>(`/v1/fichas/${id}`);

/* ---- Notas (las páginas sueltas del sitio) ---- */

export const getNotas = (pagina = 1, porPagina = 100) =>
  pedir<Paginado<NotaResumen>>(`/v1/notas?pagina=${pagina}&por_pagina=${porPagina}`);

export const getNota = (slug: string) =>
  pedirOpcional<Nota>(`/v1/notas/${encodeURIComponent(slug)}`);

/* ---- Gobierno ---- */

export const getAreas = () => pedir<AreaResumen[]>("/v1/areas");

export const getArea = (id: number) => pedirOpcional<Area>(`/v1/areas/${id}`);

/* ---- Galería ---- */

export const getGalerias = () => pedir<GaleriaResumen[]>("/v1/galerias");

export const getGaleria = (id: number) => pedirOpcional<Galeria>(`/v1/galerias/${id}`);

/* ---- Portada ---- */

export const getSliders = () => pedir<Slider[]>("/v1/sliders");

export const getBanners = () => pedir<Banner[]>("/v1/banners");

export const getEmergencias = () => pedir<Emergencia[]>("/v1/emergencias");

/* ---- Buscador ---- */

export const getBusqueda = (q: string) =>
  pedir<Busqueda>(`/v1/buscar?q=${encodeURIComponent(q)}`, 60);

export { ErrorApi, USAR_FIXTURES };
