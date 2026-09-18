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
let totalCapas = 0;
for (const f of (await readdir(`${ORIGEN}/webp`)).sort()) {
  if (!f.endsWith(".webp")) continue;
  await copyFile(`${ORIGEN}/webp/${f}`, `${DESTINO}/capas/${f}`);
  totalCapas += (await stat(`${DESTINO}/capas/${f}`)).size;
  console.log(`  capa  ${f}`);
}
console.log(`  -> ${kB(totalCapas)} en capas\n`);

// 2. El collage aplanado para teléfonos.
await copyFile(`${ORIGEN}/mobile/collage-mobile.webp`, `${DESTINO}/collage-movil.webp`);
console.log(`  movil collage-movil.webp  ${kB((await stat(`${DESTINO}/collage-movil.webp`)).size)}`);

// 3. La fotografía inicial. Es el elemento LCP de la portada, así que se
//    convierte con cuidado: AVIF primero, WebP como respaldo. El PNG original
//    pesa 2,8 MB y no se sirve nunca.
const meta = await sharp(FOTO_ORIGEN).metadata();
console.log(`\n  foto original: ${meta.width}x${meta.height} ${kB((await stat(FOTO_ORIGEN)).size)}`);

for (const [ext, opciones] of [
  ["webp", { quality: 82, effort: 6 }],
  ["avif", { quality: 58, effort: 6 }],
]) {
  const salida = `${DESTINO}/foto-inicial.${ext}`;
  await sharp(FOTO_ORIGEN)[ext](opciones).toFile(salida);
  console.log(`  foto  foto-inicial.${ext}  ${kB((await stat(salida)).size)}`);
}

// 4. El manifiesto, copiado para que quede versionado junto al código que lo
//    consume. lib/heroTucuman.ts lo traduce a tipos y le agrega las poses de
//    entrada, que el paquete no trae.
await copyFile(`${ORIGEN}/manifest.json`, `${DESTINO}/manifest-original.json`);
console.log(`\n  manifiesto original copiado como referencia`);
