import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icono } from "@/components/Iconos";
import { Migas } from "@/components/Migas";
import { getCategoria, getCategorias, getFichasDeItem } from "@/lib/api";
import { iconoDesdeFontAwesome } from "@/lib/navegacion";
import type { ItemCategoria } from "@/lib/tipos";

export const revalidate = 300;

/** Sistema aparte del municipio: se enlaza, no se replica. */
const GUIA_TRAMITES = "https://guiadetramites.smt.gob.ar";

/** Los ids de categoría son numéricos: cualquier otra cosa es una URL inválida. */
function idValido(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null;
}

export async function generateStaticParams() {
  const categorias = await getCategorias();
  return categorias.map((categoria) => ({ id: String(categoria.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numero = idValido(id);
  const categoria = numero === null ? null : await getCategoria(numero);

  if (!categoria) return { title: "Categoría no encontrada" };

  return {
    title: categoria.titulo,
    description:
      categoria.texto ??
      `Trámites y servicios de ${categoria.titulo} en la Municipalidad de San Miguel de Tucumán.`,
    alternates: { canonical: `/tramites/${categoria.id}` },
  };
}

/**
 * A dónde lleva cada ítem de la categoría.
 *
 * Un ítem con `enlace` propio sale a esa URL (el municipio la administra desde
 * el CMS y puede ser un sistema externo). Sin `enlace`, el destino es su ficha:
 * si el ítem tiene varias, se entra por la primera; si no tiene ninguna, el
 * ítem se muestra como texto — antes eso dejaba un enlace roto.
 */
type Destino =
  | { clase: "interno"; url: string }
  | { clase: "externo"; url: string }
  | { clase: "sin-enlace" };

async function resolverDestino(item: ItemCategoria): Promise<Destino> {
  if (item.enlace) {
    if (/^https?:/i.test(item.enlace)) return { clase: "externo", url: item.enlace };
    return { clase: "interno", url: item.enlace.startsWith("/") ? item.enlace : `/${item.enlace}` };
  }

  const fichas = await getFichasDeItem(item.id);
  if (!fichas || fichas.length === 0) return { clase: "sin-enlace" };
  return { clase: "interno", url: `/fichas/${fichas[0].id}` };
}

export default async function PaginaCategoria({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const numero = idValido(id);
  if (numero === null) notFound();

  const [categoria, categorias] = await Promise.all([getCategoria(numero), getCategorias()]);
  if (!categoria) notFound();

  // Una consulta por ítem, todas a la vez: en serie serían decenas de esperas.
  const destinos = await Promise.all(categoria.items.map((item) => resolverDestino(item)));
  const otras = categorias.filter((otra) => otra.id !== categoria.id);

  return (
    <>
      <div className="cabecera-pagina">
        <Migas
          migas={[
            { texto: "Inicio", url: "/" },
            { texto: "Trámites y servicios", url: "/tramites" },
            { texto: categoria.titulo },
          ]}
        />
        <div className="contenedor">
          <h1>{categoria.titulo}</h1>
          {categoria.texto ? <p className="bajada">{categoria.texto}</p> : null}
        </div>
      </div>

      <div className="contenedor">
        <div className="layout-ficha">
          <div>
            <h2 style={{ marginBottom: "var(--sp-5)" }}>Trámites de esta categoría</h2>

            {categoria.items.length === 0 ? (
              <div className="estado-vacio">
                <h3>Todavía no hay trámites publicados</h3>
                <p>
                  Esta categoría aún no tiene trámites cargados. Consultá la Guía de Trámites
                  Municipales o volvé a las demás categorías.
                </p>
              </div>
            ) : (
              <div className="grilla grilla--2">
                {categoria.items.map((item, indice) => {
                  const destino = destinos[indice];

                  return (
                    <article className="tarjeta" key={item.id}>
                      <span className="tarjeta__icono">
                        <Icono nombre={iconoDesdeFontAwesome(item.icono)} tamano={24} />
                      </span>

                      <h3>
                        {destino.clase === "externo" ? (
                          <a href={destino.url} rel="noopener" target="_blank">
                            <Icono nombre="externo" tamano={16} className="icono-en-linea" />
                            {item.titulo}
                            <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
                          </a>
                        ) : destino.clase === "interno" ? (
                          <Link href={destino.url}>{item.titulo}</Link>
                        ) : (
                          item.titulo
                        )}
                      </h3>

                      {item.texto ? <p>{item.texto}</p> : null}

                      {destino.clase === "sin-enlace" ? (
                        <p style={{ marginTop: "var(--sp-3)" }}>
                          <span className="etiqueta">Sin ficha publicada</span>
                        </p>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            )}
          </div>

          <aside className="ficha-aside">
            <div className="panel-lateral panel-lateral--accion">
              <h2>Guía de Trámites</h2>
              <p>Requisitos, documentación y costos de cada gestión municipal, paso a paso.</p>
              <a className="boton boton--blanco" href={GUIA_TRAMITES} rel="noopener" target="_blank" data-externo>
                Abrir la guía
                <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
              </a>
            </div>

            {otras.length > 0 ? (
              <nav className="panel-lateral" aria-labelledby="otras-categorias">
                <h2 id="otras-categorias">Otras categorías</h2>
                <ul>
                  {otras.map((otra) => (
                    <li key={otra.id}>
                      <Link href={`/tramites/${otra.id}`}>{otra.titulo}</Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ) : null}
          </aside>
        </div>
      </div>
    </>
  );
}
