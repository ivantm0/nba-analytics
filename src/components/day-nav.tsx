"use client";

import { useEffect } from "react";
import { addDays, formatDay, nbaToday, relativeDay } from "@/lib/dates";

const arrow =
  "flex h-10 w-10 items-center justify-center rounded-full bg-white/5 text-lg ring-1 ring-white/10 transition hover:bg-white/10";

export function DayNav({ date, onChange }: { date: string; onChange: (date: string) => void }) {
  const today = nbaToday();
  const relative = relativeDay(date);

  // Flechas del teclado para cambiar de día
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement) return;
      if (e.key === "ArrowLeft") onChange(addDays(date, -1));
      if (e.key === "ArrowRight") onChange(addDays(date, 1));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [date, onChange]);

  return (
    <div className="mb-6 flex items-center gap-3">
      <button type="button" className={arrow} onClick={() => onChange(addDays(date, -1))} aria-label="Día anterior">
        ‹
      </button>

      <label className="relative min-w-0 flex-1 cursor-pointer rounded-xl px-2 py-1 text-center hover:bg-white/5">
        <div className="text-xs font-medium uppercase tracking-wide text-orange-400">{relative ?? " "}</div>
        <div className="truncate text-lg font-semibold">{formatDay(date)}</div>
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
        ›
      </button>

      <button
        type="button"
        disabled={date === today}
        onClick={() => onChange(today)}
        className="rounded-full px-4 py-2 text-sm font-medium ring-1 ring-white/10 transition enabled:hover:bg-white/10 disabled:opacity-40"
      >
        Hoy
      </button>
    </div>
  );
}
