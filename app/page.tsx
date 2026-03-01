"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { notesReducer, initialState } from "./lib/useNotesReducer";
import { Note, NotesStore, MobilePanel, UserSettings, DEFAULT_SETTINGS } from "./lib/types";
import { fetchNotes, createNote, updateNote, deleteNote, fetchSettings, saveSettings } from "./lib/notesApi";
import CalendarSidebar from "./components/CalendarSidebar";
import NotesList from "./components/NotesList";
import NoteEditor from "./components/NoteEditor";
import EmptyState from "./components/EmptyState";
import SettingsPanel from "./components/SettingsPanel";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, dispatch] = useReducer(notesReducer, initialState);
  const [loading, setLoading] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("list");
  const [settings, setSettings] = useState<UserSettings>(DEFAULT_SETTINGS);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Load notes and settings from API on mount
  useEffect(() => {
    if (status !== "authenticated") return;

    Promise.all([
      fetchNotes().then((notes) => {
        const store: NotesStore = {};
        for (const n of notes) {
          store[n.id] = n;
        }
        dispatch({ type: "LOAD_NOTES", payload: store });
      }),
      fetchSettings().then(setSettings).catch(console.error),
    ])
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  // Compute all unique tags across all notes, including pinned tags
  const noteTags = Array.from(
    new Set(Object.values(state.notes).flatMap((n) => n.tags))
  ).sort();
  const allTags = Array.from(
    new Set([...settings.pinnedTags, ...noteTags])
  );
  // Keep pinned tags first (in pinned order), then remaining sorted alphabetically
  const pinnedSet = new Set(settings.pinnedTags);
  allTags.sort((a, b) => {
    const aPinned = pinnedSet.has(a);
    const bPinned = pinnedSet.has(b);
    if (aPinned && !bPinned) return -1;
    if (!aPinned && bPinned) return 1;
    if (aPinned && bPinned) return settings.pinnedTags.indexOf(a) - settings.pinnedTags.indexOf(b);
    return a.localeCompare(b);
  });

  // Flexible filtering: search + tag filters combine (AND); date when neither active
  const allNotes = Object.values(state.notes);
  const isSearching = state.searchQuery.trim().length > 0;
  const isFilteringByTag = state.filterTags.length > 0;
  const isExcludingByTag = state.excludeTags.length > 0;

  let filteredNotes: Note[];
  if (isSearching || isFilteringByTag || isExcludingByTag) {
    filteredNotes = allNotes;
    if (isSearching) {
      const q = state.searchQuery.toLowerCase();
      filteredNotes = filteredNotes.filter(
        (n) =>
          n.title.toLowerCase().includes(q) ||
          n.body.toLowerCase().includes(q) ||
          n.tags.some((t) => t.toLowerCase().includes(q))
      );
    }
    if (isFilteringByTag) {
      filteredNotes = filteredNotes.filter((n) =>
        state.filterTags.every((t) => n.tags.includes(t))
      );
    }
    if (isExcludingByTag) {
      filteredNotes = filteredNotes.filter((n) =>
        !state.excludeTags.some((t) => n.tags.includes(t))
      );
    }
  } else {
    filteredNotes = allNotes.filter((n) => n.date === state.selectedDate);
  }
  filteredNotes.sort((a, b) => b.updatedAt - a.updatedAt);

  const selectedNote = state.selectedNoteId
    ? (state.notes[state.selectedNoteId] ?? null)
    : null;

  async function handleSave(payload: Omit<Note, "createdAt" | "updatedAt">) {
    const isNew = !state.notes[payload.id];
    try {
      const saved = isNew
        ? await createNote(payload)
        : await updateNote(payload);
      dispatch({
        type: "SAVE_NOTE",
        payload: {
          id: saved.id,
          date: saved.date,
          title: saved.title,
          body: saved.body,
          tags: saved.tags,
        },
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNote(id);
      dispatch({ type: "DELETE_NOTE", payload: id });
      setMobilePanel("list");
    } catch (err) {
      console.error(err);
    }
  }

  async function handleSaveSettings(newSettings: UserSettings) {
    try {
      await saveSettings(newSettings);
      setSettings(newSettings);
      setSettingsOpen(false);
    } catch (err) {
      console.error(err);
    }
  }

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-sm text-zinc-400">Loading...</p>
      </div>
    );
  }

  const showEditor =
    state.editorMode === "edit" ||
    state.editorMode === "new" ||
    selectedNote !== null;

  return (
    <div className="flex h-screen overflow-hidden bg-white">
      <div className={`${mobilePanel === "calendar" ? "flex" : "hidden"} md:flex w-full md:w-auto`}>
        <CalendarSidebar
          selectedDate={state.selectedDate}
          notes={state.notes}
          onSelectDate={(date) => {
            dispatch({ type: "SELECT_DATE", payload: date });
            setMobilePanel("list");
          }}
          userEmail={session?.user?.email ?? undefined}
          allTags={allTags}
          filterTags={state.filterTags}
          excludeTags={state.excludeTags}
          pinnedTags={settings.pinnedTags}
          onFilterTag={(tag) => {
            if (!tag) {
              dispatch({ type: "SET_FILTER_TAGS", payload: [] });
              dispatch({ type: "SET_EXCLUDE_TAGS", payload: [] });
              return;
            }
            const isIncluded = state.filterTags.includes(tag);
            const isExcluded = state.excludeTags.includes(tag);
            if (!isIncluded && !isExcluded) {
              // off → include
              dispatch({ type: "SET_FILTER_TAGS", payload: [...state.filterTags, tag] });
            } else if (isIncluded) {
              // include → exclude
              dispatch({ type: "SET_FILTER_TAGS", payload: state.filterTags.filter((t) => t !== tag) });
              dispatch({ type: "SET_EXCLUDE_TAGS", payload: [...state.excludeTags, tag] });
            } else {
              // exclude → off
              dispatch({ type: "SET_EXCLUDE_TAGS", payload: state.excludeTags.filter((t) => t !== tag) });
            }
          }}
          onBack={() => setMobilePanel("list")}
          onOpenSettings={() => setSettingsOpen(true)}
        />
      </div>

      <main className="flex flex-1 overflow-hidden">
        <div className={`${mobilePanel === "list" ? "flex" : "hidden"} md:flex w-full md:w-auto`}>
          <NotesList
            selectedDate={state.selectedDate}
            notes={filteredNotes}
            selectedNoteId={state.selectedNoteId}
            onSelectNote={(id) => {
              dispatch({ type: "SELECT_NOTE", payload: id });
              setMobilePanel("editor");
            }}
            onNewNote={() => {
              dispatch({ type: "NEW_NOTE" });
              setMobilePanel("editor");
            }}
            searchQuery={state.searchQuery}
            onSearchChange={(q) => dispatch({ type: "SET_SEARCH_QUERY", payload: q })}
            isSearching={isSearching}
            isFilteringByTag={isFilteringByTag}
            filterTags={state.filterTags}
            excludeTags={state.excludeTags}
            onShowCalendar={() => setMobilePanel("calendar")}
          />
        </div>

        <div className={`${mobilePanel === "editor" ? "flex" : "hidden"} md:flex flex-1`}>
          {showEditor ? (
            <NoteEditor
              note={selectedNote}
              editorMode={state.editorMode}
              selectedDate={state.selectedDate}
              onSave={handleSave}
              onDelete={handleDelete}
              onEnterEdit={() => dispatch({ type: "ENTER_EDIT_MODE" })}
              onCancel={() => {
                dispatch({ type: "CANCEL_EDIT" });
                setMobilePanel("list");
              }}
              onBack={() => setMobilePanel("list")}
              allTags={allTags}
              settings={settings}
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </main>

      {settingsOpen && (
        <SettingsPanel
          settings={settings}
          onSave={handleSaveSettings}
          onClose={() => setSettingsOpen(false)}
        />
      )}
    </div>
  );
}
