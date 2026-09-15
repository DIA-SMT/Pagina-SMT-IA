import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BandaSeccion } from "@/components/BandaSeccion";
import { Migas } from "@/components/Migas";
import { getNotas } from "@/lib/api";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Páginas del portal",
  description:
    "Índice de las páginas de contenido del portal de la Municipalidad de San Miguel de Tucumán: historia de la ciudad, turismo, transporte, programas y campañas.",
  alternates: { canonical: "/p" },
};

/** Índice: conviene el orden alfabético, no el de última edición. */
const ORDEN = new Intl.Collator("es", { sensitivity: "base", numeric: true });

/** "2026-07-31 16:12:57" -> "31/07/2026", sin pasar por Date (evita corrimientos de zona). */
function fechaLegible(valor: string): { texto: string; iso: string } | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?/.exec(valor);
  if (!partes) return null;
  const [, anio, mes, dia, hora] = partes;
  return {
    texto: `${dia}/${mes}/${anio}`,
    iso: hora ? `${anio}-${mes}-${dia}T${hora}` : `${anio}-${mes}-${dia}`,
  };
}

/** Las bajadas del CMS son largas: en la tarjeta se recortan. */
function resumir(valor: string | null, limite = 170): string | null {
  if (!valor) return null;
  const texto = valor.replace(/\s+/g, " ").trim();
  if (!texto) return null;
  return texto.length > limite ? `${texto.slice(0, limite - 1).trimEnd()}…` : texto;
}

export default async function PaginaIndiceNotas() {
  const { datos } = await getNotas(1, 100);

  // Sin slug no hay URL a la que enlazar: esas notas quedan fuera del índice.
  const paginas = datos
    .filter((nota) => nota.slug?.trim())
    .sort((a, b) => ORDEN.compare(a.titulo ?? "", b.titulo ?? ""));

  return (
    <>
      <BandaSeccion seccion="paginas" />

      <div className="cabecera-pagina">
        <Migas migas={[{ texto: "Inicio", url: "/" }, { texto: "Páginas del portal" }]} />
        <div className="contenedor">
          <h1>Páginas del portal</h1>
          <p className="bajada">
            Las páginas de contenido del sitio municipal: historia de la ciudad, turismo,
            transporte, programas y campañas.
          </p>
        </div>
      </div>

      <section className="seccion">
        <div className="contenedor">
          {paginas.length === 0 ? (
            <div className="estado-vacio">
              <h2>No hay páginas publicadas</h2>
              <p>
                Por el momento no se pueden mostrar las páginas del portal. Podés consultar los
                trámites y servicios o la estructura de gobierno.
              </p>
              <p style={{ marginTop: "var(--sp-5)" }}>
                <Link className="boton boton--primario" href="/tramites">
                  Ver trámites y servicios
                </Link>
              </p>
            </div>
          ) : (
            <>
              <div className="seccion__cabecera">
                <div>
                  <p className="seccion__kicker">Índice</p>
                  <h2>Listado alfabético</h2>
                  <p>
                    {paginas.length === 1
                      ? "1 página publicada."
                      : `${paginas.length} páginas publicadas.`}{" "}
                    Entrá a cualquiera para ver el contenido completo.
                  </p>
                </div>
              </div>

              <div className="grilla grilla--3">
                {paginas.map((nota) => {
                  // El filtro de arriba ya garantiza el slug; esto es para el tipo.
                  const slug = nota.slug ?? "";
                  const titulo = nota.titulo ?? "Página del portal";
                  const bajada = resumir(nota.bajada);
                  const actualizado = nota.actualizado ? fechaLegible(nota.actualizado) : null;

                  return (
                    <article className="tarjeta-media" key={nota.id}>
                      {nota.imagen ? (
                        <div className="tarjeta-media__img" style={{ position: "relative" }}>
                          {/* Las imágenes del CMS no traen descripción: son decorativas,
                              y el título de la tarjeta ya nombra el destino del enlace. */}
                          <Image
                            src={nota.imagen}
                            alt=""
                            fill
                            sizes="(min-width: 64rem) 24rem, (min-width: 40rem) 45vw, calc(100vw - 2.5rem)"
                          />
                        </div>
                      ) : null}

                      <div className="tarjeta-media__cuerpo">
                        <h3>
                          <Link href={`/p/${encodeURIComponent(slug)}`}>{titulo}</Link>
                        </h3>
                        {bajada ? <p>{bajada}</p> : null}
                        {actualizado ? (
                          <p className="tarjeta-media__meta" style={{ marginTop: "auto" }}>
                            <time dateTime={actualizado.iso}>
                              Actualizada el {actualizado.texto}
                            </time>
                          </p>
                        ) : null}
                      </div>
                    </article>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </section>
    </>
  );
}
