import type { Metadata } from "next";
import Link from "next/link";

import { BandaSeccion } from "@/components/BandaSeccion";
import { Icono } from "@/components/Iconos";
import { Migas } from "@/components/Migas";
import { getCategorias } from "@/lib/api";
import { iconoDesdeFontAwesome } from "@/lib/navegacion";

/** Los contenidos del CMS cambian poco: se revalidan cada cinco minutos. */
export const revalidate = 300;

/**
 * La Guía de Trámites es un sistema aparte del municipio: se enlaza, no se
 * replica. Misma URL que publica lib/navegacion en NAV, ACCESOS y SISTEMAS.
 */
const GUIA_TRAMITES = "https://guiadetramites.smt.gob.ar";

export const metadata: Metadata = {
  title: "Trámites y servicios",
  description:
    "Trámites y servicios de la Municipalidad de San Miguel de Tucumán agrupados por tema: gestión tributaria y comercial, medio ambiente, salud, transporte, cultura, normativa, transparencia y catastro.",
  alternates: { canonical: "/tramites" },
};

/** Etiqueta con la cantidad de ítems de una categoría. */
function contarTramites(cantidad: number): string {
  return cantidad === 1 ? "1 trámite" : `${cantidad} trámites`;
}

export default async function PaginaTramites() {
  const categorias = await getCategorias();

  return (
    <>
      <BandaSeccion seccion="tramites" />

      <div className="cabecera-pagina">
        <Migas migas={[{ texto: "Inicio", url: "/" }, { texto: "Trámites y servicios" }]} />
        <div className="contenedor">
          <h1>Trámites y servicios</h1>
          <p className="bajada">
            Las gestiones municipales agrupadas por tema. Entrá a una categoría para ver qué
            trámites incluye, qué necesitás y dónde se hace cada uno.
          </p>
        </div>
      </div>

      <section className="seccion">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Categorías</p>
              <h2>Elegí el tema de tu gestión</h2>
              <p>Trámites, servicios y sistemas de la Municipalidad, ordenados por área temática.</p>
            </div>
          </div>

          {categorias.length === 0 ? (
            <div className="estado-vacio">
              <h3>No hay categorías publicadas</h3>
              <p>
                Por el momento no se pueden mostrar las categorías de trámites. Mientras tanto
                podés consultar la Guía de Trámites Municipales.
              </p>
            </div>
          ) : (
            <div className="grilla grilla--3">
              {categorias.map((categoria) => (
                <article className="tarjeta" key={categoria.id}>
                  <span className="tarjeta__icono">
                    <Icono nombre={iconoDesdeFontAwesome(categoria.icono)} tamano={24} />
                  </span>
                  <h3>
                    <Link href={`/tramites/${categoria.id}`}>{categoria.titulo}</Link>
                  </h3>
                  {categoria.texto ? <p>{categoria.texto}</p> : null}
                  <p style={{ marginTop: "var(--sp-4)" }}>
                    <span className="etiqueta etiqueta--azul">{contarTramites(categoria.items)}</span>
                  </p>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="seccion seccion--azul">
        <div className="contenedor">
          <div className="seccion__cabecera" style={{ marginBottom: 0 }}>
            <div>
              <p className="seccion__kicker">Paso a paso</p>
              <h2>Guía de Trámites Municipales</h2>
              <p>
                Requisitos, documentación, costos y oficinas de cada gestión, en el sistema
                oficial del municipio.
              </p>
            </div>
            <a className="boton boton--blanco" href={GUIA_TRAMITES} rel="noopener" target="_blank" data-externo>
              Abrir la Guía de Trámites
              <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
            </a>
          </div>
        </div>
      </section>
    </>
  );
}
