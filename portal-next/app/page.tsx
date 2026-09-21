import Link from "next/link";
import type { Metadata } from "next";

import { Banners } from "@/components/Banners";
import { Buscador } from "@/components/Buscador";
import { HeroTucuman } from "@/components/HeroTucuman";
import { FondoFotos } from "@/components/FondoFotos";
import { TelonFotos, type FotoDelTelon } from "@/components/TelonFotos";
import { Icono } from "@/components/Iconos";
import { getBanners, getCategorias, getGaleria, getGalerias } from "@/lib/api";
import { FOTOS_HERO } from "@/lib/hero";
import { construirIndice } from "@/lib/indice";
import { medirImagenes } from "@/lib/medidas";
import { ACCESOS, DESTACADOS, iconoDesdeFontAwesome } from "@/lib/navegacion";
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
 * Las dos categorías de trámites que ya tienen su propia sección en la portada.
 *
 * Están nombradas y no escritas a mano en cada lugar porque se usan en dos
 * puntos cada una: el botón de la sección y el filtro del índice. Con el número
 * suelto, cambiar una dejaba la otra apuntando a otro lado sin que nada avise.
 */
const CATEGORIA_TRANSPORTE = 7;
const CATEGORIA_TRANSPARENCIA = 10;

/**
 * Un destino, en forma comparable.
 *
 * El mismo contenido llega escrito de tres maneras distintas: `/p/colectivos`
 * desde nuestras listas, `https://smt.gob.ar/colectivos` desde un banner que el
 * municipio cargó apuntando al sitio viejo, y con los espacios en %20 cuando el
 * slug los tiene. Las tres tienen que dar la misma clave o el filtro no sirve
 * de nada.
 */
function clave(url: string): string {
  let u = url.trim().replace(/^https?:\/\/(www\.)?smt\.gob\.ar/i, "");
  try {
    u = decodeURIComponent(u);
  } catch {
    /* Si viene mal codificada se compara cruda, que es mejor que romper. */
  }
  u = u.replace(/\/+$/, "").toLowerCase();
  return u === "" ? "/" : u;
}

/**
 * Anota un destino como "ya está en la portada".
 *
 * Las páginas de contenido se anotan DOS veces: el sitio nuevo las sirve en
 * `/p/colectivos` y el viejo las servía en `/colectivos`. Un banner del CMS
 * que todavía apunte al viejo tiene que reconocerse como la misma página.
 */
function anotar(conjunto: Set<string>, url: string): void {
  const k = clave(url);
  conjunto.add(k);
  if (k.startsWith("/p/")) conjunto.add(k.slice(2));
}

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

/**
 * Cuántas fotos entran en una bajada del telón.
 *
 * El telón mide 2532px y su recorrido —animation-range: cover 0% cover 100%,
 * o sea el alto más una pantalla— son 3432px a 1440x900. Con seis fotos le
 * tocan 572px a cada una, poco menos de dos tercios de pantalla, unos seis
 * clics de rueda. Con cinco eran 686. Más de seis y el pasaje se empieza a
 * sentir como un pase de diapositivas en vez de una ciudad que cambia.
 *
 * Que sean seis NO significa que el visitante vea siempre las mismas seis:
 * salen sorteadas de todas las disponibles en cada regeneración.
 */
const FOTOS_DEL_TELON = 6;
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

  // Se devuelven TODAS las que pasan, sin recortar: quién se queda con
  // cuántas lo deciden los dos consumidores, cada uno con su propio sorteo.
  // El costo de red no cambia por esto —medirImagenes ya medía todas las
  // candidatas y el recorte venía después— así que el servidor municipal
  // recibe exactamente los mismos pedidos que antes.
  return candidatas.filter((_, i) => {
    const m = medidas[i];
    return m !== null && m.ancho >= ANCHO_MINIMO && m.ancho / m.alto >= PROPORCION_MINIMA;
  });
}

/**
 * Baraja una copia. Fisher-Yates.
 *
 * Corre en el servidor, al generar la página, y no en el navegador: con
 * revalidate = 300 el sorteo se repite cada cinco minutos, todo el mundo ve la
 * misma tanda dentro de esa ventana, y no hace falta ni un byte de JavaScript
 * ni arriesgar que el HTML del servidor no coincida con el del cliente.
 */
function barajar<T>(xs: T[]): T[] {
  const a = [...xs];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/**
 * Las fotos del telón: un sorteo entre las locales y las de las galerías.
 *
 * La PRIMERA siempre es local, y eso no es un detalle estético. Las de galería
 * vienen del servidor municipal, que tarda hasta 6,7 segundos por foto; la
 * primera del telón es la que se ve apenas alguien llega a "Cómo moverte por
 * la ciudad" y si tarda, lo que se ve es el azul plano de .telon__fondo. Las
 * locales están en public/hero, las sirve el mismo host y pesan poco.
 *
 * Meter fotos que no elegimos nosotros es seguro acá porque el contraste del
 * texto NO depende de la fotografía: lo sostiene la marquesina, que es una
 * banda opaca al 0,86. Sobre un blanco puro —el peor caso concebible— deja el
 * h2 en 8,6:1 y el kicker amarillo en 6,2:1. Es la misma clase de garantía por
 * cota que el panel del hero, y es lo que permite que el municipio suba lo que
 * quiera sin romper nada.
 */
function fotosDelTelon(deLasGalerias: Foto[]): FotoDelTelon[] {
  const locales: FotoDelTelon[] = FOTOS_HERO.map((f) => ({ src: f.src, posicion: f.posicion }));
  const remotas: FotoDelTelon[] = deLasGalerias.flatMap((f) =>
    f.imagen ? [{ src: f.imagen }] : [],
  );

  const primera = barajar(locales)[0];
  const resto = barajar([...locales.filter((f) => f.src !== primera.src), ...remotas]);
  return [primera, ...resto].slice(0, FOTOS_DEL_TELON);
}

export default async function Portada() {
  const [categorias, galerias, banners] = await Promise.all([
    getCategorias(),
    sinRomper<GaleriaResumen[]>(getGalerias(), [], "las galerías"),
    sinRomper<Banner[]>(getBanners(), [], "los banners"),
  ]);

  // El índice del buscador viaja con el HTML: el servidor municipal tarda
  // hasta 6,7 segundos por pedido, así que consultarlo por tecla no es opción.
  // Se construye acá arriba y no más abajo porque además lo usa el arreglo de
  // los banners: tiene TODAS las rutas que el portal sirve de verdad.
  const indice = await construirIndice();
  const transparencia = categorias.find((c) => c.id === CATEGORIA_TRANSPARENCIA);

  /* ---- Cada destino, un solo lugar ----
     La sección de sistemas ya filtraba contra DESTACADOS para no repetir una
     tarjeta. El principio estaba bien y no estaba aplicado en el resto: medida
     la portada, tenía 50 enlaces para 44 destinos. Se repetían colectivos, la
     Guía de Trámites, CiDiTuc/multas, SMT en Datos y dos categorías de
     trámites.

     La repetición es lo que más cansa de una página larga, y no la longitud:
     scrolleás, ves de nuevo "Recorridos de colectivos" y no sabés si avanzaste
     o estás dando vueltas. Acá se junta todo lo que la portada ya enlaza para
     que lo que viene del CMS pueda filtrarse contra eso. */
  const yaEnLaPortada = new Set<string>();
  for (const d of DESTACADOS) anotar(yaEnLaPortada, d.url);
  for (const a of ACCESOS) anotar(yaEnLaPortada, a.url);
  for (const t of TRANSPORTE) anotar(yaEnLaPortada, t.url);
  for (const u of [
    `/tramites/${CATEGORIA_TRANSPORTE}`,
    `/tramites/${CATEGORIA_TRANSPARENCIA}`,
    GUIA_TRAMITES,
    DATOS_ABIERTOS,
    LICITACIONES,
    MAPA,
    "/p/historia",
    "/p/circuitos-turisticos",
    "/p/lugares-de-interes",
  ]) {
    anotar(yaEnLaPortada, u);
  }

  /* Los banners son campañas con fecha de vencimiento; cuando una apunta a algo
     que la portada ya ofrece más arriba, no agrega nada. Se cayeron tres
     medidos: CiDiTuc/multas, SMT en Datos y tres que todavía mandaban al sitio
     viejo (turno-asistencia, SUBEM y los registros de transporte), que son las
     mismas páginas que el portal nuevo ya sirve. */
  /* ---- Los banners que todavía apuntan al sitio viejo ----
     El CMS tiene campañas cargadas con la URL vieja, https://smt.gob.ar/algo.
     Son páginas que el portal NUEVO ya sirve, así que el banner mandaba a la
     gente de vuelta al sitio que estamos reemplazando.

     Se reescriben y no se borran: la campaña es contenido que el municipio
     quiso publicar, y lo que está mal es a dónde apunta, no que exista. Sólo
     se reescribe cuando la ruta nueva EXISTE, y eso se comprueba contra el
     índice del buscador, que ya se construyó y tiene las rutas de todas las
     fichas, categorías, áreas y páginas de contenido. Si mañana el municipio
     publica una página nueva, esto se entera solo. */
  const rutasDelPortal = new Set(indice.map((e) => clave(e.u)));
  const alPortalNuevo = (enlace: string): string => {
    const m = /^https?:\/\/(www\.)?smt\.gob\.ar(\/.*)?$/i.exec(enlace.trim());
    if (!m) return enlace;
    const resto = (m[2] ?? "").replace(/\/+$/, "");
    if (resto === "") return enlace;
    const candidata = resto.startsWith("/p/") ? resto : `/p${resto}`;
    return rutasDelPortal.has(clave(candidata)) ? candidata : enlace;
  };

  const bannersReescritos: string[] = [];
  const bannersApuntados = banners.map((b) => {
    const enlace = typeof b.link === "string" ? b.link.trim() : "";
    if (enlace === "") return b;
    const nuevo = alPortalNuevo(enlace);
    if (nuevo === enlace) return b;
    bannersReescritos.push(`${enlace} -> ${nuevo}`);
    return { ...b, link: nuevo };
  });
  if (bannersReescritos.length > 0) {
    console.warn(
      `Portada: ${bannersReescritos.length} banner(s) apuntaban al sitio viejo y se redirigieron al portal nuevo: ${bannersReescritos.join(", ")}`,
    );
  }

  const bannersEscondidos: string[] = [];
  const bannersSinRepetir = bannersApuntados.filter((b) => {
    const enlace = typeof b.link === "string" ? b.link.trim() : "";
    if (enlace === "") return true; // un banner sin enlace es informativo
    const k = clave(enlace);
    if (yaEnLaPortada.has(k)) {
      bannersEscondidos.push(enlace);
      return false;
    }
    // Y se anota, así dos banners al mismo destino tampoco se repiten entre
    // ellos. No es hipotético: el CMS tiene hoy tres campañas distintas que
    // apuntan las tres a la página de la SUBE.
    yaEnLaPortada.add(k);
    return true;
  });
  /* Se avisa por el log del servidor, y no en silencio. Este filtro corre sobre
     contenido que carga el municipio desde Voyager: alguien puede subir una
     campaña, no verla aparecer y no tener forma de saber por qué. El aviso sale
     donde quien administra el contenido lo va a buscar, y no molesta a nadie
     que esté visitando la página. */
  if (bannersEscondidos.length > 0) {
    console.warn(
      `Portada: ${bannersEscondidos.length} banner(s) no se muestran porque su destino ya está enlazado más arriba: ${bannersEscondidos.join(", ")}`,
    );
  }

  /* Y el índice de categorías, sin las dos que tienen sección propia. */
  const categoriasDelIndice = categorias.filter(
    (c) => c.id !== CATEGORIA_TRANSPORTE && c.id !== CATEGORIA_TRANSPARENCIA,
  );
  const deLasGalerias = await fotosParaElFondo(galerias);
  const fotosDeFondo = barajar(deLasGalerias).slice(0, FOTOS_DE_FONDO);
  const fotosTelon = fotosDelTelon(deLasGalerias);
  return (
    <>
      {/* A. Hero: Tucumán se vuelve figuritas -------------------------------
          Tres estados encadenados: una fotografía de la ciudad, un clic que la
          convierte en una lámina de stickers, y esa lámina viva bajo el cursor.
          La máquina de estados y el porqué de cada decisión están en
          components/HeroTucuman.tsx; las quince capas, en lib/heroTucuman.ts.

          Lo que NO cambia es esta columna. El texto sigue sin caer nunca sobre
          la fotografía —la lección de los heros anteriores, que acá se paga con
          un panel azul propio— y los seis destinos siguen siendo lo primero que
          se ve, en orden de demanda medida: el primero ocupa el doble porque se
          lleva casi una de cada cuatro visitas del portal. El detalle está en
          lib/navegacion.ts, sobre DESTACADOS.

          La transformación es decorativa: el buscador y las seis tarjetas se
          pueden usar mientras corre. */}
      <HeroTucuman>
          <p className="hero__antetitulo">San Miguel de Tucumán</p>
          <h1 className="hero__titulo" id="titulo-buscar">
            La ciudad que <em>queremos</em>.
          </h1>
          {/* Dice "de la ciudad" y no "de San Miguel de Tucumán" porque el
              antetítulo, tres renglones más arriba, ya lo nombra. */}
          <p className="hero__bajada">
            Encontrá trámites, servicios e información de la ciudad.
          </p>

          <Buscador indice={indice} />

          <h2 className="hero__rotulo" id="titulo-destacados">
            Lo que más se consulta
          </h2>
          <ul className="destinos" aria-labelledby="titulo-destacados">
            {DESTACADOS.map((d, i) => (
              // El primero ocupa el doble: tiene cuatro veces el tráfico del
              // segundo, medido sobre el log del servidor.
              <li key={d.url} data-principal={i === 0 ? "" : undefined}>
                <Link className="destino" href={d.url}>
                  <span className="destino__icono">
                    <Icono nombre={d.icono} tamano={i === 0 ? 26 : 22} />
                  </span>
                  <span className="destino__titulo">{d.titulo}</span>
                  <span className="destino__flecha" aria-hidden="true">
                    <Icono nombre="flecha" tamano={18} />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
      </HeroTucuman>

      {/* B. Sistemas en línea ------------------------------------------------
          Fuera del telón y sobre blanco: acá abajo arranca el fondo de ciudad
          y conviene que empiece en transporte. Esta sección es la puerta a
          los sistemas externos —Guía de Trámites, CiDiTuc, DIM— y se lee
          mejor sin una fotografía atrás.

          Lo que queda de ACCESOS después de sacar lo que el hero ya muestra:
          el filtro es por URL, así que si mañana cambian los seis destacados
          esta sección se reacomoda sola y nunca repite una tarjeta.

          Lo que sobrevive son, sobre todo, los sistemas externos —Guía de
          Trámites, CiDiTuc, DIM— que no aparecen en nuestro log porque viven
          en otros dominios, y que por eso no podían competir por un lugar en
          el hero ordenado por demanda medida. */}
      <section className="seccion seccion--blanca" aria-labelledby="titulo-accesos">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Trámites en línea</p>
              <h2 id="titulo-accesos">Sistemas del municipio</h2>
              <p>Las plataformas donde se hacen las gestiones y los pagos.</p>
            </div>
          </div>

          <div className="grilla grilla--3">
            {ACCESOS.filter((a) => !DESTACADOS.some((d) => d.url === a.url)).map((acceso) =>
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

      {/* C. El telón: la ciudad quieta y el contenido por delante ----------
          Las fotografías se quedan fijas ocupando la pantalla mientras el
          contenido les pasa por encima, y se van turnando a medida que uno
          baja. Es position: sticky, no background-attachment: fixed, que es
          la forma que sale en los tutoriales y la única que no anda en iOS.

          Abarca TRES secciones —transporte, servicios y campañas— y no
          cuatro: el telón arranca donde el vecino pasa de "qué plataforma
          uso" a "qué necesito resolver".

          Las tarjetas son opacas, así que su texto conserva el contraste que
          ya tenía. El que vive sobre la fotografía es el de los encabezados
          de sección, y para eso está la marquesina: una banda de azul que
          entra desde el borde y se disuelve antes de la mitad. El detalle,
          con los números medidos, está en el bloque 05-bis de main.css.

          Alt vacío en todas, igual que en FondoFotos: acá la ciudad es el
          fondo de una sección de trámites. Describir el atardecer en medio
          de "Servicios por temática" sería ruido para quien usa lector de
          pantalla; las descripciones completas viven en FOTOS_HERO, donde
          sí informan. */}
      <div className="telon">
        <div className="telon__fondo">
          <TelonFotos fotos={fotosTelon} />
        </div>

        <div className="telon__contenido">
        {/* C.1. Cómo moverte por la ciudad -------------------------------- */}
        {/* El agujero más grande que mostró el log del servidor. Medido el lunes
            14/09/2026, día hábil completo y sin bots: colectivos 161 visitas
            diarias, SUBE 59, registros del transporte individual 44, SUBEM 37.
            Son 301 visitas por día de información de transporte que el portal no
            enlazaba desde ningún lado: se llegaba sólo por buscador o por la URL
            directa. Para comparar, los tres botones que la portada sí mostraba
            —historia, circuitos y lugares de interés— suman 107. */}
        <section className="seccion" aria-labelledby="titulo-transporte">
          <div className="contenedor">
            <div className="seccion__cabecera">
              <div>
                <p className="seccion__kicker">Transporte y movilidad</p>
                <h2 id="titulo-transporte">Cómo moverte por la ciudad</h2>
                <p>Los recorridos, la tarjeta y los trámites del transporte público.</p>
              </div>
              <Link className="boton boton--blanco" href={`/tramites/${CATEGORIA_TRANSPORTE}`}>
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

        {/* C.2. Servicios por temática -------------------------------------
            Era una grilla de catorce tarjetas con ícono y bajada, y ocupaba
            3.558px en teléfono: cuatro pantallas y media, la sección más alta
            de la portada. Las catorce categorías juntas suman 425 visitas
            diarias; licencia de conducir, sola, junta 831. O sea que lo más
            grande de la página era lo que menos se usaba.

            Ahora es lo que siempre fue: un índice. Las categorías siguen todas
            acá y a un toque de distancia —no se escondió ninguna—, pero como
            renglones y no como tarjetas destacadas. Baja de 3.558 a unos 620px
            en teléfono sin sacar un solo destino.

            Van sin la bajada de cada categoría a propósito: el título dice a
            dónde va —"Gestión Tributaria y Comercial", "Educación y
            Formación"— y la bajada del CMS repite lo mismo con más palabras. */}
        <section className="seccion" aria-labelledby="titulo-servicios">
          <div className="contenedor">
            <div className="seccion__cabecera">
              <div>
                <p className="seccion__kicker">Trámites y servicios</p>
                <h2 id="titulo-servicios">Servicios por temática</h2>
                <p>Elegí una categoría para ver los trámites que incluye y cómo hacerlos.</p>
              </div>
              {/* Acá había un botón a la Guía de Trámites, y era el sexto
                  destino repetido de la portada: la Guía ya tiene su tarjeta en
                  "Sistemas del municipio", mil píxeles más arriba, que es su
                  lugar —esa sección es justamente la de las plataformas
                  externas— y además se ve antes. */}
            </div>

            <ul className="indice">
              {categoriasDelIndice.map((categoria) => (
                <li key={categoria.id}>
                  <Link href={`/tramites/${categoria.id}`}>
                    <Icono nombre={iconoDesdeFontAwesome(categoria.icono)} tamano={20} />
                    <span>{categoria.titulo}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* C.3. Campañas y accesos ----------------------------------------- */}
        {/* Campañas que administra el municipio desde Voyager. Van después de los
            servicios: el trabajo principal del portal es encontrar un trámite,
            y esto es comunicación con fecha de vencimiento. Comparten el telón
            con los servicios porque son el mismo tramo de la portada. */}
        <Banners banners={bannersSinRepetir} />
        </div>
      </div>

      {/* D. Transparencia y participación --------------------------------- */}
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
                <Link href={`/tramites/${CATEGORIA_TRANSPARENCIA}`}>
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

      {/* E. Conocé la ciudad --------------------------------------------- */}
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

          {/* Las galerías, como índice y no como grilla de tarjetas.
              Ocupaban 946px en teléfono —el 63% de esta sección— para nueve
              visitas diarias en todo el sitio, que es el número más chico de
              todo el log. Y la ironía es que eran tarjetas de una sección de
              IMÁGENES que no mostraban ninguna imagen: un ícono genérico, el
              nombre y el conteo.

              Las fotos de esta sección no se tocan: son el fondo, que es
              justamente lo que se pidió que se viera más y por lo que el velo
              bajó de 0,92 a 0,46. Lo que se achica es el texto de arriba. */}
          {galerias.length > 0 && (
            <ul className="indice">
              {galerias.map((galeria) => (
                <li key={galeria.id}>
                  <Link href={`/galeria/${galeria.id}`}>
                    <Icono nombre="imagen" tamano={20} />
                    <span>{galeria.nombre ?? "Galería de imágenes"}</span>{" "}
                    {/* El espacio explícito no es decorativo: sin él, el nombre
                        y el conteo quedan pegados en el árbol de accesibilidad
                        —"Fotos de SMT14 fotos"— porque la separación visual la
                        hace un margin-left:auto, que el lector de pantalla no
                        ve. JSX descarta el salto de línea entre etiquetas. */}
                    <small>
                      {galeria.fotos} {galeria.fotos === 1 ? "foto" : "fotos"}
                    </small>
                  </Link>
                </li>
              ))}
            </ul>
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
    </>
  );
}
