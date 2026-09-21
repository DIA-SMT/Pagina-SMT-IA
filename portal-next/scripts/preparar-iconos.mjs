/**
 * Genera los iconos del sitio a partir del isotipo de la Municipalidad.
 *
 * Deja tres archivos en app/, que es donde Next los toma por convención de
 * nombre y les arma solo las etiquetas del <head>:
 *
 *   app/favicon.ico      16, 32 y 48 px — el que el navegador pide por su cuenta
 *   app/icon.png         256 px         — el que usan los navegadores actuales
 *   app/apple-icon.png   180 px         — la pantalla de inicio de iOS
 *
 * Se corre a mano, sólo si cambia el isotipo:
 *
 *   node scripts/preparar-iconos.mjs [fuente.png]
 *
 * ---- Por qué la fuente es ésta y no la del sitio viejo ----
 *
 * El favicon de producción está archivado en referencia/assets/favicon.png: el
 * isotipo de 276x318 perdido en el medio de un lienzo de 656x664 que es casi
 * todo un disco blanco. Tiene más resolución que este archivo (189x215), así
 * que la tentación es recortarlo. No sirve: el recorte se lleva el disco
 * puesto, porque adentro del rectángulo del isotipo el blanco es opaco.
 *
 * Sacarle el blanco por cálculo tampoco anda, y está probado. La cuenta natural
 * es alfa = 255 - min(r,g,b), que da bien cuando el color tiene algún canal en
 * cero: el azul #0166FF tiene r=1 y el amarillo #F4DC00 tiene b=0. Pero el
 * celeste #2DB0FF tiene r=45, así que la hoja derecha entera sale con alfa 210
 * en vez de 255 y se transparenta. Se ve de una en una prueba sobre fondo a
 * cuadros.
 *
 * Así que la fuente es este PNG, que ya viene con fondo transparente. 189x215
 * alcanza: de las tres salidas, la única que lo agranda es icon.png y lo hace
 * un 12%.
 */
import { writeFile } from "node:fs/promises";
import sharp from "sharp";

const FUENTE = process.argv[2] ?? "scripts/isotipo-smt.png";

/**
 * El isotipo trae márgenes transparentes alrededor, así que primero se busca
 * el rectángulo mínimo que lo contiene. Alcanza con mirar el canal alfa: la
 * fuente no tiene fondo, sólo la marca.
 */
async function recuadroDelIsotipo(ruta) {
  const { data, info } = await sharp(ruta).ensureAlpha().raw().toBuffer({ resolveWithObject: true });
  const { width: ancho, height: alto, channels: canales } = info;

  let izq = ancho, arr = alto, der = -1, aba = -1;
  for (let y = 0; y < alto; y++) {
    for (let x = 0; x < ancho; x++) {
      if (data[(y * ancho + x) * canales + 3] < 8) continue;
      if (x < izq) izq = x;
      if (x > der) der = x;
      if (y < arr) arr = y;
      if (y > aba) aba = y;
    }
  }
  if (der < 0) throw new Error(`${ruta} está entero transparente`);
  return { left: izq, top: arr, width: der - izq + 1, height: aba - arr + 1 };
}

/**
 * Recorta el isotipo y lo centra en un lienzo cuadrado donde ocupa `relleno`
 * del alto. El isotipo es más alto que ancho (relación 0,87), así que el
 * cuadrado se calcula sobre el alto y sobran márgenes a los costados.
 */
async function cuadrado(ruta, caja, relleno, fondo) {
  const lado = Math.round(caja.height / relleno);
  const arriba = Math.round((lado - caja.height) / 2);
  const izquierda = Math.round((lado - caja.width) / 2);
  return sharp(ruta)
    .extract(caja)
    .extend({
      top: arriba,
      bottom: lado - caja.height - arriba,
      left: izquierda,
      right: lado - caja.width - izquierda,
      background: fondo,
    })
    .png()
    .toBuffer();
}

/**
 * Arma un .ico con varios tamaños adentro.
 *
 * Los tamaños chicos van en BMP y no en PNG. Un .ico admite las dos cosas,
 * pero PNG adentro de .ico recién se soporta desde Windows Vista, y este
 * archivo no lo lee sólo el navegador: es también el que usa Windows cuando
 * alguien ancla el sitio. En BMP lo lee cualquier cosa y a estos tamaños pesa
 * nada.
 *
 * El BMP de adentro de un .ico tiene dos rarezas: la altura del encabezado va
 * al doble —declara el mapa de color y una máscara de recorte que le sigue— y
 * las filas van de abajo hacia arriba. La máscara se llena de ceros, o sea
 * "ningún píxel recortado", porque el canal alfa de los 32 bits ya dice qué es
 * transparente.
 */
function armarIco(imagenes) {
  const entradas = imagenes.map(({ lado, rgba }) => {
    const filaMascara = Math.ceil(lado / 32) * 4; // la máscara se alinea a 4 bytes
    const cabecera = Buffer.alloc(40);
    cabecera.writeUInt32LE(40, 0);
    cabecera.writeInt32LE(lado, 4);
    cabecera.writeInt32LE(lado * 2, 8); // al doble, a propósito
    cabecera.writeUInt16LE(1, 12);
    cabecera.writeUInt16LE(32, 14);

    const mapa = Buffer.alloc(lado * lado * 4);
    for (let y = 0; y < lado; y++) {
      const origen = (lado - 1 - y) * lado * 4; // de abajo hacia arriba
      for (let x = 0; x < lado; x++) {
        const o = origen + x * 4;
        const d = (y * lado + x) * 4;
        mapa[d] = rgba[o + 2]; // B
        mapa[d + 1] = rgba[o + 1]; // G
        mapa[d + 2] = rgba[o]; // R
        mapa[d + 3] = rgba[o + 3]; // A
      }
    }
    return { lado, datos: Buffer.concat([cabecera, mapa, Buffer.alloc(filaMascara * lado)]) };
  });

  const directorio = Buffer.alloc(6 + entradas.length * 16);
  directorio.writeUInt16LE(0, 0);
  directorio.writeUInt16LE(1, 2); // 1 = icono
  directorio.writeUInt16LE(entradas.length, 4);

  let posicion = directorio.length;
  entradas.forEach((e, i) => {
    const o = 6 + i * 16;
    directorio[o] = e.lado === 256 ? 0 : e.lado; // 0 significa 256
    directorio[o + 1] = e.lado === 256 ? 0 : e.lado;
    directorio.writeUInt16LE(1, o + 4);
    directorio.writeUInt16LE(32, o + 6);
    directorio.writeUInt32LE(e.datos.length, o + 8);
    directorio.writeUInt32LE(posicion, o + 12);
    posicion += e.datos.length;
  });

  return Buffer.concat([directorio, ...entradas.map((e) => e.datos)]);
}

const kB = (n) => `${(n / 1024).toFixed(1)} kB`;

const caja = await recuadroDelIsotipo(FUENTE);
console.log(`isotipo en ${FUENTE}: ${caja.width}x${caja.height} (desde ${caja.left},${caja.top})`);

/*
 * Fondo transparente y el isotipo al 94% del alto.
 *
 * Sin disco blanco detrás, que es lo que traía el archivo de producción. El
 * disco parece la opción prudente pero empeora las cosas, y está medido: sobre
 * una barra de pestañas clara el disco no cambia nada —blanco sobre blanco— y
 * el punto amarillo sigue dando 1,39:1; sobre una barra oscura, en cambio, le
 * saca al isotipo justo el fondo que lo hacía leerse, y el amarillo pasa de
 * 8,67:1 a 1,39:1 y el celeste de 5,04:1 a 2,40:1. O sea que el disco convierte
 * "se lee bien en oscuro, la cabeza flojea en claro" en "la cabeza flojea en
 * los dos". Transparente, el isotipo siempre tiene al menos dos de sus tres
 * colores con contraste de sobra.
 */
const transparente = { r: 0, g: 0, b: 0, alpha: 0 };
const maestro = await cuadrado(FUENTE, caja, 0.94, transparente);

const paraIco = [];
for (const lado of [16, 32, 48]) {
  paraIco.push({ lado, rgba: await sharp(maestro).resize(lado, lado).ensureAlpha().raw().toBuffer() });
}
const ico = armarIco(paraIco);
await writeFile("app/favicon.ico", ico);
console.log(`app/favicon.ico      16+32+48   ${kB(ico.length)}`);

/*
 * Con paleta. Son tres colores planos con los bordes suavizados, así que 256
 * entradas alcanzan y sobran: medido contra la versión de color verdadero, los
 * píxeles que se ven difieren 0,42 de 255 en promedio —21 el peor— y el canal
 * alfa queda intacto (0,02). A cambio pesa menos de la mitad.
 *
 * Al comparar hay que saltear los píxeles transparentes de los dos lados: ahí
 * el RGB es basura que no se dibuja, y contarlo da una diferencia media de 15
 * que en pantalla no existe.
 */
const PNG = { compressionLevel: 9, palette: true, quality: 100, effort: 10 };

const icono = await sharp(maestro).resize(256, 256).png(PNG).toBuffer();
await writeFile("app/icon.png", icono);
console.log(`app/icon.png         256x256    ${kB(icono.length)}`);

/*
 * El de iOS va opaco y con más aire, y las dos cosas son de iOS y no gustos.
 * Un PNG con alfa en la pantalla de inicio se compone sobre negro, así que el
 * azul del isotipo quedaría pegado al fondo. Y como iOS lo recorta en un
 * cuadrado redondeado, lo que toca el borde se pierde: va al 62% del alto para
 * que la esquina no se coma nada.
 */
const apple = await sharp(await cuadrado(FUENTE, caja, 0.62, { r: 255, g: 255, b: 255, alpha: 1 }))
  .resize(180, 180)
  .flatten({ background: "#ffffff" })
  .png(PNG)
  .toBuffer();
await writeFile("app/apple-icon.png", apple);
console.log(`app/apple-icon.png   180x180    ${kB(apple.length)}`);

console.log("\nlisto");
