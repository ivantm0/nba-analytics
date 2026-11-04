import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "NBA Analitics",
  description: "Sigue las estadísticas de tus jugadores favoritos tras cada jornada",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <header className="sticky top-0 z-10 border-b border-white/10 bg-zinc-950/80 backdrop-blur">
          <nav className="mx-auto flex max-w-6xl items-center gap-6 px-4 py-3">
            <Link href="/" className="font-bold tracking-tight">
              <span className="text-orange-400">NBA</span> Analitics
            </Link>
            <div className="flex gap-4 text-sm text-zinc-400">
              <Link href="/" className="hover:text-white">
                Mi jornada
              </Link>
              <Link href="/jugadores" className="hover:text-white">
                Jugadores
              </Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-8">{children}</main>
      </body>
    </html>
  );
}
