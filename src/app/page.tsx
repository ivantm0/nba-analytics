import { FollowedDashboard } from "@/components/followed-dashboard";

export default function Home() {
  return (
    <>
      <h1 className="text-3xl font-bold tracking-tight">Mi jornada</h1>
      <p className="mt-1 mb-6 text-zinc-400">
        Último partido de cada jugador que sigues. Las flechas comparan con su media de la temporada.
      </p>
      <FollowedDashboard />
    </>
  );
}
