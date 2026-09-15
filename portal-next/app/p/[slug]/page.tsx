import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icono } from "@/components/Iconos";
import { Migas, type Miga } from "@/components/Migas";
import { getNota, getNotas } from "@/lib/api";
import { NAV } from "@/lib/navegacion";
import type { Nota } from "@/lib/tipos";

export const revalidate = 300;

/**
 * Enlaces del bloque "La ciudad" del menú principal, reusados en el panel
 * lateral. Salen de lib/navegacion para que el día que eso se administre desde
 * el CMS esta página acompañe el cambio sin tocarse.
 */
const SECCIONES_CIUDAD = NAV.find((seccion) => seccion.titulo === "La ciudad")?.hijos ?? [];

/**
 * Los slugs de las notas vienen del CMS con mayúsculas y guiones bajos
 * inconsistentes (SUBEM, Sube, parques_smt, transporte_publico) y se usan tal
 * cual, sin normalizar.
 *
 * La base no distingue mayúsculas —MariaDB compara con colación `ci`,
 * verificado contra la API: /v1/notas/sube y /v1/notas/Sube devuelven los dos
 * la misma nota—, así que /p/sube también funciona. Lo que se prerenderiza es
 * la escritura canónica del CMS, y a esa apuntan las redirecciones de
 * next.config.ts.
 *
 * Lo único que se hace es decodificar el segmento de la URL, porque hay al
 * menos un slug con espacios. Un porcentaje mal formado en la URL haría tirar
 * a decodeURIComponent: se devuelve el valor crudo y la nota termina en 404,
 * que es lo correcto, en vez de un error 500.
 */
function decodificar(valor: string): string {
  try {
    return decodeURIComponent(valor);
  } catch {
    return valor;
  }
}

/** Adjunto ya normalizado, listo para pintar un `.documento`. */
type Adjunto = { url: string; nombre: string; extension: string };

/** Último tramo de una URL, como etiqueta de reserva si no hay nombre original. */
function nombreDesdeUrl(url: string): string {
  const hoja = url.split(/[?#]/)[0].split("/").pop() ?? "";
  return decodificar(hoja) || "Documento adjunto";
}

/**
 * Los adjuntos de una nota, vengan como vengan.
 *
 * El contrato de `lib/tipos` es `archivos: Archivo[]`, pero hoy la API de notas
 * devuelve otra cosa: un campo `archivo` con la base de storage pegada al JSON
 * crudo de Voyager, así:
 *
 *   "https://smt.gob.ar/storage/[{\"download_link\":\"notas/…pdf\",\"original_name\":\"Bases.pdf\"}]"
 *
 * Se contemplan los dos formatos, de modo que el día que la API normalice el
 * campo esta página siga andando sin cambios. Nunca lanza: un adjunto ilegible
 * se descarta en silencio antes que voltear la nota entera.
 */
function adjuntosDe(nota: Nota): Adjunto[] {
  if (Array.isArray(nota.archivos)) {
    return nota.archivos
      .filter((archivo) => archivo && archivo.url)
      .map((archivo) => ({
        url: archivo.url,
        nombre: archivo.nombre || nombreDesdeUrl(archivo.url),
        extension: archivo.extension || "",
      }));
  }

  const crudo = (nota as { archivo?: unknown }).archivo;
  if (typeof crudo !== "string") return [];

  const corte = crudo.indexOf("[");
  if (corte === -1) return [];

  const base = crudo.slice(0, corte);
  let lista: unknown;
  try {
    lista = JSON.parse(crudo.slice(corte));
  } catch {
    return [];
  }
  if (!Array.isArray(lista)) return [];

  return lista.flatMap((entrada): Adjunto[] => {
    if (!entrada || typeof entrada !== "object") return [];
    const { download_link: enlace, original_name: nombre } = entrada as {
      download_link?: unknown;
      original_name?: unknown;
    };
    if (typeof enlace !== "string" || !enlace) return [];

    const url = /^https?:\/\//i.test(enlace)
      ? enlace
      : `${base.replace(/\/+$/, "")}/${enlace.replace(/^\/+/, "")}`;

    return [
      {
        url,
        nombre: typeof nombre === "string" && nombre.trim() ? nombre : nombreDesdeUrl(url),
        extension: "",
      },
    ];
  });
}

/** Extensión en mayúsculas para el recuadro del documento. */
function extensionDe(adjunto: Adjunto): string {
  const hoja = adjunto.extension || adjunto.url.split(/[?#]/)[0].split("/").pop() || "";
  const cruda = (hoja.split(".").pop() ?? "").replace(/^\./, "");
  return /^[a-z0-9]{1,5}$/i.test(cruda) ? cruda.toUpperCase() : "";
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
  return {
    texto: `${dia}/${mes}/${anio}`,
    iso: hora ? `${anio}-${mes}-${dia}T${hora}` : `${anio}-${mes}-${dia}`,
  };
}

/** Texto plano y acotado, para las descripciones de metadata. */
function resumir(valor: string | null, limite = 160): string | null {
  if (!valor) return null;
  const texto = valor
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#3[49];/g, "'")
    .replace(/\s+/g, " ")
    .trim();
  if (!texto) return null;
  return texto.length > limite ? `${texto.slice(0, limite - 1).trimEnd()}…` : texto;
}

export async function generateStaticParams() {
  const { datos } = await getNotas(1, 100);
  // Sin slug no hay URL posible: esas notas se prerenderizan desde ningún lado.
  return datos.flatMap((nota) => (nota.slug?.trim() ? [{ slug: nota.slug }] : []));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const nota = await getNota(decodificar(slug));

  if (!nota) return { title: "Página no encontrada" };

  const titulo = nota.titulo ?? "Página del portal";

  return {
    title: titulo,
    description:
      resumir(nota.bajada) ??
      resumir(nota.texto) ??
      `${titulo}: información del portal de la Municipalidad de San Miguel de Tucumán.`,
    alternates: { canonical: `/p/${encodeURIComponent(nota.slug ?? slug)}` },
  };
}

export default async function PaginaNota({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const pedido = decodificar(slug);

  const nota = await getNota(pedido);
  if (!nota) notFound();

  const titulo = nota.titulo ?? "Página del portal";
  const migas: Miga[] = [{ texto: "Inicio", url: "/" }, { texto: titulo }];

  const adjuntos = adjuntosDe(nota);
  const actualizado = nota.actualizado ? fechaLegible(nota.actualizado) : null;

  // En el panel lateral no tiene sentido ofrecer la página en la que ya se está.
  const rutaActual = `/p/${nota.slug ?? pedido}`;
  const otrasSecciones = SECCIONES_CIUDAD.filter((enlace) => enlace.url !== rutaActual);

  return (
    <>
      <div className="cabecera-pagina">
        <Migas migas={migas} />
        <div className="contenedor">
          <h1>{titulo}</h1>
          {nota.bajada ? <p className="bajada">{nota.bajada}</p> : null}
          {actualizado ? (
            <p className="tarjeta-media__meta" style={{ marginTop: "var(--sp-3)" }}>
              <time dateTime={actualizado.iso}>Actualizada el {actualizado.texto}</time>
            </p>
          ) : null}
        </div>
      </div>

      <div className="contenedor">
        {nota.imagen ? (
          <figure
            style={{
              position: "relative",
              aspectRatio: "21 / 9",
              marginTop: "var(--sp-7)",
              borderRadius: "var(--r-lg)",
              overflow: "hidden",
            }}
          >
            {/* Las imágenes del CMS no traen descripción: se marcan como decorativas. */}
            <Image
              src={nota.imagen}
              alt=""
              fill
              sizes="(min-width: 78.5rem) 76rem, calc(100vw - 2.5rem)"
              style={{ objectFit: "cover" }}
              priority
            />
          </figure>
        ) : null}

        <div className="layout-ficha">
          <div>
            {nota.texto ? (
              /* HTML administrado desde el panel municipal, no entrada anónima. */
              <div className="prosa" dangerouslySetInnerHTML={{ __html: nota.texto }} />
            ) : (
              <div className="estado-vacio">
                <h2>Todavía no hay contenido publicado</h2>
                <p>
                  Esta página aún no tiene texto cargado. Podés volver al inicio o recorrer las
                  otras secciones de la ciudad.
                </p>
              </div>
            )}
          </div>

          <aside className="ficha-aside">
            {adjuntos.length > 0 ? (
              <div className="panel-lateral">
                <h2>Documentación</h2>
                <div style={{ display: "grid", gap: "var(--sp-3)" }}>
                  {adjuntos.map((adjunto) => {
                    const extension = extensionDe(adjunto);

                    return (
                      <a
                        className="documento"
                        key={adjunto.url}
                        href={adjunto.url}
                        rel="noopener"
                        target="_blank"
                      >
                        <span className={claseDelIcono(extension)}>
                          {extension || <Icono nombre="documento" tamano={20} />}
                        </span>
                        <span>
                          <strong>{adjunto.nombre}</strong>
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
            ) : null}

            <div className="panel-lateral">
              <h2>La ciudad</h2>
              <ul>
                {otrasSecciones.map((enlace) => (
                  <li key={enlace.url}>
                    {enlace.externo ? (
                      <a href={enlace.url} rel="noopener" target="_blank">
                        <Icono nombre="externo" tamano={16} className="icono-en-linea" />
                        {enlace.titulo}
                        <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
                      </a>
                    ) : (
                      <Link href={enlace.url}>{enlace.titulo}</Link>
                    )}
                  </li>
                ))}
                <li>
                  <Link href="/p">Todas las páginas del portal</Link>
                </li>
              </ul>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}
