import { nbaStatsSchema, type NbaStats } from "../sports/nba";
import type { ProviderGame, ProviderPlayerLine, ProviderTeam, StatsProvider } from "./types";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

/* eslint-disable @typescript-eslint/no-explicit-any -- respuestas JSON no tipadas de ESPN */

async function getJson(url: string): Promise<any> {
  const res = await fetch(url, { headers: { Accept: "application/json" } });
  if (!res.ok) throw new Error(`ESPN ${res.status} en ${url}`);
  return res.json();
}

function toTeam(t: any): ProviderTeam {
  return {
    externalId: String(t.id),
    name: t.displayName,
    abbreviation: t.abbreviation,
    logo: t.logo,
  };
}

const num = (v: string | undefined) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};
const split = (v: string | undefined) => (v ?? "0-0").split("-").map(num);

// ESPN da las stats como array de strings alineado con `keys`
function parseStats(keys: string[], values: string[], starter: boolean): NbaStats {
  const get = (k: string) => values[keys.indexOf(k)];
  const [fgm, fga] = split(get("fieldGoalsMade-fieldGoalsAttempted"));
  const [fg3m, fg3a] = split(get("threePointFieldGoalsMade-threePointFieldGoalsAttempted"));
  const [ftm, fta] = split(get("freeThrowsMade-freeThrowsAttempted"));
  return nbaStatsSchema.parse({
    min: num(get("minutes")),
    pts: num(get("points")),
    reb: num(get("rebounds")),
    oreb: num(get("offensiveRebounds")),
    dreb: num(get("defensiveRebounds")),
    ast: num(get("assists")),
    stl: num(get("steals")),
    blk: num(get("blocks")),
    tov: num(get("turnovers")),
    pf: num(get("fouls")),
    plusMinus: num(get("plusMinus")),
    fgm, fga, fg3m, fg3a, ftm, fta,
    starter,
  });
}

export const espnNbaProvider: StatsProvider = {
  sport: "nba",

  async getCompletedGames(date) {
    const board = await getJson(`${BASE}/scoreboard?dates=${date.replaceAll("-", "")}`);
    const season: number = board.leagues?.[0]?.season?.year;
    const finished = (board.events ?? []).filter((e: any) => e.status?.type?.completed);

    // Los box scores de cada partido se piden en paralelo
    return Promise.all(finished.map(async (event: any): Promise<ProviderGame> => {
      const comp = event.competitions[0];
      const side = (h: string) => comp.competitors.find((c: any) => c.homeAway === h);
      const home = side("home");
      const away = side("away");

      const summary = await getJson(`${BASE}/summary?event=${event.id}`);
      const lines: ProviderPlayerLine[] = [];
      for (const teamBox of summary.boxscore?.players ?? []) {
        const block = teamBox.statistics?.[0];
        if (!block) continue;
        for (const a of block.athletes ?? []) {
          if (a.didNotPlay || !a.stats?.length) continue;
          lines.push({
            player: {
              externalId: String(a.athlete.id),
              name: a.athlete.displayName,
              position: a.athlete.position?.abbreviation,
              jersey: a.athlete.jersey,
              headshot: a.athlete.headshot?.href,
            },
            teamExternalId: String(teamBox.team.id),
            stats: parseStats(block.keys, a.stats, Boolean(a.starter)),
          });
        }
      }

      return {
        externalId: String(event.id),
        date,
        season,
        home: { ...toTeam(home.team), score: num(home.score) },
        away: { ...toTeam(away.team), score: num(away.score) },
        lines,
      };
    }));
  },
};
