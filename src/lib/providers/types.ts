// Contrato que cumple cualquier fuente de datos (ESPN, balldontlie...).
// El resto de la app solo conoce estos tipos, nunca el formato del proveedor.

export interface ProviderTeam {
  externalId: string;
  name: string;
  abbreviation: string;
  logo?: string;
}

export interface ProviderPlayerLine {
  player: {
    externalId: string;
    name: string;
    position?: string;
    jersey?: string;
    headshot?: string;
  };
  teamExternalId: string;
  stats: Record<string, unknown>;
}

export interface ProviderGame {
  externalId: string;
  date: string; // YYYY-MM-DD
  season: number;
  home: ProviderTeam & { score: number | null };
  away: ProviderTeam & { score: number | null };
  lines: ProviderPlayerLine[];
}

export interface ScheduledGame {
  externalId: string;
  season: number;
  startTime: string; // ISO UTC
  status: "scheduled" | "live" | "final";
  statusDetail: string; // ej. "Q3 5:12", "Final"
  home: ProviderTeam & { score: number | null };
  away: ProviderTeam & { score: number | null };
}

export interface StatsProvider {
  sport: string;
  /** Todos los partidos de una fecha (jugados, en juego o por jugar), sin estadísticas */
  getSchedule(date: string): Promise<ScheduledGame[]>;
  /** Partidos finalizados de una fecha, con las líneas de estadísticas de cada jugador */
  getCompletedGames(date: string): Promise<ProviderGame[]>;
}
