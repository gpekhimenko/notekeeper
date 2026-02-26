import { NextResponse } from "next/server";
import { auth } from "../../../../auth";
import { pool } from "../../../lib/db";

// GET /api/notes/:id
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { rows } = await pool.query(
    `SELECT id, date, title, body, created_at, updated_at
     FROM notes
     WHERE id = $1 AND user_id = $2`,
    [id, session.user.id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const r = rows[0];
  return NextResponse.json({
    id: r.id,
    date: r.date,
    title: r.title,
    body: r.body,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  });
}

// PUT /api/notes/:id
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { date, title, body } = await request.json();

  const { rows } = await pool.query(
    `UPDATE notes
     SET date = $1, title = $2, body = $3, updated_at = now()
     WHERE id = $4 AND user_id = $5
     RETURNING id, date, title, body, created_at, updated_at`,
    [date, title, body, id, session.user.id]
  );

  if (rows.length === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const r = rows[0];
  return NextResponse.json({
    id: r.id,
    date: r.date,
    title: r.title,
    body: r.body,
    createdAt: new Date(r.created_at).getTime(),
    updatedAt: new Date(r.updated_at).getTime(),
  });
}

// DELETE /api/notes/:id
export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const { rowCount } = await pool.query(
    `DELETE FROM notes WHERE id = $1 AND user_id = $2`,
    [id, session.user.id]
  );

  if (rowCount === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true });
}
