import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { Banners } from "@/components/Banners";
import { Icono } from "@/components/Iconos";
import { getBanners, getCategorias, getGalerias } from "@/lib/api";
import { HERO } from "@/lib/hero";
import { ACCESOS, iconoDesdeFontAwesome } from "@/lib/navegacion";
import type { Banner, GaleriaResumen } from "@/lib/tipos";

/** Los contenidos del CMS cambian poco: se regeneran cada cinco minutos. */
export const revalidate = 300;

export const metadata: Metadata = {
  // `absolute` evita que el template del layout duplique el nombre del sitio.
  title: { absolute: "Ciudad San Miguel de Tucumán — Portal oficial" },
  description:
    "Trámites, servicios, galerías e información de gobierno de la Municipalidad de San Miguel de Tucumán.",
  alternates: { canonical: "/" },
  openGraph: {
    url: "/",
    title: "Ciudad San Miguel de Tucumán — Portal oficial",
    description:
      "Trámites, servicios, galerías e información de gobierno de la Municipalidad de San Miguel de Tucumán.",
  },
};

const GUIA_TRAMITES = "https://guiadetramites.smt.gob.ar";
const MAPA = "https://mapa.smt.gob.ar/";
const DATOS_ABIERTOS = "https://smtendatos.gob.ar/";
const LICITACIONES = "https://licitaciones.smt.gob.ar/";

/** Búsquedas frecuentes: todas corresponden a trámites que existen en el CMS. */
const BUSQUEDAS_FRECUENTES = [
  "Licencia de conducir",
  "Habilitación de comercios",
  "Carnet de sanidad",
  "Cortes de tránsito",
  "Asistencia pública",
];

/**
 * Los bloques accesorios de la portada (foto del hero, galerías) no deberían
 * tirar abajo la página entera si su endpoint falla: se registra el error en
 * el servidor y la sección se omite o queda sin tarjetas.
 */
async function sinRomper<T>(promesa: Promise<T>, respaldo: T, que: string): Promise<T> {
  try {
    return await promesa;
  } catch (error) {
    console.error(`Portada: no se pudieron cargar ${que}.`, error);
    return respaldo;
  }
}

export default async function Portada() {
  const [categorias, galerias, banners] = await Promise.all([
    getCategorias(),
    sinRomper<GaleriaResumen[]>(getGalerias(), [], "las galerías"),
    sinRomper<Banner[]>(getBanners(), [], "los banners"),
  ]);

  const transparencia = categorias.find((c) => c.id === 10);

  return (
    <>
      {/* A. Hero -------------------------------------------------------- */}
      <section className="hero">
        <div className="hero__banda">
          <Image
            src={HERO.src}
            alt={HERO.alt}
            fill
            priority
            sizes="100vw"
            style={HERO.posicion ? { objectPosition: HERO.posicion } : undefined}
          />
          <div className="hero__velo" aria-hidden="true" />
          <p className="hero__epigrafe">{HERO.epigrafe}</p>

          <div className="hero__texto">
            <div className="contenedor">
              <h1 className="hero__titulo">
                Tu ciudad, <em>más cerca</em>
              </h1>
              <p className="hero__bajada">
                Encontrá trámites, servicios e información de San Miguel de Tucumán.
              </p>
            </div>
          </div>
        </div>

        <div className="contenedor">
          <div className="hero__panel">
            <form className="buscador-hero" action="/buscar" method="get" role="search">
              <label className="visualmente-oculto" htmlFor="buscar-portada">
                Buscar trámites, servicios e información
              </label>
              <input
                id="buscar-portada"
                type="search"
                name="q"
                placeholder="¿Qué necesitás hacer?"
                required
              />
              <button className="boton boton--primario" type="submit">
                <Icono nombre="buscar" tamano={18} />
                Buscar
              </button>
            </form>

            <div className="hero__sugerencias">
              <span id="busquedas-frecuentes">Búsquedas frecuentes</span>
              <ul className="hero__chips" aria-labelledby="busquedas-frecuentes">
                {BUSQUEDAS_FRECUENTES.map((termino) => (
                  <li key={termino}>
                    <Link className="chip" href={`/buscar?q=${encodeURIComponent(termino)}`}>
                      {termino}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* B. Accesos destacados ------------------------------------------ */}
      <section className="seccion seccion--blanca" aria-labelledby="titulo-accesos">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Atajos</p>
              <h2 id="titulo-accesos">Accesos destacados</h2>
            </div>
          </div>

          <div className="grilla grilla--3">
            {ACCESOS.map((acceso) =>
              acceso.externo ? (
                <a
                  className="acceso"
                  key={acceso.url}
                  href={acceso.url}
                  rel="noopener"
                  target="_blank"
                  data-externo
                >
                  <span className="acceso__icono">
                    <Icono nombre={acceso.icono} tamano={22} />
                  </span>
                  <span>
                    {acceso.titulo}
                    <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
                    <small>{acceso.detalle}</small>
                  </span>
                </a>
              ) : (
                <Link className="acceso" key={acceso.url} href={acceso.url}>
                  <span className="acceso__icono">
                    <Icono nombre={acceso.icono} tamano={22} />
                  </span>
                  <span>
                    {acceso.titulo}
                    <small>{acceso.detalle}</small>
                  </span>
                </Link>
              ),
            )}
          </div>
        </div>
      </section>

      {/* C. Servicios por temática --------------------------------------- */}
      <section className="seccion" aria-labelledby="titulo-servicios">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Trámites y servicios</p>
              <h2 id="titulo-servicios">Servicios por temática</h2>
              <p>Elegí una categoría para ver los trámites que incluye y cómo hacerlos.</p>
            </div>
            <a className="boton boton--secundario" href={GUIA_TRAMITES} rel="noopener" target="_blank">
              Guía de Trámites
              <Icono nombre="externo" tamano={16} />
              <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
            </a>
          </div>

          <div className="grilla grilla--4">
            {categorias.map((categoria) => (
              <article className="tarjeta" key={categoria.id}>
                <span className="tarjeta__icono">
                  <Icono nombre={iconoDesdeFontAwesome(categoria.icono)} tamano={24} />
                </span>
                <h3>
                  <Link href={`/tramites/${categoria.id}`}>{categoria.titulo}</Link>
                </h3>
                {categoria.texto && <p>{categoria.texto}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* D. Conocé la ciudad --------------------------------------------- */}
      {/* Campañas que administra el municipio desde Voyager. Van después de los
          servicios: el trabajo principal del portal es encontrar un trámite,
          y esto es comunicación con fecha de vencimiento. */}
      <Banners banners={banners} />

      <section className="seccion seccion--azul" aria-labelledby="titulo-ciudad">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">La ciudad</p>
              <h2 id="titulo-ciudad">Conocé la ciudad</h2>
              <p>Su historia, sus lugares de interés y las imágenes de San Miguel de Tucumán.</p>
            </div>
          </div>

          {galerias.length > 0 && (
            <div className="grilla grilla--3">
              {galerias.map((galeria) => (
                <article className="tarjeta" key={galeria.id}>
                  <span className="tarjeta__icono">
                    <Icono nombre="imagen" tamano={24} />
                  </span>
                  <h3>
                    <Link href={`/galeria/${galeria.id}`}>
                      {galeria.nombre ?? "Galería de imágenes"}
                    </Link>
                  </h3>
                  <p>
                    {galeria.fotos} {galeria.fotos === 1 ? "foto" : "fotos"}
                  </p>
                </article>
              ))}
            </div>
          )}

          <div
            style={{
              display: "flex",
              flexWrap: "wrap",
              gap: "var(--sp-3)",
              marginTop: galerias.length > 0 ? "var(--sp-7)" : "0",
            }}
          >
            <Link className="boton boton--blanco" href="/p/historia">
              Historia de la ciudad
            </Link>
            <Link className="boton boton--blanco" href="/p/circuitos-turisticos">
              Circuitos turísticos
            </Link>
            <Link className="boton boton--blanco" href="/p/lugares-de-interes">
              Lugares de interés
            </Link>
            <a className="boton boton--blanco" href={MAPA} rel="noopener" target="_blank">
              Mapa interactivo
              <Icono nombre="externo" tamano={16} />
              <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
            </a>
          </div>
        </div>
      </section>

      {/* E. Transparencia y participación --------------------------------- */}
      <section className="seccion seccion--blanca" aria-labelledby="titulo-transparencia">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Gobierno abierto</p>
              <h2 id="titulo-transparencia">Transparencia y participación</h2>
            </div>
          </div>

          <div className="grilla grilla--3">
            <article className="tarjeta">
              <span className="tarjeta__icono">
                <Icono nombre="transparencia" tamano={24} />
              </span>
              <h3>
                <Link href="/tramites/10">
                  {transparencia?.titulo ?? "Transparencia y Participación"}
                </Link>
              </h3>
              <p>
                {transparencia?.texto ??
                  "Rendición de cuentas, acceso a la información pública y participación ciudadana."}
              </p>
            </article>

            <article className="tarjeta">
              <span className="tarjeta__icono">
                <Icono nombre="documento" tamano={24} />
              </span>
              <h3>
                <a href={DATOS_ABIERTOS} rel="noopener" target="_blank" data-externo>
                  SMT en Datos
                  <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
                </a>
              </h3>
              <p>Datos abiertos de la gestión municipal, para consultar y descargar.</p>
            </article>

            <article className="tarjeta">
              <span className="tarjeta__icono">
                <Icono nombre="normativa" tamano={24} />
              </span>
              <h3>
                <a href={LICITACIONES} rel="noopener" target="_blank" data-externo>
                  Licitaciones
                  <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
                </a>
              </h3>
              <p>Llamados a licitación y pliegos de la Municipalidad.</p>
            </article>
          </div>
        </div>
      </section>
    </>
  );
}
