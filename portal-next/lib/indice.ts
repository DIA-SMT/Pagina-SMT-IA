import "server-only";

import { getAreas, getCategoria, getCategorias, getFichasDeItem, getNotas } from "@/lib/api";
import type { Categoria, CategoriaConItems, FichaResumen } from "@/lib/tipos";

/**
 * Índice del buscador de la portada.
 *
 * Se arma en el servidor al generar la página y viaja al navegador junto al
 * HTML. Es a propósito: el buscador tiene que contestar mientras la persona
 * escribe, y pedirle cada tecla a la API no es opción cuando el servidor
 * municipal tarda entre 0,8 y 6,7 segundos por pedido (medido).
 *
 * Se regenera con la página cada cinco minutos, así que un trámite nuevo
 * aparece solo.
 */
export type EntradaIndice = {
  /** Título tal como lo publica el CMS. */
  t: string;
  /** Dónde vive: la categoría de un trámite, "Área de gobierno", etc. */
  d: string;
  /** Ruta interna del portal. */
  u: string;
  /** Visitas diarias medidas, sólo donde las hay. Desempata el orden. */
  v?: number;
};

/**
 * Visitas diarias medidas sobre el log del servidor, lunes 14/09/2026, día
 * hábil completo y con los bots excluidos.
 *
 * No es una estimación ni una preferencia editorial: es lo que la gente
 * efectivamente abre. Sirve para que "lic" devuelva Licencia de Conducir y no
 * "Medio Ambiente y Espacios Públicos", que también contiene esas tres letras.
 *
 * Conviene volver a medirlo una o dos veces por año. Si queda viejo no rompe
 * nada: lo único que pasa es que el orden deja de reflejar la realidad.
 * El detalle de la medición está en docs/trafico-y-redirecciones.md.
 */
const VISITAS_DIARIAS: Record<string, number> = {
  "/fichas/8": 831, // Licencia de conducir
  "/fichas/14": 217, // Emisión del carnet de sanidad
  "/p/turno-asistencia": 200,
  "/p/colectivos": 161,
  "/fichas/81": 85, // Servicio de Población Animal
  "/fichas/70": 82, // Consulta y pago de infracciones
  "/fichas/7": 70, // Portal de Atención Ciudadana
  "/fichas/77": 60, // Ciudadano Digital
  "/p/Sube": 54,
  "/fichas/17": 51, // Recorrido de colectivos
  "/tramites/7": 47, // Transporte y Movilidad
  "/p/Registros%20_Transporte%20_Individual_Pasajeros": 44,
  "/p/lugares-de-interes": 40,
  "/fichas/78": 38, // Prestaciones Asistencia Pública
  "/p/circuitos-turisticos": 38,
  "/p/SUBEM": 37,
  "/fichas/5": 33, // Habilitación comercial
  "/p/historia": 29,
  "/gobierno/1": 28, // Intendencia
  "/fichas/43": 27, // GIRSU
  "/p/concurso": 25,
  "/fichas/30": 25, // Código de Planeamiento Urbano
  "/fichas/23": 19, // Centro Integrador Comunitario
  "/tramites/18": 18, // Catastro y Edificación
  "/tramites/4": 12, // Prevención y Servicios de Salud
  "/tramites/1": 10, // Gestión Tributaria y Comercial
};

/** Una colección caída no puede dejar sin buscador a toda la portada. */
async function sinRomper<T>(promesa: Promise<T>, respaldo: T, que: string): Promise<T> {
  try {
    return await promesa;
  } catch (error) {
    console.error(`Índice del buscador: no se pudieron cargar ${que}.`, error);
    return respaldo;
  }
}

/**
 * Las fichas, que se alcanzan en tres saltos: categorías → ítems → fichas.
 *
 * Es el mismo recorrido que hace app/sitemap.ts. No se comparte el código
 * porque cada uno necesita campos distintos, pero sí la caché: las dos rutas
 * piden las mismas URLs, así que la segunda no vuelve a salir a la red.
 */
async function fichasDeTodasLasCategorias(
  categorias: Categoria[],
): Promise<{ ficha: FichaResumen; categoria: string }[]> {
  const conItems = await Promise.all(
    categorias.map((c) =>
      sinRomper<CategoriaConItems | null>(getCategoria(c.id), null, `la categoría ${c.id}`),
    ),
  );

  const pares = conItems.flatMap((c) => (c?.items ?? []).map((item) => ({ item, categoria: c!.titulo })));

  const listas = await Promise.all(
    pares.map((p) =>
      sinRomper<FichaResumen[] | null>(getFichasDeItem(p.item.id), null, `las fichas del ítem ${p.item.id}`),
    ),
  );

  return pares.flatMap((p, i) =>
    (listas[i] ?? []).map((ficha) => ({ ficha, categoria: p.categoria })),
  );
}

export async function construirIndice(): Promise<EntradaIndice[]> {
  const categorias = await sinRomper<Categoria[]>(getCategorias(), [], "las categorías");

  const [fichas, areas, notas] = await Promise.all([
    sinRomper(fichasDeTodasLasCategorias(categorias), [], "las fichas"),
    sinRomper(getAreas(), [], "las áreas"),
    sinRomper(
      getNotas(1, 100).then((r) => r.datos),
      [],
      "las páginas de contenido",
    ),
  ]);

  const entradas: EntradaIndice[] = [];
  const agregar = (t: string | null | undefined, d: string, u: string) => {
    const titulo = t?.trim();
    if (titulo) entradas.push({ t: titulo, d, u });
  };

  for (const c of categorias) agregar(c.titulo, "Categoría de trámites", `/tramites/${c.id}`);
  for (const { ficha, categoria } of fichas) agregar(ficha.titulo, categoria, `/fichas/${ficha.id}`);
  for (const n of notas) {
    if (n.slug?.trim()) agregar(n.titulo, "Página de contenido", `/p/${encodeURIComponent(n.slug)}`);
  }
  for (const a of areas) agregar(a.nombre, "Área de gobierno", `/gobierno/${a.id}`);

  // Sin repetir por título: el CMS tiene una ficha y un ítem con el mismo
  // nombre en varios casos, y ver la misma línea dos veces en las sugerencias
  // hace dudar de si son cosas distintas.
  const vistos = new Set<string>();
  return entradas
    .filter((e) => {
      const clave = e.t.toLowerCase();
      if (vistos.has(clave)) return false;
      vistos.add(clave);
      return true;
    })
    .map((e) => {
      const v = VISITAS_DIARIAS[e.u];
      return v ? { ...e, v } : e;
    });
}
