import { NextResponse } from "next/server";
import { auth } from "../../../auth";

function parseTags(raw: string): string[] {
  const trimmed = raw.trim();

  // Try JSON array: ["tag1", "tag2"]
  if (trimmed.startsWith("[")) {
    try {
      const arr = JSON.parse(trimmed);
      if (Array.isArray(arr)) return arr.map((t: string) => String(t).trim().toLowerCase()).filter(Boolean);
    } catch { /* fall through */ }
  }

  // Try numbered list: 1. tag1\n2. tag2
  const numbered = trimmed.match(/^\d+[\.\)]\s*(.+)$/gm);
  if (numbered) {
    return numbered.map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim().toLowerCase()).filter(Boolean);
  }

  // CSV or space-separated fallback
  const tags = trimmed
    .split(/[,\n]+/)
    .map((t) => t.trim().toLowerCase().replace(/^[-•*]\s*/, ""))
    .filter(Boolean);
  return tags;
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { body, existingTags } = await request.json();
  if (!body || typeof body !== "string") {
    return NextResponse.json({ error: "Missing body" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ tags: [] });
  }

  try {
    const hasExisting = Array.isArray(existingTags) && existingTags.length > 0;
    const systemPrompt = hasExisting
      ? `You are a note tag selector. Choose 2-4 tags from this list ONLY: ${existingTags.join(", ")}. Reply with only the chosen tags as a comma-separated list. Do not invent new tags. No explanation, no numbering, no quotes.`
      : `You are a note tag generator. Suggest 2-4 short tags (1-2 words each) for the given note. Reply with only the tags as a comma-separated list. No explanation, no numbering, no quotes.`;

    const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "openai/gpt-oss-20b",
        messages: [
          {
            role: "system",
            content: systemPrompt,
          },
          {
            role: "user",
            content: `Tag this note:\n\n${body}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.3,
      }),
    });

    if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
    const data = await res.json();
    const raw = data.choices?.[0]?.message?.content ?? "";
    let tags = parseTags(raw).slice(0, 5);
    // When existing tags are provided, only return tags from that list
    if (hasExisting) {
      tags = tags.filter((t) => existingTags.includes(t));
    }
    return NextResponse.json({ tags });
  } catch (error) {
    console.error("Suggest tags error:", error);
    return NextResponse.json({ tags: [] });
  }
}
