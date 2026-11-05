import { NextResponse } from "next/server";
import { isValidDate } from "@/lib/dates";
import { withDb } from "@/db";
import { playerDay } from "@/lib/queries";

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const date = params.get("date");
  if (!isValidDate(date)) return NextResponse.json({ error: "Fecha no válida" }, { status: 400 });
  const ids = (params.get("ids") ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0)
    .slice(0, 100);
  return NextResponse.json(await withDb(() => playerDay(ids, date), 15_000));
}
