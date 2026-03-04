import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";

export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  await pool.query("SELECT 1");
  return NextResponse.json({ ok: true, ts: new Date().toISOString() });
}
