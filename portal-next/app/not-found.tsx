import Link from "next/link";

import { Icono } from "@/components/Iconos";

/**
 * 404 del portal.
 *
 * Además de responder a notFound(), esta misma pantalla atiende cualquier URL
 * que no corresponda a una ruta del sitio. Next inyecta solo el meta robots
 * noindex en las respuestas 404, así que acá no hace falta declararlo.
 */

/** La Guía de Trámites es un sistema aparte del municipio: se enlaza, no se replica. */
const GUIA_TRAMITES = "https://guiadetramites.smt.gob.ar";

export default function NoEncontrada() {
  return (
    <div className="pagina-error">
      <div>
        <p className="codigo">404</p>
        <h1>No encontramos esta página</h1>
        <p style={{ }}>
          Puede que la dirección esté mal escrita, que la página haya cambiado de lugar o que ya no
          esté publicada. Desde acá podés volver al inicio o ir directamente a los trámites.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--sp-3)",
            justifyContent: "center",
          }}
        >
          <Link className="boton boton--primario" href="/">
            Ir al inicio
          </Link>
          <Link className="boton boton--secundario" href="/tramites">
            Ver trámites y servicios
          </Link>
          <a className="boton boton--secundario" href={GUIA_TRAMITES} rel="noopener" target="_blank">
            Guía de Trámites
            <Icono nombre="externo" tamano={16} />
            <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
          </a>
        </div>
      </div>
    </div>
  );
}
