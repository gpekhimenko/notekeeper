import { Note, UserSettings, AdminUser } from "./types";

type NotePayload = Omit<Note, "createdAt" | "updatedAt">;

export async function fetchNotes(): Promise<Note[]> {
  const res = await fetch("/api/notes");
  if (!res.ok) throw new Error("Failed to fetch notes");
  return res.json();
}

export async function createNote(payload: NotePayload): Promise<Note> {
  const res = await fetch("/api/notes", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to create note");
  return res.json();
}

export async function updateNote(payload: NotePayload): Promise<Note> {
  const res = await fetch(`/api/notes/${payload.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) throw new Error("Failed to update note");
  return res.json();
}

export async function deleteNote(id: string): Promise<void> {
  const res = await fetch(`/api/notes/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete note");
}

export async function fetchSettings(): Promise<UserSettings & { isAdmin?: boolean }> {
  const res = await fetch("/api/settings");
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function fetchAdminUsers(): Promise<AdminUser[]> {
  const res = await fetch("/api/admin/users");
  if (!res.ok) return [];
  return res.json();
}

export async function saveSettings(settings: UserSettings): Promise<void> {
  const res = await fetch("/api/settings", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to save settings");
}

export async function fetchPopularTags(): Promise<{ tag: string; count: number }[]> {
  try {
    const res = await fetch("/api/popular-tags");
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export async function suggestTitle(
  body: string,
  signal?: AbortSignal,
  model?: string
): Promise<string> {
  try {
    const res = await fetch("/api/suggest-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, model }),
      signal,
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.title ?? "";
  } catch {
    return "";
  }
}

export async function suggestTags(
  body: string,
  existingTags: string[],
  signal?: AbortSignal,
  model?: string
): Promise<string[]> {
  try {
    const res = await fetch("/api/suggest-tags", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, existingTags, model }),
      signal,
    });
    if (!res.ok) return [];
    const data = await res.json();
    return data.tags ?? [];
  } catch {
    return [];
  }
}

export async function transcribeAudio(blob: Blob): Promise<string> {
  const form = new FormData();
  form.append("file", blob, "audio.webm");
  const res = await fetch("/api/transcribe", {
    method: "POST",
    body: form,
  });
  if (!res.ok) throw new Error("Transcription failed");
  const data = await res.json();
  return data.text ?? "";
}

export async function summarizeNote(body: string, model?: string): Promise<string> {
  try {
    const res = await fetch("/api/summarize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body, model }),
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.summary ?? "";
  } catch {
    return "";
  }
}

export async function autocorrectText(
  text: string,
  provider?: string,
  language?: string
): Promise<string> {
  try {
    const res = await fetch("/api/autocorrect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, provider, language }),
    });
    if (!res.ok) return text;
    const data = await res.json();
    return data.corrected ?? text;
  } catch {
    return text;
  }
}
