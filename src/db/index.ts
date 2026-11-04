import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

let instance: ReturnType<typeof drizzle<typeof schema>> | undefined;

export function getDb() {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Falta la variable de entorno DATABASE_URL");
    // prepare: false es necesario con el pooler de Supabase (modo transaction)
    instance = drizzle(postgres(url, { prepare: false, max: 3 }), { schema });
  }
  return instance;
}

export { schema };
