import { NextResponse } from "next/server";
import { searchPlayers } from "@/lib/queries";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);
  return NextResponse.json(await searchPlayers(q));
}
