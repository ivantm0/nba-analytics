"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlayerListItem } from "@/lib/queries";
import { FollowButton } from "./follow-button";
import { PlayerAvatar } from "./player-avatar";

export function PlayerSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlayerListItem[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) {
      setResults([]);
      return;
    }
    setLoading(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/players/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then(setResults)
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [q]);

  return (
    <div>
      <input
        autoFocus
        value={q}
        onChange={(e) => setQ(e.target.value)}
        placeholder="Busca un jugador… (ej. Doncic)"
        className="w-full rounded-xl border border-white/10 bg-zinc-900 px-4 py-3 text-lg outline-none placeholder:text-zinc-500 focus:border-orange-400/60"
      />
      <ul className="mt-4 divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 empty:hidden">
        {results.map((p) => (
          <li key={p.id}>
            <Link href={`/jugadores/${p.id}`} className="flex items-center gap-3 bg-zinc-900/60 px-4 py-3 hover:bg-zinc-900">
              <PlayerAvatar src={p.headshot} name={p.name} size={40} />
              <div className="min-w-0 flex-1">
                <div className="truncate font-medium">{p.name}</div>
                <div className="text-sm text-zinc-400">
                  {p.team ?? "—"} · {p.position ?? "—"}
                </div>
              </div>
              <FollowButton playerId={p.id} />
            </Link>
          </li>
        ))}
      </ul>
      {!loading && q.trim().length >= 2 && results.length === 0 && (
        <p className="mt-4 text-zinc-500">Sin resultados.</p>
      )}
    </div>
  );
}
