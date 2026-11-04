# NBA Analitics

Web para seguir las estadísticas de tus jugadores favoritos tras cada jornada, sin tener que entrar partido a partido.

## Stack

- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **PostgreSQL** (Supabase) + **Drizzle ORM**
- **Datos**: endpoints públicos de ESPN, detrás de la interfaz `StatsProvider`
- **Ingesta diaria**: Netlify Scheduled Function (`netlify/functions/ingest-daily.mts`)
- **Favoritos**: `localStorage` (sin login), en `src/lib/use-follows.ts`
- **Deploy**: Netlify

## Arquitectura

```
ESPN ──► StatsProvider ──► ingestDate() ──► PostgreSQL ──► API routes / Server Components ──► UI
         (src/lib/providers)  (cron diario)    (Supabase)
```

- `src/db/schema.ts`: modelo multideporte (`sport` en cada tabla y stats en JSONB)
- `src/lib/sports/nba.ts`: esquema Zod de las stats NBA y cálculo de medias
- `src/lib/providers/`: adaptadores de fuentes de datos (para añadir un deporte o proveedor, crea uno nuevo)
- `src/lib/queries.ts`: consultas que usa la web

## Puesta en marcha

1. Crea un proyecto en [Supabase](https://supabase.com) (gratis) y copia la *connection string* del **Transaction pooler**.
2. `cp .env.example .env` y pega la URL en `DATABASE_URL`.
3. Instala dependencias y crea las tablas:
   ```bash
   npm install
   npm run db:push
   ```
4. Carga los datos de la temporada (backfill):
   ```bash
   npm run ingest -- 2026-10-21 2026-10-30
   ```
5. `npm run dev` y abre http://localhost:3000

## Deploy en Netlify

1. Sube el repo a GitHub e impórtalo en Netlify (detecta Next.js automáticamente).
2. En *Site configuration > Environment variables* añade `DATABASE_URL`.
3. La función `ingest-daily` se ejecuta cada día a las 09:00 UTC.
