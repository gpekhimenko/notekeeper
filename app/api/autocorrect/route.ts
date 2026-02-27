import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { auth } from "../../../auth";

const client = new Anthropic();

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { text } = await request.json();
  if (!text || typeof text !== "string") {
    return NextResponse.json({ error: "Missing text" }, { status: 400 });
  }

  try {
    const message = await client.messages.create({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 1024,
      system:
        "Fix spelling, grammar, and punctuation errors in this voice-transcribed text. Keep the meaning and wording as close to the original as possible. Return only the corrected text, nothing else.",
      messages: [{ role: "user", content: text }],
    });

    const corrected =
      message.content[0].type === "text"
        ? message.content[0].text
        : text;

    return NextResponse.json({ corrected });
  } catch (error) {
    console.error("Autocorrect API error:", error);
    // On failure, return original text so nothing is lost
    return NextResponse.json({ corrected: text });
  }
}
