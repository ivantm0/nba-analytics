"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlayerSummary } from "@/lib/queries";
import { useFollows } from "@/lib/use-follows";
import { PlayerCard } from "./player-card";

export function FollowedDashboard() {
  const { ids } = useFollows();
  const [data, setData] = useState<PlayerSummary[] | null>(null);
  const key = [...ids].sort((a, b) => a - b).join(",");

  useEffect(() => {
    if (!key) return;
    let cancelled = false;
    fetch(`/api/players/summary?ids=${key}`)
      .then((r) => r.json())
      .then((d: PlayerSummary[]) => !cancelled && setData(d))
      .catch(() => !cancelled && setData([]));
    return () => {
      cancelled = true;
    };
  }, [key]);

  if (!key) {
    return (
      <div className="rounded-2xl border border-dashed border-white/15 p-10 text-center">
        <p className="text-lg font-medium">Aún no sigues a ningún jugador</p>
        <p className="mt-1 text-zinc-400">Busca jugadores y márcalos con ☆ para verlos aquí tras cada jornada.</p>
        <Link
          href="/jugadores"
          className="mt-5 inline-block rounded-full bg-orange-500 px-5 py-2 font-medium text-white hover:bg-orange-400"
        >
          Buscar jugadores
        </Link>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ids.map((id) => (
          <div key={id} className="h-56 animate-pulse rounded-2xl bg-zinc-900/60" />
        ))}
      </div>
    );
  }

  // Los que jugaron más recientemente, primero
  const sorted = data
    .filter((p) => ids.includes(p.id))
    .sort((a, b) => (b.last?.date ?? "").localeCompare(a.last?.date ?? ""));

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {sorted.map((p) => (
        <PlayerCard key={p.id} p={p} />
      ))}
    </div>
  );
}
