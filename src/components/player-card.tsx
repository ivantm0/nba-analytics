import { ArrowDown, ArrowUp, Minus } from "lucide-react";
import Link from "next/link";
import { formatTipoff } from "@/lib/dates";
import type { DayEntry, DayGame, GameLine } from "@/lib/queries";
import type { Badge, NbaAverages } from "@/lib/sports/nba";
import { FollowButton } from "./follow-button";
import { GameBadges } from "./game-badges";
import { PlayerAvatar } from "./player-avatar";
import { RecentForm } from "./recent-form";

/** Valor del partido y diferencia con la media de la temporada */
function Stat({ label, value, avg }: { label: string; value: number; avg?: number }) {
  const diff = avg === undefined ? null : value - avg;
  const flat = diff !== null && Math.abs(diff) < 1;
  const Icon = diff === null || flat ? Minus : diff > 0 ? ArrowUp : ArrowDown;
  const tone = diff === null || flat ? "text-zinc-500" : diff > 0 ? "text-emerald-400" : "text-rose-400";
  return (
    <div className="rounded-xl bg-white/[0.04] px-2 pt-2.5 pb-2 text-center">
      <div className="text-2xl font-semibold leading-none tabular-nums">{value}</div>
      <div className="mt-1.5 text-[11px] font-medium uppercase tracking-wide text-zinc-500">{label}</div>
      {avg !== undefined && diff !== null && (
        <div
          className={`mt-1 inline-flex items-center gap-0.5 text-xs tabular-nums ${tone}`}
          title={`Media de la temporada: ${avg.toFixed(1)}`}
        >
          <Icon size={12} strokeWidth={2.5} aria-hidden />
          {diff > 0 ? "+" : ""}
          {diff.toFixed(1)}
          <span className="sr-only"> respecto a su media ({avg.toFixed(1)})</span>
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
    <span className={`font-medium tabular-nums ${won ? "text-emerald-400" : "text-rose-400"}`}>
      {won ? "V" : "D"} {team}-{opp}
    </span>
  );
}

function Played({ g, season, badges }: { g: GameLine; season: NbaAverages | null; badges: Badge[] }) {
  const s = g.stats;
  const secondary: [string, string][] = [
    ["Min", String(s.min)],
    ["TC", `${s.fgm}/${s.fga}`],
    ["3P", `${s.fg3m}/${s.fg3a}`],
    ["TL", `${s.ftm}/${s.fta}`],
    ["Rob", String(s.stl)],
    ["Tap", String(s.blk)],
    ["Pér", String(s.tov)],
    ["+/-", `${s.plusMinus > 0 ? "+" : ""}${s.plusMinus}`],
  ];
  return (
    <>
      <Matchup isHome={g.isHome} opponent={g.opponentAbbr}>
        <Result team={g.teamScore} opp={g.opponentScore} />
      </Matchup>
      <GameBadges badges={badges} className="mt-2.5" />
      <div className="mt-2.5 grid grid-cols-3 gap-2">
        <Stat label="Pts" value={s.pts} avg={season?.pts} />
        <Stat label="Reb" value={s.reb} avg={season?.reb} />
        <Stat label="Ast" value={s.ast} avg={season?.ast} />
      </div>
      <dl className="mt-3 grid grid-cols-4 gap-x-2 gap-y-2 px-1 text-center">
        {secondary.map(([label, value]) => (
          <div key={label}>
            <dt className="text-[10px] font-medium uppercase tracking-wide text-zinc-500">{label}</dt>
            <dd className="text-sm tabular-nums text-zinc-300">{value}</dd>
          </div>
        ))}
      </dl>
    </>
  );
}

function DayBody({ day, season }: { day: DayGame; season: NbaAverages | null }) {
  switch (day.kind) {
    case "played":
      return <Played g={day.line} season={season} badges={day.badges} />;
    case "scheduled":
      return (
        <Matchup isHome={day.isHome} opponent={day.opponentAbbr}>
          <span className="rounded-full bg-sky-400/10 px-2.5 py-0.5 tabular-nums text-sky-300">
            {formatTipoff(day.startTime)}
          </span>
        </Matchup>
      );
    case "live":
      return (
        <Matchup isHome={day.isHome} opponent={day.opponentAbbr}>
          <span className="flex items-center gap-2">
            <span className="h-2 w-2 animate-pulse rounded-full bg-rose-500" aria-hidden />
            <span className="sr-only">En directo:</span>
            <span className="font-medium tabular-nums text-zinc-100">
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
    <article
      className={`group relative rounded-2xl border border-white/10 bg-zinc-900/60 p-4 transition focus-within:border-white/25 hover:border-white/20 hover:bg-zinc-900 ${
        resting ? "opacity-60 focus-within:opacity-100 hover:opacity-100" : ""
      }`}
    >
      <div className="flex items-center gap-3">
        <PlayerAvatar src={p.headshot} name={p.name} />
        <div className="min-w-0 flex-1">
          {/* Enlace "estirado": toda la tarjeta lleva a la ficha, sin anidar el botón dentro del enlace */}
          <Link
            href={`/jugadores/${p.id}`}
            className="block truncate font-semibold outline-none after:absolute after:inset-0 after:rounded-2xl group-hover:text-orange-300 focus-visible:after:outline-2 focus-visible:after:outline-offset-2 focus-visible:after:outline-orange-400"
          >
            {p.name}
          </Link>
          <div className="text-sm text-zinc-400">
            {p.team ?? "—"} · {p.position ?? "—"}
          </div>
        </div>
        <FollowButton playerId={p.id} compact />
      </div>
      <DayBody day={p.day} season={p.season} />
      <RecentForm games={p.recent} avg={p.season?.pts} />
    </article>
  );
}
