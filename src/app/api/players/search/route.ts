import { NextResponse } from "next/server";
import { withDb } from "@/db";
import { searchPlayers } from "@/lib/queries";

export async function GET(req: Request) {
  const q = new URL(req.url).searchParams.get("q")?.trim() ?? "";
  if (q.length < 2) return NextResponse.json([]);
  return NextResponse.json(await withDb(() => searchPlayers(q)));
}
