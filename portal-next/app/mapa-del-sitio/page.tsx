import type { Metadata } from "next";
import Link from "next/link";

import { BandaSeccion } from "@/components/BandaSeccion";
import { Icono } from "@/components/Iconos";
import { Migas } from "@/components/Migas";
import { getAreas, getCategorias, getGalerias, getNotas } from "@/lib/api";
import { ACCESOS, NAV, SISTEMAS, type ItemNav } from "@/lib/navegacion";
import type { AreaResumen, Categoria, GaleriaResumen, NotaResumen } from "@/lib/tipos";

/** Los contenidos del CMS cambian poco: se revalidan cada cinco minutos. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Mapa del sitio",
  description:
    "Índice del portal de la Municipalidad de San Miguel de Tucumán: categorías de trámites, áreas de gobierno, páginas de contenido, galerías de imágenes, sistemas municipales en línea y páginas generales del sitio.",
  alternates: { canonical: "/mapa-del-sitio" },
};

/** Raíz del organigrama municipal, el mismo id que fija /gobierno. */
const ID_INTENDENCIA = 1;

/** Índice: conviene el orden alfabético, no el de última edición. */
const ORDEN = new Intl.Collator("es", { sensitivity: "base", numeric: true });

/**
 * Páginas del propio portal que no salen del CMS.
 *
 * Son estructura, no contenido: se escriben acá porque no hay ningún endpoint
 * que las liste. El detalle de cada una está copiado de la bajada que la
 * propia página publica, para que el mapa no invente una descripción nueva.
 */
const PAGINAS_PROPIAS = [
  { titulo: "Inicio", url: "/", detalle: "portada del portal" },
  {
    titulo: "Buscar en el portal",
    url: "/buscar",
    detalle: "páginas de contenido, trámites y áreas de gobierno publicados en este sitio",
  },
  {
    titulo: "Contacto",
    url: "/contacto",
    detalle: "teléfonos, domicilio y correos de la Municipalidad",
  },
  {
    titulo: "Accesibilidad",
    url: "/accesibilidad",
    detalle: "declaración de accesibilidad del portal",
  },
];

/**
 * Los <li> de las listas a varias columnas.
 *
 * `breakInside` evita que una entrada quede partida entre el pie de una
 * columna y la cabeza de la siguiente, que es donde el multicolumna se vuelve
 * ilegible.
 */
const ITEM_LISTA: React.CSSProperties = { breakInside: "avoid", marginBottom: "var(--sp-2)" };

/**
 * Sistemas y sitios del municipio que viven fuera del portal, sin repetir URLs.
 *
 * SISTEMAS manda el orden y aporta los diez del pie; después se suman los
 * destinos externos que sólo aparecen en el menú o en los accesos de la
 * portada (mapa interactivo, contaduría, noticias, multas), que de otro modo
 * no figurarían en ningún índice. Se compara por URL, así que un mismo sistema
 * nombrado dos veces distinto entra una sola vez.
 */
function sitiosExternos(): ItemNav[] {
  const vistas = new Set<string>();
  const salida: ItemNav[] = [];

  const agregar = (titulo: string, url: string) => {
    if (vistas.has(url)) return;
    vistas.add(url);
    salida.push({ titulo, url, externo: true });
  };

  for (const sistema of SISTEMAS) agregar(sistema.titulo, sistema.url);

  for (const seccion of NAV) {
    if (seccion.externo && seccion.url) agregar(seccion.titulo, seccion.url);
    for (const hijo of seccion.hijos ?? []) {
      if (hijo.externo) agregar(hijo.titulo, hijo.url);
    }
  }

  for (const acceso of ACCESOS) {
    if (acceso.externo) agregar(acceso.titulo, acceso.url);
  }

  return salida;
}

const SITIOS_EXTERNOS = sitiosExternos();

/**
 * El mapa lista cuatro colecciones y ninguna manda sobre las otras: si el
 * endpoint de galerías falla, las 112 áreas tienen que seguir estando. Cada
 * rama se pide por separado y, si se cae, queda sin desplegar. El enlace a la
 * sección está escrito en la página, así que nunca desaparece: esta página es
 * justamente a la que llega quien ya no encontró el camino por otro lado.
 */
async function sinRomper<T>(promesa: Promise<T>, respaldo: T, que: string): Promise<T> {
  try {
    return await promesa;
  } catch (error) {
    console.error(`Mapa del sitio: no se pudieron cargar ${que}.`, error);
    return respaldo;
  }
}

/** El nombre puede venir vacío del CMS: el id mantiene identificable al área. */
function nombreDeArea(area: AreaResumen): string {
  return area.nombre?.trim() || `Área ${area.id}`;
}

/** Ídem con las galerías. */
function nombreDeGaleria(galeria: GaleriaResumen): string {
  return galeria.nombre?.trim() || `Galería ${galeria.id}`;
}

function contarDependencias(cantidad: number): string {
  return cantidad === 1 ? "1 área dependiente" : `${cantidad} áreas dependientes`;
}

/** Misma etiqueta que usa /tramites: el portal no puede contar de dos maneras. */
function contarTramites(cantidad: number): string {
  return cantidad === 1 ? "1 trámite" : `${cantidad} trámites`;
}

function contarFotos(cantidad: number): string {
  return cantidad === 1 ? "1 foto" : `${cantidad} fotos`;
}

/**
 * Arma la jerarquía en memoria, igual que /gobierno.
 *
 * `getAreas()` devuelve las áreas planas y cada una declara los ids de sus
 * dependencias: el árbol se deduce de ahí, sin pedir las 112 fichas.
 */
function armarEstructura(areas: AreaResumen[]) {
  const porId = new Map(areas.map((area) => [area.id, area]));

  const intendencia = porId.get(ID_INTENDENCIA) ?? null;
  const primerNivel = (intendencia?.dependencias ?? [])
    .map((id) => porId.get(id))
    .filter((area): area is AreaResumen => area !== undefined);

  const dependientes = new Set(areas.flatMap((area) => area.dependencias));
  const sueltas = areas.filter((area) => area.id !== ID_INTENDENCIA && !dependientes.has(area.id));

  return { intendencia, primerNivel, sueltas };
}

/**
 * Listas largas repartidas en columnas.
 *
 * El multicolumna va en un <div> y no en el <ul> a propósito: cambiarle el
 * display a la lista le saca las semánticas de lista en varios lectores de
 * pantalla, y acá lo que más sirve es justamente que se anuncie "lista de 31
 * elementos" antes de empezar a leerla.
 */
function Columnas({ children }: { children: React.ReactNode }) {
  return <div style={{ columnWidth: "17rem", columnGap: "var(--sp-6)" }}>{children}</div>;
}

/** Aclaración de una entrada (cuántos trámites, cuántas fotos). */
function Detalle({ children }: { children: React.ReactNode }) {
  return <span style={{ color: "var(--c-ink-muted)" }}> — {children}</span>;
}

/**
 * Una rama que no se pudo cargar. No se oculta en silencio: quien llegó al
 * mapa porque no encontraba algo tiene que saber que falta una parte.
 */
function RamaSinDatos({ que }: { que: string }) {
  return (
    <div className="aviso aviso--info">
      <p>
        <Icono nombre="documento" tamano={18} className="icono-en-linea" />
        No se pudo cargar el listado de {que}. El enlace de arriba sigue funcionando y lleva a la
        sección completa.
      </p>
    </div>
  );
}

export default async function PaginaMapaDelSitio() {
  // Las cuatro colecciones se piden juntas: esperar una atrás de otra
  // cuadruplicaría el tiempo de la página sin ganar nada.
  const [categorias, areas, galerias, notas] = await Promise.all([
    sinRomper<Categoria[]>(getCategorias(), [], "las categorías de trámites"),
    sinRomper<AreaResumen[]>(getAreas(), [], "las áreas de gobierno"),
    sinRomper<GaleriaResumen[]>(getGalerias(), [], "las galerías"),
    sinRomper<NotaResumen[]>(
      getNotas(1, 100).then((respuesta) => respuesta.datos),
      [],
      "las páginas de contenido",
    ),
  ]);

  const { intendencia, primerNivel, sueltas } = armarEstructura(areas);

  // Sin slug no hay URL a la que enlazar: esas notas quedan fuera del índice,
  // el mismo criterio que aplica /p.
  const paginas = notas
    .filter((nota) => nota.slug?.trim())
    .sort((a, b) => ORDEN.compare(a.titulo ?? "", b.titulo ?? ""));

  return (
    <>
      <BandaSeccion seccion="mapa" />

      <div className="cabecera-pagina">
        <Migas migas={[{ texto: "Inicio", url: "/" }, { texto: "Mapa del sitio" }]} />
        <div className="contenedor">
          <h1>Mapa del sitio</h1>
          <p className="bajada">
            Todo lo que publica este portal, sección por sección, con un enlace directo a cada
            página. Si no encontrás algo en el menú ni en el buscador, buscalo acá.
          </p>
        </div>
      </div>

      {/* A. Trámites y servicios ----------------------------------------- */}
      <section className="seccion" aria-labelledby="mapa-tramites">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Gestiones</p>
              <h2 id="mapa-tramites">Trámites y servicios</h2>
              <p>
                Las gestiones municipales agrupadas por tema. Cada trámite cuelga de su categoría:
                por eso el mapa llega hasta las categorías y no lista las fichas una por una.
              </p>
            </div>
            <Link className="boton boton--secundario" href="/tramites">
              Ver todas las categorías
            </Link>
          </div>

          {categorias.length === 0 ? (
            <RamaSinDatos que="las categorías de trámites" />
          ) : (
            <Columnas>
              <ul>
                {categorias.map((categoria) => (
                  <li key={categoria.id} style={ITEM_LISTA}>
                    <Link href={`/tramites/${categoria.id}`}>{categoria.titulo}</Link>
                    <Detalle>{contarTramites(categoria.items)}</Detalle>
                  </li>
                ))}
              </ul>
            </Columnas>
          )}
        </div>
      </section>

      {/* B. Gobierno ------------------------------------------------------ */}
      <section className="seccion seccion--blanca" aria-labelledby="mapa-gobierno">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Organigrama</p>
              <h2 id="mapa-gobierno">Gobierno</h2>
              <p>
                Las áreas del Departamento Ejecutivo. Acá figuran la Intendencia y las áreas que
                dependen de ella; las direcciones y subsecretarías de cada una están dentro de su
                propia ficha, con el domicilio y el contacto.
              </p>
              {sueltas.length > 0 ? (
                <p>
                  {sueltas.length === 1
                    ? "Un área más figura en el registro municipal"
                    : `Otras ${sueltas.length} áreas figuran en el registro municipal`}{" "}
                  sin dependencia asignada en el organigrama publicado: van al final de la lista.
                </p>
              ) : null}
            </div>
            <Link className="boton boton--secundario" href="/gobierno">
              Ver la estructura de gobierno
            </Link>
          </div>

          {areas.length === 0 ? (
            <RamaSinDatos que="las áreas de gobierno" />
          ) : (
            <ul>
              {intendencia ? (
                <li style={ITEM_LISTA}>
                  <Link href={`/gobierno/${intendencia.id}`}>{nombreDeArea(intendencia)}</Link>

                  {primerNivel.length > 0 ? (
                    <ul>
                      {primerNivel.map((area) => (
                        <li key={area.id} style={ITEM_LISTA}>
                          <Link href={`/gobierno/${area.id}`}>{nombreDeArea(area)}</Link>
                          {area.dependencias.length > 0 ? (
                            <Detalle>{contarDependencias(area.dependencias.length)}</Detalle>
                          ) : null}
                        </li>
                      ))}
                    </ul>
                  ) : null}
                </li>
              ) : null}

              {sueltas.map((area) => (
                <li key={area.id} style={ITEM_LISTA}>
                  <Link href={`/gobierno/${area.id}`}>{nombreDeArea(area)}</Link>{" "}
                  <span className="etiqueta">Sin dependencia asignada</span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      {/* C. Páginas de contenido ------------------------------------------ */}
      <section className="seccion" aria-labelledby="mapa-paginas">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Contenidos</p>
              <h2 id="mapa-paginas">Páginas de contenido</h2>
              <p>
                Historia de la ciudad, turismo, transporte, programas y campañas.{" "}
                {/* El conteo sólo se imprime si hay algo que contar: cuando la
                    API no responde, "Hay 0 páginas publicadas" contradice al
                    aviso de abajo, que dice que el listado no se pudo cargar.
                    Son dos cosas distintas y el vecino merece saber cuál es. */}
                {paginas.length === 0
                  ? null
                  : paginas.length === 1
                    ? "Hay 1 página publicada."
                    : `Hay ${paginas.length} páginas publicadas.`}
              </p>
            </div>
            <Link className="boton boton--secundario" href="/p">
              Ver el índice de páginas
            </Link>
          </div>

          {paginas.length === 0 ? (
            <RamaSinDatos que="las páginas de contenido" />
          ) : (
            <Columnas>
              <ul>
                {paginas.map((nota) => {
                  // El filtro de arriba ya garantiza el slug; esto es para el tipo.
                  const slug = nota.slug ?? "";

                  return (
                    <li key={nota.id} style={ITEM_LISTA}>
                      {/* encodeURIComponent, como en /p y en el buscador: hay un
                          slug con espacios y sin codificar el enlace no resuelve. */}
                      <Link href={`/p/${encodeURIComponent(slug)}`}>
                        {nota.titulo?.trim() || "Página del portal"}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </Columnas>
          )}
        </div>
      </section>

      {/* D. Galerías ------------------------------------------------------ */}
      <section className="seccion seccion--blanca" aria-labelledby="mapa-galerias">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Imágenes</p>
              <h2 id="mapa-galerias">Galerías</h2>
              <p>Fotografías de San Miguel de Tucumán publicadas por el municipio.</p>
            </div>
            <Link className="boton boton--secundario" href="/galeria">
              Ver todas las galerías
            </Link>
          </div>

          {galerias.length === 0 ? (
            <RamaSinDatos que="las galerías" />
          ) : (
            <Columnas>
              <ul>
                {galerias.map((galeria) => (
                  <li key={galeria.id} style={ITEM_LISTA}>
                    <Link href={`/galeria/${galeria.id}`}>{nombreDeGaleria(galeria)}</Link>
                    {galeria.fotos > 0 ? <Detalle>{contarFotos(galeria.fotos)}</Detalle> : null}
                  </li>
                ))}
              </ul>
            </Columnas>
          )}
        </div>
      </section>

      {/* E. Sistemas municipales ------------------------------------------ */}
      <section className="seccion" aria-labelledby="mapa-sistemas">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Fuera del portal</p>
              <h2 id="mapa-sistemas">Sistemas municipales</h2>
              <p>
                Los sistemas y sitios del municipio que funcionan aparte de este portal. Estos
                enlaces salen del sitio.
              </p>
            </div>
          </div>

          <Columnas>
            <ul>
              {SITIOS_EXTERNOS.map((sitio) => (
                <li key={sitio.url} style={ITEM_LISTA}>
                  {/* data-externo le agrega la flecha por CSS: no se escribe el carácter. */}
                  <a href={sitio.url} rel="noopener" data-externo>
                    {sitio.titulo}
                  </a>
                </li>
              ))}
            </ul>
          </Columnas>
        </div>
      </section>

      {/* F. Páginas del portal -------------------------------------------- */}
      <section className="seccion seccion--blanca" aria-labelledby="mapa-portal">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Navegación</p>
              <h2 id="mapa-portal">Páginas del portal</h2>
              <p>
                Las páginas generales del sitio, las que no dependen de una categoría ni de un área.
              </p>
            </div>
          </div>

          <ul>
            {PAGINAS_PROPIAS.map((pagina) => (
              <li key={pagina.url} style={ITEM_LISTA}>
                <Link href={pagina.url}>{pagina.titulo}</Link>
                <Detalle>{pagina.detalle}</Detalle>
              </li>
            ))}

            {/* La página actual se nombra pero no se enlaza a sí misma. */}
            <li style={ITEM_LISTA}>
              <span aria-current="page">Mapa del sitio</span>
              <Detalle>esta página</Detalle>
            </li>
          </ul>
        </div>
      </section>
    </>
  );
}
