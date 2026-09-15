import type { Metadata } from "next";
import Link from "next/link";

import { Icono } from "@/components/Iconos";
import { Migas } from "@/components/Migas";

/**
 * Fecha de esta declaración.
 *
 * Va escrita a mano y no con `new Date()` a propósito: la fecha tiene que
 * decir cuándo se revisó el portal, no cuándo se sirvió la página. Con una
 * fecha calculada, el documento se estaría autofirmando cada vez que alguien
 * lo abre, sin que nadie haya vuelto a mirar nada.
 *
 * Se actualiza a mano, y sólo cuando se rehace la revisión que este texto
 * describe.
 */
const FECHA_DECLARACION = "15 de septiembre de 2026";

/**
 * Áreas a las que se puede escribir por una barrera de accesibilidad.
 *
 * Los correos salen del CMS y son los mismos que ya se publican en la ficha de
 * cada área. Se repiten acá en texto plano, y no sólo como enlace a la ficha,
 * porque quien no puede usar el portal tiene que poder quedarse con la
 * dirección sin navegar tres páginas más.
 */
const AREAS_DE_REPORTE = [
  {
    nombre: "Secretaría de Atención al Ciudadano",
    email: "satencionciudadana@smt.gob.ar",
    url: "/gobierno/11",
  },
  {
    nombre: "Dirección de Innovación Tecnológica",
    email: "ditec@smt.gob.ar",
    url: "/gobierno/28",
  },
];

/**
 * Contrastes medidos sobre la página servida, no sobre los valores del código.
 * Donde una medición dio un rango —el encabezado de portada rota entre siete
 * fotografías, la banda azul es un degradado— se publica el rango completo o
 * el punto menos favorable, que es el único número que significa algo.
 */
const CONTRASTES = [
  { que: "Texto blanco del encabezado de portada, sobre las siete fotografías", valor: "6,73:1 a 8,55:1" },
  { que: "Texto amarillo del encabezado de portada, sobre esas mismas fotografías", valor: "4,83:1 a 6,14:1" },
  { que: "Texto blanco sobre la banda azul institucional, en su punto menos favorable", valor: "5,46:1" },
  { que: "Texto celeste claro sobre la banda azul, en su punto menos favorable", valor: "4,55:1" },
  { que: "Enlaces sobre fondo blanco, en reposo", valor: "6,82:1" },
  { que: "Enlaces sobre fondo blanco, con el puntero encima", valor: "9,68:1" },
  { que: "Texto secundario", valor: "7,4:1" },
  { que: "Metadatos y textos de ayuda", valor: "4,9:1" },
  { que: "Etiquetas de tipo de resultado: celeste, azul y amarilla", valor: "4,7:1 · 6,17:1 · 5,64:1" },
  { que: "Borde de campos y controles, sobre blanco", valor: "3,59:1" },
  { que: "Borde de campos y controles, sobre el fondo gris general", valor: "3,34:1" },
];

/**
 * Sistemas del municipio que quedan fuera de esta declaración.
 *
 * Son las mismas URLs que publica lib/navegacion. Van con el dominio a la
 * vista y sin enlace: acá el dato que importa es poder identificar de quién es
 * cada sistema cuando hay que reclamarle, no entrar.
 */
const FUERA_DE_ALCANCE = [
  { nombre: "Guía de Trámites", dominio: "guiadetramites.smt.gob.ar" },
  { nombre: "CiDiTuc y Catastro y Edificación", dominio: "ciudaddigital.smt.gob.ar" },
  { nombre: "Consulta y pago de multas", dominio: "cidituc.smt.gob.ar" },
  { nombre: "Ingresos Municipales (DIM)", dominio: "dimsmt.gob.ar" },
  { nombre: "Tesorería — Proveedores", dominio: "tesoreria.smt.gob.ar" },
  { nombre: "Licitaciones", dominio: "licitaciones.smt.gob.ar" },
  { nombre: "Expedientes", dominio: "expediente.smt.gob.ar" },
  { nombre: "Gestión de Empleados", dominio: "personal.smt.gob.ar" },
  { nombre: "Webmail", dominio: "webmail.smt.gob.ar" },
  { nombre: "Mapa interactivo", dominio: "mapa.smt.gob.ar" },
  { nombre: "SMT en Datos", dominio: "smtendatos.gob.ar" },
  { nombre: "Contaduría y presupuesto", dominio: "transparencia.smt.gob.ar" },
  { nombre: "Portal de noticias", dominio: "comunicacionsmt.gob.ar" },
];

export const metadata: Metadata = {
  title: "Accesibilidad",
  description:
    "Declaración de accesibilidad del portal de la Municipalidad de San Miguel de Tucumán: estado de conformidad con WCAG 2.2 AA, qué se midió, qué no se midió todavía, limitaciones conocidas y dónde reportar una barrera.",
  alternates: { canonical: "/accesibilidad" },
};

export default function PaginaAccesibilidad() {
  return (
    <>
      <div className="cabecera-pagina">
        <Migas migas={[{ texto: "Inicio", url: "/" }, { texto: "Accesibilidad" }]} />
        <div className="contenedor">
          <h1>Accesibilidad</h1>
          <p className="bajada">
            Qué se midió de este portal, con qué método, qué quedó sin medir y dónde escribir si
            encontrás una página que no podés usar.
          </p>
        </div>
      </div>

      <section className="seccion">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Compromiso</p>
              <h2>A qué apunta este portal</h2>
            </div>
          </div>

          <div className="prosa">
            <p>
              El portal de la Municipalidad de San Miguel de Tucumán se desarrolla tomando como
              referencia las Pautas de Accesibilidad para el Contenido Web (WCAG) en su versión 2.2,
              nivel AA. Es la norma que el proyecto adoptó como objetivo técnico y la que se usa
              para decidir contrastes, tamaños de texto, áreas de toque y comportamiento de los
              controles.
            </p>
            <p>
              Un portal municipal no es una opción entre varias: si acá no se puede leer un
              requisito o encontrar una dirección, el vecino no tiene otro lugar donde resolverlo.
              Por eso esta declaración se apoya en una norma verificable y publica números medidos,
              no una descripción de intenciones. Donde no hubo medición, lo dice.
            </p>
          </div>
        </div>
      </section>

      <section className="seccion seccion--blanca">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Estado</p>
              <h2>Parcialmente conforme</h2>
            </div>
          </div>

          <div className="prosa">
            <p>
              El portal es <strong>parcialmente conforme</strong> con WCAG 2.2 nivel AA. Quiere
              decir que una parte del contenido cumple los criterios de la norma y otra parte no los
              cumple o todavía no fue evaluada.
            </p>
            <p>
              No se declara conformidad plena porque no corresponde: no se hizo una revisión
              criterio por criterio de la norma completa, no se probó el portal con productos de
              apoyo y no hubo auditoría de un tercero independiente. Lo que hay es una revisión
              hecha dentro del propio equipo de desarrollo, y es lo que se detalla más abajo.
            </p>

            <div className="aviso aviso--info">
              <p>
                <Icono nombre="documento" tamano={18} className="icono-en-linea" />
                Esta declaración alcanza a las páginas que publica este portal en smt.gob.ar: la
                portada, los trámites y servicios, las áreas de gobierno, las páginas informativas,
                las galerías de imágenes y el buscador. No alcanza a ningún subdominio del municipio
                ni a los sistemas en línea que el portal enlaza.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Verificación</p>
              <h2>Qué se verificó y con qué método</h2>
              <p>
                El método fue la inspección del HTML servido y de los estilos computados en el
                navegador, sobre las páginas del portal.
              </p>
            </div>
          </div>

          <div className="prosa">
            <h3>Estructura, navegación y teclado</h3>
          </div>

          <ul className="lista-check" style={{ maxWidth: "var(--ancho-texto)" }}>
            <li>
              Un solo encabezado de primer nivel por página y jerarquía de encabezados sin saltos,
              en las plantillas revisadas.
            </li>
            <li>
              Enlace «Saltar al contenido principal» como primer elemento que recibe el foco en cada
              página, con destino real en el cuerpo del contenido.
            </li>
            <li>Idioma declarado como castellano de Argentina en todas las páginas.</li>
            <li>
              Ninguna imagen sin atributo de texto alternativo en las plantillas propias del portal.
            </li>
            <li>
              Las migas de pan y los filtros de galería marcan la posición actual con una marca que
              los lectores de pantalla anuncian, y no solamente con un color distinto.
            </li>
            <li>
              Los tres campos de búsqueda del portal tienen una etiqueta asociada de verdad, no sólo
              el texto de ayuda que se borra al empezar a escribir.
            </li>
            <li>
              En las páginas que arma el portal hay 23 enlaces que abren una pestaña nueva y los 23
              lo avisan por texto. De esos, 18 llevan además una marca visible —una flecha o un
              icono— porque salen hacia otro sitio. Los 5 restantes no la llevan a propósito: son
              descargas de documentos y fotos alojadas en el propio servidor municipal, más los
              iconos de redes sociales. No pasa lo mismo con los enlaces que vienen del gestor de
              contenidos: está más abajo, entre las limitaciones.
            </li>
            <li>
              El menú en teléfono se cierra con la tecla Escape, retiene el foco adentro mientras
              está abierto y devuelve el foco al botón que lo abrió.
            </li>
            <li>
              El indicador de foco es un anillo de dos tonos, uno claro y uno oscuro, para que se
              distinga tanto sobre fondo blanco como sobre las bandas azules. Rodea también las
              tarjetas y las fotos de la galería, no sólo los botones.
            </li>
            <li>
              Si el sistema operativo está configurado para reducir el movimiento, el portal
              desactiva sus animaciones y transiciones.
            </li>
          </ul>

          <div className="prosa">
            <h3>Contraste de color</h3>
            <p>
              Medido sobre los píxeles que el navegador dibuja, no sobre los colores declarados en
              el código. El borde de los campos y controles se mide aparte porque la norma le exige
              un mínimo distinto, de 3:1 contra el fondo que tiene al lado.
            </p>

            {/* La tabla desborda a lo ancho en un teléfono y su contenedor la
                desplaza. Un contenedor que se desplaza tiene que poder
                recibir el foco, o con teclado no hay forma de ver la columna
                que quedó afuera (WCAG 2.1.1). tabIndex lo hace alcanzable y
                el rol con nombre hace que el lector de pantalla lo anuncie
                como una región, en vez de dejar al usuario en un cuadro mudo
                que se mueve. */}
            <div
              className="tabla-scroll"
              tabIndex={0}
              role="region"
              aria-label="Relaciones de contraste medidas en el portal"
            >
              <table>
                <caption className="visualmente-oculto">
                  Relaciones de contraste medidas en el portal
                </caption>
                <thead>
                  <tr>
                    <th scope="col">Qué se midió</th>
                    <th scope="col">Contraste</th>
                  </tr>
                </thead>
                <tbody>
                  {CONTRASTES.map((fila) => (
                    <tr key={fila.que}>
                      <th scope="row" style={{ fontWeight: 400, background: "transparent" }}>
                        {fila.que}
                      </th>
                      <td>{fila.valor}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <h3>Tamaño de texto y áreas de toque</h3>
            <p>
              El cuerpo de texto del portal es de 17 píxeles. Medida la escala en una pantalla de
              360 píxeles de ancho, que es la de un teléfono chico: cuerpo 17, subtítulos 19,
              títulos de sección 26 y título de página 32.
            </p>
            <p>
              En pantallas táctiles, los controles más chicos —filtros, etiquetas de búsqueda,
              teléfonos de emergencia, enlaces del pie, redes sociales, paginación y migas de pan—
              se agrandan a 44 píxeles de alto. La norma pide 24 por 24; acá se subió a 44, que es
              el tamaño recomendado para uso táctil.
            </p>
          </div>
        </div>
      </section>

      <section className="seccion seccion--blanca">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Verificación</p>
              <h2>Qué no se verificó todavía</h2>
              <p>
                Este apartado pesa tanto como el anterior: es la razón por la que la conformidad se
                declara parcial y no plena.
              </p>
            </div>
          </div>

          <div className="prosa">
            <ul>
              <li>
                No se corrió ninguna herramienta automática de evaluación de accesibilidad sobre
                este portal.
              </li>
              <li>
                No se probó con ningún producto de apoyo: ni lector de pantalla, ni magnificador, ni
                control por voz. La navegación por teclado se probó a mano, sin lector.
              </li>
              <li>
                No hay una revisión criterio por criterio de WCAG 2.2 AA. Los criterios que sí se
                trabajaron de forma explícita son los de foco visible, contraste de elementos no
                textuales, tamaño del área de toque y uso del color como único portador de
                información.
              </li>
              <li>
                No se midió cómo se reacomoda el contenido a 320 píxeles de ancho ni con el zoom del
                navegador al 400%. Las mediciones se hicieron a 360 y 375 píxeles.
              </li>
              <li>No se probó el aumento del espaciado de texto ni el zoom de sólo texto al 200%.</li>
              <li>
                El indicador de foco de los campos de formulario y del buscador es distinto del
                general —un borde azul con halo, en vez del anillo de dos tonos— y es el único punto
                del sistema de foco que no tiene un contraste medido.
              </li>
              <li>
                No hubo evaluación externa ni auditoría de un tercero independiente, y no hay una
                fecha comprometida para hacerla.
              </li>
            </ul>
          </div>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Limitaciones</p>
              <h2>Limitaciones conocidas</h2>
            </div>
          </div>

          <div className="prosa">
            <h3>El contenido que se carga desde el gestor</h3>
            <p>
              Buena parte del texto de las fichas de trámite y de las páginas informativas se
              administra desde el gestor de contenidos del municipio, y llega pegado desde un
              procesador de texto. En los 72 contenidos que llegaron así hay 1.197 declaraciones de
              tipografía propia, 941 de color fijo, 725 de texto justificado, 297 de tamaño de letra
              en puntos y 232 de interlineado al 115%, además de 580 propiedades privadas del
              procesador.
            </p>
            <p>
              El portal neutraliza todo eso desde su hoja de estilos, sin modificar el contenido
              original, porque el municipio lo sigue administrando del mismo modo: el texto
              justificado se alinea a la izquierda, los colores fijos vuelven al color del portal, y
              la tipografía y el tamaño se unifican con el resto del sitio. Está verificado sobre los
              estilos que el navegador termina aplicando, y los centrados que estaban puestos a
              propósito quedan como estaban.
            </p>

            <h3>Lo que la hoja de estilos no puede corregir</h3>
            <div className="aviso aviso--alerta">
              <div>
                <p>
                  Estas cuatro cosas son contenido, no presentación. Ninguna regla de estilos las
                  puede inventar: se corrigen cargando el contenido de otra manera.
                </p>
              </div>
            </div>
            <ul>
              <li>
                El texto administrado se estructura con negrita en lugar de encabezados. En todo el
                contenido relevado hay 473 usos de negrita contra 3 encabezados reales. Para quien
                navega saltando de encabezado en encabezado, esas páginas no tienen estructura
                interna.
              </li>
              <li>
                De los 247 enlaces que hay dentro del contenido administrado, 196 abren una pestaña
                nueva sin avisarlo por texto. El aviso existe en los enlaces que arma el portal, no
                en los que se cargan desde el gestor.
              </li>
              <li>
                Las 112 imágenes del contenido administrado tienen el atributo de texto alternativo,
                pero en 17 está vacío: esas se anuncian como decorativas, aunque no lo sean. De las
                95 que sí tienen texto, muchas lo repiten en un segundo atributo, lo que en algunos
                lectores de pantalla produce un doble anuncio.
              </li>
              <li>
                De las 38 fotografías publicadas en las galerías, 12 tienen descripción cargada y 26
                están vacías. Esas 26 se publican como imágenes decorativas, así que un lector de
                pantalla las saltea.
              </li>
            </ul>

            <h3>Documentos adjuntos</h3>
            <p>
              43 de los contenidos publicados enlazan un documento PDF alojado en el servidor
              municipal: 22 son fichas de trámite, 13 son organigramas de áreas y 8 son páginas
              informativas. Ninguno de esos documentos fue revisado: no se sabe si tienen texto
              seleccionable, si están etiquetados o si son imágenes escaneadas. Que el grueso sean
              fichas de trámite importa, porque ahí es donde están los requisitos y los costos que
              el vecino viene a buscar. Si necesitás el contenido de alguno y el archivo no te
              sirve, escribí al área que lo publica.
            </p>

            <h3>Dependencia de JavaScript</h3>
            <p>
              Los desplegables del menú principal son botones que abre el navegador con JavaScript.
              Si JavaScript no está disponible, esos desplegables no se abren. El contenido sigue
              siendo alcanzable de otras formas: el pie de página enlaza parte de esas secciones,
              y están los índices completos de{" "}
              <Link href="/tramites">trámites y servicios</Link>,{" "}
              <Link href="/gobierno">áreas de gobierno</Link>,{" "}
              <Link href="/p">páginas informativas</Link> y{" "}
              <Link href="/galeria">galerías de imágenes</Link>.
            </p>
          </div>
        </div>
      </section>

      <section className="seccion seccion--blanca">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Alcance</p>
              <h2>Contenido fuera de alcance</h2>
              <p>
                Varios servicios del municipio son desarrollos distintos, con su propio dominio y
                sus propios responsables. El portal los enlaza pero no los controla, así que esta
                declaración no los cubre y no puede responder por ellos.
              </p>
            </div>
          </div>

          <div className="prosa">
            <ul>
              {FUERA_DE_ALCANCE.map((sistema) => (
                <li key={sistema.dominio}>
                  <strong>{sistema.nombre}</strong> — {sistema.dominio}
                </li>
              ))}
            </ul>
            <p>
              Si la barrera que encontraste está en alguno de ellos, contalo igual por los canales de
              abajo: el portal no lo puede arreglar, pero el municipio necesita saberlo igual.
            </p>
          </div>
        </div>
      </section>

      <section className="seccion">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Reportes</p>
              <h2>Cómo reportar una barrera</h2>
            </div>
          </div>

          <div className="prosa">
            <p>
              Si hay una página de este portal que no podés usar, escribinos. Un reporte concreto
              sirve más que cualquier revisión interna, porque señala el problema real y no el que
              nosotros suponemos.
            </p>
          </div>

          <div className="panel-lateral" style={{ maxWidth: "var(--ancho-texto)" }}>
            <h3>Correos de contacto</h3>
            <ul>
              {AREAS_DE_REPORTE.map((area) => (
                <li key={area.email} style={{ overflowWrap: "anywhere" }}>
                  <Link href={area.url}>{area.nombre}</Link>
                  <br />
                  <a href={`mailto:${area.email}`}>{area.email}</a>
                </li>
              ))}
            </ul>
          </div>

          <div className="prosa">
            <p>
              En <Link href="/contacto">contacto</Link> están el resto de los canales del municipio,
              con el domicilio, los teléfonos generales y el correo de cada área.
            </p>

            <h3>Qué conviene contar</h3>
            <p>
              Cuanto más preciso sea el reporte, antes se puede reproducir el problema. Si podés,
              incluí:
            </p>
            <ul>
              <li>La dirección de la página donde apareció el problema.</li>
              <li>Qué estabas tratando de hacer y qué pasó en cambio.</li>
              <li>Con qué navegador y en qué dispositivo —computadora, teléfono, tableta—.</li>
              <li>
                Si usás alguna tecnología de asistencia —lector de pantalla, magnificador, teclado
                sin mouse, control por voz—, cuál y qué versión.
              </li>
            </ul>
            <p>
              Todavía no hay un plazo de respuesta comprometido para este tipo de reportes, así que
              no se promete uno acá.
            </p>
          </div>
        </div>
      </section>

      <section className="seccion seccion--blanca">
        <div className="contenedor">
          <div className="seccion__cabecera">
            <div>
              <p className="seccion__kicker">Vigencia</p>
              <h2>Fecha de esta declaración</h2>
            </div>
          </div>

          <div className="prosa">
            <p>
              Esta declaración se redactó el {FECHA_DECLARACION} y describe el estado del portal a
              esa fecha. Las mediciones de contraste y de tipografía que publica provienen de la
              revisión de diseño hecha ese mismo día.
            </p>
            <p>
              La fecha se actualiza a mano, y solamente cuando se vuelve a revisar el portal. Si acá
              dice una fecha, es porque ese día alguien miró.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
