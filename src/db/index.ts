import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let client: postgres.Sql | undefined;
let instance: Db | undefined;

export function getDb() {
  if (!instance) {
    const url = process.env.DATABASE_URL;
    if (!url) throw new Error("Falta la variable de entorno DATABASE_URL");
    // prepare: false es necesario con el pooler de Supabase (modo transaction).
    // idle_timeout cierra nosotros las conexiones inactivas antes de que el pooler las corte por su cuenta.
    client = postgres(url, { prepare: false, max: 3, idle_timeout: 20, connect_timeout: 10, max_lifetime: 60 * 5 });
    instance = drizzle(client, { schema });
  }
  return instance;
}

/** Descarta el pool actual (sin esperar a las conexiones colgadas); la siguiente llamada abre uno nuevo */
function resetDb() {
  client?.end({ timeout: 0 }).catch(() => {});
  client = undefined;
  instance = undefined;
}

class DbTimeoutError extends Error {}

const withTimeout = <T>(p: Promise<T>, ms: number) =>
  new Promise<T>((resolve, reject) => {
    const t = setTimeout(() => reject(new DbTimeoutError(`La base de datos no respondió en ${ms} ms`)), ms);
    p.then(resolve, reject).finally(() => clearTimeout(t));
  });

/**
 * Ejecuta una operación de lectura con límite de tiempo. A veces el pooler de Supabase deja conexiones
 * que ya no responden pero el cliente no lo detecta: si pasa, se descarta el pool y se reintenta una vez.
 */
export async function withDb<T>(fn: () => Promise<T>, ms = 8000): Promise<T> {
  try {
    return await withTimeout(fn(), ms);
  } catch (e) {
    if (!(e instanceof DbTimeoutError)) throw e;
    resetDb();
    return withTimeout(fn(), ms);
  }
}

export { schema };
