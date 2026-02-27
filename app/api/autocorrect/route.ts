import { NextResponse } from "next/server";
import { auth } from "../../../auth";

interface LTMatch {
  offset: number;
  length: number;
  replacements: { value: string }[];
}

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
    const res = await fetch("https://api.languagetool.org/v2/check", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ text, language: "en-US" }),
    });

    if (!res.ok) {
      return NextResponse.json({ corrected: text });
    }

    const data = await res.json();
    const matches: LTMatch[] = data.matches ?? [];

    // Apply replacements in reverse order so offsets stay valid
    let corrected = text;
    for (const match of [...matches].sort((a, b) => b.offset - a.offset)) {
      if (match.replacements.length > 0) {
        const before = corrected.slice(0, match.offset);
        const after = corrected.slice(match.offset + match.length);
        corrected = before + match.replacements[0].value + after;
      }
    }

    return NextResponse.json({ corrected });
  } catch (error) {
    console.error("Autocorrect API error:", error);
    return NextResponse.json({ corrected: text });
  }
}
