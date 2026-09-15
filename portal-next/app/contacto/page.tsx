import type { Metadata } from "next";
import Link from "next/link";

import { BandaSeccion } from "@/components/BandaSeccion";
import { Icono } from "@/components/Iconos";
import { Migas } from "@/components/Migas";
import { getAreas, getEmergencias } from "@/lib/api";
import { CONTACTO, ICONO_RED, REDES, SISTEMAS } from "@/lib/navegacion";
import type { AreaResumen, Emergencia } from "@/lib/tipos";

/** Los contenidos del CMS cambian poco: se revalidan cada cinco minutos. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Contacto",
  description:
    "Teléfonos, domicilio y correos de las áreas de la Municipalidad de San Miguel de Tucumán, y los sistemas en línea del municipio.",
  alternates: { canonical: "/contacto" },
};

/**
 * Áreas que se muestran con su contacto completo.
 *
 * Son ids del CMS, del mismo modo que /gobierno fija el 1 de la Intendencia.
 * Lo único que se decide acá es *cuáles* se destacan: el nombre, el domicilio,
 * el correo y el teléfono los trae getAreas(), así que si el municipio corrige
 * un dato en el CMS la página se corrige sola. Si un id deja de existir, su
 * tarjeta simplemente no se dibuja.
 *
 * 11 es la Secretaría de Atención al Ciudadano, 41 la Dirección de Respuesta
 * Rápida (el área que recibe los reclamos) y 35 la Dirección de Defensa Civil,
 * que además es la única de las 112 áreas con teléfono cargado.
 */
const IDS_AREAS_DE_ATENCION = [11, 41, 35];

/**
 * Seguimiento de reclamos. Es el destino al que deriva la ficha del Portal de
 * Atención Ciudadana del sitio actual, y el único canal de consulta de
 * reclamos que está relevado con URL propia.
 *
 * Está escrito acá y no en lib/navegacion.ts porque ese archivo no se toca en
 * esta entrega; el lugar que le corresponde es SISTEMAS.
 */
const URL_RECLAMOS = "https://atencionciudadana.smt.gob.ar/";

/**
 * Icono del sprite para cada sistema del pie. Es decoración: el título del
 * enlace ya dice de qué se trata, así que un sistema sin entrada acá cae en el
 * icono genérico de enlace saliente y no pierde nada.
 */
const ICONO_SISTEMA: Record<string, string> = {
  CiDiTuc: "cidituc",
  "Guía de Trámites": "tramites",
  "Ingresos Municipales (DIM)": "pagos",
  "Tesorería — Proveedores": "pagos",
  Licitaciones: "documento",
  Expedientes: "documento",
  "Gestión de Empleados": "transparencia",
  "Catastro y Edificación": "catastro",
  Webmail: "correo",
  "SMT en Datos": "transparencia",
};

/** El nombre puede venir vacío del CMS: el id mantiene identificable al área. */
function nombreDe(area: AreaResumen): string {
  return area.nombre?.trim() || `Área ${area.id}`;
}

/**
 * El campo de correo del CMS admite cualquier cosa: hay cuatro áreas cuyo
 * email cargado es "@" o ".". Confiar en que el campo no esté vacío publicaría
 * cuatro mailto: que no llegan a ninguna casilla.
 */
function correoValido(email: string | null): string | null {
  const valor = email?.trim() ?? "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(valor) ? valor : null;
}

/**
 * Mismo problema en el domicilio: tres áreas lo tienen cargado como un punto
 * solo y otras dos arrastran un punto pegado al principio (".San Martín 1009").
 */
function domicilioValido(domicilio: string | null): string | null {
  const valor = domicilio?.trim().replace(/^\.+\s*/, "").trim() ?? "";
  return valor.length > 2 ? valor : null;
}

/**
 * Un `tel:` discable a partir de lo que haya cargado.
 *
 * El CMS y lib/navegacion guardan los números como se leen, cada uno a su
 * manera: "(0381) 430-8393" en Asistencia Pública y "3814238907" crudo en
 * Defensa Civil, la única de las 112 áreas con el campo cargado. Ninguna de las
 * dos formas se puede pasar tal cual a un `tel:`: sin prefijo internacional, un
 * teléfono que marque desde afuera de Tucumán no llega.
 *
 * Todos los números relevados son de la ciudad, así que el destino siempre es
 * +54 381 más los siete dígitos finales. Es el mismo criterio del pie de
 * página, para no tener dos conviviendo en el mismo sitio.
 */
function enlaceTelefonicoLocal(telefono: string): string {
  const crudo = telefono.trim();
  // Si alguna vez el CMS trae un número ya internacionalizado, se respeta.
  if (crudo.startsWith("+")) return crudo.replace(/[^\d+]/g, "");
  return `+54381${crudo.replace(/\D/g, "").slice(-7)}`;
}

/** Fila de contacto con icono, como las de la ficha de área. */
function FilaContacto({ icono, children }: { icono: string; children: React.ReactNode }) {
  return (
    <li style={{ display: "flex", gap: "var(--sp-3)", overflowWrap: "anywhere" }}>
      <Icono nombre={icono} tamano={18} />
      <span>{children}</span>
    </li>
  );
}

export default async function PaginaContacto() {
  // Los teléfonos de emergencia salen del CMS, no están escritos a mano.
  let emergencias: Emergencia[] = [];
  try {
    emergencias = await getEmergencias();
  } catch {
    // Si la API no responde, la página se muestra igual sin ese bloque: los
    // teléfonos de la Municipalidad y el domicilio no dependen de la API.
  }

  let areas: AreaResumen[] = [];
  try {
    areas = await getAreas();
  } catch {
    // Ídem: el directorio es un agregado, no el contenido principal.
  }

  const porId = new Map(areas.map((area) => [area.id, area]));
  const areasDeAtencion = IDS_AREAS_DE_ATENCION.map((id) => porId.get(id)).filter(
    (area): area is AreaResumen => area !== undefined,
  );

  return (
    <>
      <BandaSeccion seccion="contacto" />

      <div className="cabecera-pagina">
        <Migas migas={[{ texto: "Inicio", url: "/" }, { texto: "Contacto" }]} />
        <div className="contenedor">
          <h1>Contacto</h1>
          <p className="bajada">
            Los teléfonos, el domicilio y los correos institucionales de la Municipalidad de San
            Miguel de Tucumán, y los sistemas en línea donde se hacen y se consultan gestiones. El
            portal no recibe consultas por formulario: cada trámite se resuelve por el canal que le
            corresponde.
          </p>
        </div>
      </div>

      {/* A. Teléfonos ---------------------------------------------------- */}
      <section className="seccion seccion--blanca" aria-labelledby="titulo-telefonos">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Por teléfono</p>
              <h2 id="titulo-telefonos">Líneas municipales</h2>
            </div>
          </div>

          <div className="grilla grilla--2">
            <article className="tarjeta">
              <span className="tarjeta__icono">
                <Icono nombre="telefono" tamano={24} />
              </span>
              <h3>Municipalidad de San Miguel de Tucumán</h3>
              <p>
                <a href={`tel:${CONTACTO.telefonoLink}`}>{CONTACTO.telefono}</a>
              </p>
            </article>

            <article className="tarjeta">
              <span className="tarjeta__icono">
                <Icono nombre="salud" tamano={24} />
              </span>
              <h3>Asistencia Pública</h3>
              <ul style={{ listStyle: "none", padding: 0, display: "grid", gap: "var(--sp-2)" }}>
                {CONTACTO.asistenciaPublica.map((telefono) => (
                  <li key={telefono}>
                    <a href={`tel:${enlaceTelefonicoLocal(telefono)}`}>{telefono}</a>
                  </li>
                ))}
              </ul>
            </article>
          </div>
        </div>
      </section>

      {/* B. Emergencias -------------------------------------------------- */}
      {emergencias.length > 0 ? (
        <section className="seccion seccion--azul" aria-labelledby="titulo-emergencias">
          <div className="contenedor">
            <div className="seccion__cabecera">
              <div>
                <p className="seccion__kicker">Urgencias</p>
                <h2 id="titulo-emergencias">Teléfonos de emergencia</h2>
                <p>Los mismos que figuran en el pie de todas las páginas del portal.</p>
              </div>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--sp-2)" }}>
              {emergencias.map((tel) => (
                <a className="tel-emergencia" key={tel.id} href={`tel:${tel.numero}`}>
                  <strong>{tel.numero}</strong> {tel.nombre ?? "Emergencias"}
                </a>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* C. Sede ---------------------------------------------------------- */}
      <section className="seccion" aria-labelledby="titulo-sede">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Presencial</p>
              <h2 id="titulo-sede">Dónde queda</h2>
            </div>
          </div>

          {/*
            La altura de calle está en disputa y no se resuelve eligiendo: el
            sitio actual publica 598 en el encabezado y 570 en el pie y en las
            fichas, y dentro del propio CMS conviven las dos (49 áreas cargadas
            en 570 y dos en 598). Se publica el valor único de lib/navegacion.ts
            para que el portal no diga dos direcciones distintas, y queda
            pendiente que el municipio confirme cuál es la oficial. La duda no
            se le traslada al vecino: una dirección con asterisco no le sirve
            para ir.
          */}
          <article className="tarjeta" style={{ maxWidth: "var(--ancho-texto)" }}>
            <span className="tarjeta__icono">
              <Icono nombre="ubicacion" tamano={24} />
            </span>
            <h3>Casa Central</h3>
            <address style={{ fontStyle: "normal" }}>{CONTACTO.direccion}</address>
            <p style={{ marginTop: "var(--sp-4)" }}>
              Muchas áreas municipales atienden en otros domicilios. El de cada una figura en{" "}
              <Link href="/gobierno">la estructura de gobierno</Link>.
            </p>
          </article>
        </div>
      </section>

      {/* D. Correos por área --------------------------------------------- */}
      <section className="seccion seccion--blanca" aria-labelledby="titulo-areas">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Por correo</p>
              <h2 id="titulo-areas">Escribile al área que corresponde</h2>
              <p>
                Cada área municipal publica su casilla de correo institucional en la estructura de
                gobierno.
              </p>
            </div>
          </div>

          {areasDeAtencion.length > 0 ? (
            <div className="grilla grilla--3">
              {areasDeAtencion.map((area) => {
                const correo = correoValido(area.email);
                const domicilio = domicilioValido(area.domicilio);

                return (
                  <article className="tarjeta" key={area.id}>
                    <span className="tarjeta__icono">
                      <Icono nombre="correo" tamano={24} />
                    </span>
                    <h3>
                      <Link href={`/gobierno/${area.id}`}>{nombreDe(area)}</Link>
                    </h3>

                    <ul
                      style={{
                        listStyle: "none",
                        padding: 0,
                        display: "grid",
                        gap: "var(--sp-2)",
                        marginTop: "var(--sp-3)",
                        fontSize: "var(--fs-sm)",
                      }}
                    >
                      {domicilio ? (
                        <FilaContacto icono="ubicacion">
                          {/* position:relative para que el ::after del título no tape el texto. */}
                          <address style={{ fontStyle: "normal", position: "relative" }}>
                            {domicilio}
                          </address>
                        </FilaContacto>
                      ) : null}

                      {area.telefono ? (
                        <FilaContacto icono="telefono">
                          <a
                            href={`tel:${enlaceTelefonicoLocal(area.telefono)}`}
                            style={{ position: "relative" }}
                          >
                            {area.telefono}
                          </a>
                        </FilaContacto>
                      ) : null}

                      {correo ? (
                        <FilaContacto icono="correo">
                          <a href={`mailto:${correo}`} style={{ position: "relative" }}>
                            {correo}
                          </a>
                        </FilaContacto>
                      ) : null}
                    </ul>
                  </article>
                );
              })}
            </div>
          ) : (
            <div className="estado-vacio">
              <h3>No se puede mostrar el directorio de áreas</h3>
              <p>
                Los correos de cada área no están disponibles en este momento. Los teléfonos de la
                Municipalidad figuran más arriba y en el pie de página.
              </p>
            </div>
          )}

          <p style={{ marginTop: "var(--sp-6)" }}>
            <Link className="boton boton--secundario" href="/gobierno">
              Ver la estructura de gobierno
            </Link>
          </p>
        </div>
      </section>

      {/* E. Sistemas en línea --------------------------------------------- */}
      <section className="seccion" aria-labelledby="titulo-sistemas">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">En línea</p>
              <h2 id="titulo-sistemas">Sistemas municipales</h2>
              <p>
                Los sistemas en línea del municipio. Algunos piden que te registres.
              </p>
            </div>
          </div>

          <div className="grilla grilla--2">
            <a
              className="acceso"
              href={URL_RECLAMOS}
              rel="noopener"
              target="_blank"
              data-externo
            >
              <span className="acceso__icono">
                <Icono nombre="seguridad" tamano={22} />
              </span>
              <span>
                Atención Ciudadana
                <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
                <small>Consulta de reclamos</small>
              </span>
            </a>

            {SISTEMAS.map((sistema) => (
              <a
                className="acceso"
                key={sistema.url}
                href={sistema.url}
                rel="noopener"
                target="_blank"
                data-externo
              >
                <span className="acceso__icono">
                  <Icono nombre={ICONO_SISTEMA[sistema.titulo] ?? "externo"} tamano={22} />
                </span>
                <span>
                  {sistema.titulo}
                  <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* F. Redes --------------------------------------------------------- */}
      <section className="seccion seccion--blanca" aria-labelledby="titulo-redes">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Redes</p>
              <h2 id="titulo-redes">Cuentas oficiales</h2>
            </div>
          </div>

          <div className="grilla grilla--4">
            {REDES.map((red) => (
              <a
                className="acceso"
                key={red.url}
                href={red.url}
                rel="noopener"
                target="_blank"
                data-externo
              >
                <span className="acceso__icono">
                  <Icono nombre={ICONO_RED[red.titulo] ?? "externo"} tamano={22} />
                </span>
                <span>
                  {red.titulo} de la Municipalidad
                  <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
                </span>
              </a>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
