"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Mi jornada", active: (p: string) => p === "/" },
  { href: "/jugadores", label: "Jugadores", active: (p: string) => p.startsWith("/jugadores") },
];

export function NavLinks() {
  const pathname = usePathname();
  return (
    <div className="flex gap-1 text-sm">
      {LINKS.map(({ href, label, active }) => {
        const current = active(pathname);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`rounded-full px-3 py-1.5 transition ${
              current ? "bg-white/10 text-white" : "text-zinc-400 hover:text-white"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </div>
  );
}
