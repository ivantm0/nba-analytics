"use client";

import { LoaderCircle, Search } from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import type { PlayerListItem } from "@/lib/queries";
import { FollowButton } from "./follow-button";
import { PlayerAvatar } from "./player-avatar";

type Status = "idle" | "loading" | "done" | "error";

export function PlayerSearch() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState<PlayerListItem[]>([]);
  const [status, setStatus] = useState<Status>("idle");
  const term = q.trim();

  useEffect(() => {
    if (term.length < 2) {
      setResults([]);
      setStatus("idle");
      return;
    }
    setStatus("loading");
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/players/search?q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => {
          if (!r.ok) throw new Error(String(r.status));
          return r.json();
        })
        .then((data: PlayerListItem[]) => {
          setResults(data);
          setStatus("done");
        })
        .catch((e) => e.name !== "AbortError" && setStatus("error"));
    }, 250);
    return () => {
      clearTimeout(t);
      ctrl.abort();
    };
  }, [term]);

  return (
    <div>
      <div className="relative">
        <Search size={20} className="pointer-events-none absolute top-1/2 left-4 -translate-y-1/2 text-zinc-500" aria-hidden />
        <input
          autoFocus
          type="text"
          inputMode="search"
          enterKeyHint="search"
          autoComplete="off"
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Busca un jugador… (ej. Doncic)"
          aria-label="Buscar jugador"
          className="w-full rounded-xl border border-white/10 bg-zinc-900 py-3 pr-11 pl-12 text-lg outline-none transition placeholder:text-zinc-500 focus:border-orange-400/60 focus-visible:outline-none"
        />
        {status === "loading" && (
          <LoaderCircle
            size={20}
            className="absolute top-1/2 right-4 -translate-y-1/2 animate-spin text-zinc-500"
            aria-label="Buscando"
          />
        )}
      </div>

      {results.length > 0 && (
        <ul className={`mt-4 divide-y divide-white/5 overflow-hidden rounded-xl border border-white/10 transition-opacity ${status === "loading" ? "opacity-60" : ""}`}>
          {results.map((p) => (
            <li key={p.id} className="group relative flex items-center gap-3 bg-zinc-900/60 px-4 py-3 transition hover:bg-zinc-900">
              <PlayerAvatar src={p.headshot} name={p.name} size={40} />
              <div className="min-w-0 flex-1">
                {/* Enlace "estirado" a toda la fila; el botón de seguir queda fuera del enlace */}
                <Link
                  href={`/jugadores/${p.id}`}
                  className="block truncate font-medium outline-none after:absolute after:inset-0 group-hover:text-orange-300 focus-visible:after:outline-2 focus-visible:after:-outline-offset-2 focus-visible:after:outline-orange-400"
                >
                  {p.name}
                </Link>
                <div className="text-sm text-zinc-400">
                  {p.team ?? "—"} · {p.position ?? "—"}
                </div>
              </div>
              <FollowButton playerId={p.id} compact />
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-sm text-zinc-500" aria-live="polite">
        {status === "idle" && "Escribe al menos 2 letras del nombre. Pulsa la estrella para seguir a un jugador."}
        {status === "done" && results.length === 0 && `Ningún jugador coincide con «${term}».`}
        {status === "error" && <span className="text-rose-300">No se ha podido buscar. Inténtalo de nuevo.</span>}
      </p>
    </div>
  );
}
