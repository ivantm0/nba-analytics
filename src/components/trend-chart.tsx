"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import type { GameLine } from "@/lib/queries";
import type { NbaStats } from "@/lib/sports/nba";

const METRICS = [
  { key: "pts", label: "Puntos" },
  { key: "reb", label: "Rebotes" },
  { key: "ast", label: "Asistencias" },
  { key: "min", label: "Minutos" },
] as const satisfies readonly { key: keyof NbaStats; label: string }[];

type MetricKey = (typeof METRICS)[number]["key"];
type Range = 10 | "all";

// Geometría en píxeles reales: el ancho se mide del contenedor para que el texto no se encoja en móvil
const DEFAULT_W = 640;
// A la derecha queda hueco para la etiqueta de la media, fuera de la zona de datos
const PAD = { top: 16, right: 76, bottom: 28, left: 32 };
const fmtDate = (d: string) => `${d.slice(8)}/${d.slice(5, 7)}`;

/** Paso "bonito" para la escala Y (1, 2, 5, 10...) */
function niceStep(max: number) {
  const raw = max / 4;
  const pow = 10 ** Math.floor(Math.log10(raw || 1));
  return [1, 2, 5, 10].map((m) => m * pow).find((s) => s >= raw) ?? raw;
}

export function TrendChart({ log }: { log: GameLine[] }) {
  const [metric, setMetric] = useState<MetricKey>("pts");
  const [range, setRange] = useState<Range>(10);
  const [hover, setHover] = useState<number | null>(null);
  const titleId = useId();
  const boxRef = useRef<HTMLDivElement>(null);
  const [W, setW] = useState(DEFAULT_W);
  const H = W < 480 ? 200 : 220;

  useEffect(() => {
    const el = boxRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setW(Math.max(280, Math.round(entry.contentRect.width))));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const games = useMemo(() => {
    const chrono = [...log].reverse(); // del más antiguo al más reciente
    return range === "all" ? chrono : chrono.slice(-range);
  }, [log, range]);

  if (log.length < 2) return null;

  const values = games.map((g) => Number(g.stats[metric]));
  const seasonAvg = log.reduce((acc, g) => acc + Number(g.stats[metric]), 0) / log.length;
  const step = niceStep(Math.max(...values, seasonAvg));
  const yMax = Math.ceil(Math.max(...values, seasonAvg) / step) * step || 1;
  const ticks = Array.from({ length: Math.round(yMax / step) + 1 }, (_, i) => i * step);

  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const x = (i: number) => PAD.left + (games.length === 1 ? innerW / 2 : (i / (games.length - 1)) * innerW);
  const y = (v: number) => PAD.top + innerH - (v / yMax) * innerH;
  const path = values.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(" ");
  const labelEvery = Math.ceil(games.length / Math.max(3, Math.floor(innerW / 56)));
  const metricLabel = METRICS.find((m) => m.key === metric)!.label;
  const active = hover !== null ? games[hover] : null;

  const tab = (on: boolean) =>
    `rounded-full px-3 py-1 text-sm font-medium transition ${
      on ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
    }`;

  return (
    <section className="mt-8" aria-labelledby={titleId}>
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h2 id={titleId} className="text-sm font-semibold uppercase tracking-wide text-zinc-400">
          Tendencia · {metricLabel}
        </h2>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex gap-1" role="group" aria-label="Estadística">
            {METRICS.map((m) => (
              <button key={m.key} type="button" aria-pressed={metric === m.key} onClick={() => setMetric(m.key)} className={tab(metric === m.key)}>
                {m.label}
              </button>
            ))}
          </div>
          <div className="flex gap-1 border-l border-white/10 pl-2" role="group" aria-label="Periodo">
            <button type="button" aria-pressed={range === 10} onClick={() => setRange(10)} className={tab(range === 10)}>
              Últimos 10
            </button>
            <button type="button" aria-pressed={range === "all"} onClick={() => setRange("all")} className={tab(range === "all")}>
              Temporada
            </button>
          </div>
        </div>
      </div>

      <div className="relative rounded-xl border border-white/10 bg-zinc-900/60 p-3">
        <div ref={boxRef}>
        <svg
          viewBox={`0 0 ${W} ${H}`}
          width={W}
          height={H}
          className="block touch-none select-none"
          role="img"
          aria-label={`${metricLabel} por partido, ${games.length} partidos. Media de la temporada: ${seasonAvg.toFixed(1)}.`}
          onPointerLeave={() => setHover(null)}
        >
          {/* Rejilla y eje Y, discretos */}
          {ticks.map((t) => (
            <g key={t}>
              <line x1={PAD.left} x2={W - PAD.right} y1={y(t)} y2={y(t)} stroke="rgb(255 255 255 / 0.06)" />
              <text x={PAD.left - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-zinc-500 text-[11px] tabular-nums">
                {t}
              </text>
            </g>
          ))}

          {/* Media de la temporada como referencia */}
          <line
            x1={PAD.left}
            x2={W - PAD.right}
            y1={y(seasonAvg)}
            y2={y(seasonAvg)}
            stroke="rgb(161 161 170 / 0.7)"
            strokeDasharray="4 4"
          />
          <text x={W - PAD.right + 8} y={y(seasonAvg)} dy="0.32em" className="fill-zinc-400 text-[11px] tabular-nums">
            Media {seasonAvg.toFixed(1)}
          </text>

          {/* Fechas en el eje X, espaciadas desde la más reciente para que no se pisen */}
          {games.map((g, i) =>
            (games.length - 1 - i) % labelEvery === 0 ? (
              <text key={g.gameId} x={x(i)} y={H - 8} textAnchor="middle" className="fill-zinc-500 text-[11px] tabular-nums">
                {fmtDate(g.date)}
              </text>
            ) : null,
          )}

          {/* Cursor vertical del punto activo */}
          {hover !== null && (
            <line x1={x(hover)} x2={x(hover)} y1={PAD.top} y2={PAD.top + innerH} stroke="rgb(255 255 255 / 0.15)" />
          )}

          <path d={path} fill="none" stroke="var(--accent)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />

          {values.map((v, i) => (
            <circle
              key={games[i].gameId}
              cx={x(i)}
              cy={y(v)}
              r={hover === i ? 5.5 : 4}
              fill="var(--accent)"
              stroke="#18181b"
              strokeWidth={2}
            />
          ))}

          {/* Zonas de detección más anchas que los puntos, una por partido */}
          {games.map((g, i) => {
            const half = innerW / Math.max(games.length - 1, 1) / 2;
            return (
              <rect
                key={g.gameId}
                x={x(i) - half}
                y={PAD.top}
                width={half * 2}
                height={innerH}
                fill="transparent"
                tabIndex={0}
                aria-label={`${fmtDate(g.date)} ${g.isHome ? "vs" : "en"} ${g.opponentAbbr}: ${values[i]} ${metricLabel.toLowerCase()}`}
                onPointerEnter={() => setHover(i)}
                onPointerDown={() => setHover(i)}
                onFocus={() => setHover(i)}
                onBlur={() => setHover(null)}
                className="outline-none"
              />
            );
          })}
        </svg>
        </div>

        {active && hover !== null && (
          <div
            className="pointer-events-none absolute top-3 rounded-lg border border-white/10 bg-zinc-950/95 px-3 py-2 text-sm shadow-lg shadow-black/40"
            style={{
              left: `${(x(hover) / W) * 100}%`,
              transform: `translateX(${hover > games.length / 2 ? "calc(-100% - 12px)" : "12px"})`,
            }}
          >
            <div className="text-xs text-zinc-400">
              {fmtDate(active.date)} · {active.isHome ? "vs" : "@"} {active.opponentAbbr}
            </div>
            <div className="font-semibold tabular-nums">
              {values[hover]} <span className="font-normal text-zinc-400">{metricLabel.toLowerCase()}</span>
            </div>
            <div className="text-xs tabular-nums text-zinc-400">
              {active.stats.pts} pts · {active.stats.reb} reb · {active.stats.ast} ast
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
