// Ingesta manual / backfill:
//   npm run ingest                         -> ayer
//   npm run ingest -- 2026-10-30           -> un día
//   npm run ingest -- 2026-10-21 2026-10-30 -> rango
import "dotenv/config";
import { ingestDate, previousNbaDate } from "../src/lib/ingest";
import { espnNbaProvider } from "../src/lib/providers/espn-nba";

async function main() {
  const [from = previousNbaDate(), to = from] = process.argv.slice(2);
  for (let d = new Date(from + "T12:00:00Z"); d <= new Date(to + "T12:00:00Z"); d.setUTCDate(d.getUTCDate() + 1)) {
    const result = await ingestDate(espnNbaProvider, d.toISOString().slice(0, 10));
    console.log(result);
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
