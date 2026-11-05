"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useState } from "react";
import { isValidDate, previousNbaDate } from "@/lib/dates";
import type { DayEntry } from "@/lib/queries";
import { useFollows } from "@/lib/use-follows";
import { DayNav } from "./day-nav";
import { PlayerCard } from "./player-card";

// Orden en la jornada: quien jugó / está jugando primero, luego los que juegan más tarde, y los que descansan al final
const ORDER: Record<DayEntry["day"]["kind"], number> = { live: 0, played: 1, final: 2, scheduled: 3, none: 4 };
const startOf = (e: DayEntry) => ("startTime" in e.day ? e.day.startTime : "");

export function FollowedDashboard() {
  const { ids } = useFollows();
  const router = useRouter();
  const pathname = usePathname();
  const fecha = useSearchParams().get("fecha");
  // Por defecto, la última jornada terminada
  const date = isValidDate(fecha) ? fecha : previousNbaDate();

  const [data, setData] = useState<{ key: string; entries: DayEntry[]; error?: boolean } | null>(null);
  const [retry, setRetry] = useState(0);
  const key = `${date}|${[...ids].sort((a, b) => a - b).join(",")}`;

  const changeDate = useCallback(
    (d: string) => router.replace(`${pathname}?fecha=${d}`, { scroll: false }),
    [router, pathname],
  );

  useEffect(() => {
    if (ids.length === 0) return;
    let cancelled = false;
    const [d, idList] = key.split("|");
    fetch(`/api/players/day?date=${d}&ids=${idList}`)
      .then((r) => {
        if (!r.ok) throw new Error(String(r.status));
        return r.json();
      })
      .then((entries: DayEntry[]) => !cancelled && setData({ key, entries }))
      .catch(() => !cancelled && setData({ key, entries: [], error: true }));
    return () => {
      cancelled = true;
    };
  }, [key, ids.length, retry]);

  if (ids.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
        <p className="text-lg font-medium">Aún no sigues a ningún jugador</p>
        <p className="mt-1 text-zinc-400">Busca jugadores y pulsa la estrella para verlos aquí tras cada jornada.</p>
        <Link
          href="/jugadores"
          className="mt-5 inline-block rounded-full bg-orange-500 px-5 py-2 font-medium text-white hover:bg-orange-400"
        >
          Buscar jugadores
        </Link>
      </div>
    );
  }

  const loading = data?.key !== key;
  const entries = (data?.entries ?? [])
    .filter((p) => ids.includes(p.id))
    .sort((a, b) => ORDER[a.day.kind] - ORDER[b.day.kind] || startOf(a).localeCompare(startOf(b)));

  return (
    <>
      <DayNav date={date} onChange={changeDate} />
      {loading && !data ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-busy="true" aria-label="Cargando jornada">
          {ids.map((id) => (
            <div key={id} className="h-64 animate-pulse rounded-2xl bg-zinc-900/60" />
          ))}
        </div>
      ) : !loading && data?.error ? (
        <div role="alert" className="rounded-2xl border border-rose-400/20 bg-rose-400/5 p-6 text-center">
          <p className="font-medium text-rose-200">No se ha podido cargar la jornada.</p>
          <p className="mt-1 text-sm text-zinc-400">Comprueba tu conexión e inténtalo de nuevo.</p>
          <button
            type="button"
            onClick={() => setRetry((n) => n + 1)}
            className="mt-4 rounded-full bg-white/10 px-4 py-2 text-sm font-medium transition hover:bg-white/15"
          >
            Reintentar
          </button>
        </div>
      ) : (
        <>
          {!loading && entries.length > 0 && entries.every((e) => e.day.kind === "none") && (
            <p className="mb-4 text-sm text-zinc-400">Ninguno de tus jugadores juega este día.</p>
          )}
        <div className={`grid gap-4 transition-opacity sm:grid-cols-2 lg:grid-cols-3 ${loading ? "opacity-50" : ""}`}>
          {entries.map((p) => (
            <PlayerCard key={p.id} p={p} />
          ))}
        </div>
        </>
      )}
    </>
  );
}
