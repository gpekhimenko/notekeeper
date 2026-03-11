import { NextResponse } from "next/server";
import { pool } from "../../../lib/db";

export async function GET(request: Request) {
  // Verify Vercel cron secret if present, or allow external cron services
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;
  if (cronSecret && authHeader && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Query actual tables so Supabase counts this as real activity
  const result = await pool.query(
    "SELECT COUNT(*) AS note_count FROM notes"
  );

  return NextResponse.json({
    ok: true,
    note_count: result.rows[0].note_count,
    ts: new Date().toISOString(),
  });
}
