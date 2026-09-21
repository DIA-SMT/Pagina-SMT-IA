/**
 * Prepara los recursos del hero de stickers para producción.
 *
 * Toma el paquete que vino en Descargas y deja en public/hero-tucuman/ sólo lo
 * que el navegador va a pedir: los quince WebP de las capas, el collage móvil
 * y la fotografía inicial convertida a WebP y AVIF.
 *
 * Los PNG maestros NO se copian: son 25,8 MB y no los necesita nadie en
 * producción. Viven en Descargas como fuente.
 *
 * Se corre a mano cuando cambian los recursos, pasándole dónde está el
 * paquete y dónde la fotografía inicial:
 *
 *   node scripts/preparar-hero-tucuman.mjs <paquete> <foto-inicial.png>
 *
 * Las dos rutas van por argumento y no escritas acá adentro porque este repo
 * es público: tenerlas fijas publicaba el usuario de Windows y la estructura
 * de una carpeta de Descargas ajena, y además dejaba el script inservible para
 * cualquiera que no fuera la máquina donde se escribió.
 */
import { mkdir, copyFile, readdir, stat } from "node:fs/promises";
import sharp from "sharp";

const [ORIGEN, FOTO_ORIGEN] = process.argv.slice(2);
const DESTINO = "public/hero-tucuman";

if (!ORIGEN || !FOTO_ORIGEN) {
  console.error(
    [
      "Faltan las rutas.",
      "",
      "  node scripts/preparar-hero-tucuman.mjs <paquete> <foto-inicial.png>",
      "",
      "<paquete> es la carpeta que trae webp/ y mobile/ adentro;",
      "<foto-inicial.png> es la Imagen 1, el PNG del que salen el WebP y el AVIF.",
    ].join("\n"),
  );
  process.exit(1);
}

const kB = (n) => `${(n / 1024).toFixed(0)} kB`;

await mkdir(`${DESTINO}/capas`, { recursive: true });

// 1. Las quince capas, tal cual: ya vienen en WebP con alfa y a ~1400px, que
//    es más de lo que cualquiera de ellas mide en pantalla (la más grande, el
//    rótulo, llega a 680px de ancho máximo según el manifiesto).
//
//    Con una salvedad que apareció en la versión 2 del paquete: dos de los
//    quince WebP llegaron con CERO bytes —08-empanadas y 12-naturaleza-tucumana,
//    y la primera es justamente una de las seis capas corregidas—. El PNG
//    maestro de las dos estaba bien, así que cuando el WebP falta o viene vacío
//    se genera desde el PNG en vez de copiar un archivo roto. No es redibujar
//    nada: es el mismo dibujo, reencodeado, porque el empaquetado falló.
let totalCapas = 0;
const regenerados = [];
for (const f of (await readdir(`${ORIGEN}/webp`)).sort()) {
  if (!f.endsWith(".webp")) continue;
  const origen = `${ORIGEN}/webp/${f}`;
  const destino = `${DESTINO}/capas/${f}`;
  const vacio = (await stat(origen)).size === 0;

  if (vacio) {
    const png = `${ORIGEN}/png/${f.replace(/\.webp$/, ".png")}`;
    // Calidad 72 y no la que uno pondría a ojo: se eligió igualando la
    // compresión del propio paquete. Las trece capas que llegaron bien pesan
    // 133 kB por megapíxel en promedio, y 72 es la calidad que deja a estas dos
    // en ese orden. Con 88 quedaban al doble de peso por píxel que sus vecinas,
    // sin ganancia visible: en pantalla se ven a un cuarto de su tamaño.
    await sharp(png).webp({ quality: 72, effort: 6 }).toFile(destino);
    regenerados.push(f);
  } else {
    await copyFile(origen, destino);
  }

  const peso = (await stat(destino)).size;
  totalCapas += peso;
  console.log(`  capa  ${f}${vacio ? "   (REGENERADA desde el PNG: el WebP del paquete venía vacío)" : ""}`);
}
if (regenerados.length > 0) {
  console.log(`\n  AVISO: ${regenerados.length} WebP del paquete venían en 0 bytes y se regeneraron desde su PNG maestro: ${regenerados.join(", ")}`);
}
console.log(`  -> ${kB(totalCapas)} en capas\n`);

// 2. El collage aplanado para teléfonos.
await copyFile(`${ORIGEN}/mobile/collage-mobile.webp`, `${DESTINO}/collage-movil.webp`);
console.log(`  movil collage-movil.webp  ${kB((await stat(`${DESTINO}/collage-movil.webp`)).size)}`);

// 3. La fotografía inicial. Es el elemento LCP de la portada, así que se
//    convierte con cuidado: AVIF primero, WebP como respaldo. El PNG maestro no
//    se sirve nunca —la versión 2 pesa 10,8 MB— y se queda afuera del repo.
//
//    Se REDIMENSIONA a 1920 de ancho. El maestro viene en 4K y servir 3840px de
//    LCP a un portal municipal no tiene sentido: medido sobre este mismo
//    archivo, a 1672px el AVIF pesa 219 kB, a 1920 son 258, a 2400 son 330 y a
//    2880, 403. 1920 cubre la pantalla de escritorio más común sin pagar el
//    doble, y además da un 16:9 exacto, que es la proporción que .ht__escena
//    declara con aspect-ratio. El archivo anterior era 1672x941 = 1,7768, algo
//    corrido de 16:9.
const ANCHO_SERVIDO = 1920;
const meta = await sharp(FOTO_ORIGEN).metadata();
console.log(`\n  foto maestra: ${meta.width}x${meta.height} ${kB((await stat(FOTO_ORIGEN)).size)}`);

for (const [ext, opciones] of [
  ["webp", { quality: 82, effort: 6 }],
  ["avif", { quality: 58, effort: 6 }],
]) {
  const salida = `${DESTINO}/foto-inicial.${ext}`;
  await sharp(FOTO_ORIGEN).resize(ANCHO_SERVIDO)[ext](opciones).toFile(salida);
  console.log(`  foto  foto-inicial.${ext}  ${kB((await stat(salida)).size)}`);
}
console.log(
  `\n  RECORDATORIO: si el ancho servido cambia, hay que actualizar FOTO.ancho\n` +
    `  y FOTO.alto en lib/heroTucuman.ts. De ahí salen los atributos width y\n` +
    `  height del <img>, que son los que evitan el salto de maquetación, y la\n` +
    `  proporción con la que se traducen las poses de entrada.`,
);

// 4. El manifiesto, copiado para que quede versionado junto al código que lo
//    consume. lib/heroTucuman.ts lo traduce a tipos y le agrega las poses de
//    entrada, que el paquete no trae.
await copyFile(`${ORIGEN}/manifest.json`, `${DESTINO}/manifest-original.json`);
console.log(`\n  manifiesto original copiado como referencia`);
