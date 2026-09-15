/**
 * Tipos de la API de datos del portal.
 *
 * Reflejan las respuestas REALES de datos.smt.gob.ar, verificadas contra los
 * fixtures de `fixtures/`. Si algún día los datos pasan a otra fuente
 * (Supabase u otra), estos tipos son el contrato que se mantiene: solo hay
 * que reescribir `lib/api.ts`, no las páginas.
 */

/** Archivo adjunto. Voyager guarda el nombre original, que sirve de etiqueta. */
export type Archivo = {
  url: string;
  nombre: string;
  extension: string;
};

export type Categoria = {
  id: number;
  titulo: string;
  texto: string | null;
  icono: string | null;
  orden: number | null;
  items: number;
  slug: string;
};

/** Un ítem con `enlace` sale a una URL propia; sin él, lleva a su ficha. */
export type ItemCategoria = {
  id: number;
  titulo: string;
  texto: string | null;
  icono: string | null;
  enlace: string | null;
  orden: number | null;
};

export type CategoriaConItems = Omit<Categoria, "items" | "orden"> & {
  items: ItemCategoria[];
};

export type FichaResumen = {
  id: number;
  titulo: string;
  bajada: string | null;
  imagen: string | null;
  archivos: Archivo[];
};

export type Ficha = {
  id: number;
  categoria: number;
  item: number;
  titulo: string;
  bajada: string | null;
  /** HTML administrado desde el CMS. */
  cuerpo: string | null;
  imagen: string | null;
  archivos: Archivo[];
  actualizado: string | null;
};

export type NotaResumen = {
  id: number;
  titulo: string | null;
  bajada: string | null;
  slug: string | null;
  estado: string | null;
  imagen: string | null;
  actualizado: string | null;
};

export type Nota = NotaResumen & {
  /** HTML administrado desde el CMS. */
  texto: string | null;
  archivos: Archivo[];
};

export type AreaResumen = {
  id: number;
  nombre: string | null;
  slug: string;
  autoridad: string | null;
  foto: string | null;
  domicilio: string | null;
  telefono: string | null;
  email: string | null;
  descripcion: string | null;
  organigrama: string | null;
  /** Ids de las áreas dependientes. */
  dependencias: number[];
};

export type AreaDependencia = {
  id: number;
  nombre: string | null;
  slug: string;
  autoridad: string | null;
  email: string | null;
};

export type Area = Omit<AreaResumen, "dependencias"> & {
  padre: { id: number; nombre: string | null; slug: string } | null;
  dependencias: AreaDependencia[];
};

export type GaleriaResumen = {
  id: number;
  nombre: string | null;
  slug: string;
  fotos: number;
};

export type Foto = {
  id: number;
  descripcion: string | null;
  imagen: string | null;
  miniatura: string | null;
};

export type Galeria = Omit<GaleriaResumen, "fotos"> & {
  fotos: Foto[];
};

export type Slider = {
  id: number;
  title?: string | null;
  image?: string | null;
  active?: number | null;
  orden?: number | null;
  link?: string | null;
  description?: string | null;
  [clave: string]: unknown;
};

export type Banner = {
  id: number;
  name?: string | null;
  image?: string | null;
  type?: string | null;
  orden?: number | null;
  posicion?: string | null;
  [clave: string]: unknown;
};

export type Emergencia = {
  id: number;
  nombre: string | null;
  numero: string;
};

export type ResultadoBusqueda =
  | { tipo: "nota"; id: number; titulo: string | null; bajada: string | null; slug: string | null }
  | { tipo: "ficha"; id: number; titulo: string | null; bajada: string | null; categoria: number }
  | { tipo: "area"; id: number; titulo: string | null; autoridad: string | null };

export type Busqueda = {
  consulta: string;
  total: number;
  resultados: ResultadoBusqueda[];
};

export type Paginado<T> = {
  datos: T[];
  paginacion: {
    pagina: number;
    por_pagina: number;
    total: number;
    paginas: number;
  };
};
