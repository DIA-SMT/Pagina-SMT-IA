"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";

import { Icono } from "./Iconos";
import { CIDITUC, NAV } from "@/lib/navegacion";

/**
 * Encabezado del portal.
 *
 * Accesibilidad: los desplegables son <button> con aria-expanded, se cierran
 * con Escape y al perder el foco. El panel móvil es un diálogo con trampa de
 * foco y devuelve el foco al botón que lo abrió.
 */
export function Encabezado() {
  const [abierto, setAbierto] = useState<number | null>(null);
  const [movil, setMovil] = useState(false);
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
      <header className="header">
        <div className="contenedor header__inner">
          <Link className="header__logo" href="/" aria-label="Inicio — Municipalidad de San Miguel de Tucumán">
            <Image src="/img/logo-smt-pos.png" alt="Ciudad San Miguel de Tucumán" width={245} height={80} priority />
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
            <Link className="boton-buscar solo-desktop" href="/buscar" aria-label="Buscar en el portal" style={{ textDecoration: "none" }}>
              <Icono nombre="buscar" tamano={20} />
            </Link>
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
