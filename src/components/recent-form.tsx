import type { RecentGame } from "@/lib/queries";

const fmt = (d: string) => d.slice(8) + "/" + d.slice(5, 7);

/**
 * Puntos de los últimos 5 partidos (el más reciente a la derecha).
 * Cada valor se tiñe según quede por encima o por debajo de la media de la temporada.
 */
export function RecentForm({ games, avg }: { games: RecentGame[]; avg: number | undefined }) {
  if (games.length === 0) return null;
  return (
    <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/5 pt-3">
      <span className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">
        Pts últimos {games.length}
      </span>
      <ol className="flex gap-1">
        {games.map((g, i) => {
          const last = i === games.length - 1;
          const tone =
            avg === undefined || Math.abs(g.pts - avg) < 1
              ? "text-zinc-300"
              : g.pts > avg
                ? "text-emerald-300"
                : "text-rose-300";
          return (
            <li
              key={g.date}
              title={`${fmt(g.date)} vs ${g.opponentAbbr}: ${g.pts} pts, ${g.reb} reb, ${g.ast} ast`}
              className={`min-w-8 rounded-md px-1.5 py-0.5 text-center text-sm tabular-nums ${tone} ${
                last ? "bg-white/10 font-semibold" : "bg-white/[0.03]"
              }`}
            >
              {g.pts}
            </li>
          );
        })}
      </ol>
    </div>
  );
}
