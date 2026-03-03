import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { pool } from "../../../lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id || !session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const adminEmails = (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);

  if (!adminEmails.includes(session.user.email.toLowerCase())) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { rows } = await pool.query(`
    SELECT
      u.id,
      u.name,
      u.email,
      u.image,
      COUNT(n.id)::int AS "noteCount",
      COUNT(DISTINCT t.tag)::int AS "tagCount",
      MAX(n.updated_at) AS "lastActive"
    FROM users u
    LEFT JOIN notes n ON n.user_id = u.id
    LEFT JOIN LATERAL unnest(n.tags) AS t(tag) ON true
    GROUP BY u.id
    ORDER BY MAX(n.updated_at) DESC NULLS LAST
  `);

  return NextResponse.json(rows);
}
