export function todayISO(): string {
  return new Date().toLocaleDateString("en-CA"); // "YYYY-MM-DD"
}

export function formatDateDisplay(iso: string): string {
  const date = new Date(iso + "T00:00:00");
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function truncateBody(body: string, maxLength = 80): string {
  if (body.length <= maxLength) return body;
  return body.slice(0, maxLength).trimEnd() + "…";
}

export function generateNoteId(): string {
  return crypto.randomUUID();
}
