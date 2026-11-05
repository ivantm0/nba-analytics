import { Flame, Trophy } from "lucide-react";
import type { Badge } from "@/lib/sports/nba";

const TONES: Record<Badge["tone"], string> = {
  gold: "bg-amber-400/10 text-amber-200 ring-amber-400/30",
  good: "bg-emerald-400/10 text-emerald-200 ring-emerald-400/25",
};

export function GameBadges({ badges, className = "" }: { badges: Badge[]; className?: string }) {
  if (badges.length === 0) return null;
  return (
    <ul className={`flex flex-wrap gap-1.5 ${className}`} aria-label="Hitos del partido">
      {badges.map((b) => {
        const Icon = b.tone === "gold" ? Trophy : Flame;
        return (
          <li
            key={b.id}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ring-1 ${TONES[b.tone]}`}
          >
            <Icon size={12} strokeWidth={2.25} aria-hidden />
            {b.label}
          </li>
        );
      })}
    </ul>
  );
}
