"use client";

import { useEffect, useReducer } from "react";
import { notesReducer, initialState } from "./lib/useNotesReducer";
import { Note, NotesStore } from "./lib/types";
import CalendarSidebar from "./components/CalendarSidebar";
import NotesList from "./components/NotesList";
import NoteEditor from "./components/NoteEditor";
import EmptyState from "./components/EmptyState";

const STORAGE_KEY = "notekeeper_notes";

export default function Home() {
  const [state, dispatch] = useReducer(notesReducer, initialState);

  // Load notes from localStorage on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as NotesStore;
        dispatch({ type: "LOAD_NOTES", payload: parsed });
      }
    } catch {
      // ignore corrupt data
    }
  }, []);

  // Sync notes to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state.notes));
  }, [state.notes]);

  const notesForDate = Object.values(state.notes)
    .filter((n) => n.date === state.selectedDate)
    .sort((a, b) => b.updatedAt - a.updatedAt);

  const selectedNote = state.selectedNoteId
    ? (state.notes[state.selectedNoteId] ?? null)
    : null;

  function handleSave(payload: Omit<Note, "createdAt" | "updatedAt">) {
    dispatch({ type: "SAVE_NOTE", payload });
  }

  function handleDelete(id: string) {
    dispatch({ type: "DELETE_NOTE", payload: id });
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
