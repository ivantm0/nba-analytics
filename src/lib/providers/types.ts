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

export interface StatsProvider {
  sport: string;
  /** Partidos finalizados de una fecha, con las líneas de estadísticas de cada jugador */
  getCompletedGames(date: string): Promise<ProviderGame[]>;
}
