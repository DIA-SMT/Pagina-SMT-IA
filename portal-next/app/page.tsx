import Image from "next/image";
import Link from "next/link";
import type { Metadata } from "next";

import { Banners } from "@/components/Banners";
import { Buscador } from "@/components/Buscador";
import { FondoFotos } from "@/components/FondoFotos";
import { Icono } from "@/components/Iconos";
import { getBanners, getCategorias, getGaleria, getGalerias } from "@/lib/api";
import { FOTOS_HERO } from "@/lib/hero";
import { construirIndice } from "@/lib/indice";
import { medirImagenes } from "@/lib/medidas";
import { ACCESOS, iconoDesdeFontAwesome } from "@/lib/navegacion";
import type { Banner, Foto, GaleriaResumen } from "@/lib/tipos";

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

/**
 * Los cuatro destinos de transporte con más demanda medida.
 *
 * Las descripciones no las escribimos nosotros: salen de lo que dice cada
 * página. "Gratuita para grupos con atributos sociales" está en el texto de
 * /p/Sube y "Boleto Educativo Municipal" en el de /p/SUBEM. Los cuatro
 * destinos están verificados en 200.
 */
const TRANSPORTE = [
  {
    titulo: "Recorridos de colectivos",
    detalle: "Las líneas municipales, de la 1 a la 19, y cómo seguirlas en tiempo real.",
    url: "/p/colectivos",
    icono: "transporte",
  },
  {
    titulo: "Tarjeta SUBE",
    detalle: "Cómo obtenerla y quiénes la reciben sin cargo.",
    url: "/p/Sube",
    icono: "pagos",
  },
  {
    titulo: "Boleto Educativo Municipal",
    detalle: "El programa SUBEM para estudiantes de primaria y secundaria.",
    url: "/p/SUBEM",
    icono: "educacion",
  },
  {
    titulo: "Transporte individual de pasajeros",
    detalle: "El registro obligatorio para personas, vehículos y empresas del servicio.",
    url: "/p/Registros%20_Transporte%20_Individual_Pasajeros",
    icono: "normativa",
  },
];

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

/**
 * Las fotos que se van pasando de fondo en "Conocé la ciudad".
 *
 * Salen de las galerías del CMS, no de una lista escrita acá: si el municipio
 * carga una foto nueva, la portada la muestra sola.
 *
 * Se quedan las que tienen descripción cargada. La regla no es caprichosa: en
 * las galerías de hoy son 12 de 38, y son justamente las fotos de ciudad
 * —Monumento al Bicentenario, Plaza Independencia, El Rosedal— mientras que
 * las de actos y oficinas están sin describir. Además le da al municipio un
 * motivo concreto para completar el texto alternativo.
 *
 * Se descartan las repetidas por descripción: hay dos "Puente peatonal Mate de
 * luna" y verlas pasar una atrás de la otra queda raro.
 *
 * Además se miden: una foto vertical recortada a una banda ancha muestra una
 * tajada sin sentido, y una chica estirada se ve borrosa. Las dos cosas se
 * notan. Como la API no publica el tamaño —la base guarda la ruta del archivo
 * y nada más— se lee la cabecera de cada candidata (lib/medidas.ts).
 *
 * Los dos umbrales salen de medir la caja real: a 1440px de pantalla el fondo
 * mide 1425x802.
 *   - Apaisada, 1,2 de proporción o más. Con la foto vertical de 675x1011 que
 *     había entrado, se veía una franja del medio y nada más.
 *   - 1200px de ancho como mínimo, para que el estiramiento no pase de 1,19x
 *     y no se note. La que había entrado medía 427x641 y se servía a 160x240.
 *
 * Cinco es el tope: a siete segundos por foto ya son treinta y cinco segundos
 * de vuelta y la sección no gana nada con más.
 */
const FOTOS_DE_FONDO = 5;
const ANCHO_MINIMO = 1200;
const PROPORCION_MINIMA = 1.2;

async function fotosParaElFondo(galerias: GaleriaResumen[]): Promise<Foto[]> {
  const completas = await Promise.all(
    galerias.map((galeria) =>
      sinRomper(getGaleria(galeria.id), null, `la galería ${galeria.id}`),
    ),
  );

  // Primero el filtro barato: descripción cargada y sin repetir.
  const vistas = new Set<string>();
  const candidatas: Foto[] = [];
  for (const galeria of completas) {
    for (const foto of galeria?.fotos ?? []) {
      const descripcion = foto.descripcion?.trim();
      if (!descripcion || !foto.imagen) continue;
      const clave = descripcion.toLowerCase();
      if (vistas.has(clave)) continue;
      vistas.add(clave);
      candidatas.push(foto);
    }
  }

  // Y recién ahí el caro, que pide bytes por la red. De a tandas de tres: el
  // servidor municipal tarda hasta 6,7 segundos por foto y con doce pedidos
  // simultáneos se ahoga, así que el fondo cambiaba de cantidad de fotos en
  // cada regeneración. El resultado queda en caché un día.
  const medidas = await medirImagenes(candidatas.map((foto) => foto.imagen ?? ""));

  return candidatas
    .filter((_, i) => {
      const m = medidas[i];
      return m !== null && m.ancho >= ANCHO_MINIMO && m.ancho / m.alto >= PROPORCION_MINIMA;
    })
    .slice(0, FOTOS_DE_FONDO);
}

export default async function Portada() {
  const [categorias, galerias, banners] = await Promise.all([
    getCategorias(),
    sinRomper<GaleriaResumen[]>(getGalerias(), [], "las galerías"),
    sinRomper<Banner[]>(getBanners(), [], "los banners"),
  ]);

  const transparencia = categorias.find((c) => c.id === 10);
  const fotosDeFondo = await fotosParaElFondo(galerias);
  // El índice del buscador viaja con el HTML: el servidor municipal tarda
  // hasta 6,7 segundos por pedido, así que consultarlo por tecla no es opción.
  const indice = await construirIndice();

  return (
    <>
      {/* A. Hero: buscar y los accesos -------------------------------------
          Sin fotografía: la ciudad ahora es el telón de la sección de
          servicios, más abajo. Acá manda el azul institucional, el mismo
          degradado que usan las otras zonas azules del portal.

          El panel dejó de ser una tarjeta con sombra: esa tarjeta existía
          para que el texto no cayera sobre la foto. Sin foto detrás, un
          recuadro azul sobre azul sería un contorno que no separa nada.
          La curva del pétalo del logo se mudó al canto de la banda.

          Los accesos vuelven acá adentro, que es donde estaban: son lo
          único blanco de la banda y le dan el punto de apoyo. */}
      <section className="hero">
        <div className="hero__contenido contenedor">
          <div className="hero__panel">
            <h1 className="hero__titulo">
              Tu ciudad, <em>más cerca</em>
            </h1>
            <p className="hero__bajada">
              Encontrá trámites, servicios e información de San Miguel de Tucumán.
            </p>

            <Buscador indice={indice} />

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

          {/* Sección propia adentro del hero, y no un div: así "Accesos
              destacados" nombra a las seis tarjetas y nada más. Puesto en el
              <section> de afuera, un lector de pantalla anunciaba como
              "Accesos destacados" a toda la región que contiene el h1 de la
              página y el buscador. */}
          <section className="hero__hojas" aria-labelledby="titulo-accesos">
            <h2 className="hero__rotulo" id="titulo-accesos">
              Accesos destacados
            </h2>
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
          </section>
        </div>
      </section>

      {/* B-bis. Cómo moverte por la ciudad -------------------------------- */}
      {/* El agujero más grande que mostró el log del servidor. Medido el lunes
          14/09/2026, día hábil completo y sin bots: colectivos 161 visitas
          diarias, SUBE 59, registros del transporte individual 44, SUBEM 37.
          Son 301 visitas por día de información de transporte que el portal no
          enlazaba desde ningún lado: se llegaba sólo por buscador o por la URL
          directa. Para comparar, los tres botones que la portada sí mostraba
          —historia, circuitos y lugares de interés— suman 107. */}
      <section className="seccion seccion--blanca" aria-labelledby="titulo-transporte">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Transporte y movilidad</p>
              <h2 id="titulo-transporte">Cómo moverte por la ciudad</h2>
              <p>Los recorridos, la tarjeta y los trámites del transporte público.</p>
            </div>
            <Link className="boton boton--secundario" href="/tramites/7">
              Ver todos los trámites de transporte
            </Link>
          </div>

          <div className="grilla grilla--4">
            {TRANSPORTE.map((destino) => (
              <article className="tarjeta" key={destino.url}>
                <span className="tarjeta__icono">
                  <Icono nombre={destino.icono} tamano={24} />
                </span>
                <h3>
                  <Link href={destino.url}>{destino.titulo}</Link>
                </h3>
                <p>{destino.detalle}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* C. El telón: la ciudad quieta y el contenido por delante ----------
          Las tres fotografías se quedan fijas ocupando la pantalla mientras
          los servicios y las campañas le pasan por encima, y se van
          turnando a medida que uno baja. Es position: sticky, no
          background-attachment: fixed, que es la forma que sale en los
          tutoriales y la única que no funciona en iOS.

          Las tarjetas son opacas, así que su texto conserva el contraste
          que ya tenía. El que sí cambia es el de los encabezados de
          sección, que quedan sobre la fotografía: por eso el velo de azul
          institucional es fuerte y no un lavado. Está medido sobre los
          píxeles compuestos, no sobre el color nominal.

          Alt vacío en las tres, igual que en FondoFotos: acá la ciudad es
          el fondo de una sección de trámites. Describir el atardecer en
          medio de "Servicios por temática" sería ruido para quien usa
          lector de pantalla; las descripciones completas viven en
          FOTOS_HERO, donde sí informan. */}
      <div className="telon">
        <div className="telon__fondo">
          <div className="telon__fotos">
            {FOTOS_HERO.slice(0, 3).map((foto) => (
              <Image
                key={foto.src}
                src={foto.src}
                alt=""
                fill
                loading="lazy"
                /* No es 100vw: las fotos son 3:1 y el cajón es alto, así que
                   object-fit cover las agranda hasta tapar el ALTO y quedan
                   pintadas mucho más anchas que la pantalla. En un teléfono de
                   360x800 se pintan a 2400px de ancho, y con 100vw el
                   navegador elegía el archivo de 750w: 6,4 veces estirado. Con
                   200vw baja a 3,3 y se paga medio archivo más. No se pide el
                   tamaño exacto a propósito: serían 500 KB de fondo decorativo
                   en móvil, que es el 60% del tráfico. */
                sizes="(max-width: 48rem) 200vw, 100vw"
                style={foto.posicion ? { objectPosition: foto.posicion } : undefined}
              />
            ))}
            <div className="telon__velo" aria-hidden="true" />
          </div>
        </div>

        <div className="telon__contenido">
        {/* C.1. Servicios por temática ------------------------------------- */}
        <section className="seccion" aria-labelledby="titulo-servicios">
          <div className="contenedor">
            <div className="seccion__cabecera">
              <div>
                <p className="seccion__kicker">Trámites y servicios</p>
                <h2 id="titulo-servicios">Servicios por temática</h2>
                <p>Elegí una categoría para ver los trámites que incluye y cómo hacerlos.</p>
              </div>
              <a className="boton boton--blanco" href={GUIA_TRAMITES} rel="noopener" target="_blank">
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

        {/* C.2. Campañas y accesos ----------------------------------------- */}
        {/* Campañas que administra el municipio desde Voyager. Van después de los
            servicios: el trabajo principal del portal es encontrar un trámite,
            y esto es comunicación con fecha de vencimiento. Comparten el telón
            con los servicios porque son el mismo tramo de la portada. */}
        <Banners banners={banners} />
        </div>
      </div>

      {/* D. Conocé la ciudad --------------------------------------------- */}
      {/* Lleva su propio fondo de fotos, y son otras: las del telón de arriba
          son las siete piezas de public/hero/, éstas salen de las galerías que
          carga el municipio. */}
      <section className="seccion seccion--azul seccion--fotos" aria-labelledby="titulo-ciudad">
        <FondoFotos fotos={fotosDeFondo} />

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
