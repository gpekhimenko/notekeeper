"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { notesReducer, initialState } from "./lib/useNotesReducer";
import { Note, NotesStore, MobilePanel } from "./lib/types";
import { fetchNotes, createNote, updateNote, deleteNote } from "./lib/notesApi";
import CalendarSidebar from "./components/CalendarSidebar";
import NotesList from "./components/NotesList";
import NoteEditor from "./components/NoteEditor";
import EmptyState from "./components/EmptyState";

export default function Home() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [state, dispatch] = useReducer(notesReducer, initialState);
  const [loading, setLoading] = useState(true);
  const [mobilePanel, setMobilePanel] = useState<MobilePanel>("list");

  // Redirect to login if not authenticated
  useEffect(() => {
    if (status === "unauthenticated") {
      router.replace("/login");
    }
  }, [status, router]);

  // Load notes from API on mount
  useEffect(() => {
    if (status !== "authenticated") return;

    fetchNotes()
      .then((notes) => {
        const store: NotesStore = {};
        for (const n of notes) {
          store[n.id] = n;
        }
        dispatch({ type: "LOAD_NOTES", payload: store });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [status]);

  // Compute all unique tags across all notes
  const allTags = Array.from(
    new Set(Object.values(state.notes).flatMap((n) => n.tags))
  ).sort();

  // Flexible filtering: search query > tag filter > date filter
  const allNotes = Object.values(state.notes);
  const isSearching = state.searchQuery.trim().length > 0;
  const isFilteringByTag = state.filterTags.length > 0;

  let filteredNotes: Note[];
  if (isSearching) {
    const q = state.searchQuery.toLowerCase();
    filteredNotes = allNotes.filter(
      (n) =>
        n.title.toLowerCase().includes(q) ||
        n.body.toLowerCase().includes(q) ||
        n.tags.some((t) => t.toLowerCase().includes(q))
    );
  } else if (isFilteringByTag) {
    filteredNotes = allNotes.filter((n) =>
      state.filterTags.every((t) => n.tags.includes(t))
    );
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

  if (status === "loading" || loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-white">
        <p className="text-sm text-zinc-400">Loading…</p>
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
          onFilterTag={(tag) => {
            if (!tag) {
              dispatch({ type: "SET_FILTER_TAGS", payload: [] });
              return;
            }
            const newTags = state.filterTags.includes(tag)
              ? state.filterTags.filter((t) => t !== tag)
              : [...state.filterTags, tag];
            dispatch({ type: "SET_FILTER_TAGS", payload: newTags });
          }}
          onBack={() => setMobilePanel("list")}
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
            />
          ) : (
            <EmptyState />
          )}
        </div>
      </main>
    </div>
  );
}
