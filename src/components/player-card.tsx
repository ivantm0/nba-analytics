import Link from "next/link";
import { formatTipoff } from "@/lib/dates";
import type { DayEntry, DayGame, GameLine } from "@/lib/queries";
import type { NbaAverages } from "@/lib/sports/nba";
import { FollowButton } from "./follow-button";
import { PlayerAvatar } from "./player-avatar";

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

function Matchup({ isHome, opponent, children }: { isHome: boolean; opponent: string; children?: React.ReactNode }) {
  return (
    <div className="mt-4 flex items-center justify-between text-sm text-zinc-400">
      <span>
        {isHome ? "vs" : "@"} <span className="font-medium text-zinc-200">{opponent}</span>
      </span>
      {children}
    </div>
  );
}

function Result({ team, opp }: { team: number | null; opp: number | null }) {
  const won = (team ?? 0) > (opp ?? 0);
  return (
    <span className={won ? "text-emerald-400" : "text-rose-400"}>
      {won ? "V" : "D"} {team}-{opp}
    </span>
  );
}

function Played({ g, season }: { g: GameLine; season: NbaAverages | null }) {
  return (
    <>
      <Matchup isHome={g.isHome} opponent={g.opponentAbbr}>
        <Result team={g.teamScore} opp={g.opponentScore} />
      </Matchup>
      <div className="mt-2 grid grid-cols-3 gap-2">
        <Stat label="Pts" value={g.stats.pts} avg={season?.pts} />
        <Stat label="Reb" value={g.stats.reb} avg={season?.reb} />
        <Stat label="Ast" value={g.stats.ast} avg={season?.ast} />
      </div>
      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-zinc-400 tabular-nums">
        <span>{g.stats.min} MIN</span>
        <span>TC {g.stats.fgm}/{g.stats.fga}</span>
        <span>3P {g.stats.fg3m}/{g.stats.fg3a}</span>
        <span>TL {g.stats.ftm}/{g.stats.fta}</span>
        <span>{g.stats.stl} ROB</span>
        <span>{g.stats.blk} TAP</span>
        <span>{g.stats.plusMinus > 0 ? "+" : ""}{g.stats.plusMinus}</span>
      </div>
    </>
  );
}

function DayBody({ day, season }: { day: DayGame; season: NbaAverages | null }) {
  switch (day.kind) {
    case "played":
      return <Played g={day.line} season={season} />;
    case "scheduled":
      return (
        <Matchup isHome={day.isHome} opponent={day.opponentAbbr}>
          <span className="rounded-full bg-sky-400/10 px-2.5 py-0.5 text-sky-300">
            {formatTipoff(day.startTime)}
          </span>
        </Matchup>
      );
    case "live":
      return (
        <Matchup isHome={day.isHome} opponent={day.opponentAbbr}>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" />
            <span className="tabular-nums text-zinc-200">
              {day.teamScore}-{day.opponentScore}
            </span>
            <span className="text-xs">{day.statusDetail}</span>
          </span>
        </Matchup>
      );
    case "final":
      // Acabado pero aún sin cargar en la base de datos (o el jugador no salió a pista)
      return (
        <>
          <Matchup isHome={day.isHome} opponent={day.opponentAbbr}>
            <Result team={day.teamScore} opp={day.opponentScore} />
          </Matchup>
          <p className="mt-3 text-sm text-zinc-500">No jugó o sus estadísticas aún no están cargadas.</p>
        </>
      );
    case "none":
      return <p className="mt-4 text-sm text-zinc-500">Sin partido este día.</p>;
  }
}

export function PlayerCard({ p }: { p: DayEntry }) {
  const resting = p.day.kind === "none";
  return (
    <Link
      href={`/jugadores/${p.id}`}
      className={`group block rounded-2xl border border-white/10 bg-zinc-900/60 p-4 transition hover:border-white/20 hover:bg-zinc-900 ${
        resting ? "opacity-60 hover:opacity-100" : ""
      }`}
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
      <DayBody day={p.day} season={p.season} />
    </Link>
  );
}
