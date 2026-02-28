import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { pool } from "../../lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await pool.query(
    `SELECT unnest(tags) AS tag, COUNT(*) AS count
     FROM notes
     WHERE user_id = $1 AND array_length(tags, 1) > 0
     GROUP BY tag
     ORDER BY count DESC, tag ASC`,
    [session.user.id]
  );

  return NextResponse.json(
    rows.map((r: { tag: string; count: string }) => ({ tag: r.tag, count: Number(r.count) }))
  );
}
