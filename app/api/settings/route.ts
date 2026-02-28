import { NextResponse } from "next/server";
import { auth } from "../../../auth";
import { pool } from "../../lib/db";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { rows } = await pool.query(
    `SELECT speech_provider, autocorrect_provider, autocorrect_language,
            title_model, tag_model, pinned_tags
     FROM user_settings WHERE user_id = $1`,
    [session.user.id]
  );

  if (rows.length === 0) {
    return NextResponse.json({
      speechProvider: "web-speech-api",
      autocorrectProvider: "languagetool",
      autocorrectLanguage: "en-US",
      titleModel: "groq/openai/gpt-oss-20b",
      tagModel: "groq/openai/gpt-oss-20b",
      pinnedTags: [],
    });
  }

  const r = rows[0];
  return NextResponse.json({
    speechProvider: r.speech_provider,
    autocorrectProvider: r.autocorrect_provider,
    autocorrectLanguage: r.autocorrect_language,
    titleModel: r.title_model,
    tagModel: r.tag_model,
    pinnedTags: r.pinned_tags ?? [],
  });
}

export async function PUT(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    speechProvider,
    autocorrectProvider,
    autocorrectLanguage,
    titleModel,
    tagModel,
    pinnedTags,
  } = body;

  await pool.query(
    `INSERT INTO user_settings (user_id, speech_provider, autocorrect_provider, autocorrect_language, title_model, tag_model, pinned_tags, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, $7, now())
     ON CONFLICT (user_id) DO UPDATE SET
       speech_provider = EXCLUDED.speech_provider,
       autocorrect_provider = EXCLUDED.autocorrect_provider,
       autocorrect_language = EXCLUDED.autocorrect_language,
       title_model = EXCLUDED.title_model,
       tag_model = EXCLUDED.tag_model,
       pinned_tags = EXCLUDED.pinned_tags,
       updated_at = now()`,
    [
      session.user.id,
      speechProvider,
      autocorrectProvider,
      autocorrectLanguage,
      titleModel,
      tagModel,
      pinnedTags ?? [],
    ]
  );

  return NextResponse.json({ ok: true });
}
