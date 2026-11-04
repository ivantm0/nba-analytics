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
