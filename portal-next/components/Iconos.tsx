/**
 * Sprite de iconos del portal: una sola familia de trazo, 24x24.
 *
 * Reemplaza a Font Awesome Pro que carga el sitio actual — son unos pocos KB
 * en vez de varios cientos, y sin dudas de licencia.
 *
 * `<SpriteIconos />` se renderiza una vez en el layout; después se usa
 * `<Icono nombre="salud" />` en cualquier lado.
 */

const T = {
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 2,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SpriteIconos() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ display: "none" }}>
      <defs>
        <symbol id="i-buscar" viewBox="0 0 24 24" {...T}>
          <circle cx="10.5" cy="10.5" r="7" />
          <path d="m21 21-5.2-5.2" />
        </symbol>
        <symbol id="i-menu" viewBox="0 0 24 24" {...T}>
          <path d="M4 6h16M4 12h16M4 18h16" />
        </symbol>
        <symbol id="i-cerrar" viewBox="0 0 24 24" {...T}>
          <path d="M18 6 6 18M6 6l12 12" />
        </symbol>
        <symbol id="i-chevron" viewBox="0 0 24 24" {...T}>
          <path d="m6 9 6 6 6-6" />
        </symbol>
        <symbol id="i-flecha" viewBox="0 0 24 24" {...T}>
          <path d="M5 12h14m-6-6 6 6-6 6" />
        </symbol>
        <symbol id="i-externo" viewBox="0 0 24 24" {...T}>
          <path d="M11 5H6a2 2 0 0 0-2 2v11a2 2 0 0 0 2 2h11a2 2 0 0 0 2-2v-5" />
          <path d="M14 4h6v6" />
          <path d="M20 4 10 14" />
        </symbol>

        <symbol id="i-tramites" viewBox="0 0 24 24" {...T}>
          <path d="M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2" />
          <rect x="9" y="3" width="6" height="4" rx="1" />
          <path d="M9 12h6m-6 4h4" />
        </symbol>
        <symbol id="i-cidituc" viewBox="0 0 24 24" {...T}>
          <rect x="7" y="2.5" width="10" height="19" rx="2.5" />
          <path d="M11 18.5h2" />
        </symbol>
        <symbol id="i-pagos" viewBox="0 0 24 24" {...T}>
          <rect x="3" y="6" width="18" height="13" rx="2" />
          <path d="M3 10.5h18" />
          <path d="M7 15h4" />
        </symbol>
        <symbol id="i-multas" viewBox="0 0 24 24" {...T}>
          <path d="M14 3v5h5" />
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M12 11v4m0 3v.01" />
        </symbol>
        <symbol id="i-comercio" viewBox="0 0 24 24" {...T}>
          <path d="M4 9 5.5 4h13L20 9" />
          <path d="M4 9a2.7 2.7 0 0 0 5.33 0A2.7 2.7 0 0 0 14.66 9 2.7 2.7 0 0 0 20 9" />
          <path d="M5 11.5V20h14v-8.5" />
          <path d="M9 20v-5h6v5" />
        </symbol>
        <symbol id="i-salud" viewBox="0 0 24 24" {...T}>
          <path d="M19.5 13.6 12 21l-7.5-7.4a5 5 0 1 1 7.5-6.6 5 5 0 1 1 7.5 6.6" />
          <path d="M9.5 12h2l1-2 1.5 4 1-2h2" />
        </symbol>
        <symbol id="i-ambiente" viewBox="0 0 24 24" {...T}>
          <path d="M6 18c-1.5-6 2-12 12-13 .5 9-3 13.5-9 13.5-1 0-2-.2-3-.5z" />
          <path d="M6 18c2-4 5-7 9-9" />
          <path d="M6 18l-2 3" />
        </symbol>
        <symbol id="i-cultura" viewBox="0 0 24 24" {...T}>
          <path d="m4 8 8-4 8 4" />
          <path d="M4 8v1h16V8" />
          <path d="M6 9v7m4-7v7m4-7v7m4-7v7" />
          <path d="M4 19h16v-2.5H4z" />
        </symbol>
        <symbol id="i-seguridad" viewBox="0 0 24 24" {...T}>
          <path d="M12 3 5 6v5c0 4.5 3 8.5 7 10 4-1.5 7-5.5 7-10V6z" />
          <path d="m9.5 12 2 2 3.5-4" />
        </symbol>
        <symbol id="i-educacion" viewBox="0 0 24 24" {...T}>
          <path d="m22 9-10-4L2 9l10 4z" />
          <path d="M6 11.5V16c0 1.5 2.7 3 6 3s6-1.5 6-3v-4.5" />
          <path d="M22 9v5" />
        </symbol>
        <symbol id="i-transporte" viewBox="0 0 24 24" {...T}>
          <path d="M4 16V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v10" />
          <path d="M4 16h16v2a1 1 0 0 1-1 1h-1.5M4 16v2a1 1 0 0 0 1 1h1.5" />
          <path d="M4 11h16" />
          <circle cx="8" cy="19" r="1.6" />
          <circle cx="16" cy="19" r="1.6" />
        </symbol>
        <symbol id="i-biblioteca" viewBox="0 0 24 24" {...T}>
          <path d="M12 6a4 4 0 0 0-4-2H4v15h5a3 3 0 0 1 3 2 3 3 0 0 1 3-2h5V4h-4a4 4 0 0 0-4 2z" />
          <path d="M12 6v15" />
        </symbol>
        <symbol id="i-transparencia" viewBox="0 0 24 24" {...T}>
          <circle cx="12" cy="12" r="3.2" />
          <path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" />
        </symbol>
        <symbol id="i-normativa" viewBox="0 0 24 24" {...T}>
          <path d="M12 4v16m0-16 7 3m-7-3L5 7" />
          <path d="M3.5 13a3 3 0 0 0 6 0L6.5 7zm11 0a3 3 0 0 0 6 0L17.5 7z" />
          <path d="M8 20h8" />
        </symbol>
        <symbol id="i-actividades" viewBox="0 0 24 24" {...T}>
          <rect x="4" y="5" width="16" height="16" rx="2" />
          <path d="M16 3v4M8 3v4m-4 4h16" />
          <path d="m10.5 16 1.5 1.5 3-3.5" />
        </symbol>
        <symbol id="i-patrimonio" viewBox="0 0 24 24" {...T}>
          <path d="M3 21h18M5 21V8l7-5 7 5v13" />
          <path d="M9 21v-6a3 3 0 0 1 6 0v6" />
          <path d="M12 8v.01" />
        </symbol>
        <symbol id="i-justicia" viewBox="0 0 24 24" {...T}>
          <path d="m14 6 6 6m-9-3 6-6m-8.5 8.5L3 17c-.5 1.5.5 3 2 3h0c1.5.5 3-.5 3-2l5.5-5.5" />
          <path d="m13 7 4 4" />
        </symbol>
        <symbol id="i-catastro" viewBox="0 0 24 24" {...T}>
          <path d="m4 7 5-2 6 2 5-2v14l-5 2-6-2-5 2z" />
          <path d="M9 5v14m6-12v14" />
        </symbol>

        <symbol id="i-telefono" viewBox="0 0 24 24" {...T}>
          <path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2" />
        </symbol>
        <symbol id="i-ubicacion" viewBox="0 0 24 24" {...T}>
          <path d="M12 21s-7-5.5-7-11a7 7 0 0 1 14 0c0 5.5-7 11-7 11z" />
          <circle cx="12" cy="10" r="2.5" />
        </symbol>
        <symbol id="i-correo" viewBox="0 0 24 24" {...T}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <path d="m3 7 9 6 9-6" />
        </symbol>
        <symbol id="i-documento" viewBox="0 0 24 24" {...T}>
          <path d="M14 3v5h5" />
          <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
          <path d="M9 13h6m-6 4h6" />
        </symbol>
        <symbol id="i-descarga" viewBox="0 0 24 24" {...T}>
          <path d="M12 4v11m0 0 4-4m-4 4-4-4" />
          <path d="M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
        </symbol>
        <symbol id="i-imagen" viewBox="0 0 24 24" {...T}>
          <rect x="3" y="5" width="18" height="14" rx="2" />
          <circle cx="8.5" cy="10" r="1.5" />
          <path d="m5 17 4.5-4.5 3 3L16 12l3 3" />
        </symbol>

        <symbol id="i-facebook" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M13.5 21v-7h2.4l.4-3h-2.8V9.1c0-.9.3-1.5 1.6-1.5h1.3V4.9c-.2 0-1-.1-1.9-.1-1.9 0-3.2 1.2-3.2 3.3V11H9v3h2.3v7z" />
        </symbol>
        <symbol id="i-instagram" viewBox="0 0 24 24" {...T}>
          <rect x="4" y="4" width="16" height="16" rx="4" />
          <circle cx="12" cy="12" r="3.5" />
          <path d="M16.7 7.3v.01" />
        </symbol>
        <symbol id="i-x" viewBox="0 0 24 24" fill="currentColor" stroke="none">
          <path d="M17.3 3H20l-6.6 7.6L21 21h-5.9l-4.6-6-5.3 6H2.5l7-8.1L2.5 3h6l4.2 5.5zm-1 16.2h1.6L7.6 4.7H5.9z" />
        </symbol>
        <symbol id="i-youtube" viewBox="0 0 24 24" {...T}>
          <rect x="3" y="6" width="18" height="12" rx="3" />
          <path d="m10.5 9.5 4.5 2.5-4.5 2.5z" fill="currentColor" stroke="none" />
        </symbol>
      </defs>
    </svg>
  );
}

export function Icono({
  nombre,
  tamano = 24,
  className,
}: {
  nombre: string;
  tamano?: number;
  className?: string;
}) {
  return (
    <svg width={tamano} height={tamano} aria-hidden="true" className={className}>
      <use href={`#i-${nombre}`} />
    </svg>
  );
}
