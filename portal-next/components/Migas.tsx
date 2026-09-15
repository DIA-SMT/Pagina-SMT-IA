import Link from "next/link";

export type Miga = { texto: string; url?: string };

/** Migas de pan. El último elemento va sin url y se marca como página actual. */
export function Migas({ migas }: { migas: Miga[] }) {
  return (
    <nav className="migas" aria-label="Ruta de navegación">
      <div className="contenedor">
        <ol>
          {migas.map((m, i) => (
            <li key={`${m.texto}-${i}`}>
              {m.url ? <Link href={m.url}>{m.texto}</Link> : <span aria-current="page">{m.texto}</span>}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
}
