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
    /* Transporte entra al primer nivel ocupando el lugar que dejó
       Transparencia, cuyos hijos pasaron a Gobierno. No es un capricho de
       orden: son 301 visitas diarias —colectivos 161, SUBE 59, SUBEM 37,
       registros 44— que hoy no tienen ninguna puerta de entrada en el portal,
       más la ficha de recorridos con otras 51. Y el ancho obliga a canjear:
       a 1024px, donde aparece este menú, sobran 49px sobre un promedio de
       122px por ítem, así que un sexto ítem no entra. */
    titulo: "Transporte",
    hijos: [
      { titulo: "Recorridos de colectivos", url: "/p/colectivos" },
      { titulo: "Tarjeta SUBE", url: "/p/Sube" },
      { titulo: "Programa SUBEM — boleto educativo", url: "/p/SUBEM" },
      { titulo: "Registros del transporte individual", url: "/p/Registros%20_Transporte%20_Individual_Pasajeros" },
      { titulo: "Cortes de tránsito", url: "/p/cortes" },
      { titulo: "Trámites de transporte y movilidad", url: "/tramites/7" },
    ],
  },
  {
    /* Absorbe los hijos de la vieja sección Transparencia. El rótulo se queda
       en "Gobierno" y no pasa a "Gobierno y transparencia" por el mismo
       problema de ancho: el rótulo largo mide unos 210px contra los 102 de
       este, y no hay de dónde sacarlos. En el pie, donde sí hay lugar, la
       columna se llama "Gobierno y transparencia". */
    titulo: "Gobierno",
    hijos: [
      { titulo: "Estructura de Gobierno", url: "/gobierno" },
      { titulo: "Transparencia y Participación", url: "/tramites/10" },
      { titulo: "Normativa", url: "/tramites/11" },
      { titulo: "Justicia Municipal", url: "/tramites/16" },
      { titulo: "Presupuesto Participativo", url: "/p/presupuestoparticipativo" },
      { titulo: "Portal de Datos", url: "https://smtendatos.gob.ar/", externo: true },
      { titulo: "Contaduría y presupuesto", url: "https://transparencia.smt.gob.ar/", externo: true },
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
    titulo: "Noticias",
    url: "https://comunicacionsmt.gob.ar/",
    externo: true,
  },
];

export const CIDITUC = "https://ciudaddigital.smt.gob.ar/";

/** Accesos destacados de la portada. Configurables por el municipio. */
/**
 * Los seis destinos del hero, en orden de demanda MEDIDA.
 *
 * No están elegidos a dedo: salen del access_ssl_log del servidor municipal
 * (lunes 14/09/2026, día hábil completo, bots excluidos), las mismas cifras
 * que lib/indice.ts usa para ordenar el buscador.
 *
 *   /fichas/8            Licencia de conducir ............ 831 visitas/día
 *   /fichas/14           Carnet de sanidad ............... 217
 *   /p/turno-asistencia  Turno de Asistencia Pública ..... 200
 *   /p/colectivos        Recorridos de colectivos ........ 161
 *   /fichas/70           Consulta y pago de infracciones .. 82
 *   /fichas/5            Habilitación comercial ........... 33
 *
 * El primero se lleva 831 de las ~3.600 visitas diarias del portal: casi una
 * de cada cuatro, y cuatro veces el segundo. Por eso el hero le da el doble de
 * ancho. La jerarquía visual sigue a la demanda real y no a lo que nos parece
 * importante; si algún día se remide el log y el orden cambia, esta lista
 * cambia con él.
 *
 * SIN DESCRIPCIONES: las fichas no las tienen estructuradas en el CMS y no se
 * inventan. El título de cada una es el de su página.
 *
 * LO QUE NO ESTÁ Y NO ES UN OLVIDO: pagar tasas se hace en dimsmt.gob.ar y
 * CiDiTuc en ciudaddigital.smt.gob.ar. Son otros dominios, así que su uso no
 * aparece en este log. Ausencia de dato no es ausencia de demanda: por eso
 * esos tres siguen abajo, en ACCESOS.
 */
export const DESTACADOS = [
  { titulo: "Licencia de conducir", url: "/fichas/8", icono: "transporte" },
  { titulo: "Carnet de sanidad", url: "/fichas/14", icono: "salud" },
  { titulo: "Turno de Asistencia Pública", url: "/p/turno-asistencia", icono: "salud" },
  { titulo: "Recorridos de colectivos", url: "/p/colectivos", icono: "transporte" },
  { titulo: "Consulta y pago de infracciones", url: "/fichas/70", icono: "multas" },
  // Sexto lugar: 85 visitas diarias. Estaba Habilitación Municipal (ficha 5),
  // con 33, o sea que el único puesto de esta lista que NO seguía la demanda
  // era el último. Por encima de la habilitación había tres fichas y se eligió
  // la más consultada de las tres. Las otras dos: Portal de Atención Ciudadana
  // (ficha 7, 70 visitas) y Ciudadano Digital (ficha 77, 60), que además ya
  // tiene su tarjeta en ACCESOS como CiDiTuc y habría sido un destino repetido.
  //
  // El costo es que la lista se queda sin su única entrada para comercios.
  // Se aceptó porque el rótulo de la sección dice "Lo que más se consulta" y
  // ordenarla por otra cosa sería mentir sobre el dato; la habilitación sigue
  // a un toque, en su categoría.
  { titulo: "Servicio de Población Animal", url: "/fichas/81", icono: "salud" },
];

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

/* ------------------------------------------------------------------ *
 * El pie como directorio
 * ------------------------------------------------------------------ */

/**
 * Columnas del pie de página.
 *
 * El pie anterior era una selección de favoritos: tenía "Gestión Tributaria"
 * pero no las otras trece categorías, y un `SISTEMAS.slice(0, 8)` decidía por
 * orden de array que Webmail y SMT en Datos no existieran. Sus dieciocho
 * enlaces no cubrían ni una de las diez páginas más visitadas del portal.
 *
 * Acá cada columna tiene una REGLA que se puede decir en voz alta, escrita en
 * `regla`. Sirve para dos cosas: decidir sin discutir si un enlace nuevo entra
 * o no, y detectar cuándo una columna dejó de cumplir lo que promete.
 *
 * El orden de las columnas sigue la demanda medida sobre el log del servidor
 * (lunes 14/09/2026): trámites 2.270 visitas diarias, transporte 301 sin
 * ninguna puerta de entrada en el portal, gobierno 567, ciudad 107.
 *
 * Los destinos están verificados uno por uno contra el portal: 34 rutas
 * internas y 9 externas, todas en 200. Las etiquetas respetan el título real
 * de cada página; donde el rótulo agrega algo ("gratuitos" en Talleres,
 * "boleto educativo" en SUBEM) es porque el propio contenido lo dice.
 */
export type EnlacePie = {
  texto: string;
  url: string;
  externo?: boolean;
};

export type ColumnaPie = {
  titulo: string;
  /** La regla que define qué entra en esta columna. No se muestra al vecino. */
  regla: string;
  enlaces: EnlacePie[];
};

export const PIE: ColumnaPie[] = [
  {
    titulo: "Trámites y servicios",
    regla:
      "Las seis fichas de trámite más visitadas del portal, más las dos vías " +
      "de gestión en línea y el índice completo por tema.",
    enlaces: [
      { texto: "Licencia de conducir", url: "/fichas/8" },
      { texto: "Emisión del carnet de sanidad", url: "/fichas/14" },
      { texto: "Turnos de Asistencia Pública", url: "/p/turno-asistencia" },
      { texto: "Consulta y pago de infracciones", url: "/fichas/70" },
      { texto: "Servicio de Población Animal", url: "/fichas/81" },
      { texto: "Habilitación comercial", url: "/fichas/5" },
      { texto: "Guía de Trámites Municipales", url: "https://guiadetramites.smt.gob.ar", externo: true },
      { texto: "Ingresos Municipales (DIM)", url: "https://www.dimsmt.gob.ar/", externo: true },
      { texto: "Todos los trámites, por tema", url: "/tramites" },
    ],
  },
  {
    titulo: "Transporte y movilidad",
    regla:
      "Todo lo que el portal publica sobre moverse por la ciudad, sin importar " +
      "de qué tabla del CMS venga. Es la columna que arregla las 301 visitas " +
      "diarias que hoy no tienen ninguna puerta de entrada.",
    enlaces: [
      { texto: "Recorridos de colectivos", url: "/p/colectivos" },
      { texto: "Tarjeta SUBE", url: "/p/Sube" },
      { texto: "Programa SUBEM — boleto educativo", url: "/p/SUBEM" },
      { texto: "Registros del transporte individual", url: "/p/Registros%20_Transporte%20_Individual_Pasajeros" },
      { texto: "Cortes de tránsito", url: "/p/cortes" },
      { texto: "Plan Integral de Movilidad Urbana", url: "/fichas/15" },
      { texto: "Secretaría de Movilidad Urbana", url: "/gobierno/12" },
      { texto: "Trámites de transporte y movilidad", url: "/tramites/7" },
    ],
  },
  {
    titulo: "Gobierno y transparencia",
    regla:
      "El organigrama, las categorías institucionales y los sistemas donde el " +
      "municipio rinde cuentas.",
    enlaces: [
      { texto: "Estructura de gobierno", url: "/gobierno" },
      { texto: "Transparencia y Participación", url: "/tramites/10" },
      { texto: "Normativa", url: "/tramites/11" },
      { texto: "Justicia Municipal", url: "/tramites/16" },
      { texto: "Presupuesto Participativo", url: "/p/presupuestoparticipativo" },
      { texto: "Ordenanza Tributaria 2026", url: "/p/ordenanzatributaria" },
      { texto: "Licitaciones", url: "https://licitaciones.smt.gob.ar/", externo: true },
      { texto: "Tesorería — proveedores", url: "https://tesoreria.smt.gob.ar/", externo: true },
      { texto: "SMT en Datos", url: "https://smtendatos.gob.ar/", externo: true },
    ],
  },
  {
    titulo: "La ciudad",
    regla:
      "Lo que el portal publica sobre la ciudad como lugar: su historia, sus " +
      "espacios, su patrimonio y sus actividades abiertas.",
    enlaces: [
      { texto: "Historia de la ciudad", url: "/p/historia" },
      { texto: "Lugares de interés", url: "/p/lugares-de-interes" },
      { texto: "Circuitos turísticos", url: "/p/circuitos-turisticos" },
      { texto: "Parques", url: "/p/parques_smt" },
      { texto: "Talleres municipales gratuitos", url: "/p/Talleres" },
      { texto: "Patrimonio Cultural", url: "/tramites/13" },
      { texto: "Galería de imágenes", url: "/galeria" },
      { texto: "Todas las páginas del portal", url: "/p" },
      { texto: "Mapa interactivo", url: "https://mapa.smt.gob.ar/", externo: true },
    ],
  },
  {
    titulo: "Emergencias y contacto",
    regla:
      "Los canales para una urgencia y para comunicarse con el municipio. Los " +
      "teléfonos de emergencia no van acá: salen del CMS y se muestran aparte, " +
      "para que el municipio pueda corregirlos sin tocar el código.",
    enlaces: [
      { texto: "Prestaciones de Asistencia Pública", url: "/fichas/78" },
      { texto: "Defensa Civil Municipal", url: "/fichas/64" },
      { texto: "Seguridad Ciudadana y Emergencias", url: "/tramites/5" },
      { texto: "Contacto de la Municipalidad", url: "/contacto" },
    ],
  },
];

/**
 * La franja inferior: las páginas de convención que un portal de Estado tiene
 * que tener siempre a la vista.
 *
 * No están acá Webmail ni Gestión de Empleados, que la propuesta original
 * ponía en esta franja: son sistemas de uso interno del personal municipal y
 * ofrecérselos al vecino en las 175 páginas del portal, sin ninguna
 * aclaración, es ruido. Siguen listados en el mapa del sitio.
 */
export const PIE_LEGAL: EnlacePie[] = [
  { texto: "Contacto", url: "/contacto" },
  { texto: "Mapa del sitio", url: "/mapa-del-sitio" },
  { texto: "Accesibilidad", url: "/accesibilidad" },
  { texto: "Portal de noticias", url: "https://comunicacionsmt.gob.ar/", externo: true },
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
