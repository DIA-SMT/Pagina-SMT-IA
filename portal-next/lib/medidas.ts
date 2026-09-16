import "server-only";

/**
 * Mide una imagen remota sin descargarla entera.
 *
 * Hace falta porque la API no publica el tamaño de las fotos: la base del CMS
 * guarda la ruta del archivo y nada más. Sin el dato, la portada no puede
 * saber cuál de las fotos de la galería sirve como fondo y cuál va a quedar
 * estirada y borrosa.
 *
 * Sólo se leen los primeros 64 KB, que es donde vive la cabecera en JPEG y en
 * PNG. Se corre en el servidor, al generar la página, y la respuesta queda en
 * la caché de Next durante un día: el tamaño de un archivo no cambia.
 */
export type Medidas = { ancho: number; alto: number };

/** PNG: el bloque IHDR arranca en el byte 8 y trae ancho y alto seguidos. */
function medirPNG(b: Buffer): Medidas | null {
  if (b.length < 24) return null;
  if (b.readUInt32BE(0) !== 0x89504e47) return null;
  return { ancho: b.readUInt32BE(16), alto: b.readUInt32BE(20) };
}

/**
 * JPEG: hay que recorrer los segmentos hasta encontrar un SOF, que es el que
 * declara las dimensiones. Los marcadores C4, C8 y CC tienen el mismo rango
 * pero son otra cosa (tablas Huffman y codificación aritmética), por eso el
 * salteo explícito.
 */
function medirJPEG(b: Buffer): Medidas | null {
  if (b.length < 4 || b.readUInt16BE(0) !== 0xffd8) return null;

  let i = 2;
  while (i + 9 < b.length) {
    if (b[i] !== 0xff) {
      i += 1;
      continue;
    }
    const marcador = b[i + 1];
    if (marcador >= 0xc0 && marcador <= 0xcf && marcador !== 0xc4 && marcador !== 0xc8 && marcador !== 0xcc) {
      return { alto: b.readUInt16BE(i + 5), ancho: b.readUInt16BE(i + 7) };
    }
    // Los marcadores sin carga útil no traen longitud: se saltan de a dos.
    if (marcador === 0xd8 || (marcador >= 0xd0 && marcador <= 0xd9)) {
      i += 2;
      continue;
    }
    const largo = b.readUInt16BE(i + 2);
    if (largo < 2) return null;
    i += 2 + largo;
  }
  return null;
}

export async function medirImagen(url: string): Promise<Medidas | null> {
  try {
    const respuesta = await fetch(url, {
      headers: { Range: "bytes=0-65535" },
      // El tamaño de un archivo no cambia: se cachea por un día.
      next: { revalidate: 86400 },
      // Quince segundos y no ocho: el servidor municipal tarda entre 0,8 y
      // 6,7 segundos por foto, medido. Con ocho, las lentas daban timeout y
      // el fondo cambiaba de cantidad de fotos en cada regeneración.
      signal: AbortSignal.timeout(15000),
    });
    if (!respuesta.ok) return null;

    const bytes = Buffer.from(await respuesta.arrayBuffer());
    return medirPNG(bytes) ?? medirJPEG(bytes);
  } catch {
    // Una foto que no se puede medir simplemente no entra al fondo. No es
    // motivo para voltear la portada.
    return null;
  }
}

/**
 * Mide una lista de imágenes de a tandas chicas.
 *
 * De a doce en paralelo, el servidor municipal se ahoga: medido, cuatro de
 * doce daban timeout y el resto tardaba hasta 6,7 segundos. De a tres, las
 * doce entran holgadas. Se paga un poco más de espera al generar la página,
 * una vez por día, a cambio de que el resultado sea siempre el mismo.
 */
export async function medirImagenes(urls: string[], porTanda = 3): Promise<(Medidas | null)[]> {
  const salida: (Medidas | null)[] = [];
  for (let i = 0; i < urls.length; i += porTanda) {
    const tanda = await Promise.all(urls.slice(i, i + porTanda).map(medirImagen));
    salida.push(...tanda);
  }
  return salida;
}
