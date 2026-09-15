/**
 * Navegación y accesos del portal.
 *
 * Las URLs salen del relevamiento del sitio real (14/09/2026) y se conservan
 * exactas, incluidas sus rarezas. Los destinos externos (CiDiTuc, DIM,
 * Guía de Trámites, etc.) siguen siendo enlaces salientes: esos sistemas no
 * se tocan.
 *
 * En producción esto debería leerse del CMS (tabla menu_items de Voyager),
 * para que el equipo municipal lo siga administrando. Está acá como
 * configuración mientras tanto.
 */

export type ItemNav = {
  titulo: string;
  url: string;
  externo?: boolean;
};

export type SeccionNav = {
  titulo: string;
  url?: string;
  externo?: boolean;
  hijos?: ItemNav[];
};

export const NAV: SeccionNav[] = [
  {
    titulo: "Trámites y servicios",
    hijos: [
      { titulo: "Guía de Trámites Municipales", url: "https://guiadetramites.smt.gob.ar", externo: true },
      { titulo: "Gestión Tributaria y Comercial", url: "/tramites/1" },
      { titulo: "Medio Ambiente y Espacios Públicos", url: "/tramites/2" },
      { titulo: "Prevención y Servicios de Salud", url: "/tramites/4" },
      { titulo: "Seguridad Ciudadana y Emergencias", url: "/tramites/5" },
      { titulo: "Transporte y Movilidad", url: "/tramites/7" },
      { titulo: "Ver todas las categorías", url: "/tramites" },
    ],
  },
  {
    titulo: "Gobierno",
    hijos: [
      { titulo: "Estructura de Gobierno", url: "/gobierno" },
      { titulo: "Normativa", url: "/tramites/11" },
      { titulo: "Justicia Municipal", url: "/tramites/16" },
      { titulo: "Licitaciones", url: "https://licitaciones.smt.gob.ar/", externo: true },
    ],
  },
  {
    titulo: "La ciudad",
    hijos: [
      { titulo: "Historia", url: "/p/historia" },
      { titulo: "Circuitos turísticos", url: "/p/circuitos-turisticos" },
      { titulo: "Lugares de interés", url: "/p/lugares-de-interes" },
      { titulo: "Patrimonio cultural", url: "/tramites/13" },
      { titulo: "Galería de imágenes", url: "/galeria" },
      { titulo: "Mapa interactivo", url: "https://mapa.smt.gob.ar/", externo: true },
    ],
  },
  {
    titulo: "Transparencia",
    hijos: [
      { titulo: "Transparencia y Participación", url: "/tramites/10" },
      { titulo: "Portal de Datos", url: "https://smtendatos.gob.ar/", externo: true },
      { titulo: "Contaduría y presupuesto", url: "https://transparencia.smt.gob.ar/", externo: true },
      { titulo: "Licitaciones", url: "https://licitaciones.smt.gob.ar/", externo: true },
    ],
  },
  {
    titulo: "Noticias",
    url: "https://comunicacionsmt.gob.ar/",
    externo: true,
  },
];

export const CIDITUC = "https://ciudaddigital.smt.gob.ar/";

/** Accesos destacados de la portada. Configurables por el municipio. */
export const ACCESOS = [
  { titulo: "Guía de Trámites", detalle: "Paso a paso de cada gestión", url: "https://guiadetramites.smt.gob.ar", icono: "tramites", externo: true },
  { titulo: "CiDiTuc", detalle: "Tu ciudad digital", url: CIDITUC, icono: "cidituc", externo: true },
  { titulo: "Pagá tus tasas", detalle: "Ingresos municipales", url: "https://www.dimsmt.gob.ar/", icono: "pagos", externo: true },
  { titulo: "Multas", detalle: "Consultá y gestioná infracciones", url: "https://cidituc.smt.gob.ar/?destino=derivador#/multas", icono: "multas", externo: true },
  { titulo: "Licencia de conducir", detalle: "Requisitos y turnos", url: "/fichas/8", icono: "transporte" },
  { titulo: "Turno Asistencia Pública", detalle: "Sacá tu turno de salud", url: "/p/turno-asistencia", icono: "salud" },
];

/** Herramientas del pie. URLs exactas del sitio actual. */
export const SISTEMAS: ItemNav[] = [
  { titulo: "CiDiTuc", url: CIDITUC, externo: true },
  { titulo: "Guía de Trámites", url: "https://guiadetramites.smt.gob.ar", externo: true },
  { titulo: "Ingresos Municipales (DIM)", url: "https://www.dimsmt.gob.ar/", externo: true },
  { titulo: "Tesorería — Proveedores", url: "https://tesoreria.smt.gob.ar/", externo: true },
  { titulo: "Licitaciones", url: "https://licitaciones.smt.gob.ar/", externo: true },
  { titulo: "Expedientes", url: "https://expediente.smt.gob.ar/index.jsp", externo: true },
  { titulo: "Gestión de Empleados", url: "https://personal.smt.gob.ar/", externo: true },
  { titulo: "Catastro y Edificación", url: "https://ciudaddigital.smt.gob.ar/?destino=catastro", externo: true },
  { titulo: "Webmail", url: "https://webmail.smt.gob.ar/login.php", externo: true },
  { titulo: "SMT en Datos", url: "https://smtendatos.gob.ar/", externo: true },
];

export const CONTACTO = {
  // El sitio actual publica 598 en el encabezado y 570 en el pie y las fichas.
  // Pendiente de confirmar con el municipio cuál es la oficial.
  direccion: "9 de Julio 570, T4000 San Miguel de Tucumán",
  telefono: "(0381) 451-6500",
  telefonoLink: "+543814516500",
  asistenciaPublica: ["(0381) 430-8393", "(0381) 421-2329"],
};

export const REDES: ItemNav[] = [
  { titulo: "Facebook", url: "https://www.facebook.com/MuniSMTucuman", externo: true },
  { titulo: "Instagram", url: "https://instagram.com/munismtucuman", externo: true },
  { titulo: "X (Twitter)", url: "https://twitter.com/MuniSMT", externo: true },
  { titulo: "YouTube", url: "https://www.youtube.com/user/MuniSMTucuman", externo: true },
];

/** Iconos de red, para el sprite. */
export const ICONO_RED: Record<string, string> = {
  Facebook: "facebook",
  Instagram: "instagram",
  "X (Twitter)": "x",
  YouTube: "youtube",
};

/**
 * Los iconos del CMS vienen como clases de Font Awesome ("fa-solid fa-store").
 * Acá se mapean a los del sprite propio, para no cargar Font Awesome Pro
 * (cuya licencia además habría que revisar).
 */
export function iconoDesdeFontAwesome(clase: string | null): string {
  if (!clase) return "tramites";
  // El CMS tiene clases con espacios de más ("fa -solid fa-recycle").
  const c = clase.toLowerCase().replace(/\s+/g, " ");

  // EL ORDEN IMPORTA: gana la primera que coincide, así que lo específico va
  // antes que lo genérico. Por ejemplo "landmark" tiene que resolverse como
  // patrimonio y no como cultura, y "scale-balanced" como justicia.
  const reglas: [RegExp, string][] = [
    [/scale-balanced|balance-scale|gavel|justice/, "justicia"],
    [/landmark|monument|archway|building-columns|museum/, "patrimonio"],
    [/lock-open|unlock|eye|transparen|chart|handshake/, "transparencia"],
    [/flag|file-contract|scroll|stamp|gavel|book-law/, "normativa"],
    [/icons|calendar|users|people|hands-helping|person/, "actividades"],
    [/store|shop|cash-register|receipt|invoice|dollar|money|coins/, "pagos"],
    [/leaf|tree|recycle|seedling|earth|globe/, "ambiente"],
    [/masks|theater|palette|music|camera|guitar|paint/, "cultura"],
    [/heart|hospital|stethoscope|medkit|user-doctor|pulse|briefcase-medical/, "salud"],
    [/shield|siren|fire|helmet|exclamation-triangle/, "seguridad"],
    [/graduation|school|book-open|chalkboard|user-graduate/, "educacion"],
    [/bus|car|road|traffic|motorcycle|truck|bicycle/, "transporte"],
    [/book|library|bookmark/, "biblioteca"],
    [/map|ruler|drafting|home|house|city|building/, "catastro"],
  ];

  for (const [re, nombre] of reglas) if (re.test(c)) return nombre;
  return "tramites";
}
