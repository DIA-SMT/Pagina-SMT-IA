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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es-AR">
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
