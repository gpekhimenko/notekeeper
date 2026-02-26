import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { pool } from "../../lib/db";

// GET /api/notes — list all notes for the authenticated user
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await pool.query(
    `SELECT id, date, title, body, tags, created_at, updated_at
     FROM notes
     WHERE user_id = $1
     ORDER BY updated_at DESC`,
    [session.user.id]
  );

  const notes = rows.map((r) => ({
    id: r.id,
    date: r.date,
    title: r.title,
    body: r.body,
    tags: r.tags ?? [],
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  }));

  return NextResponse.json(notes);
}

// POST /api/notes — create a new note
export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, date, title, body, tags } = await request.json();

  const { rows } = await pool.query(
    `INSERT INTO notes (id, user_id, date, title, body, tags)
     VALUES ($1, $2, $3, $4, $5, $6)
     RETURNING id, date, title, body, tags, created_at, updated_at`,
    [id, session.user.id, date, title, body, tags ?? []]
  );

  const r = rows[0];
  return NextResponse.json({
    id: r.id,
    date: r.date,
    title: r.title,
    body: r.body,
    tags: r.tags ?? [],
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  }, { status: 201 });
}
