import Link from "next/link";
import Image from "next/image";

import { Icono } from "./Iconos";
import { CONTACTO, ICONO_RED, REDES, SISTEMAS } from "@/lib/navegacion";
import { getEmergencias } from "@/lib/api";

export async function PieDePagina() {
  // Los teléfonos de emergencia salen del CMS, no están escritos a mano.
  let emergencias: { id: number; nombre: string | null; numero: string }[] = [];
  try {
    emergencias = await getEmergencias();
  } catch {
    // Si la API no responde, el pie se muestra igual sin ese bloque.
  }

  return (
    <footer className="footer">
      <div className="contenedor">
        <div className="footer__grid">
          <div>
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

          <nav aria-label="Trámites y servicios">
            <h2>Trámites y servicios</h2>
            <ul>
              <li><a href="https://guiadetramites.smt.gob.ar" rel="noopener" data-externo>Guía de Trámites</a></li>
              <li><Link href="/tramites/1">Gestión Tributaria</Link></li>
              <li><a href="https://www.dimsmt.gob.ar/" rel="noopener" data-externo>Ingresos Municipales</a></li>
              <li><Link href="/tramites">Todas las categorías</Link></li>
              <li><Link href="/gobierno">Estructura de gobierno</Link></li>
              <li><Link href="/galeria">Galería de imágenes</Link></li>
            </ul>
          </nav>

          <nav aria-label="Herramientas municipales">
            <h2>Herramientas</h2>
            <ul>
              {SISTEMAS.slice(0, 8).map((s) => (
                <li key={s.url}>
                  <a href={s.url} rel="noopener" data-externo>{s.titulo}</a>
                </li>
              ))}
            </ul>
          </nav>

          <div>
            <h2>Emergencias</h2>
            <div className="footer__emergencias">
              {emergencias.map((tel) => (
                <a key={tel.id} className="tel-emergencia" href={`tel:${tel.numero}`}>
                  <strong>{tel.numero}</strong> {tel.nombre}
                </a>
              ))}
            </div>
            <h2 style={{ marginTop: "var(--sp-5)" }}>Asistencia Pública</h2>
            <ul>
              {CONTACTO.asistenciaPublica.map((tel) => (
                <li key={tel}>
                  <a href={`tel:+54381${tel.replace(/\D/g, "").slice(-7)}`}>{tel}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="footer__legal">
          <span>© {new Date().getFullYear()} Municipalidad de San Miguel de Tucumán — Portal oficial</span>
          <span>
            <a href="https://comunicacionsmt.gob.ar/" rel="noopener" data-externo>Portal de noticias</a>
            {" · "}
            <a href="https://smtendatos.gob.ar/" rel="noopener" data-externo>SMT en Datos</a>
          </span>
        </div>
      </div>
    </footer>
  );
}
