import { NextResponse } from "next/server";
import { playerSummaries } from "@/lib/queries";

export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 100);
  return NextResponse.json(await playerSummaries(ids));
}
