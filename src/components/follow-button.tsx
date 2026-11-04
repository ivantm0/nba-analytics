"use client";

import { useFollows } from "@/lib/use-follows";

export function FollowButton({ playerId }: { playerId: number }) {
  const { isFollowing, toggle } = useFollows();
  const on = isFollowing(playerId);
  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault();
        toggle(playerId);
      }}
      aria-pressed={on}
      title={on ? "Dejar de seguir" : "Seguir"}
      className={`rounded-full px-3 py-1 text-sm font-medium transition ${
        on
          ? "bg-amber-400/15 text-amber-300 ring-1 ring-amber-400/40 hover:bg-amber-400/25"
          : "bg-white/5 text-zinc-300 ring-1 ring-white/10 hover:bg-white/10"
      }`}
    >
      {on ? "★ Siguiendo" : "☆ Seguir"}
    </button>
  );
}
