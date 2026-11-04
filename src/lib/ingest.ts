import { sql, type SQL } from "drizzle-orm";
import type { PgColumn } from "drizzle-orm/pg-core";
import { getDb, schema } from "../db";
import type { StatsProvider } from "./providers/types";

const { teams, players, games, playerGameStats } = schema;

// En un upsert por lotes, "actualiza con el valor que intentábamos insertar"
const excluded = (col: PgColumn): SQL => sql.raw(`excluded."${col.name}"`);

// Postgres rechaza un mismo lote con dos filas que chocan en la misma clave
const dedupe = <T>(rows: T[], key: (r: T) => string) => [...new Map(rows.map((r) => [key(r), r])).values()];

/**
 * Descarga los partidos finalizados de `date` y los guarda (idempotente: se puede repetir).
 * Hace 4 consultas por día, una por tabla, en lugar de varias por jugador.
 */
export async function ingestDate(provider: StatsProvider, date: string) {
  const sport = provider.sport;
  const providerGames = await provider.getCompletedGames(date);
  if (providerGames.length === 0) return { date, games: 0, lines: 0 };

  return getDb().transaction(async (tx) => {
    const teamRows = dedupe(
      providerGames.flatMap((g) => [g.home, g.away]).map(({ externalId, name, abbreviation, logo }) => ({
        sport, externalId, name, abbreviation, logo,
      })),
      (t) => t.externalId,
    );
    const teamIds = new Map(
      (
        await tx
          .insert(teams)
          .values(teamRows)
          .onConflictDoUpdate({
            target: [teams.sport, teams.externalId],
            set: { name: excluded(teams.name), abbreviation: excluded(teams.abbreviation), logo: excluded(teams.logo) },
          })
          .returning({ id: teams.id, externalId: teams.externalId })
      ).map((t) => [t.externalId, t.id]),
    );

    const gameIds = new Map(
      (
        await tx
          .insert(games)
          .values(
            providerGames.map((g) => ({
              sport,
              externalId: g.externalId,
              date: g.date,
              season: g.season,
              homeTeamId: teamIds.get(g.home.externalId)!,
              awayTeamId: teamIds.get(g.away.externalId)!,
              homeScore: g.home.score,
              awayScore: g.away.score,
            })),
          )
          .onConflictDoUpdate({
            target: [games.sport, games.externalId],
            set: { homeScore: excluded(games.homeScore), awayScore: excluded(games.awayScore) },
          })
          .returning({ id: games.id, externalId: games.externalId })
      ).map((g) => [g.externalId, g.id]),
    );

    const lines = providerGames.flatMap((g) => g.lines.map((l) => ({ ...l, gameExternalId: g.externalId })));
    if (lines.length === 0) return { date, games: providerGames.length, lines: 0 };

    const playerIds = new Map(
      (
        await tx
          .insert(players)
          .values(
            dedupe(lines, (l) => l.player.externalId).map((l) => ({
              sport,
              ...l.player,
              teamId: teamIds.get(l.teamExternalId)!,
            })),
          )
          .onConflictDoUpdate({
            target: [players.sport, players.externalId],
            set: {
              name: excluded(players.name),
              position: excluded(players.position),
              jersey: excluded(players.jersey),
              headshot: excluded(players.headshot),
              teamId: excluded(players.teamId),
              updatedAt: sql`now()`,
            },
          })
          .returning({ id: players.id, externalId: players.externalId })
      ).map((p) => [p.externalId, p.id]),
    );

    await tx
      .insert(playerGameStats)
      .values(
        lines.map((l) => ({
          playerId: playerIds.get(l.player.externalId)!,
          gameId: gameIds.get(l.gameExternalId)!,
          teamId: teamIds.get(l.teamExternalId)!,
          stats: l.stats,
        })),
      )
      .onConflictDoUpdate({
        target: [playerGameStats.playerId, playerGameStats.gameId],
        set: { stats: excluded(playerGameStats.stats) },
      });

    return { date, games: providerGames.length, lines: lines.length };
  });
}

/** Fecha de ayer en horario de EE. UU. (la "jornada" NBA que acaba de terminar) */
export function previousNbaDate(now = new Date()) {
  const us = new Date(now.toLocaleString("en-US", { timeZone: "America/New_York" }));
  us.setDate(us.getDate() - 1);
  return us.toLocaleDateString("en-CA"); // YYYY-MM-DD
}
