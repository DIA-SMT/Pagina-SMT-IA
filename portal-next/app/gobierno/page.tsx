import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BandaSeccion } from "@/components/BandaSeccion";
import { Icono } from "@/components/Iconos";
import { Migas } from "@/components/Migas";
import { getAreas } from "@/lib/api";
import type { AreaResumen } from "@/lib/tipos";

/** Los contenidos del CMS cambian poco: se revalidan cada cinco minutos. */
export const revalidate = 300;

/** Raíz del organigrama municipal: todo el Departamento Ejecutivo cuelga de acá. */
const ID_INTENDENCIA = 1;

export const metadata: Metadata = {
  title: "Estructura de gobierno",
  description:
    "Secretarías, direcciones y organismos del Departamento Ejecutivo de la Municipalidad de San Miguel de Tucumán, con sus autoridades y datos de contacto.",
  alternates: { canonical: "/gobierno" },
};

/** El nombre puede venir vacío del CMS: el id mantiene identificable al área. */
function nombreDe(area: { id: number; nombre: string | null }): string {
  return area.nombre?.trim() || `Área ${area.id}`;
}

function contarDependencias(cantidad: number): string {
  return cantidad === 1 ? "1 área dependiente" : `${cantidad} áreas dependientes`;
}

/**
 * Arma la jerarquía en memoria.
 *
 * `getAreas()` devuelve las áreas planas y cada una lista los ids de sus
 * dependencias: el árbol no viene hecho. De ahí salen tres grupos:
 *  - la raíz (Intendencia),
 *  - el primer nivel, que es lo que la raíz declara como dependencia,
 *  - las sueltas: áreas que no figuran como dependencia de ninguna otra.
 *
 * Las sueltas existen en los datos actuales (dos áreas quedaron sin padre en el
 * CMS). Se muestran aparte para que sus fichas no queden sin ningún enlace que
 * lleve hasta ellas; si el municipio las reubica, la sección desaparece sola.
 */
function armarEstructura(areas: AreaResumen[]) {
  const porId = new Map(areas.map((area) => [area.id, area]));

  const resolver = (ids: number[]) =>
    ids.map((id) => porId.get(id)).filter((area): area is AreaResumen => area !== undefined);

  const intendencia = porId.get(ID_INTENDENCIA) ?? null;
  const primerNivel = intendencia ? resolver(intendencia.dependencias) : [];

  const dependientes = new Set(areas.flatMap((area) => area.dependencias));
  const sueltas = areas.filter(
    (area) => area.id !== ID_INTENDENCIA && !dependientes.has(area.id),
  );

  return { intendencia, primerNivel, sueltas };
}

/**
 * Tarjeta de área para las grillas.
 *
 * El correo lleva position:relative porque el enlace del título cubre toda la
 * tarjeta con un ::after: sin eso, el mailto queda tapado y no se puede usar.
 */
function TarjetaArea({ area }: { area: AreaResumen }) {
  return (
    <article className="tarjeta">
      <span className="tarjeta__icono">
        <Icono nombre="patrimonio" tamano={24} />
      </span>

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

      {area.dependencias.length > 0 ? (
        <p style={{ marginTop: "var(--sp-4)" }}>
          <span className="etiqueta etiqueta--azul">
            {contarDependencias(area.dependencias.length)}
          </span>
        </p>
      ) : null}
    </article>
  );
}

export default async function PaginaGobierno() {
  const areas = await getAreas();
  const { intendencia, primerNivel, sueltas } = armarEstructura(areas);

  return (
    <>
      <BandaSeccion seccion="gobierno" />

      <div className="cabecera-pagina">
        <Migas migas={[{ texto: "Inicio", url: "/" }, { texto: "Gobierno" }]} />
        <div className="contenedor">
          <h1>Estructura de gobierno</h1>
          <p className="bajada">
            Las áreas que integran el Departamento Ejecutivo de la Municipalidad de San Miguel de
            Tucumán. Entrá a cada una para ver de quién depende, qué áreas tiene a cargo y cómo
            comunicarte.
          </p>
        </div>
      </div>

      {intendencia ? (
        <section className="seccion seccion--blanca">
          <div className="contenedor">
            <div className="seccion__cabecera">
              <div>
                <p className="seccion__kicker">Conducción</p>
                <h2>{nombreDe(intendencia)}</h2>
                <p>
                  Encabeza el Departamento Ejecutivo y coordina las secretarías y direcciones que
                  dependen de ella.
                </p>
              </div>
            </div>

            <div
              className="tarjeta"
              style={{
                display: "flex",
                flexWrap: "wrap",
                alignItems: "center",
                gap: "var(--sp-6)",
              }}
            >
              {intendencia.foto ? (
                /* Retrato de la autoridad, cuyo nombre se lee al lado: es decorativo. */
                <div
                  style={{
                    position: "relative",
                    flex: "none",
                    width: "11rem",
                    height: "11rem",
                    borderRadius: "var(--r-full)",
                    overflow: "hidden",
                  }}
                >
                  <Image
                    src={intendencia.foto}
                    alt=""
                    fill
                    sizes="176px"
                    style={{ objectFit: "cover" }}
                    priority
                  />
                </div>
              ) : null}

              <div style={{ flex: "1 1 20rem" }}>
                {intendencia.autoridad ? (
                  <>
                    <span className="etiqueta etiqueta--azul">Autoridad</span>
                    <p
                      style={{
                        marginTop: "var(--sp-3)",
                        fontSize: "var(--fs-md)",
                        fontWeight: 700,
                        color: "var(--c-ink)",
                      }}
                    >
                      {intendencia.autoridad}
                    </p>
                  </>
                ) : null}

                <ul
                  style={{
                    listStyle: "none",
                    padding: 0,
                    display: "grid",
                    gap: "var(--sp-2)",
                    marginTop: "var(--sp-4)",
                    fontSize: "var(--fs-sm)",
                  }}
                >
                  {intendencia.domicilio ? (
                    <li style={{ display: "flex", gap: "var(--sp-3)" }}>
                      <Icono nombre="ubicacion" tamano={18} />
                      <span>{intendencia.domicilio}</span>
                    </li>
                  ) : null}

                  {intendencia.telefono ? (
                    <li style={{ display: "flex", gap: "var(--sp-3)" }}>
                      <Icono nombre="telefono" tamano={18} />
                      <a href={`tel:${intendencia.telefono.replace(/[^\d+]/g, "")}`}>
                        {intendencia.telefono}
                      </a>
                    </li>
                  ) : null}

                  {intendencia.email ? (
                    <li
                      style={{ display: "flex", gap: "var(--sp-3)", overflowWrap: "anywhere" }}
                    >
                      <Icono nombre="correo" tamano={18} />
                      <a href={`mailto:${intendencia.email}`}>{intendencia.email}</a>
                    </li>
                  ) : null}
                </ul>

                <p style={{ marginTop: "var(--sp-5)" }}>
                  <Link className="boton boton--secundario" href={`/gobierno/${intendencia.id}`}>
                    Ver la ficha de {nombreDe(intendencia)}
                  </Link>
                </p>
              </div>
            </div>
          </div>
        </section>
      ) : null}

      <section className="seccion">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Primer nivel</p>
              <h2>Secretarías y áreas que dependen de la Intendencia</h2>
              <p>
                Cada área reúne sus propias direcciones y subsecretarías. El detalle de cada una
                incluye domicilio, contacto y organigrama.
              </p>
            </div>
          </div>

          {primerNivel.length === 0 ? (
            <div className="estado-vacio">
              <h3>No hay áreas publicadas</h3>
              <p>
                Por el momento no se puede mostrar la estructura de gobierno. Si necesitás
                comunicarte con el municipio, los datos de contacto están en el pie de página.
              </p>
            </div>
          ) : (
            <div className="grilla grilla--2">
              {primerNivel.map((area) => (
                <TarjetaArea area={area} key={area.id} />
              ))}
            </div>
          )}
        </div>
      </section>

      {sueltas.length > 0 ? (
        <section className="seccion seccion--blanca">
          <div className="contenedor">
            <div className="seccion__cabecera">
              <div>
                <p className="seccion__kicker">Otras áreas</p>
                <h2>Áreas sin dependencia asignada</h2>
                <p>
                  Figuran en el registro municipal, pero todavía no están ubicadas dentro de una
                  secretaría en el organigrama publicado.
                </p>
              </div>
            </div>

            <div className="grilla grilla--2">
              {sueltas.map((area) => (
                <TarjetaArea area={area} key={area.id} />
              ))}
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
