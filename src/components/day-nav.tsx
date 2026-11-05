"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect } from "react";
import { addDays, formatDay, formatDayShort, nbaToday, relativeDay } from "@/lib/dates";

const arrow =
  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-white/5 text-zinc-200 ring-1 ring-white/10 transition hover:bg-white/10 hover:text-white active:scale-95";

export function DayNav({ date, onChange }: { date: string; onChange: (date: string) => void }) {
  const today = nbaToday();
  const relative = relativeDay(date);

  // Flechas del teclado para cambiar de día
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.altKey || e.ctrlKey || e.metaKey) return;
      if (e.key === "ArrowLeft") onChange(addDays(date, -1));
      if (e.key === "ArrowRight") onChange(addDays(date, 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date, onChange]);

  return (
    <div className="mb-6 flex items-center gap-2 sm:gap-3">
      <button type="button" className={arrow} onClick={() => onChange(addDays(date, -1))} aria-label="Día anterior">
        <ChevronLeft size={20} aria-hidden />
      </button>

      <label className="relative min-w-0 flex-1 cursor-pointer rounded-xl px-2 py-2 text-center transition focus-within:bg-white/5 hover:bg-white/5">
        <span className="block truncate text-base font-semibold sm:text-lg" aria-live="polite">
          {relative && <span className="text-orange-400">{relative} · </span>}
          <span className="hidden sm:inline">{relative ? formatDay(date).toLowerCase() : formatDay(date)}</span>
          <span className="sm:hidden">{relative ? formatDayShort(date).toLowerCase() : formatDayShort(date)}</span>
        </span>
        {/* Selector nativo invisible encima del texto: al pulsar la fecha se abre el calendario */}
        <input
          type="date"
          value={date}
          onChange={(e) => e.target.value && onChange(e.target.value)}
          onClick={(e) => e.currentTarget.showPicker?.()}
          className="absolute inset-0 cursor-pointer opacity-0"
          aria-label="Elegir fecha"
        />
      </label>

      <button type="button" className={arrow} onClick={() => onChange(addDays(date, 1))} aria-label="Día siguiente">
        <ChevronRight size={20} aria-hidden />
      </button>

      <button
        type="button"
        disabled={date === today}
        onClick={() => onChange(today)}
        className="h-10 shrink-0 rounded-full px-4 text-sm font-medium ring-1 ring-white/10 transition enabled:hover:bg-white/10 enabled:active:scale-95 disabled:text-zinc-500"
      >
        Hoy
      </button>
    </div>
  );
}
