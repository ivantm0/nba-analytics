import { and, desc, eq, ilike, inArray, max, sql } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import { getDb, schema } from "../db";
import { espnNbaProvider } from "./providers/espn-nba";
import type { ScheduledGame } from "./providers/types";
import { averages, badges, type Badge, type NbaAverages, type NbaStats } from "./sports/nba";

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
    // Primero los que empiezan por el texto (nombre o apellido), luego el resto
    .orderBy(
      sql`case when ${players.name} ilike ${q + "%"} or ${players.name} ilike ${"% " + q + "%"} then 0 else 1 end`,
      players.name,
    )
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

/** Resumen de cada jugador más todos sus partidos de la temporada (del más reciente al más antiguo) */
async function loadPlayers(ids: number[]) {
  if (ids.length === 0) return [];
  const [list, lines] = await Promise.all([
    getDb().select(playerFields).from(players).leftJoin(teams, eq(players.teamId, teams.id)).where(inArray(players.id, ids)),
    gameLines(ids),
  ]);
  return list.map((p) => {
    const log = lines.filter((l) => l.playerId === p.id).map((l) => l.line);
    const summary: PlayerSummary = { ...p, last: log[0] ?? null, season: averages(log.map((l) => l.stats)) };
    return { summary, log };
  });
}

export async function playerSummaries(ids: number[]): Promise<PlayerSummary[]> {
  return (await loadPlayers(ids)).map((p) => p.summary);
}

export async function playerDetail(id: number) {
  const [p] = await loadPlayers([id]);
  if (!p) return null;
  return { ...p.summary, log: p.log.map((g) => ({ ...g, badges: gameBadges(g, p.log) })) };
}

/** Badges de un partido, comparándolo solo con los partidos jugados hasta ese día */
function gameBadges(g: GameLine, log: GameLine[]): Badge[] {
  return badges(g.stats, log.filter((l) => l.date < g.date).map((l) => l.stats));
}

export interface RecentGame {
  date: string;
  opponentAbbr: string;
  pts: number;
  reb: number;
  ast: number;
}

export type DayGame =
  | { kind: "played"; line: GameLine; badges: Badge[] }
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
  /** Últimos 5 partidos hasta ese día (incluido), del más antiguo al más reciente */
  recent: RecentGame[];
}

/** Qué hace cada jugador en una jornada: sus stats si jugó, o el partido programado / en juego */
export async function playerDay(ids: number[], date: string): Promise<DayEntry[]> {
  const [loaded, lines, schedule] = await Promise.all([
    loadPlayers(ids),
    gameLines(ids, date),
    espnNbaProvider.getSchedule(date).catch((): ScheduledGame[] => []),
  ]);

  return loaded.map(({ summary: p, log }): DayEntry => {
    const recent = log
      .filter((g) => g.date <= date)
      .slice(0, 5)
      .reverse()
      .map((g) => ({ date: g.date, opponentAbbr: g.opponentAbbr, pts: g.stats.pts, reb: g.stats.reb, ast: g.stats.ast }));

    const line = lines.find((l) => l.playerId === p.id)?.line;
    if (line) return { ...p, recent, day: { kind: "played", line, badges: gameBadges(line, log) } };

    const game = schedule.find((g) => g.home.externalId === p.teamExternalId || g.away.externalId === p.teamExternalId);
    if (!game) return { ...p, recent, day: { kind: "none" } };
    const isHome = game.home.externalId === p.teamExternalId;
    const [own, opp] = isHome ? [game.home, game.away] : [game.away, game.home];
    return {
      ...p,
      recent,
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
