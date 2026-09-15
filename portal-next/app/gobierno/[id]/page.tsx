import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Icono } from "@/components/Iconos";
import { Migas, type Miga } from "@/components/Migas";
import { getArea, getAreas } from "@/lib/api";
import type { AreaDependencia } from "@/lib/tipos";

/** Los contenidos del CMS cambian poco: se revalidan cada cinco minutos. */
export const revalidate = 300;

/** Los ids de área son numéricos: cualquier otra cosa es una URL inválida. */
function idValido(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null;
}

/** El nombre puede venir vacío del CMS: el id mantiene identificable al área. */
function nombreDe(area: { id: number; nombre: string | null }): string {
  return area.nombre?.trim() || `Área ${area.id}`;
}

type Organigrama = { url: string; nombre: string; extension: string };

/**
 * Extrae el PDF del organigrama.
 *
 * El campo no es una URL: Voyager guarda la base del storage con el JSON del
 * adjunto pegado atrás, tal cual sale de la base:
 *
 *   https://smt.gob.ar/storage/[{"download_link":"administraciones\/...pdf",
 *                               "original_name":"Intendencia 31-8-26.pdf"}]
 *
 * Publicar ese valor como href daría un enlace roto, así que se parte en la
 * base y el JSON, y se rearma la URL real. Si el formato cambia o el JSON no
 * se puede leer, devuelve null y la ficha simplemente no muestra el documento.
 */
function organigramaDe(valor: string | null): Organigrama | null {
  if (!valor) return null;

  const corte = valor.indexOf("[");
  const armar = (url: string, nombre: string): Organigrama | null => {
    if (!/^https?:\/\//i.test(url)) return null;
    const cruda = url.split(/[?#]/)[0].split(".").pop() ?? "";
    const extension = /^[a-z0-9]{2,4}$/i.test(cruda) ? cruda.toUpperCase() : "PDF";
    return { url: url.replace(/ /g, "%20"), nombre, extension };
  };

  // Formato limpio: el CMS ya guardó una URL directa.
  if (corte === -1) return armar(valor, "Organigrama del área");

  const base = valor.slice(0, corte).replace(/\/$/, "");

  try {
    const adjuntos = JSON.parse(valor.slice(corte)) as {
      download_link?: string;
      original_name?: string;
    }[];
    const adjunto = adjuntos.find((a) => a?.download_link);
    if (!adjunto?.download_link) return null;

    return armar(
      `${base}/${adjunto.download_link.replace(/^\//, "")}`,
      adjunto.original_name?.trim() || "Organigrama del área",
    );
  } catch {
    return null;
  }
}

/**
 * Entidades que usa el editor del CMS. El panel guarda los acentos escapados
 * ("Telef&oacute;nico"), y en la metadata no hay HTML que las interprete.
 */
const ENTIDADES: Record<string, string> = {
  nbsp: " ",
  amp: "&",
  quot: '"',
  aacute: "á",
  eacute: "é",
  iacute: "í",
  oacute: "ó",
  uacute: "ú",
  ntilde: "ñ",
  uuml: "ü",
  Aacute: "Á",
  Eacute: "É",
  Iacute: "Í",
  Oacute: "Ó",
  Uacute: "Ú",
  Ntilde: "Ñ",
};

/** Resumen en texto plano del HTML del CMS, para la metadata. */
function resumenDeHtml(html: string | null): string | null {
  if (!html) return null;
  const texto = html
    .replace(/<[^>]*>/g, " ")
    .replace(/&#(\d+);/g, (_, codigo: string) => String.fromCodePoint(Number(codigo)))
    .replace(/&([A-Za-z]+);/g, (entera, nombre: string) => ENTIDADES[nombre] ?? entera)
    .replace(/\s+/g, " ")
    .trim();
  if (!texto) return null;
  return texto.length > 160 ? `${texto.slice(0, 157)}…` : texto;
}

export async function generateStaticParams() {
  const areas = await getAreas();
  return areas.map((area) => ({ id: String(area.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numero = idValido(id);
  const area = numero === null ? null : await getArea(numero);

  if (!area) return { title: "Área no encontrada" };

  const nombre = nombreDe(area);
  const descripcion =
    resumenDeHtml(area.descripcion) ??
    [
      `${nombre} de la Municipalidad de San Miguel de Tucumán.`,
      area.autoridad ? `A cargo de ${area.autoridad}.` : null,
      area.domicilio,
    ]
      .filter(Boolean)
      .join(" ");

  return {
    title: nombre,
    description: descripcion,
    alternates: { canonical: `/gobierno/${area.id}` },
  };
}

/**
 * Tarjeta de área dependiente.
 *
 * El correo lleva position:relative porque el enlace del título cubre toda la
 * tarjeta con un ::after: sin eso, el mailto queda tapado y no se puede usar.
 */
function TarjetaDependencia({ area }: { area: AreaDependencia }) {
  return (
    <article className="tarjeta">
      <h3>
        <Link href={`/gobierno/${area.id}`}>{nombreDe(area)}</Link>
      </h3>

      {area.autoridad ? <p>{area.autoridad}</p> : null}

      {area.email ? (
        <p style={{ overflowWrap: "anywhere" }}>
          <a href={`mailto:${area.email}`} style={{ position: "relative" }}>
            {area.email}
          </a>
        </p>
      ) : null}
    </article>
  );
}

export default async function PaginaArea({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numero = idValido(id);
  if (numero === null) notFound();

  const area = await getArea(numero);
  if (!area) notFound();

  const nombre = nombreDe(area);
  const organigrama = organigramaDe(area.organigrama);
  // El teléfono está vacío en casi todas las áreas: la línea se omite entera.
  const hayContacto = Boolean(area.domicilio || area.telefono || area.email);

  const migas: Miga[] = [
    { texto: "Inicio", url: "/" },
    { texto: "Gobierno", url: "/gobierno" },
    ...(area.padre
      ? [{ texto: nombreDe(area.padre), url: `/gobierno/${area.padre.id}` }]
      : []),
    { texto: nombre },
  ];

  return (
    <>
      <div className="cabecera-pagina">
        <Migas migas={migas} />
        <div className="contenedor">
          <h1>{nombre}</h1>
          {area.padre ? (
            <p className="bajada">
              Depende de <Link href={`/gobierno/${area.padre.id}`}>{nombreDe(area.padre)}</Link>
            </p>
          ) : null}
        </div>
      </div>

      <div className="contenedor">
        <div className="layout-ficha">
          <div>
            {area.autoridad || area.foto ? (
              <div
                className="tarjeta"
                style={{
                  display: "flex",
                  flexWrap: "wrap",
                  alignItems: "center",
                  gap: "var(--sp-5)",
                }}
              >
                {area.foto ? (
                  /* Retrato de la autoridad, cuyo nombre se lee al lado: es decorativo. */
                  <div
                    style={{
                      position: "relative",
                      flex: "none",
                      width: "8rem",
                      height: "8rem",
                      borderRadius: "var(--r-full)",
                      overflow: "hidden",
                    }}
                  >
                    <Image
                      src={area.foto}
                      alt=""
                      fill
                      sizes="128px"
                      style={{ objectFit: "cover" }}
                      priority
                    />
                  </div>
                ) : null}

                <div style={{ flex: "1 1 14rem" }}>
                  <span className="etiqueta etiqueta--azul">Autoridad</span>
                  <p
                    style={{
                      marginTop: "var(--sp-3)",
                      fontSize: "var(--fs-md)",
                      fontWeight: 700,
                      color: "var(--c-ink)",
                    }}
                  >
                    {area.autoridad ?? "Sin autoridad publicada"}
                  </p>
                </div>
              </div>
            ) : null}

            {area.descripcion ? (
              /* HTML administrado desde el panel municipal, no entrada anónima. */
              <div
                className="prosa"
                style={{ marginTop: "var(--sp-6)" }}
                dangerouslySetInnerHTML={{ __html: area.descripcion }}
              />
            ) : null}

            {area.dependencias.length > 0 ? (
              <section style={{ marginTop: "var(--sp-7)" }}>
                <h2 style={{ marginBottom: "var(--sp-5)" }}>Áreas dependientes</h2>
                <div className="grilla grilla--2">
                  {area.dependencias.map((dependencia) => (
                    <TarjetaDependencia area={dependencia} key={dependencia.id} />
                  ))}
                </div>
              </section>
            ) : null}

            {!area.autoridad && !area.foto && !area.descripcion && area.dependencias.length === 0 ? (
              <div className="estado-vacio">
                <h2>Todavía no hay información publicada</h2>
                <p>
                  Esta área aún no tiene autoridad, descripción ni dependencias cargadas. Si
                  figuran datos de contacto, podés usarlos para comunicarte.
                </p>
              </div>
            ) : null}
          </div>

          <aside className="ficha-aside">
            {hayContacto ? (
              <div className="panel-lateral">
                <h2>Contacto</h2>
                <ul>
                  {area.domicilio ? (
                    <li style={{ display: "flex", gap: "var(--sp-3)" }}>
                      <Icono nombre="ubicacion" tamano={18} />
                      <span>{area.domicilio}</span>
                    </li>
                  ) : null}

                  {area.telefono ? (
                    <li style={{ display: "flex", gap: "var(--sp-3)" }}>
                      <Icono nombre="telefono" tamano={18} />
                      <a href={`tel:${area.telefono.replace(/[^\d+]/g, "")}`}>{area.telefono}</a>
                    </li>
                  ) : null}

                  {area.email ? (
                    <li
                      style={{ display: "flex", gap: "var(--sp-3)", overflowWrap: "anywhere" }}
                    >
                      <Icono nombre="correo" tamano={18} />
                      <a href={`mailto:${area.email}`}>{area.email}</a>
                    </li>
                  ) : null}
                </ul>
              </div>
            ) : null}

            {organigrama ? (
              <div className="panel-lateral">
                <h2>Organigrama</h2>
                <a className="documento" href={organigrama.url} rel="noopener" target="_blank">
                  <span className="documento__icono">{organigrama.extension}</span>
                  <span>
                    <strong>{organigrama.nombre}</strong>
                    <small>
                      Descargar
                      <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
                    </small>
                  </span>
                </a>
              </div>
            ) : null}

            <nav className="panel-lateral" aria-labelledby="volver-gobierno">
              <h2 id="volver-gobierno">Estructura de gobierno</h2>
              <ul>
                {area.padre ? (
                  <li>
                    <Link href={`/gobierno/${area.padre.id}`}>{nombreDe(area.padre)}</Link>
                  </li>
                ) : null}
                <li>
                  <Link href="/gobierno">Ver todas las áreas</Link>
                </li>
              </ul>
            </nav>
          </aside>
        </div>
      </div>
    </>
  );
}
