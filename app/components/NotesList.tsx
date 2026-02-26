"use client";

import { Note } from "../lib/types";
import { formatDateDisplay, truncateBody } from "../lib/noteUtils";

interface NotesListProps {
  selectedDate: string;
  notes: Note[];
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onNewNote: () => void;
  searchQuery: string;
  onSearchChange: (query: string) => void;
  isSearching: boolean;
  isFilteringByTag: boolean;
  filterTag: string | null;
}

export default function NotesList({
  selectedDate,
  notes,
  selectedNoteId,
  onSelectNote,
  onNewNote,
  searchQuery,
  onSearchChange,
  isSearching,
  isFilteringByTag,
  filterTag,
}: NotesListProps) {
  const headerText = isSearching
    ? `Results for "${searchQuery}"`
    : isFilteringByTag
      ? `Tagged: ${filterTag}`
      : formatDateDisplay(selectedDate);

  const emptyText = isSearching
    ? "No matching notes"
    : isFilteringByTag
      ? "No notes with this tag"
      : "No notes for this day";

  return (
    <div className="w-64 border-r border-zinc-200 bg-zinc-50 flex flex-col">
      {/* Search input */}
      <div className="px-3 py-2 border-b border-zinc-200">
        <input
          type="text"
          placeholder="Search notes…"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          className="w-full text-xs text-zinc-700 placeholder-zinc-400 outline-none bg-white border border-zinc-200 rounded px-2 py-1.5 focus:border-blue-400 transition-colors"
        />
      </div>

      <div className="px-4 py-3 border-b border-zinc-200 flex items-center justify-between gap-2">
        <span className="text-xs font-medium text-zinc-500 truncate">
          {headerText}
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
            {emptyText}
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
                  {/* Show date when searching or filtering by tag */}
                  {(isSearching || isFilteringByTag) && (
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {note.date}
                    </p>
                  )}
                  {/* Tag pills (max 3 + overflow) */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {note.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="text-[10px] bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded-full"
                        >
                          {tag}
                        </span>
                      ))}
                      {note.tags.length > 3 && (
                        <span className="text-[10px] text-zinc-400">
                          +{note.tags.length - 3}
                        </span>
                      )}
                    </div>
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
