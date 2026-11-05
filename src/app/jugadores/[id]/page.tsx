import { notFound } from "next/navigation";
import { FollowButton } from "@/components/follow-button";
import { GameBadges } from "@/components/game-badges";
import { PlayerAvatar } from "@/components/player-avatar";
import { TrendChart } from "@/components/trend-chart";
import { withDb } from "@/db";
import { playerDetail } from "@/lib/queries";

export const revalidate = 3600;

const pct = (v: number | null) => (v === null ? "—" : `${(v * 100).toFixed(1)}%`);

export default async function PlayerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const p = await withDb(() => playerDetail(Number(id)));
  if (!p) notFound();
  const s = p.season;

  const averagesRow = s
    ? [
        ["PJ", s.games.toString()],
        ["MIN", s.min.toFixed(1)],
        ["PTS", s.pts.toFixed(1)],
        ["REB", s.reb.toFixed(1)],
        ["AST", s.ast.toFixed(1)],
        ["ROB", s.stl.toFixed(1)],
        ["TAP", s.blk.toFixed(1)],
        ["TC%", pct(s.fgPct)],
        ["3P%", pct(s.fg3Pct)],
      ]
    : [];

  return (
    <>
      <div className="flex flex-wrap items-center gap-4">
        <PlayerAvatar src={p.headshot} name={p.name} size={88} />
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight text-balance sm:text-3xl">{p.name}</h1>
          <p className="text-zinc-400">
            {p.team ?? "—"} · {p.position ?? "—"}
          </p>
        </div>
        <FollowButton playerId={p.id} />
      </div>

      {s && (
        <section className="mt-8">
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Medias de la temporada</h2>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 lg:grid-cols-9">
            {averagesRow.map(([label, value]) => (
              <div key={label} className="rounded-xl border border-white/10 bg-zinc-900/60 p-3 text-center">
                <div className="text-xl font-semibold tabular-nums">{value}</div>
                <div className="text-[11px] uppercase tracking-wide text-zinc-500">{label}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <TrendChart log={p.log} />

      <section className="mt-8">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-zinc-400">Partidos</h2>
        <div className="overflow-x-auto rounded-xl border border-white/10">
          <table className="w-full text-sm whitespace-nowrap tabular-nums">
            <thead className="bg-zinc-900 text-left text-xs uppercase tracking-wide text-zinc-500">
              <tr>
                {["Fecha", "Rival", "Res.", "MIN", "PTS", "REB", "AST", "ROB", "TAP", "PER", "TC", "3P", "TL", "+/-", "Hitos"].map((h) => (
                  <th key={h} className="px-3 py-2 font-medium">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {p.log.map((g) => {
                const won = (g.teamScore ?? 0) > (g.opponentScore ?? 0);
                return (
                  <tr key={g.gameId} className="transition-colors hover:bg-white/[0.03]">
                    <td className="px-3 py-2 text-zinc-400">{g.date.slice(5).split("-").reverse().join("/")}</td>
                    <td className="px-3 py-2">
                      {g.isHome ? "vs" : "@"} {g.opponentAbbr}
                    </td>
                    <td className={`px-3 py-2 ${won ? "text-emerald-400" : "text-rose-400"}`}>
                      {won ? "V" : "D"} {g.teamScore}-{g.opponentScore}
                    </td>
                    <td className="px-3 py-2">{g.stats.min}</td>
                    <td className="px-3 py-2 font-semibold">{g.stats.pts}</td>
                    <td className="px-3 py-2">{g.stats.reb}</td>
                    <td className="px-3 py-2">{g.stats.ast}</td>
                    <td className="px-3 py-2">{g.stats.stl}</td>
                    <td className="px-3 py-2">{g.stats.blk}</td>
                    <td className="px-3 py-2">{g.stats.tov}</td>
                    <td className="px-3 py-2">{g.stats.fgm}/{g.stats.fga}</td>
                    <td className="px-3 py-2">{g.stats.fg3m}/{g.stats.fg3a}</td>
                    <td className="px-3 py-2">{g.stats.ftm}/{g.stats.fta}</td>
                    <td className="px-3 py-2">{g.stats.plusMinus > 0 ? "+" : ""}{g.stats.plusMinus}</td>
                    <td className="px-3 py-1.5">
                      <GameBadges badges={g.badges} className="flex-nowrap" />
                    </td>
                  </tr>
                );
              })}
              {p.log.length === 0 && (
                <tr>
                  <td colSpan={15} className="px-3 py-6 text-center text-zinc-500">
                    Sin partidos esta temporada.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </section>
    </>
  );
}
