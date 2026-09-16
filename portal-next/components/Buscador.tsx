"use client";

import { useId, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { Icono } from "./Iconos";
import type { EntradaIndice } from "@/lib/indice";

/** Cuántas sugerencias se muestran. Más de seis y la lista tapa la página. */
const MAXIMO = 6;
/** Debajo de dos letras cualquier cosa coincide con todo. */
const MINIMO = 2;

/**
 * Quita acentos para comparar, sin cambiar el largo del texto.
 *
 * El largo importa: el resaltado usa la posición encontrada en el texto
 * normalizado para cortar el ORIGINAL. Con caracteres precompuestos —que es
 * como los guarda el CMS— NFD más el descarte de las marcas devuelve un
 * carácter por carácter, así que las posiciones coinciden.
 */
function normalizar(s: string): string {
  return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "");
}

/**
 * Buscador con sugerencias de la portada.
 *
 * Por qué existe y por qué es de cliente: es la puerta principal del portal.
 * Entran 2.210 personas por día a la portada y la página más visitada del
 * sitio es una sola ficha, "Licencia de conducir", con 831 visitas diarias.
 * Hasta ahora había que escribir, apretar Buscar, esperar una página de
 * resultados y recién ahí elegir. Ahora contesta mientras se escribe.
 *
 * El índice viaja con el HTML en vez de consultarse por red en cada tecla:
 * el servidor municipal tarda entre 0,8 y 6,7 segundos por pedido, así que
 * un buscador que dependiera de él sería más lento que el formulario que
 * reemplaza.
 *
 * Sin JavaScript sigue funcionando: el <form> mantiene su action a /buscar,
 * que es exactamente lo que hacía antes.
 */
export function Buscador({ indice }: { indice: EntradaIndice[] }) {
  const router = useRouter();
  const id = useId();
  const campo = useRef<HTMLInputElement>(null);
  const [consulta, setConsulta] = useState("");
  const [abierto, setAbierto] = useState(false);
  const [activo, setActivo] = useState(-1);

  const sugerencias = useMemo(() => {
    const n = normalizar(consulta.trim());
    if (n.length < MINIMO) return [];

    const puntuadas: { e: EntradaIndice; p: number }[] = [];
    for (const e of indice) {
      const t = normalizar(e.t);
      let p: number;
      // El orden de los tres casos es la mitad del valor del buscador. Con
      // coincidencia simple, "lic" devolvía "Espacios Públicos" antes que
      // "Licencia de Conducir".
      if (t.startsWith(n)) p = 1000;
      else if (t.split(/\s+/).some((w) => w.startsWith(n))) p = 500;
      else if (t.includes(n)) p = 100;
      else continue;
      // El tráfico medido desempata. Logarítmico para que las 831 visitas de
      // la licencia no aplasten todo lo demás.
      puntuadas.push({ e, p: p + Math.log1p(e.v ?? 0) * 40 });
    }

    return puntuadas
      .sort((a, b) => b.p - a.p)
      .slice(0, MAXIMO)
      .map((x) => x.e);
  }, [consulta, indice]);

  const listaVisible = abierto && consulta.trim().length >= MINIMO;

  function ir(entrada: EntradaIndice) {
    setAbierto(false);
    router.push(entrada.u);
  }

  function alTeclear(e: React.KeyboardEvent<HTMLInputElement>) {
    if (!listaVisible || sugerencias.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActivo((i) => (i + 1) % sugerencias.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActivo((i) => (i - 1 + sugerencias.length) % sugerencias.length);
    } else if (e.key === "Enter" && activo >= 0) {
      // Sólo se intercepta el Enter cuando hay una sugerencia elegida con las
      // flechas. Si no, el formulario hace lo de siempre y va a /buscar.
      e.preventDefault();
      ir(sugerencias[activo]);
    } else if (e.key === "Escape") {
      setAbierto(false);
      setActivo(-1);
    }
  }

  /** Marca en negrita el tramo que la persona escribió. */
  function resaltar(titulo: string) {
    const n = normalizar(consulta.trim());
    const i = normalizar(titulo).indexOf(n);
    if (i < 0) return titulo;
    return (
      <>
        {titulo.slice(0, i)}
        <b>{titulo.slice(i, i + n.length)}</b>
        {titulo.slice(i + n.length)}
      </>
    );
  }

  return (
    <div
      className="buscador-vivo"
      onBlur={(e) => {
        // Se cierra al salir del conjunto, no de cada control: si no, tocar
        // una sugerencia la cerraría antes de que el clic llegue.
        if (!e.currentTarget.contains(e.relatedTarget as Node)) setAbierto(false);
      }}
    >
      <form className="buscador-hero" action="/buscar" method="get" role="search">
        <label className="visualmente-oculto" htmlFor={id}>
          Buscar trámites, servicios e información
        </label>
        <input
          id={id}
          ref={campo}
          type="search"
          name="q"
          placeholder="¿Qué necesitás hacer?"
          autoComplete="off"
          required
          value={consulta}
          onChange={(e) => {
            setConsulta(e.target.value);
            setAbierto(true);
            setActivo(-1);
          }}
          onFocus={() => setAbierto(true)}
          onKeyDown={alTeclear}
          role="combobox"
          aria-expanded={listaVisible}
          aria-controls={`${id}-lista`}
          aria-autocomplete="list"
          aria-activedescendant={activo >= 0 ? `${id}-op-${activo}` : undefined}
        />
        <button className="boton boton--primario" type="submit">
          <Icono nombre="buscar" tamano={18} />
          <span>Buscar</span>
        </button>
      </form>

      {listaVisible ? (
        <ul className="sugerencias" id={`${id}-lista`} role="listbox" aria-label="Sugerencias">
          {sugerencias.length === 0 ? (
            <li className="sugerencias__vacio">
              No encontramos nada con «{consulta.trim()}». Probá con otra palabra, o apretá
              Buscar para ver todos los resultados.
            </li>
          ) : (
            sugerencias.map((s, i) => (
              <li
                key={s.u + s.t}
                id={`${id}-op-${i}`}
                className="sugerencia"
                role="option"
                aria-selected={i === activo}
                onMouseEnter={() => setActivo(i)}
                onMouseDown={(e) => {
                  // mousedown y no click: el click llega después del blur del
                  // campo, y para entonces la lista ya se cerró.
                  e.preventDefault();
                  ir(s);
                }}
              >
                <span className="sugerencia__t">{resaltar(s.t)}</span>
                <span className="sugerencia__d">{s.d}</span>
                {s.v && s.v >= 100 ? <span className="sugerencia__chip">Más buscado</span> : null}
              </li>
            ))
          )}
        </ul>
      ) : null}
    </div>
  );
}
