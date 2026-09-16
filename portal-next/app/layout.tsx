import type { Metadata } from "next";
import "./globals.css";

import { Encabezado } from "@/components/Encabezado";
import { PieDePagina } from "@/components/PieDePagina";
import { SpriteIconos } from "@/components/Iconos";
import { SITIO } from "@/lib/sitio";

export const metadata: Metadata = {
  metadataBase: new URL(SITIO),
  title: {
    default: "Ciudad San Miguel de Tucumán",
    template: "%s | Ciudad San Miguel de Tucumán",
  },
  description:
    "Portal oficial de la Municipalidad de San Miguel de Tucumán: trámites, servicios, gobierno e información para vecinos y vecinas.",
  openGraph: {
    type: "website",
    locale: "es_AR",
    siteName: "Ciudad San Miguel de Tucumán",
  },
  icons: { icon: "/img/favicon.png" },
};

/**
 * Aplica el tema elegido ANTES de que el navegador pinte.
 *
 * Sin esto, quien eligió oscuro ve la página clara durante una fracción de
 * segundo y después el cambio de golpe. Es el defecto más visible de cualquier
 * tema oscuro mal hecho y no se puede arreglar desde React: para cuando el
 * componente monta, el primer cuadro ya se dibujó.
 *
 * Va en el <head>, sin async ni defer, a propósito: tiene que bloquear el
 * pintado. Son cuatro líneas.
 *
 * Si no hay nada elegido no estampa nada, y ahí manda prefers-color-scheme,
 * que es el comportamiento correcto por defecto: el sistema de la persona.
 */
const TEMA_SIN_DESTELLO = `
try {
  var t = localStorage.getItem("tema");
  if (t === "dark" || t === "light") document.documentElement.dataset.theme = t;
} catch (e) {}
`;

/*
 * suppressHydrationWarning va sólo en el <html> y es necesario, no un parche
 * para tapar un error: el script de arriba estampa data-theme antes de que
 * React hidrate, así que ese atributo nunca va a coincidir con el del HTML
 * servido. Es la contrapartida de no tener destello, y React ofrece esta marca
 * justamente para eso. Afecta únicamente a los atributos de ese elemento; el
 * resto del árbol sigue avisando normalmente.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: TEMA_SIN_DESTELLO }} />
      </head>
      <body>
        <a className="saltar-contenido" href="#contenido">
          Saltar al contenido principal
        </a>

        <SpriteIconos />
        <Encabezado />

        <main id="contenido">{children}</main>

        <PieDePagina />
      </body>
    </html>
  );
}
