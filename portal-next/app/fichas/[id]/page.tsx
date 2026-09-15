import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";

import { Icono } from "@/components/Iconos";
import { Migas, type Miga } from "@/components/Migas";
import { getCategoria, getFicha } from "@/lib/api";
import type { Archivo } from "@/lib/tipos";

export const revalidate = 300;

/** Los ids de ficha son numéricos: cualquier otra cosa es una URL inválida. */
function idValido(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null;
}

/** Extensión en mayúsculas para el recuadro del documento. */
function extensionDe(archivo: Archivo): string {
  const cruda =
    archivo.extension || archivo.url.split(/[?#]/)[0].split(".").pop() || "";
  return cruda.replace(/^\./, "").toUpperCase().slice(0, 4);
}

/** El color del recuadro distingue planillas y documentos de texto del resto. */
function claseDelIcono(extension: string): string {
  if (/^(DOC|DOCX|ODT|RTF|TXT)$/.test(extension)) return "documento__icono documento__icono--doc";
  if (/^(XLS|XLSX|XLSM|ODS|CSV)$/.test(extension)) return "documento__icono documento__icono--xls";
  return "documento__icono";
}

/** "2026-07-31 16:12:57" -> "31/07/2026", sin pasar por Date (evita corrimientos de zona). */
function fechaLegible(valor: string): { texto: string; iso: string } | null {
  const partes = /^(\d{4})-(\d{2})-(\d{2})(?:[ T](\d{2}:\d{2}:\d{2}))?/.exec(valor);
  if (!partes) return null;
  const [, anio, mes, dia, hora] = partes;
  return { texto: `${dia}/${mes}/${anio}`, iso: hora ? `${anio}-${mes}-${dia}T${hora}` : `${anio}-${mes}-${dia}` };
}

/** Resumen en texto plano del cuerpo del CMS, para la metadata. */
function resumenDelCuerpo(html: string | null): string | null {
  if (!html) return null;
  const texto = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (!texto) return null;
  return texto.length > 160 ? `${texto.slice(0, 157)}…` : texto;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numero = idValido(id);
  const ficha = numero === null ? null : await getFicha(numero);

  if (!ficha) return { title: "Trámite no encontrado" };

  return {
    title: ficha.titulo,
    description:
      ficha.bajada ??
      resumenDelCuerpo(ficha.cuerpo) ??
      `${ficha.titulo}: información del trámite en el portal de la Municipalidad de San Miguel de Tucumán.`,
    alternates: { canonical: `/fichas/${ficha.id}` },
  };
}

export default async function PaginaFicha({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numero = idValido(id);
  if (numero === null) notFound();

  const ficha = await getFicha(numero);
  if (!ficha) notFound();

  // La categoría solo se conoce a través de la ficha: esta llamada va después.
  const categoria = await getCategoria(ficha.categoria);

  const migas: Miga[] = [
    { texto: "Inicio", url: "/" },
    { texto: "Trámites y servicios", url: "/tramites" },
    ...(categoria ? [{ texto: categoria.titulo, url: `/tramites/${categoria.id}` }] : []),
    { texto: ficha.titulo },
  ];

  const actualizado = ficha.actualizado ? fechaLegible(ficha.actualizado) : null;
  const tieneAdjuntos = ficha.archivos.length > 0;

  return (
    <>
      <div className="cabecera-pagina">
        <Migas migas={migas} />
        <div className="contenedor">
          <h1>{ficha.titulo}</h1>
          {ficha.bajada ? <p className="bajada">{ficha.bajada}</p> : null}
          {actualizado ? (
            <p className="tarjeta-media__meta" style={{ marginTop: "var(--sp-3)" }}>
              <time dateTime={actualizado.iso}>Actualizado el {actualizado.texto}</time>
            </p>
          ) : null}
        </div>
      </div>

      <div className="contenedor">
        <div className={tieneAdjuntos ? "layout-ficha" : "seccion"}>
          <div>
            {ficha.imagen ? (
              <div
                style={{
                  position: "relative",
                  aspectRatio: "16 / 9",
                  borderRadius: "var(--r-lg)",
                  overflow: "hidden",
                  marginBottom: "var(--sp-6)",
                }}
              >
                {/* Las imágenes del CMS no traen descripción: se marcan como decorativas. */}
                <Image
                  src={ficha.imagen}
                  alt=""
                  fill
                  sizes="(min-width: 64rem) 46rem, 100vw"
                  style={{ objectFit: "cover" }}
                  priority
                />
              </div>
            ) : null}

            {ficha.cuerpo ? (
              /* HTML administrado desde el panel municipal, no entrada anónima. */
              <div className="prosa" dangerouslySetInnerHTML={{ __html: ficha.cuerpo }} />
            ) : (
              <div className="estado-vacio">
                <h2>Todavía no hay detalle publicado</h2>
                <p>
                  Esta ficha aún no tiene contenido cargado. Podés consultar los requisitos en la
                  Guía de Trámites Municipales o comunicarte con el área correspondiente.
                </p>
              </div>
            )}
          </div>

          {tieneAdjuntos ? (
            <aside className="ficha-aside">
              <div className="panel-lateral">
                <h2>Documentación</h2>
                <div style={{ display: "grid", gap: "var(--sp-3)" }}>
                  {ficha.archivos.map((archivo) => {
                    const extension = extensionDe(archivo);

                    return (
                      <a
                        className="documento"
                        key={archivo.url}
                        href={archivo.url}
                        rel="noopener"
                        target="_blank"
                      >
                        <span className={claseDelIcono(extension)}>
                          {extension || <Icono nombre="documento" tamano={20} />}
                        </span>
                        <span>
                          <strong>{archivo.nombre}</strong>
                          <small>
                            Descargar
                            <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
                          </small>
                        </span>
                      </a>
                    );
                  })}
                </div>
              </div>
            </aside>
          ) : null}
        </div>
      </div>
    </>
  );
}
