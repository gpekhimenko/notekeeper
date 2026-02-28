import { NextResponse } from "next/server";
import { auth } from "../../../auth";

async function summarizeWithGroq(body: string): Promise<string> {
  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) throw new Error("GROQ_API_KEY not set");

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
          content:
            "You are a note summarizer. Provide a concise 2-3 sentence summary of the note. No quotes, no explanation.",
        },
        {
          role: "user",
          content: `Summarize this note:\n\n${body}`,
        },
      ],
      max_tokens: 300,
      temperature: 0.3,
    }),
  });

  if (!res.ok) throw new Error(`Groq API error: ${res.status}`);
  const data = await res.json();
  return data.choices?.[0]?.message?.content ?? "";
}

async function summarizeWithHuggingFace(body: string): Promise<string> {
  const token = process.env.HF_TOKEN;
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const prompt = `<s>[INST] Provide a concise 2-3 sentence summary of the following note. No quotes, no explanation.\n\n${body} [/INST]`;

  const res = await fetch(
    "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
    {
      method: "POST",
      headers,
      body: JSON.stringify({
        inputs: prompt,
        parameters: { max_new_tokens: 200, temperature: 0.3 },
      }),
    }
  );

  if (!res.ok) throw new Error(`HuggingFace API error: ${res.status}`);
  const data = await res.json();
  const generated = data?.[0]?.generated_text ?? "";
  const parts = generated.split("[/INST]");
  return parts.length > 1 ? parts[parts.length - 1].trim() : generated.trim();
}

export async function POST(request: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { body, model } = await request.json();
  if (!body || typeof body !== "string") {
    return NextResponse.json({ error: "Missing body" }, { status: 400 });
  }

  try {
    const provider =
      model === "huggingface/mistral-7b"
        ? "huggingface"
        : model === "groq/openai/gpt-oss-20b"
          ? "groq"
          : (process.env.TITLE_PROVIDER ?? "groq");
    const summary =
      provider === "huggingface"
        ? await summarizeWithHuggingFace(body)
        : await summarizeWithGroq(body);

    return NextResponse.json({ summary: summary.trim() });
  } catch (error) {
    console.error("Summarize error:", error);
    return NextResponse.json({ summary: "" });
  }
}
