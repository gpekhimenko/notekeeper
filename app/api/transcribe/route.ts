import { NextResponse } from "next/server";
import { auth } from "../../../auth";

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const formData = await request.formData();
  const file = formData.get("file");
  if (!file || !(file instanceof Blob)) {
    return NextResponse.json({ error: "Missing audio file" }, { status: 400 });
  }

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "GROQ_API_KEY not configured" }, { status: 500 });
  }

  try {
    const body = new FormData();
    body.append("file", file, "audio.webm");
    body.append("model", "whisper-large-v3-turbo");
    body.append("language", "en");

    const res = await fetch("https://api.groq.com/openai/v1/audio/transcriptions", {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body,
    });

    if (!res.ok) {
      const err = await res.text();
      console.error("Groq Whisper API error:", res.status, err);
      return NextResponse.json({ error: "Transcription failed" }, { status: 502 });
    }

    const data = await res.json();
    let text = (data.text ?? "").trim();

    // Whisper hallucinates repetitive phrases on silent/quiet segments
    const hallucinations = [
      /^(thank you[.!,\s]*)+$/i,
      /^(thanks for watching[.!,\s]*)+$/i,
      /^(you[.!,\s]*)+$/i,
      /^(bye[.!,\s]*)+$/i,
      /^(please subscribe[.!,\s]*)+$/i,
      /^(so[.!,\s]*)+$/i,
    ];
    if (hallucinations.some((re) => re.test(text))) {
      text = "";
    }

    return NextResponse.json({ text });
  } catch (error) {
    console.error("Transcription error:", error);
    return NextResponse.json({ error: "Transcription failed" }, { status: 500 });
  }
}
