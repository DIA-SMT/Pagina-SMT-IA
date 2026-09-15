import type { Metadata } from "next";
import Link from "next/link";

import { Icono } from "@/components/Iconos";
import { Migas } from "@/components/Migas";
import { ErrorApi, getBusqueda } from "@/lib/api";
import { CIDITUC } from "@/lib/navegacion";
import type { Busqueda, ResultadoBusqueda } from "@/lib/tipos";

/**
 * Los resultados dependen del parámetro `q` de la URL: no hay nada estable que
 * prerenderizar. La página se arma en cada pedido; el fetch del buscador ya
 * tiene su propia revalidación corta en lib/api.
 */
export const dynamic = "force-dynamic";

/** La Guía de Trámites es un sistema aparte del municipio: se enlaza, no se replica. */
const GUIA_TRAMITES = "https://guiadetramites.smt.gob.ar";

/** Con menos de dos caracteres la API responde 400: ni se la consulta. */
const MINIMO = 2;

/** `q` puede llegar repetido (?q=a&q=b) o ausente. Se toma el primer valor. */
function consultaDe(valor: string | string[] | undefined): string {
  const bruto = Array.isArray(valor) ? (valor[0] ?? "") : (valor ?? "");
  return bruto.replace(/\s+/g, " ").trim();
}

/** Las bajadas del CMS son largas: en el listado se recortan. */
function resumir(valor: string | null, limite = 180): string | null {
  if (!valor) return null;
  const texto = valor.replace(/\s+/g, " ").trim();
  if (!texto) return null;
  return texto.length > limite ? `${texto.slice(0, limite - 1).trimEnd()}…` : texto;
}

type Destino = { url: string; etiqueta: string; titulo: string; detalle: string | null };

/**
 * Un color por tipo de resultado. Antes los tres usaban la etiqueta azul, así
 * que ocupaba lugar sin informar nada. Los tres pasan AA: azul 6,17:1,
 * amarillo 5,64:1 y celeste 4,70:1.
 */
function claseEtiqueta(etiqueta: string): string {
  if (etiqueta === "Trámite o servicio") return "etiqueta etiqueta--azul";
  if (etiqueta === "Área de gobierno") return "etiqueta etiqueta--amarilla";
  return "etiqueta";
}

/**
 * Cada tipo de resultado vive en una sección distinta del portal. Las notas sin
 * slug no tienen URL a la que enlazar: quedan fuera del listado.
 */
function destinoDe(resultado: ResultadoBusqueda): Destino | null {
  switch (resultado.tipo) {
    case "nota": {
      const slug = resultado.slug?.trim();
      if (!slug) return null;
      return {
        url: `/p/${encodeURIComponent(slug)}`,
        etiqueta: "Página del portal",
        titulo: resultado.titulo?.trim() || "Página del portal",
        detalle: resumir(resultado.bajada),
      };
    }
    case "ficha":
      return {
        url: `/fichas/${resultado.id}`,
        etiqueta: "Trámite o servicio",
        titulo: resultado.titulo?.trim() || `Trámite ${resultado.id}`,
        detalle: resumir(resultado.bajada),
      };
    case "area":
      return {
        url: `/gobierno/${resultado.id}`,
        etiqueta: "Área de gobierno",
        titulo: resultado.titulo?.trim() || `Área ${resultado.id}`,
        detalle: resultado.autoridad?.trim() || null,
      };
  }
}

function contarResultados(cantidad: number, consulta: string): string {
  const cuenta = cantidad === 1 ? "1 resultado" : `${cantidad} resultados`;
  return `${cuenta} para «${consulta}»`;
}

export async function generateMetadata({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}): Promise<Metadata> {
  const consulta = consultaDe((await searchParams).q);

  return {
    // Una consulta más corta que el mínimo no llegó a buscar nada: no da título.
    title:
      consulta.length >= MINIMO ? `Búsqueda: ${consulta.slice(0, 60)}` : "Buscar en el portal",
    description:
      "Buscá páginas, trámites y áreas de gobierno publicados en el portal de la Municipalidad de San Miguel de Tucumán.",
    // Son resultados de búsqueda: no corresponde que los indexen los buscadores.
    robots: { index: false, follow: true },
  };
}

/** Salidas que se ofrecen cuando la búsqueda no resuelve la consulta. */
function SalidasUtiles() {
  return (
    <p
      style={{
        marginTop: "var(--sp-6)",
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--sp-3)",
        justifyContent: "center",
      }}
    >
      <Link className="boton boton--primario" href="/tramites">
        Ver categorías de trámites
      </Link>
      <a className="boton boton--secundario" href={GUIA_TRAMITES} rel="noopener" target="_blank">
        Ir a la Guía de Trámites
        <Icono nombre="externo" tamano={16} />
        <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
      </a>
    </p>
  );
}

export default async function PaginaBuscar({
  searchParams,
}: {
  searchParams: Promise<{ [clave: string]: string | string[] | undefined }>;
}) {
  const consulta = consultaDe((await searchParams).q);
  const consultaValida = consulta.length >= MINIMO;

  // Con una consulta corta no se llama a la API: se explica qué falta y listo.
  let busqueda: Busqueda | null = null;
  let falla: "corta" | "api" | null = null;

  if (consultaValida) {
    try {
      busqueda = await getBusqueda(consulta);
    } catch (e) {
      falla = e instanceof ErrorApi && e.estado === 400 ? "corta" : "api";
    }
  }

  const resultados = (busqueda?.resultados ?? []).flatMap((resultado) => {
    const destino = destinoDe(resultado);
    return destino ? [{ clave: `${resultado.tipo}-${resultado.id}`, ...destino }] : [];
  });

  return (
    <>
      <div className="cabecera-pagina">
        <Migas migas={[{ texto: "Inicio", url: "/" }, { texto: "Buscar" }]} />
        <div className="contenedor">
          <h1>Buscar en el portal</h1>
          <p className="bajada">
            Encontrá páginas de contenido, trámites y áreas de gobierno publicados en este sitio.
          </p>

          <form className="buscador-hero" action="/buscar" method="get" role="search">
            <label className="visualmente-oculto" htmlFor="buscar-consulta">
              Qué querés buscar
            </label>
            <input
              id="buscar-consulta"
              type="search"
              name="q"
              defaultValue={consulta}
              placeholder="¿Qué necesitás hacer?"
              minLength={MINIMO}
              required
            />
            <button className="boton boton--primario" type="submit">
              Buscar
            </button>
          </form>
        </div>
      </div>

      <section className="seccion">
        <div className="contenedor">
          {!consultaValida ? (
            <>
              <div className="seccion__cabecera">
                <div>
                  <p className="seccion__kicker">Búsqueda</p>
                  <h2>Escribí qué estás buscando</h2>
                  <p>
                    {consulta.length === 0
                      ? "Todavía no ingresaste una consulta. Usá el campo de arriba para empezar."
                      : "La consulta necesita al menos dos caracteres. Probá con una palabra completa."}
                  </p>
                </div>
              </div>

              <ul className="lista-check" style={{ maxWidth: "var(--ancho-texto)" }}>
                <li>Buscá por el nombre del trámite, por ejemplo licencia o habilitación.</li>
                <li>También podés buscar por el nombre de un área o de una secretaría.</li>
                <li>Si no aparece lo que necesitás, probá con una sola palabra clave.</li>
              </ul>

              <SalidasUtiles />
            </>
          ) : falla ? (
            <div className="estado-vacio">
              <h2>No se pudo completar la búsqueda</h2>
              <p style={{ maxWidth: "var(--ancho-texto)", }}>
                {falla === "corta"
                  ? "La consulta resultó demasiado corta para el buscador. Probá con una palabra más específica."
                  : "El buscador no está disponible en este momento. Podés intentar de nuevo en unos minutos o recorrer el portal por sus secciones."}
              </p>
              <SalidasUtiles />
            </div>
          ) : resultados.length === 0 ? (
            <div className="estado-vacio">
              <h2>No encontramos resultados para «{consulta}»</h2>
              <p style={{ maxWidth: "var(--ancho-texto)", }}>
                Revisá cómo está escrita la consulta o probá con una palabra más general. También
                podés recorrer las categorías de trámites o consultar la Guía de Trámites
                Municipales.
              </p>
              <SalidasUtiles />
            </div>
          ) : (
            <>
              <div className="seccion__cabecera">
                <div>
                  <p className="seccion__kicker">Resultados</p>
                  <h2>{contarResultados(resultados.length, consulta)}</h2>
                  <p>
                    Entrá a cualquiera para ver el contenido completo. Cada resultado indica a qué
                    sección del portal pertenece.
                  </p>
                </div>
              </div>

              <ul className="grilla" style={{ listStyle: "none", padding: 0 }}>
                {resultados.map((resultado) => (
                  <li className="tarjeta" key={resultado.clave}>
                    <span className={claseEtiqueta(resultado.etiqueta)}>{resultado.etiqueta}</span>
                    <h3 style={{ marginTop: "var(--sp-3)" }}>
                      <Link href={resultado.url}>{resultado.titulo}</Link>
                    </h3>
                    {resultado.detalle ? <p>{resultado.detalle}</p> : null}
                  </li>
                ))}
              </ul>
            </>
          )}

          <div className="aviso aviso--info" style={{ marginTop: "var(--sp-7)" }}>
            {/* El icono va dentro del párrafo: como hijo directo del .aviso
                (que es flex) se estiraría a lo alto de todo el texto. */}
            <p>
              <Icono nombre="buscar" tamano={18} className="icono-en-linea" />
              La búsqueda cubre los contenidos publicados en este portal: páginas, trámites y áreas
              de gobierno. No incluye los sistemas externos del municipio, que tienen su propia
              búsqueda:{" "}
              <a href={GUIA_TRAMITES} rel="noopener" target="_blank" data-externo>
                Guía de Trámites
                <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
              </a>{" "}
              y{" "}
              <a href={CIDITUC} rel="noopener" target="_blank" data-externo>
                CiDiTuc
                <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
              </a>
              .
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
