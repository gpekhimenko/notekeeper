"use client";

import { Note } from "../lib/types";
import { formatDateDisplay, truncateBody } from "../lib/noteUtils";
import { getTagColor } from "../lib/tagColors";

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
  filterTags: string[];
  excludeTags: string[];
  onShowCalendar?: () => void;
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
  filterTags,
  excludeTags,
  onShowCalendar,
}: NotesListProps) {
  const isExcludingByTag = excludeTags.length > 0;
  const tagLabel = [
    ...filterTags,
    ...excludeTags.map((t) => `\u2212${t}`),
  ].join(", ");
  const isFiltering = isFilteringByTag || isExcludingByTag;

  const headerText = isSearching && isFiltering
    ? `Results for "${searchQuery}" in tagged: ${tagLabel}`
    : isSearching
      ? `Results for "${searchQuery}"`
      : isFiltering
        ? `Tagged: ${tagLabel}`
        : formatDateDisplay(selectedDate);

  const emptyText = isSearching && isFiltering
    ? "No notes matching search and tags"
    : isSearching
      ? "No matching notes"
      : isFiltering
        ? "No notes with these tags"
        : "No notes for this day";

  return (
    <div className="w-full md:w-64 border-r border-zinc-200 bg-zinc-50 flex flex-col">
      {/* Search input */}
      <div className="px-3 py-2 border-b border-zinc-200 flex items-center gap-2">
        {onShowCalendar && (
          <button
            onClick={onShowCalendar}
            className="md:hidden shrink-0 text-zinc-500 hover:text-zinc-800 transition-colors p-1"
            aria-label="Show calendar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path fillRule="evenodd" d="M5.75 2a.75.75 0 01.75.75V4h7V2.75a.75.75 0 011.5 0V4h.25A2.75 2.75 0 0118 6.75v8.5A2.75 2.75 0 0115.25 18H4.75A2.75 2.75 0 012 15.25v-8.5A2.75 2.75 0 014.75 4H5V2.75A.75.75 0 015.75 2zm-1 5.5c-.69 0-1.25.56-1.25 1.25v6.5c0 .69.56 1.25 1.25 1.25h10.5c.69 0 1.25-.56 1.25-1.25v-6.5c0-.69-.56-1.25-1.25-1.25H4.75z" clipRule="evenodd" />
            </svg>
          </button>
        )}
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
                  {(isSearching || isFiltering) && (
                    <p className="text-[10px] text-zinc-400 mt-1">
                      {note.date}
                    </p>
                  )}
                  {/* Tag pills (max 3 + overflow) */}
                  {note.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1.5">
                      {note.tags.slice(0, 3).map((tag) => {
                        const color = getTagColor(tag);
                        return (
                          <span
                            key={tag}
                            className={`text-[10px] ${color.bg} ${color.text} px-1.5 py-0.5 rounded-full`}
                          >
                            {tag}
                          </span>
                        );
                      })}
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
