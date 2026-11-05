"use client";

import { Star } from "lucide-react";
import { useFollows } from "@/lib/use-follows";

/**
 * `compact`: solo el icono (tarjetas y listas), para no robar ancho al nombre del jugador.
 * Va por encima del enlace "estirado" de la tarjeta gracias a `relative z-10`.
 */
export function FollowButton({ playerId, compact = false }: { playerId: number; compact?: boolean }) {
  const { isFollowing, toggle } = useFollows();
  const on = isFollowing(playerId);
  const label = on ? "Dejar de seguir" : "Seguir";
  return (
    <button
      type="button"
      onClick={() => toggle(playerId)}
      aria-pressed={on}
      aria-label={compact ? label : undefined}
      title={label}
      className={`relative z-10 inline-flex shrink-0 items-center justify-center gap-1.5 rounded-full text-sm font-medium ring-1 transition active:scale-95 ${
        compact ? "h-9 w-9" : "px-3.5 py-1.5"
      } ${
        on
          ? "bg-amber-400/15 text-amber-300 ring-amber-400/40 hover:bg-amber-400/25"
          : "bg-white/5 text-zinc-300 ring-white/10 hover:bg-white/10 hover:text-white"
      }`}
    >
      <Star size={16} strokeWidth={2} fill={on ? "currentColor" : "none"} aria-hidden />
      {!compact && (on ? "Siguiendo" : "Seguir")}
    </button>
  );
}
