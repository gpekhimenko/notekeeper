"use client";

import { Note } from "../lib/types";
import { formatDateDisplay, truncateBody } from "../lib/noteUtils";

interface NotesListProps {
  selectedDate: string;
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
}

export default function NotesList({
  selectedDate,
  notes,
  selectedNoteId,
  onSelectNote,
  onNewNote,
}: NotesListProps) {
  return (
    <div className="w-64 border-r border-zinc-200 bg-zinc-50 flex flex-col">
      <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500 truncate">
          {formatDateDisplay(selectedDate)}
        </span>
        <button
          onClick={onNewNote}
          className="shrink-0 text-xs font-medium text-blue-600 hover:text-blue-800 border border-blue-200 hover:border-blue-400 rounded px-2 py-1 transition-colors"
        >
          + New
        </button>
      </div>

      <div className="flex-1 overflow-y-auto thin-scrollbar">
        {notes.length === 0 ? (
          <p className="text-xs text-zinc-400 text-center mt-8 px-4">
            No notes for this day
          </p>
        ) : (
          <ul>
            {notes.map((note) => (
              <li key={note.id}>
                <button
                  onClick={() => onSelectNote(note.id)}
                  className={`w-full text-left px-4 py-3 border-b border-zinc-200 transition-colors ${
                    selectedNoteId === note.id
                      ? "bg-blue-50 border-l-2 border-l-blue-500"
                      : "hover:bg-white"
                  }`}
                >
                  <p className="text-sm font-medium text-zinc-800 truncate">
                    {note.title || "Untitled"}
                  </p>
                  {note.body && (
                    <p className="text-xs text-zinc-500 mt-0.5 line-clamp-2">
                      {truncateBody(note.body)}
                    </p>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
