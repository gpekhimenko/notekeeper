"use client";

import { useEffect, useReducer, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { notesReducer, initialState } from "./lib/useNotesReducer";
import { Note, NotesStore } from "./lib/types";
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

  const notesForDate = Object.values(state.notes)
    .filter((n) => n.date === state.selectedDate)
    .sort((a, b) => b.updatedAt - a.updatedAt);

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
        payload: { id: saved.id, date: saved.date, title: saved.title, body: saved.body },
      });
    } catch (err) {
      console.error(err);
    }
  }

  async function handleDelete(id: string) {
    try {
      await deleteNote(id);
      dispatch({ type: "DELETE_NOTE", payload: id });
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
      <CalendarSidebar
        selectedDate={state.selectedDate}
        notes={state.notes}
        onSelectDate={(date) => dispatch({ type: "SELECT_DATE", payload: date })}
        userEmail={session?.user?.email ?? undefined}
      />

      <main className="flex flex-1 overflow-hidden">
        <NotesList
          selectedDate={state.selectedDate}
          notes={notesForDate}
          selectedNoteId={state.selectedNoteId}
          onSelectNote={(id) => dispatch({ type: "SELECT_NOTE", payload: id })}
          onNewNote={() => dispatch({ type: "NEW_NOTE" })}
        />

        {showEditor ? (
          <NoteEditor
            note={selectedNote}
            editorMode={state.editorMode}
            selectedDate={state.selectedDate}
            onSave={handleSave}
            onDelete={handleDelete}
            onEnterEdit={() => dispatch({ type: "ENTER_EDIT_MODE" })}
            onCancel={() => dispatch({ type: "CANCEL_EDIT" })}
          />
        ) : (
          <EmptyState />
        )}
      </main>
    </div>
  );
}
