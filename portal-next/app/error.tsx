"use client"; // Los límites de error tienen que ser componentes de cliente.

import { useEffect } from "react";
import Link from "next/link";

/**
 * Límite de error del portal.
 *
 * Al vecino no se le muestra el mensaje técnico ni el stack: solo qué pasó y
 * cómo seguir. El detalle queda en la consola del navegador y, del lado del
 * servidor, en los registros que se identifican con el mismo `digest`.
 *
 * En Next 16 el componente recibe `retry` además de `reset`: `retry()` vuelve a
 * pedir los datos y a renderizar el segmento, que es lo que hace falta cuando
 * la falla vino de la API; `reset()` solo limpia el estado del límite. Se usa
 * `retry` cuando está disponible y `reset` como respaldo.
 */
export default function ErrorDelPortal({
  error,
  reset,
  retry,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  retry?: () => void;
}) {
  useEffect(() => {
    // Para diagnóstico: no se muestra en pantalla.
    console.error(error);
  }, [error]);

  const reintentar = retry ?? reset;

  return (
    <div className="pagina-error">
      <div>
        <h1>No pudimos mostrar esta página</h1>
        <p style={{ }}>
          Hubo un problema al cargar el contenido. Puede ser algo momentáneo: probá de nuevo en unos
          segundos. Si vuelve a pasar, entrá desde el inicio del portal.
        </p>

        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: "var(--sp-3)",
            justifyContent: "center",
          }}
        >
          <button className="boton boton--primario" type="button" onClick={() => reintentar()}>
            Reintentar
          </button>
          <Link className="boton boton--secundario" href="/">
            Ir al inicio
          </Link>
        </div>

        {error.digest ? (
          <p
            style={{
              marginTop: "var(--sp-6)",
              fontSize: "var(--fs-xs)",
              color: "var(--c-ink-muted)",
            }}
          >
            Código de referencia: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}
