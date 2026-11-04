import Link from "next/link";
import type { PlayerSummary } from "@/lib/queries";
import { FollowButton } from "./follow-button";
import { PlayerAvatar } from "./player-avatar";

const fmtDate = (d: string) =>
  new Date(d + "T12:00:00Z").toLocaleDateString("es-ES", { weekday: "short", day: "numeric", month: "short" });

function Stat({ label, value, avg }: { label: string; value: number; avg?: number }) {
  const diff = avg === undefined ? 0 : value - avg;
  const trend = Math.abs(diff) < 1 ? "text-zinc-500" : diff > 0 ? "text-emerald-400" : "text-rose-400";
  return (
    <div className="rounded-lg bg-white/[0.03] px-2 py-2 text-center">
      <div className="text-2xl font-semibold tabular-nums">{value}</div>
      <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
      {avg !== undefined && (
        <div className={`text-[11px] tabular-nums ${trend}`}>
          {diff > 0 ? "▲" : diff < 0 ? "▼" : "•"} {avg.toFixed(1)}
        </div>
      )}
    </div>
  );
}

export function PlayerCard({ p }: { p: PlayerSummary }) {
  const g = p.last;
  const won = g && g.teamScore !== null && g.opponentScore !== null && g.teamScore > g.opponentScore;
  return (
    <Link
      href={`/jugadores/${p.id}`}
      className="group block rounded-2xl border border-white/10 bg-zinc-900/60 p-4 transition hover:border-white/20 hover:bg-zinc-900"
    >
      <div className="flex items-center gap-3">
        <PlayerAvatar src={p.headshot} name={p.name} />
        <div className="min-w-0 flex-1">
          <div className="truncate font-semibold group-hover:text-orange-300">{p.name}</div>
          <div className="text-sm text-zinc-400">
            {p.team ?? "—"} · {p.position ?? "—"}
          </div>
        </div>
        <FollowButton playerId={p.id} />
      </div>

      {g ? (
        <>
          <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
            <span className="capitalize">{fmtDate(g.date)}</span>
            <span>
              {g.isHome ? "vs" : "@"} {g.opponentAbbr}{" "}
              <span className={won ? "text-emerald-400" : "text-rose-400"}>
                {won ? "V" : "D"} {g.teamScore}-{g.opponentScore}
              </span>
            </span>
          </div>
          <div className="mt-2 grid grid-cols-3 gap-2">
            <Stat label="Pts" value={g.stats.pts} avg={p.season?.pts} />
            <Stat label="Reb" value={g.stats.reb} avg={p.season?.reb} />
            <Stat label="Ast" value={g.stats.ast} avg={p.season?.ast} />
          </div>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 tabular-nums">
            <span>{g.stats.min} MIN</span>
            <span>
              TC {g.stats.fgm}/{g.stats.fga}
            </span>
            <span>
              3P {g.stats.fg3m}/{g.stats.fg3a}
            </span>
            <span>
              TL {g.stats.ftm}/{g.stats.fta}
            </span>
            <span>{g.stats.stl} ROB</span>
            <span>{g.stats.blk} TAP</span>
            <span>
              {g.stats.plusMinus > 0 ? "+" : ""}
              {g.stats.plusMinus}
            </span>
          </div>
        </>
      ) : (
        <p className="mt-4 text-sm text-zinc-500">Sin partidos esta temporada todavía.</p>
      )}
    </Link>
  );
}
