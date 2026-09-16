import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";

import { Migas } from "@/components/Migas";
import { getGaleria, getGalerias } from "@/lib/api";
import { medirImagenes } from "@/lib/medidas";
import type { Foto, Galeria } from "@/lib/tipos";

/** Los contenidos del CMS cambian poco: se revalidan cada cinco minutos. */
export const revalidate = 300;

/** Los ids de galería son numéricos: cualquier otra cosa es una URL inválida. */
function idValido(id: string): number | null {
  return /^\d+$/.test(id) ? Number(id) : null;
}

/** El nombre puede venir vacío del CMS: el id mantiene identificable la galería. */
function nombreDe(galeria: { id: number; nombre: string | null }): string {
  return galeria.nombre?.trim() || `Galería ${galeria.id}`;
}

function contarFotos(cantidad: number): string {
  return cantidad === 1 ? "1 foto" : `${cantidad} fotos`;
}

/**
 * Foto lista para mostrar.
 *
 * `miniatura` es la versión recortada que se ve en la grilla e `imagen` la
 * original, que se abre al hacer clic. Cualquiera de las dos puede faltar: si
 * falta la miniatura se muestra la original, y si no hay ningún archivo la
 * foto se descarta, porque no habría nada que pintar.
 */
type FotoLista = {
  id: number;
  src: string;
  original: string | null;
  descripcion: string | null;
  /** Proporción real de la foto, para que no haya que recortarla. */
  proporcion: number;
};

/**
 * Proporción de reserva cuando una foto no se puede medir. Es la que tenían
 * todas hasta ahora, y como reserva sirve: lo que no sirve es imponérsela a
 * las 38.
 */
const PROPORCION_RESERVA = 4 / 3;

/**
 * Prepara las fotos con su proporción real.
 *
 * Antes iban todas metidas a la fuerza en una caja de 4/3 con objectFit cover,
 * así que a una foto vertical se le comían el cielo y el piso: en la galería
 * de Parques se veía una tajada de la flor y del monumento, no la foto. Con la
 * proporción real, cada una entra entera y la grilla queda despareja abajo,
 * que es como se ve un mosaico de fotos de verdad.
 *
 * La API no publica el tamaño —la base guarda la ruta del archivo y nada
 * más—, así que hay que leer la cabecera de cada archivo. Se hace de a tandas
 * de tres porque el servidor municipal tarda hasta 6,7 segundos por foto y con
 * todas a la vez se ahoga. Corre al generar la página y queda en caché un día.
 */
async function prepararFotos(fotos: Foto[]): Promise<FotoLista[]> {
  // La miniatura del CMS NO se usa: Voyager las genera todas a 255x160 con el
  // recorte ya hecho. Son dos problemas de una: la foto vertical llega
  // decapitada de fábrica, y 255px de ancho en una tarjeta de 256px se ve
  // borrosa en cualquier pantalla de densidad doble. Se parte del original y
  // next/image entrega el tamaño que corresponda a cada pantalla.
  const utiles = fotos.flatMap((foto) => {
    const src = foto.imagen ?? foto.miniatura;
    return src ? [{ foto, src }] : [];
  });

  const medidas = await medirImagenes(utiles.map((x) => x.src));

  return utiles.map(({ foto, src }, i) => {
    const m = medidas[i];
    return {
      id: foto.id,
      src,
      original: foto.imagen,
      descripcion: foto.descripcion?.trim() || null,
      proporcion: m && m.alto > 0 ? m.ancho / m.alto : PROPORCION_RESERVA,
    };
  });
}

/** Descripción de metadata armada con el contenido real de la galería. */
function describir(galeria: Galeria): string {
  const nombre = nombreDe(galeria);
  const base = `${nombre}: ${contarFotos(galeria.fotos.length)} de San Miguel de Tucumán publicadas por el municipio.`;

  const pies = [
    ...new Set(
      galeria.fotos.flatMap((foto) => (foto.descripcion?.trim() ? [foto.descripcion.trim()] : [])),
    ),
  ].slice(0, 3);

  return pies.length > 0 ? `${base} Incluye ${pies.join(", ")}.` : base;
}

export async function generateStaticParams() {
  const galerias = await getGalerias();
  return galerias.map((galeria) => ({ id: String(galeria.id) }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const numero = idValido(id);
  const galeria = numero === null ? null : await getGaleria(numero);

  if (!galeria) return { title: "Galería no encontrada" };

  return {
    title: nombreDe(galeria),
    description: describir(galeria),
    alternates: { canonical: `/galeria/${galeria.id}` },
  };
}

export default async function PaginaGaleria({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const numero = idValido(id);

  // El listado completo se usa para la barra de filtros: se pide en paralelo
  // con la galería para no encadenar dos esperas.
  const [galeria, galerias] = await Promise.all([
    numero === null ? null : getGaleria(numero),
    getGalerias(),
  ]);

  if (!galeria) notFound();

  const nombre = nombreDe(galeria);
  const fotos = await prepararFotos(galeria.fotos);

  return (
    <>
      <div className="cabecera-pagina">
        <Migas
          migas={[
            { texto: "Inicio", url: "/" },
            { texto: "Galería de imágenes", url: "/galeria" },
            { texto: nombre },
          ]}
        />
        <div className="contenedor">
          <h1>{nombre}</h1>
          <p className="bajada">
            {fotos.length > 0
              ? `${contarFotos(fotos.length)} de San Miguel de Tucumán. Tocá una imagen para verla en tamaño completo.`
              : "Esta galería todavía no tiene fotos publicadas."}
          </p>
        </div>
      </div>

      <section className="seccion">
        <div className="contenedor">
          {galerias.length > 1 ? (
            <nav
              aria-label="Galerías de imágenes"
              className="filtros"
              style={{ marginBottom: "var(--sp-6)" }}
            >
              {galerias.map((otra) => {
                const actual = otra.id === galeria.id;

                return (
                  <Link
                    aria-current={actual ? "page" : undefined}
                    className={actual ? "filtro filtro--activo" : "filtro"}
                    href={`/galeria/${otra.id}`}
                    key={otra.id}
                  >
                    {nombreDe(otra)}
                  </Link>
                );
              })}
            </nav>
          ) : null}

          {fotos.length === 0 ? (
            <div className="estado-vacio">
              <h2>Todavía no hay fotos cargadas</h2>
              <p>
                Esta galería figura publicada, pero aún no tiene imágenes. Podés ver{" "}
                <Link href="/galeria">las demás galerías del portal</Link>.
              </p>
            </div>
          ) : (
            <div className="galeria">
              {fotos.map((foto) => (
                <figure key={foto.id} style={{ aspectRatio: foto.proporcion }}>
                  {/* El pie describe la foto: cuando existe, esa misma
                      descripción es el texto alternativo de la imagen. */}
                  <Image
                    alt={foto.descripcion ?? ""}
                    src={foto.src}
                    fill
                    sizes="(min-width: 76rem) 24rem, (min-width: 60rem) 31vw, (min-width: 40rem) 46vw, calc(100vw - 2.5rem)"
                    style={{ objectFit: "cover" }}
                  />

                  {foto.original ? (
                    /* El enlace cubre toda la figura, por encima de la imagen y
                       del pie, para que se pueda tocar la foto entera. */
                    <a
                      href={foto.original}
                      rel="noopener"
                      style={{ position: "absolute", inset: 0, zIndex: 1 }}
                      target="_blank"
                    >
                      <span className="visualmente-oculto">
                        {foto.descripcion
                          ? `Ver ${foto.descripcion} en tamaño completo`
                          : "Ver la imagen en tamaño completo"}{" "}
                        (se abre en otra pestaña)
                      </span>
                    </a>
                  ) : null}

                  {foto.descripcion ? <figcaption>{foto.descripcion}</figcaption> : null}
                </figure>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
