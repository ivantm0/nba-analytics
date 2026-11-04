import type { Config } from "@netlify/functions";
import { ingestDate, previousNbaDate } from "../../src/lib/ingest";
import { espnNbaProvider } from "../../src/lib/providers/espn-nba";

// Cada día a las 09:00 UTC (10:00/11:00 en España), con todos los partidos de la noche ya acabados
const ingestDaily = async () => {
  const result = await ingestDate(espnNbaProvider, previousNbaDate());
  console.log("Ingesta completada", result);
};

export default ingestDaily;

export const config: Config = { schedule: "0 9 * * *" };
