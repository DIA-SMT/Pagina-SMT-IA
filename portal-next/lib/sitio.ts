/**
 * La URL pública del portal, en un solo lugar.
 *
 * La usan `metadataBase` en app/layout.tsx, el `Sitemap:` de app/robots.ts y
 * cada `<loc>` de app/sitemap.ts. Los dos últimos la necesitan absoluta y no
 * pueden resolverla solos: Next genera esos dos archivos aparte del render de
 * las páginas, donde `metadataBase` no está accesible, y escribe el valor tal
 * cual se lo pasamos. Una ruta relativa saldría publicada rota.
 *
 * Sin la barra final, para poder concatenar rutas que empiezan con "/" sin que
 * quede una doble.
 */
export const SITIO = (process.env.SITIO_URL ?? "https://smt.gob.ar").replace(/\/+$/, "");
