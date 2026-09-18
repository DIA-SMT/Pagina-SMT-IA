"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { Icono } from "./Iconos";
import { Tema } from "./Tema";
import { CIDITUC, NAV } from "@/lib/navegacion";

/**
 * Encabezado del portal.
 *
 * Accesibilidad: los desplegables son <button> con aria-expanded, se cierran
 * con Escape y al perder el foco. El panel móvil es un diálogo con trampa de
 * foco y devuelve el foco al botón que lo abrió.
 *
 * SE PLIEGA AL BAJAR Y VUELVE AL SUBIR. Además cuelga de su borde inferior una
 * lengüeta que lo trae de vuelta desde cualquier parte de la página. La
 * lengüeta va pegada al encabezado y no fija al viewport a propósito: cuando
 * el encabezado se corre hacia arriba, ella queda justo en el borde de la
 * pantalla, que es donde uno la busca. Un solo elemento, sin sincronizar dos
 * posiciones.
 *
 * TRES RESGUARDOS QUE NO SON ADORNO:
 *
 * - Si el foco entra al encabezado plegado —tabulando— se despliega solo. Sin
 *   esto, quien usa teclado tabula hacia enlaces que no ve.
 * - No se pliega con un desplegable o el panel móvil abiertos: esconder un
 *   menú abierto debajo del borde es desorientador.
 * - Con prefers-reduced-motion no se desliza: aparece y desaparece de una.
 */
export function Encabezado() {
  const [abierto, setAbierto] = useState<number | null>(null);
  const [movil, setMovil] = useState(false);
  /** Plegado hacia arriba. */
  const [plegado, setPlegado] = useState(false);
  /** Ya se bajó lo suficiente como para que la lengüeta tenga sentido. */
  const [desplazado, setDesplazado] = useState(false);
  const navRef = useRef<HTMLElement>(null);
  const ruta = usePathname();

  // Al navegar se cierra todo. Se ajusta DURANTE el render comparando con la
  // ruta anterior, no desde un efecto: es el patrón que recomienda React para
  // derivar estado de un cambio de prop, y evita el render en cascada que
  // marca la regla react-hooks/set-state-in-effect.
  const [rutaPrevia, setRutaPrevia] = useState(ruta);
  if (ruta !== rutaPrevia) {
    setRutaPrevia(ruta);
    setAbierto(null);
    setMovil(false);
  }

  // Un desplegable o el panel abiertos congelan el plegado: esconder un menú
  // abierto debajo del borde de la pantalla desorienta.
  const hayAlgoAbierto = abierto !== null || movil;

  useEffect(() => {
    if (hayAlgoAbierto) return;
    // UMBRAL: 120px. Por debajo de eso el encabezado siempre se ve, así que un
    // rebote de scroll arriba de todo no lo hace parpadear.
    const UMBRAL = 120;
    // MINIMO: 6px de movimiento antes de reaccionar. Sin esto, el temblor de
    // un trackpad alterna plegado y desplegado varias veces por segundo.
    const MINIMO = 6;
    let ultimo = window.scrollY;
    const alScrollear = () => {
      const y = window.scrollY;
      setDesplazado(y > UMBRAL);
      if (y <= UMBRAL) setPlegado(false);
      else if (y > ultimo + MINIMO) setPlegado(true);
      else if (y < ultimo - MINIMO) setPlegado(false);
      ultimo = y;
    };
    alScrollear();
    window.addEventListener("scroll", alScrollear, { passive: true });
    return () => window.removeEventListener("scroll", alScrollear);
  }, [hayAlgoAbierto]);

  useEffect(() => {
    function fuera(e: MouseEvent) {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setAbierto(null);
    }
    function escape(e: KeyboardEvent) {
      if (e.key === "Escape") setAbierto(null);
    }
    document.addEventListener("click", fuera);
    document.addEventListener("keydown", escape);
    return () => {
      document.removeEventListener("click", fuera);
      document.removeEventListener("keydown", escape);
    };
  }, []);

  return (
    <>
      <header
        className="header"
        id="encabezado"
        data-plegado={plegado ? "" : undefined}
        // Si el foco entra estando plegado, se despliega: nadie debería
        // tabular hacia enlaces que no ve.
        onFocusCapture={() => setPlegado(false)}
      >
        <div className="contenedor header__inner">
          <Link className="header__logo" href="/" aria-label="Inicio — Municipalidad de San Miguel de Tucumán">
            <Image
              src="/img/logo-smt-pos.png"
              alt="Ciudad San Miguel de Tucumán"
              width={245}
              height={80}
              priority
            />
          </Link>

          <nav className="nav" aria-label="Navegación principal" ref={navRef}>
            <ul>
              {NAV.map((seccion, i) => (
                <li key={seccion.titulo} className={`nav__item${abierto === i ? " nav__item--abierto" : ""}`}>
                  {seccion.hijos ? (
                    <>
                      <button
                        className="nav__enlace"
                        type="button"
                        aria-expanded={abierto === i}
                        aria-controls={`submenu-${i}`}
                        onClick={() => setAbierto(abierto === i ? null : i)}
                      >
                        {seccion.titulo}
                        <Icono nombre="chevron" tamano={16} />
                      </button>
                      <ul className="nav__submenu" id={`submenu-${i}`}>
                        {seccion.hijos.map((hijo) => (
                          <li key={hijo.url}>
                            <EnlaceNav {...hijo} />
                          </li>
                        ))}
                      </ul>
                    </>
                  ) : (
                    <EnlaceNav {...seccion} url={seccion.url!} className="nav__enlace" />
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <div className="header__acciones">
            {/* La cápsula agrupa SÓLO el tema y la búsqueda, que son las dos
                utilidades. Antes el borde y el fondo estaban en
                .header__acciones, que también contiene CiDiTuc y el botón de
                menú: quedaba una píldora azul metida adentro de una funda
                blanca. Medido a 1280: la cápsula iba de x=1003 a x=1240 y
                CiDiTuc arrancaba en x=1101, o sea adentro. */}
            <div className="header__utilidades">
              <Tema />
              <Link className="boton-buscar" href="/buscar" aria-label="Buscar en el portal">
                {/* 20 y no 18: los dos iconos de la cápsula van juntos y del
                    mismo tamaño. Entre 64 y 80rem el rótulo no está y quedan
                    uno al lado del otro, donde la diferencia se nota. */}
                <Icono nombre="buscar" tamano={20} />
                {/* El rótulo aparece recién a 80rem. Medido: a 1024 el
                    encabezado ya va lleno —logo 114 + menú 588 + acciones 219
                    + dos gaps de 24 = 969, que es exactamente el ancho del
                    contenedor— y a 1280 sobran 196px. */}
                <span className="boton-buscar__texto">Buscar</span>
              </Link>
            </div>
            <a className="boton-cidituc" href={CIDITUC} rel="noopener" target="_blank" data-externo>
              <Icono nombre="cidituc" tamano={18} />
              CiDiTuc
              <span className="visualmente-oculto">(se abre en otra pestaña)</span>
            </a>
            <button
              className="boton-menu"
              type="button"
              aria-expanded={movil}
              aria-controls="panel-movil"
              onClick={() => setMovil(true)}
            >
              <Icono nombre="menu" tamano={20} />
              Menú
            </button>
          </div>
        </div>

        {/* La lengüeta cuelga del borde inferior, así que al plegarse el
            encabezado ella queda en el borde de la pantalla. Aparece recién
            después del umbral para no ensuciar el arranque de la página. */}
        {desplazado && (
          <button
            type="button"
            className="header__lengueta"
            aria-expanded={!plegado}
            aria-controls="encabezado"
            aria-label={plegado ? "Mostrar el menú" : "Ocultar el menú"}
            onClick={() => setPlegado((v) => !v)}
          >
            <Icono nombre="chevron" tamano={16} />
          </button>
        )}
      </header>

      {movil && <PanelMovil cerrar={() => setMovil(false)} />}
    </>
  );
}

function EnlaceNav({
  titulo,
  url,
  externo,
  className,
}: {
  titulo: string;
  url: string;
  externo?: boolean;
  className?: string;
}) {
  if (externo) {
    return (
      <a href={url} className={className} rel="noopener" target="_blank" data-externo>
        {titulo}
        <span className="visualmente-oculto"> (se abre en otra pestaña)</span>
      </a>
    );
  }
  return (
    <Link href={url} className={className}>
      {titulo}
    </Link>
  );
}

function PanelMovil({ cerrar }: { cerrar: () => void }) {
  const caja = useRef<HTMLDivElement>(null);
  const [acordeon, setAcordeon] = useState<number | null>(null);

  useEffect(() => {
    const previo = document.activeElement as HTMLElement | null;
    document.body.style.overflow = "hidden";
    caja.current?.querySelector<HTMLElement>("button, a")?.focus();

    function teclas(e: KeyboardEvent) {
      if (e.key === "Escape") return cerrar();
      if (e.key !== "Tab" || !caja.current) return;
      const focables = caja.current.querySelectorAll<HTMLElement>('a[href], button:not([disabled]), input');
      if (!focables.length) return;
      const primero = focables[0];
      const ultimo = focables[focables.length - 1];
      if (e.shiftKey && document.activeElement === primero) {
        e.preventDefault();
        ultimo.focus();
      } else if (!e.shiftKey && document.activeElement === ultimo) {
        e.preventDefault();
        primero.focus();
      }
    }

    document.addEventListener("keydown", teclas);
    return () => {
      document.removeEventListener("keydown", teclas);
      document.body.style.overflow = "";
      previo?.focus();
    };
  }, [cerrar]);

  return (
    <div className="panel-movil" id="panel-movil" data-abierto role="dialog" aria-modal="true" aria-label="Menú de navegación">
      <button className="panel-movil__fondo" type="button" onClick={cerrar} tabIndex={-1} aria-hidden="true" />
      <div className="panel-movil__caja" ref={caja}>
        <div className="panel-movil__cierre">
          <Image src="/img/logo-smt-pos.png" alt="" width={130} height={42} />
          <button className="boton-buscar" type="button" onClick={cerrar} aria-label="Cerrar menú">
            <Icono nombre="cerrar" tamano={18} />
          </button>
        </div>

        <nav aria-label="Navegación móvil">
          <ul>
            {NAV.map((seccion, i) => (
              <li key={seccion.titulo}>
                {seccion.hijos ? (
                  <>
                    <button
                      className="acordeon__boton"
                      type="button"
                      aria-expanded={acordeon === i}
                      aria-controls={`acordeon-${i}`}
                      onClick={() => setAcordeon(acordeon === i ? null : i)}
                    >
                      {seccion.titulo}
                      <Icono nombre="chevron" tamano={18} />
                    </button>
                    <div className="acordeon__panel" id={`acordeon-${i}`} hidden={acordeon !== i}>
                      <ul>
                        {seccion.hijos.map((hijo) => (
                          <li key={hijo.url}>
                            <EnlaceNav {...hijo} />
                          </li>
                        ))}
                      </ul>
                    </div>
                  </>
                ) : (
                  <EnlaceNav {...seccion} url={seccion.url!} />
                )}
              </li>
            ))}
            <li>
              <a href={CIDITUC} rel="noopener" style={{ color: "var(--c-azul-700)" }}>
                CiDiTuc — Ciudad Digital
              </a>
            </li>
          </ul>
        </nav>

        <form className="buscador-hero" action="/buscar" method="get" role="search" style={{ marginTop: "var(--sp-5)" }}>
          <label className="visualmente-oculto" htmlFor="buscar-movil">Buscar en el portal</label>
          <input id="buscar-movil" type="search" name="q" placeholder="¿Qué necesitás hacer?" required />
          <button className="boton boton--primario" type="submit">Buscar</button>
        </form>
      </div>
    </div>
  );
}
