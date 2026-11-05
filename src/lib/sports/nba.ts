import { z } from "zod";

export const nbaStatsSchema = z.object({
  min: z.number(),
  pts: z.number(),
  reb: z.number(),
  oreb: z.number(),
  dreb: z.number(),
  ast: z.number(),
  stl: z.number(),
  blk: z.number(),
  tov: z.number(),
  pf: z.number(),
  fgm: z.number(),
  fga: z.number(),
  fg3m: z.number(),
  fg3a: z.number(),
  ftm: z.number(),
  fta: z.number(),
  plusMinus: z.number(),
  starter: z.boolean(),
});

export type NbaStats = z.infer<typeof nbaStatsSchema>;

export type NbaAverages = Pick<NbaStats, "min" | "pts" | "reb" | "ast" | "stl" | "blk" | "tov"> & {
  games: number;
  fgPct: number | null;
  fg3Pct: number | null;
};

export interface Badge {
  id: "triple-double" | "double-double" | "season-high" | "above-average";
  label: string;
  /** "gold": hito poco frecuente; "good": rendimiento destacado */
  tone: "gold" | "good";
}

const DD_KEYS = ["pts", "reb", "ast", "stl", "blk"] as const;

/**
 * Hitos de un partido. `previous` son los partidos de la temporada ANTERIORES a ese día,
 * para que un "máximo de la temporada" no dependa de partidos posteriores.
 */
export function badges(s: NbaStats, previous: NbaStats[]): Badge[] {
  const out: Badge[] = [];
  const doubles = DD_KEYS.filter((k) => s[k] >= 10).length;
  if (doubles >= 3) out.push({ id: "triple-double", label: "Triple-doble", tone: "gold" });
  else if (doubles === 2) out.push({ id: "double-double", label: "Doble-doble", tone: "good" });

  if (previous.length >= 3 && s.pts > 0 && s.pts >= Math.max(...previous.map((g) => g.pts))) {
    out.push({ id: "season-high", label: "Máximo de la temporada", tone: "gold" });
  }

  const avg = averages(previous);
  if (avg && previous.length >= 3 && s.pts - avg.pts >= 10) {
    out.push({ id: "above-average", label: `+${Math.round(s.pts - avg.pts)} pts sobre su media`, tone: "good" });
  }
  return out;
}

export function averages(list: NbaStats[]): NbaAverages | null {
  if (list.length === 0) return null;
  const sum = (k: keyof NbaStats) => list.reduce((acc, s) => acc + Number(s[k]), 0);
  const avg = (k: keyof NbaStats) => sum(k) / list.length;
  const pct = (m: keyof NbaStats, a: keyof NbaStats) => (sum(a) > 0 ? sum(m) / sum(a) : null);
  return {
    games: list.length,
    min: avg("min"),
    pts: avg("pts"),
    reb: avg("reb"),
    ast: avg("ast"),
    stl: avg("stl"),
    blk: avg("blk"),
    tov: avg("tov"),
    fgPct: pct("fgm", "fga"),
    fg3Pct: pct("fg3m", "fg3a"),
  };
}
