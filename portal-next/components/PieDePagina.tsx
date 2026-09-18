import Link from "next/link";
import Image from "next/image";

import { Icono } from "./Iconos";
import { PlegarPie } from "./PlegarPie";
import { CONTACTO, ICONO_RED, PIE, PIE_LEGAL, REDES, type EnlacePie } from "@/lib/navegacion";
import { getEmergencias } from "@/lib/api";

/**
 * Un enlace del pie. Los que salen del portal llevan `data-externo`, que el
 * CSS convierte en una flecha, y el aviso de pestaña nueva para lector de
 * pantalla.
 */
function EnlaceDelPie({ enlace }: { enlace: EnlacePie }) {
  if (enlace.externo) {
    return (
      <a href={enlace.url} rel="noopener" target="_blank" data-externo>
        {enlace.texto}
        <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
      </a>
    );
  }
  return <Link href={enlace.url}>{enlace.texto}</Link>;
}

/**
 * Una columna del pie.
 *
 * <details> es HTML nativo: es accesible por teclado sin programar nada y los
 * lectores de pantalla lo anuncian como un grupo que se puede expandir.
 *
 * Sin `name`: ese atributo convierte a los <details> en un acordeón exclusivo
 * —abrir uno cierra los demás—, que es un comportamiento razonable en un menú
 * pero no en un directorio, donde alguien puede querer comparar dos columnas.
 */
function ColumnaDelPie({
  titulo,
  enlaces,
  children,
}: {
  titulo: string;
  enlaces?: EnlacePie[];
  children?: React.ReactNode;
}) {
  return (
    <details className="footer__col" open>
      <summary>
        <h2>{titulo}</h2>
      </summary>
      {enlaces ? (
        <ul>
          {enlaces.map((enlace) => (
            <li key={enlace.url + enlace.texto}>
              <EnlaceDelPie enlace={enlace} />
            </li>
          ))}
        </ul>
      ) : null}
      {children}
    </details>
  );
}

export async function PieDePagina() {
  // Los teléfonos de emergencia salen del CMS, no están escritos a mano.
  let emergencias: { id: number; nombre: string | null; numero: string }[] = [];
  try {
    emergencias = await getEmergencias();
  } catch {
    // Si la API no responde, el pie se muestra igual sin ese bloque.
  }

  return (
    <>
      {/* ---- La franja de emergencias ----
          Va AFUERA del pie y antes, no adentro. Dos motivos:

          Uno es el que se pidió: separar. El pie es un azul continuo de 500px
          y los teléfonos quedaban ahí adentro, como una columna más entre
          nueve enlaces de trámites. Con su propia franja clara, la última cosa
          que se ve antes del pie son los números de emergencia.

          El otro es que no tenían por qué estar en el pie. Un pie es
          navegación secundaria; un teléfono de emergencia no es secundario.
          Como región propia con su título, un lector de pantalla la anuncia
          y se puede saltar a ella. */}
      {emergencias.length > 0 ? (
        <section className="franja-emergencias" aria-labelledby="titulo-emergencias">
          <div className="contenedor">
            <h2 id="titulo-emergencias">Emergencias</h2>
            <ul className="franja-emergencias__numeros">
              {emergencias.map((tel) => (
                <li key={tel.id}>
                  <a className="tel-emergencia" href={`tel:${tel.numero}`}>
                    <strong>{tel.numero}</strong> {tel.nombre}
                  </a>
                </li>
              ))}
            </ul>
            <p className="franja-emergencias__extra">
              {CONTACTO.asistenciaPublica.map((tel, i) => (
                <span key={tel}>
                  {i > 0 ? " · " : "Asistencia Pública: "}
                  <a href={`tel:+54381${tel.replace(/\D/g, "").slice(-7)}`}>{tel}</a>
                </span>
              ))}
            </p>
          </div>
        </section>
      ) : null}

    <footer className="footer">
      <div className="contenedor">
        {/* La identidad va afuera de la grilla y sin plegar: el logo, el
            domicilio y el teléfono general son lo primero que alguien busca
            en un pie institucional, y esconderlos detrás de un desplegable
            sería empeorar justamente lo que vinimos a arreglar. */}
        <div className="footer__identidad">
          <div className="footer__logo">
            <Image src="/img/logo-smt-neg.png" alt="Ciudad San Miguel de Tucumán" width={184} height={60} />
          </div>
          <address className="footer__direccion">
            <span>
              <Icono nombre="ubicacion" tamano={16} className="icono-en-linea" />
              {CONTACTO.direccion}
            </span>
            <span>
              <Icono nombre="telefono" tamano={16} className="icono-en-linea" />
              Municipalidad: <a href={`tel:${CONTACTO.telefonoLink}`}>{CONTACTO.telefono}</a>
            </span>
          </address>
          <div className="footer__redes">
            {REDES.map((red) => (
              <a
                key={red.url}
                href={red.url}
                rel="noopener"
                target="_blank"
                aria-label={`${red.titulo} de la Municipalidad (se abre en otra pestaña)`}
              >
                <Icono nombre={ICONO_RED[red.titulo] ?? "externo"} tamano={20} />
              </a>
            ))}
          </div>
        </div>

        <nav className="footer__grid" aria-label="Directorio del portal">
          {PIE.map((columna) => (
            <ColumnaDelPie key={columna.titulo} titulo={columna.titulo} enlaces={columna.enlaces} />
          ))}

        </nav>
        <PlegarPie />

        <div className="footer__legal">
          <span>© {new Date().getFullYear()} Municipalidad de San Miguel de Tucumán — Portal oficial</span>
          <span>
            {PIE_LEGAL.map((enlace, i) => (
              <span key={enlace.url}>
                {i > 0 ? " · " : null}
                <EnlaceDelPie enlace={enlace} />
              </span>
            ))}
          </span>
        </div>
      </div>
    </footer>
    </>
  );
}
