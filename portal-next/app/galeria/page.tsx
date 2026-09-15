import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { BandaSeccion } from "@/components/BandaSeccion";
import { Migas } from "@/components/Migas";
import { getGaleria, getGalerias } from "@/lib/api";
import type { Foto, GaleriaResumen } from "@/lib/tipos";

/** Los contenidos del CMS cambian poco: se revalidan cada cinco minutos. */
export const revalidate = 300;

export const metadata: Metadata = {
  title: "Galería de imágenes",
  description:
    "Las galerías de fotos publicadas por la Municipalidad de San Miguel de Tucumán: la ciudad, sus parques y plazas, el Teatro Municipal y otros espacios públicos.",
  alternates: { canonical: "/galeria" },
};

/** El nombre puede venir vacío del CMS: el id mantiene identificable la galería. */
function nombreDe(galeria: { id: number; nombre: string | null }): string {
  return galeria.nombre?.trim() || `Galería ${galeria.id}`;
}

function contarFotos(cantidad: number): string {
  return cantidad === 1 ? "1 foto" : `${cantidad} fotos`;
}

/**
 * Portada de una galería.
 *
 * El listado no trae ninguna imagen: `getGalerias()` solo devuelve el nombre y
 * la cantidad de fotos. Para ilustrar cada tarjeta hay que entrar a la galería
 * y quedarse con la primera foto. Se prefiere la miniatura, que es la versión
 * recortada que el CMS genera para mostrar en grilla.
 *
 * Si la galería no responde, no tiene fotos, o la primera no tiene archivo, se
 * devuelve null y la tarjeta va sin imagen: no se inventa una portada ajena.
 */
function portadaDe(fotos: Foto[] | undefined): string | null {
  const primera = fotos?.[0];
  return primera?.miniatura ?? primera?.imagen ?? null;
}

export default async function PaginaGalerias() {
  const galerias = await getGalerias();

  // Las portadas se piden todas juntas: son cinco galerías y esperar una atrás
  // de otra multiplicaría por cinco el tiempo de la página.
  const detalles = await Promise.all(galerias.map((galeria) => getGaleria(galeria.id)));

  const conPortada: { galeria: GaleriaResumen; portada: string | null }[] = galerias.map(
    (galeria, indice) => ({ galeria, portada: portadaDe(detalles[indice]?.fotos) }),
  );

  return (
    <>
      <BandaSeccion seccion="galeria" />

      <div className="cabecera-pagina">
        <Migas migas={[{ texto: "Inicio", url: "/" }, { texto: "Galería de imágenes" }]} />
        <div className="contenedor">
          <h1>Galería de imágenes</h1>
          <p className="bajada">
            Fotografías de San Miguel de Tucumán publicadas por el municipio. Entrá a cada galería
            para ver todas sus imágenes.
          </p>
        </div>
      </div>

      <section className="seccion">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">La ciudad en imágenes</p>
              <h2>Galerías publicadas</h2>
            </div>
          </div>

          {conPortada.length === 0 ? (
            <div className="estado-vacio">
              <h3>No hay galerías publicadas</h3>
              <p>
                Por el momento no hay imágenes cargadas. Podés recorrer las otras secciones del
                portal desde el menú principal.
              </p>
            </div>
          ) : (
            <div className="grilla grilla--3">
              {conPortada.map(({ galeria, portada }) => (
                <article className="tarjeta-media" key={galeria.id}>
                  {portada ? (
                    <div className="tarjeta-media__img">
                      {/* Foto de muestra: la tarjeta ya se anuncia con el nombre
                          de la galería, así que acá la imagen es decorativa. */}
                      <Image
                        src={portada}
                        alt=""
                        width={640}
                        height={400}
                        sizes="(min-width: 76rem) 24rem, (min-width: 56rem) 31vw, (min-width: 40rem) 46vw, calc(100vw - 2.5rem)"
                        style={{ objectFit: "cover" }}
                      />
                    </div>
                  ) : null}

                  <div className="tarjeta-media__cuerpo">
                    <h3>
                      <Link href={`/galeria/${galeria.id}`}>{nombreDe(galeria)}</Link>
                    </h3>
                    <p className="tarjeta-media__meta">
                      {galeria.fotos > 0 ? contarFotos(galeria.fotos) : "Sin fotos cargadas"}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
