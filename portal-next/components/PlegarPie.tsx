"use client";

import { useEffect } from "react";

/**
 * Pliega las columnas del pie en pantallas angostas.
 *
 * Por qué existe este componente, que es la única pizca de JavaScript de
 * cliente del portal:
 *
 * Un pie que de verdad funciona como directorio mide 3.092px en una pantalla
 * de 360px —cuatro pantallas de puro pie— y plegado mide 948px. La diferencia
 * justifica la excepción.
 *
 * El `open` de <details> es un atributo, no un estilo, así que CSS no puede
 * abrirlo ni cerrarlo. Se puede simular abrirlo con
 * `::details-content { content-visibility: visible }` —medido: la caja pasa de
 * 27 a 67px— pero `checkVisibility()` sigue dando `false`, o sea que el
 * navegador no lo considera visible y un lector de pantalla en escritorio
 * podría saltear el directorio entero. En un portal municipal eso no se
 * arriesga.
 *
 * Entonces el HTML se sirve con todo ABIERTO —que es el estado correcto si
 * JavaScript no corre— y esto lo cierra en teléfono.
 *
 * Va en un efecto y no en un <script> en el marcado por dos motivos que
 * aparecieron al probarlo: React no ejecuta los <script> que encuentra dentro
 * de un componente, y tocar el DOM antes de la hidratación deja el árbol
 * servido distinto del que React espera, un desajuste que React avisa que no
 * va a reparar. Corriendo después de hidratar no hay ninguna de las dos cosas.
 * El parpadeo no se ve: el pie está abajo de todo.
 */
export function PlegarPie() {
  useEffect(() => {
    // Mismo umbral que el @media del pie en styles/main.css. Si cambia uno,
    // cambia el otro: por debajo de 60rem las columnas son plegables y por
    // encima el rótulo vuelve a ser un título sin controles.
    const consulta = window.matchMedia("(max-width: 59.999rem)");

    const aplicar = () => {
      const columnas = document.querySelectorAll<HTMLDetailsElement>(".footer__col");
      for (const columna of columnas) columna.open = !consulta.matches;
    };

    aplicar();
    consulta.addEventListener("change", aplicar);
    return () => consulta.removeEventListener("change", aplicar);
  }, []);

  return null;
}
