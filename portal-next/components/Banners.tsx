import { CarruselBanners } from "./CarruselBanners";
import type { Banner } from "@/lib/tipos";

/**
 * Banners de campaña que administra el municipio desde Voyager.
 *
 * Son piezas gráficas con el texto incrustado en la imagen, así que nunca se
 * recortan: cada una entra completa en su cajón.
 *
 * Medidos los quince que publica el CMS, vienen en siete proporciones
 * distintas: 960x960 (1:1) la de la radio, 970x90 (10,78:1) la del Portal de
 * Datos, y cinco medidas más en el medio. En la grilla de dos columnas que
 * había antes, cada fila quedaba de una altura distinta y el bloque se veía
 * desprolijo. Van a un carrusel donde todos comparten cajón.
 *
 * El campo `responsive` del CMS es la variante para pantallas angostas: el
 * sitio actual la usa con `d-none d-lg-block` / `d-block d-lg-none`. Acá se
 * resuelve con <picture>, que es el equivalente correcto.
 *
 * No se usa next/image a propósito: son imágenes de ancho variable y algunas
 * son GIF animados, que el optimizador no convierte. Van con lazy loading y
 * dimensiones declaradas para no provocar saltos de maquetación.
 */

/** Sin `link` el banner es informativo y no se envuelve en un enlace. */
function esExterno(url: string): boolean {
  return /^https?:\/\//i.test(url) && !url.startsWith("https://smt.gob.ar");
}

function Pieza({ banner }: { banner: Banner }) {
  const imagen = typeof banner.image === "string" ? banner.image : null;
  if (!imagen) return null;

  const movil = typeof banner.responsive === "string" && banner.responsive.trim() !== ""
    ? banner.responsive
    : null;
  const nombre = typeof banner.name === "string" ? banner.name.trim() : "";
  const enlace = typeof banner.link === "string" && banner.link.trim() !== "" ? banner.link.trim() : null;

  const figura = (
    <picture>
      {movil && <source media="(max-width: 62rem)" srcSet={movil} />}
      <img src={imagen} alt={nombre} loading="lazy" decoding="async" />
    </picture>
  );

  if (!enlace) {
    return <div className="banner">{figura}</div>;
  }

  const externo = esExterno(enlace);
  // El tipo Banner tiene index signature, asi que target llega como unknown.
  const nuevaPestana = externo || Boolean(banner.target);
  return (
    <a
      className="banner"
      href={enlace}
      {...(nuevaPestana ? { rel: "noopener", target: "_blank" } : {})}
    >
      {figura}
      {nuevaPestana && (
        <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
      )}
    </a>
  );
}

export function Banners({ banners }: { banners: Banner[] }) {
  // Solo los publicados, en el orden que definió el municipio. Los que no
  // tienen orden van al final.
  const visibles = banners
    .filter((b) => Number(b.estado) === 1)
    .filter((b) => ["inicio", "fin"].includes(String(b.posicion)))
    .sort((a, b) => (Number(a.orden) || 9999) - (Number(b.orden) || 9999));

  if (visibles.length === 0) return null;

  return (
    <section className="seccion" aria-labelledby="titulo-campanas">
      <div className="contenedor">
        <div className="seccion__cabecera">
          <div>
            <p className="seccion__kicker">Campañas y accesos</p>
            <h2 id="titulo-campanas">Lo que está pasando en la ciudad</h2>
          </div>
        </div>
        <CarruselBanners cantidad={visibles.length}>
          {visibles.map((b) => (
            <Pieza key={b.id} banner={b} />
          ))}
        </CarruselBanners>
      </div>
    </section>
  );
}
