import { Note } from "./types";

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

export async function suggestTitle(
  body: string,
  signal?: AbortSignal
): Promise<string> {
  try {
    const res = await fetch("/api/suggest-title", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ body }),
      signal,
    });
    if (!res.ok) return "";
    const data = await res.json();
    return data.title ?? "";
  } catch {
    return "";
  }
}

export async function autocorrectText(text: string): Promise<string> {
  try {
    const res = await fetch("/api/autocorrect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return text;
    const data = await res.json();
    return data.corrected ?? text;
  } catch {
    return text;
  }
}
