"use client";

import { useCallback, useSyncExternalStore } from "react";

// Jugadores seguidos guardados en el navegador (sin login).
// Si más adelante se añaden cuentas, solo cambia la implementación de este hook.

const KEY = "nba-analitics:follows";
const listeners = new Set<() => void>();
let cache: { raw: string | null; ids: number[] } = { raw: null, ids: [] };

function read(): number[] {
  let raw: string | null = null;
  try {
    raw = localStorage.getItem(KEY);
  } catch {}
  if (raw !== cache.raw) {
    let ids: number[] = [];
    try {
      ids = raw ? JSON.parse(raw) : [];
    } catch {}
    cache = { raw, ids };
  }
  return cache.ids;
}

function write(ids: number[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(ids));
  } catch {}
  listeners.forEach((l) => l());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  window.addEventListener("storage", listener);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", listener);
  };
}

const EMPTY: number[] = [];

export function useFollows() {
  const ids = useSyncExternalStore(subscribe, read, () => EMPTY);
  const toggle = useCallback((id: number) => {
    const current = read();
    write(current.includes(id) ? current.filter((x) => x !== id) : [...current, id]);
  }, []);
  return { ids, isFollowing: (id: number) => ids.includes(id), toggle };
}
