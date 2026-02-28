"use client";

import { DayPicker } from "react-day-picker";
import { signOut } from "next-auth/react";
import { NotesStore } from "../lib/types";
import { getTagColor } from "../lib/tagColors";

interface CalendarSidebarProps {
  selectedDate: string;
  notes: NotesStore;
  onSelectDate: (date: string) => void;
  userEmail?: string;
  allTags: string[];
  filterTags: string[];
  onFilterTag: (tag: string) => void;
  onBack?: () => void;
  onOpenSettings?: () => void;
}

export default function CalendarSidebar({
  selectedDate,
  notes,
  onSelectDate,
  userEmail,
  allTags,
  filterTags,
  onFilterTag,
  onBack,
  onOpenSettings,
}: CalendarSidebarProps) {
  const selected = new Date(selectedDate + "T00:00:00");

  // Collect unique dates that have notes
  const datesWithNotes = Array.from(
    new Set(Object.values(notes).map((n) => n.date))
  ).map((d) => new Date(d + "T00:00:00"));

  function handleSelect(date: Date | undefined) {
    if (!date) return;
    onSelectDate(date.toLocaleDateString("en-CA"));
  }

  return (
    <aside className="w-full md:w-72 border-r border-zinc-200 bg-white flex flex-col">
      <div className="px-4 py-5 border-b border-zinc-200 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-zinc-800 tracking-tight">
          Notekeeper
        </h1>
        {onBack && (
          <button
            onClick={onBack}
            className="md:hidden text-zinc-500 hover:text-zinc-800 transition-colors p-1"
            aria-label="Close calendar"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        )}
      </div>
      <div className="flex-1 overflow-auto px-2 py-4">
        <DayPicker
          mode="single"
          selected={selected}
          onSelect={handleSelect}
          modifiers={{ hasNotes: datesWithNotes }}
          modifiersClassNames={{
            hasNotes: "has-notes",
          }}
          classNames={{
            root: "rdp-root",
            month_caption: "flex items-center justify-between px-1 mb-3",
            caption_label: "text-sm font-semibold text-zinc-700",
            nav: "flex gap-1",
            button_previous:
              "p-1 rounded hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors",
            button_next:
              "p-1 rounded hover:bg-zinc-100 text-zinc-500 hover:text-zinc-800 transition-colors",
            month_grid: "w-full border-collapse",
            weekdays: "flex mb-1",
            weekday:
              "flex-1 text-center text-xs font-medium text-zinc-400 uppercase py-1",
            week: "flex",
            day: "flex-1 flex items-center justify-center",
            day_button:
              "w-8 h-8 rounded-full text-sm flex items-center justify-center relative transition-colors hover:bg-zinc-100 text-zinc-700 cursor-pointer",
            selected:
              "!bg-blue-600 !text-white hover:!bg-blue-700 rounded-full",
            today: "font-bold text-blue-600",
            outside: "opacity-30",
            disabled: "opacity-20 cursor-not-allowed",
          }}
        />

        {/* Tag filter section */}
        {allTags.length > 0 && (
          <div className="mt-4 px-2">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-zinc-500 uppercase tracking-wider">
                Tags
              </span>
              {filterTags.length > 0 && (
                <button
                  onClick={() => onFilterTag("")}
                  className="text-[10px] text-zinc-400 hover:text-zinc-700 transition-colors"
                >
                  Clear
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {allTags.map((tag) => {
                const color = getTagColor(tag);
                const isActive = filterTags.includes(tag);
                return (
                  <button
                    key={tag}
                    onClick={() => onFilterTag(tag)}
                    className={`text-xs px-2 py-0.5 rounded-full transition-colors ${
                      isActive
                        ? `${color.activeBg} ${color.activeText}`
                        : `${color.bg} ${color.text} hover:opacity-80`
                    }`}
                  >
                    {tag}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
      <style>{`
        .has-notes::after {
          content: '';
          display: block;
          width: 4px;
          height: 4px;
          border-radius: 50%;
          background: #2563eb;
          margin: 1px auto 0;
        }
        .rdp-root [data-selected] .has-notes::after {
          background: white;
        }
      `}</style>

      {userEmail && (
        <div className="border-t border-zinc-200 px-4 py-3">
          <p className="text-xs text-zinc-500 truncate mb-2">{userEmail}</p>
          <div className="flex items-center gap-3">
            <button
              onClick={() => signOut()}
              className="text-xs text-zinc-500 hover:text-zinc-800 transition-colors"
            >
              Sign out
            </button>
            {onOpenSettings && (
              <button
                onClick={onOpenSettings}
                className="text-zinc-400 hover:text-zinc-700 transition-colors p-0.5"
                aria-label="Open settings"
                title="Settings"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
                  <path fillRule="evenodd" d="M7.84 1.804A1 1 0 0 1 8.82 1h2.36a1 1 0 0 1 .98.804l.331 1.652a6.993 6.993 0 0 1 1.929 1.115l1.598-.54a1 1 0 0 1 1.186.447l1.18 2.044a1 1 0 0 1-.205 1.251l-1.267 1.113a7.047 7.047 0 0 1 0 2.228l1.267 1.113a1 1 0 0 1 .206 1.25l-1.18 2.045a1 1 0 0 1-1.187.447l-1.598-.54a6.993 6.993 0 0 1-1.929 1.115l-.33 1.652a1 1 0 0 1-.982.804H8.82a1 1 0 0 1-.98-.804l-.331-1.652a6.993 6.993 0 0 1-1.929-1.115l-1.598.54a1 1 0 0 1-1.186-.447l-1.18-2.044a1 1 0 0 1 .205-1.251l1.267-1.114a7.05 7.05 0 0 1 0-2.227L1.821 7.773a1 1 0 0 1-.206-1.25l1.18-2.045a1 1 0 0 1 1.187-.447l1.598.54A6.992 6.992 0 0 1 7.51 3.456l.33-1.652ZM10 13a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" clipRule="evenodd" />
                </svg>
              </button>
            )}
          </div>
        </div>
      )}
    </aside>
  );
}
