import { and, desc, eq, ilike, inArray, max } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb, schema } from "../db";
import { espnNbaProvider } from "./providers/espn-nba";
import type { ScheduledGame } from "./providers/types";
import { averages, type NbaAverages, type NbaStats } from "./sports/nba";

const { teams, players, games, playerGameStats } = schema;
const homeTeam = alias(teams, "home_team");
const awayTeam = alias(teams, "away_team");

export interface PlayerListItem {
  id: number;
  name: string;
  position: string | null;
  headshot: string | null;
  team: string | null;
  teamLogo: string | null;
  teamExternalId: string | null;
}

export interface GameLine {
  gameId: number;
  gameExternalId: string;
  date: string;
  teamAbbr: string;
  opponentAbbr: string;
  isHome: boolean;
  teamScore: number | null;
  opponentScore: number | null;
  stats: NbaStats;
}

export interface PlayerSummary extends PlayerListItem {
  last: GameLine | null;
  season: NbaAverages | null;
}

const playerFields = {
  id: players.id,
  name: players.name,
  position: players.position,
  headshot: players.headshot,
  team: teams.abbreviation,
  teamLogo: teams.logo,
  teamExternalId: teams.externalId,
};

export async function searchPlayers(q: string): Promise<PlayerListItem[]> {
  return getDb()
    .select(playerFields)
    .from(players)
    .leftJoin(teams, eq(players.teamId, teams.id))
    .where(and(eq(players.sport, "nba"), ilike(players.name, `%${q}%`)))
    .orderBy(players.name)
    .limit(25);
}

async function currentSeason() {
  const [row] = await getDb().select({ season: max(games.season) }).from(games).where(eq(games.sport, "nba"));
  return row?.season ?? null;
}

/** Partidos de varios jugadores (de la temporada actual o de un día), del más reciente al más antiguo */
async function gameLines(playerIds: number[], date?: string) {
  if (playerIds.length === 0) return [];
  const season = date ? null : await currentSeason();
  if (!date && !season) return [];
  const rows = await getDb()
    .select({
      playerId: playerGameStats.playerId,
      teamId: playerGameStats.teamId,
      stats: playerGameStats.stats,
      gameId: games.id,
      gameExternalId: games.externalId,
      date: games.date,
      homeTeamId: games.homeTeamId,
      homeScore: games.homeScore,
      awayScore: games.awayScore,
      homeAbbr: homeTeam.abbreviation,
      awayAbbr: awayTeam.abbreviation,
    })
    .from(playerGameStats)
    .innerJoin(games, eq(playerGameStats.gameId, games.id))
    .innerJoin(homeTeam, eq(games.homeTeamId, homeTeam.id))
    .innerJoin(awayTeam, eq(games.awayTeamId, awayTeam.id))
    .where(and(inArray(playerGameStats.playerId, playerIds), date ? eq(games.date, date) : eq(games.season, season!)))
    .orderBy(desc(games.date));

  return rows.map((r) => {
    const isHome = r.teamId === r.homeTeamId;
    const line: GameLine = {
      gameId: r.gameId,
      gameExternalId: r.gameExternalId,
      date: r.date,
      isHome,
      teamAbbr: isHome ? r.homeAbbr : r.awayAbbr,
      opponentAbbr: isHome ? r.awayAbbr : r.homeAbbr,
      teamScore: isHome ? r.homeScore : r.awayScore,
      opponentScore: isHome ? r.awayScore : r.homeScore,
      stats: r.stats as NbaStats,
    };
    return { playerId: r.playerId, line };
  });
}

export async function playerSummaries(ids: number[]): Promise<PlayerSummary[]> {
  if (ids.length === 0) return [];
  const [list, lines] = await Promise.all([
    getDb().select(playerFields).from(players).leftJoin(teams, eq(players.teamId, teams.id)).where(inArray(players.id, ids)),
    gameLines(ids),
  ]);
  return list.map((p) => {
    const own = lines.filter((l) => l.playerId === p.id).map((l) => l.line);
    return { ...p, last: own[0] ?? null, season: averages(own.map((l) => l.stats)) };
  });
}

export async function playerDetail(id: number) {
  const [summary] = await playerSummaries([id]);
  if (!summary) return null;
  const log = (await gameLines([id])).map((l) => l.line);
  return { ...summary, log };
}

export type DayGame =
  | { kind: "played"; line: GameLine }
  | {
      kind: "scheduled" | "live" | "final";
      startTime: string;
      statusDetail: string;
      opponentAbbr: string;
      isHome: boolean;
      teamScore: number | null;
      opponentScore: number | null;
    }
  | { kind: "none" };

export interface DayEntry extends PlayerSummary {
  day: DayGame;
}

/** Qué hace cada jugador en una jornada: sus stats si jugó, o el partido programado / en juego */
export async function playerDay(ids: number[], date: string): Promise<DayEntry[]> {
  const [summaries, lines, schedule] = await Promise.all([
    playerSummaries(ids),
    gameLines(ids, date),
    espnNbaProvider.getSchedule(date).catch((): ScheduledGame[] => []),
  ]);

  return summaries.map((p): DayEntry => {
    const line = lines.find((l) => l.playerId === p.id)?.line;
    if (line) return { ...p, day: { kind: "played", line } };

    const game = schedule.find((g) => g.home.externalId === p.teamExternalId || g.away.externalId === p.teamExternalId);
    if (!game) return { ...p, day: { kind: "none" } };
    const isHome = game.home.externalId === p.teamExternalId;
    const [own, opp] = isHome ? [game.home, game.away] : [game.away, game.home];
    return {
      ...p,
      day: {
        kind: game.status,
        startTime: game.startTime,
        statusDetail: game.statusDetail,
        opponentAbbr: opp.abbreviation,
        isHome,
        teamScore: own.score,
        opponentScore: opp.score,
      },
    };
  });
}
