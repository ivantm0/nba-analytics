import { PlayerSearch } from "@/components/player-search";

export default function PlayersPage() {
  return (
    <div className="mx-auto max-w-2xl">
      <h1 className="mb-6 text-3xl font-bold tracking-tight">Jugadores</h1>
      <PlayerSearch />
    </div>
  );
}
