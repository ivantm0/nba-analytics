import { nbaStatsSchema, type NbaStats } from "../sports/nba";
import type { ProviderGame, ProviderPlayerLine, ProviderTeam, StatsProvider } from "./types";

const BASE = "https://site.api.espn.com/apis/site/v2/sports/basketball/nba";

/* eslint-disable @typescript-eslint/no-explicit-any -- respuestas JSON no tipadas de ESPN */

async function getJson(url: string): Promise<any> {
  // Con límite de tiempo: si ESPN no responde, la web no se queda colgada esperando
  const res = await fetch(url, {
    headers: { Accept: "application/json" },
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
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

  async getSchedule(date) {
    const board = await getJson(`${BASE}/scoreboard?dates=${date.replaceAll("-", "")}`);
    const season: number = board.leagues?.[0]?.season?.year;
    return (board.events ?? []).map((event: any) => {
      const comp = event.competitions[0];
      const side = (h: string) => comp.competitors.find((c: any) => c.homeAway === h);
      const state = event.status?.type?.state;
      const started = state !== "pre";
      const team = (c: any) => ({ ...toTeam(c.team), score: started ? num(c.score) : null });
      return {
        externalId: String(event.id),
        season,
        startTime: event.date,
        status: event.status?.type?.completed ? "final" : started ? "live" : "scheduled",
        statusDetail: event.status?.type?.shortDetail ?? "",
        home: team(side("home")),
        away: team(side("away")),
      };
    });
  },

  async getCompletedGames(date) {
    const finished = (await this.getSchedule(date)).filter((g) => g.status === "final");

    // Los box scores de cada partido se piden en paralelo
    return Promise.all(finished.map(async (game): Promise<ProviderGame> => {
      const summary = await getJson(`${BASE}/summary?event=${game.externalId}`);
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
        externalId: game.externalId,
        date,
        season: game.season,
        home: game.home,
        away: game.away,
        lines,
      };
    }));
  },
};
