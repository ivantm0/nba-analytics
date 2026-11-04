import {
  date,
  integer,
  jsonb,
  pgTable,
  serial,
  text,
  timestamp,
  unique,
} from "drizzle-orm/pg-core";

// Modelo multideporte: todo cuelga de `sport` y las stats viven en JSONB,
// validadas por el esquema de cada deporte (ver src/lib/sports).

export const teams = pgTable(
  "teams",
  {
    id: serial("id").primaryKey(),
    sport: text("sport").notNull(),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    abbreviation: text("abbreviation").notNull(),
    logo: text("logo"),
  },
  (t) => [unique().on(t.sport, t.externalId)],
);

export const players = pgTable(
  "players",
  {
    id: serial("id").primaryKey(),
    sport: text("sport").notNull(),
    externalId: text("external_id").notNull(),
    name: text("name").notNull(),
    position: text("position"),
    jersey: text("jersey"),
    headshot: text("headshot"),
    teamId: integer("team_id").references(() => teams.id),
    updatedAt: timestamp("updated_at").defaultNow().notNull(),
  },
  (t) => [unique().on(t.sport, t.externalId)],
);

export const games = pgTable(
  "games",
  {
    id: serial("id").primaryKey(),
    sport: text("sport").notNull(),
    externalId: text("external_id").notNull(),
    date: date("date").notNull(),
    season: integer("season").notNull(),
    homeTeamId: integer("home_team_id").references(() => teams.id).notNull(),
    awayTeamId: integer("away_team_id").references(() => teams.id).notNull(),
    homeScore: integer("home_score"),
    awayScore: integer("away_score"),
  },
  (t) => [unique().on(t.sport, t.externalId)],
);

export const playerGameStats = pgTable(
  "player_game_stats",
  {
    id: serial("id").primaryKey(),
    playerId: integer("player_id").references(() => players.id).notNull(),
    gameId: integer("game_id").references(() => games.id).notNull(),
    teamId: integer("team_id").references(() => teams.id).notNull(),
    stats: jsonb("stats").notNull(),
  },
  (t) => [unique().on(t.playerId, t.gameId)],
);
