// Las jornadas NBA se identifican por su fecha en EE. UU. (YYYY-MM-DD).
// Sin dependencias de servidor: se usa tanto en cliente como en la ingesta.

const NBA_TZ = "America/New_York";

export function nbaToday(now = new Date()) {
  return now.toLocaleDateString("en-CA", { timeZone: NBA_TZ });
}

export function addDays(date: string, n: number) {
  const d = new Date(date + "T12:00:00Z");
  d.setUTCDate(d.getUTCDate() + n);
  return d.toISOString().slice(0, 10);
}

/** La jornada que acaba de terminar */
export function previousNbaDate(now = new Date()) {
  return addDays(nbaToday(now), -1);
}

export function isValidDate(date: string | null | undefined): date is string {
  return !!date && /^\d{4}-\d{2}-\d{2}$/.test(date) && !Number.isNaN(Date.parse(date));
}

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function formatDay(date: string) {
  return capitalize(
    new Date(date + "T12:00:00Z").toLocaleDateString("es-ES", {
      weekday: "long",
      day: "numeric",
      month: "long",
      timeZone: "UTC",
    }),
  );
}

export function relativeDay(date: string) {
  const diff = Math.round((Date.parse(date) - Date.parse(nbaToday())) / 86_400_000);
  return ({ [-1]: "Ayer", 0: "Hoy", 1: "Mañana" } as Record<number, string>)[diff] ?? null;
}

/** Hora de inicio en la zona horaria del usuario, ej. "mié 01:30" */
export function formatTipoff(iso: string) {
  return capitalize(new Date(iso).toLocaleString("es-ES", { weekday: "short", hour: "2-digit", minute: "2-digit" }));
}
