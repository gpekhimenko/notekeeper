"use client";

import { useEffect, useState } from "react";
import { Note } from "../lib/types";
import { generateNoteId } from "../lib/noteUtils";

interface NoteEditorProps {
  note: Note | null;
  editorMode: "view" | "edit" | "new";
  selectedDate: string;
  onSave: (payload: Omit<Note, "createdAt" | "updatedAt">) => void;
  onDelete: (id: string) => void;
  onEnterEdit: () => void;
  onCancel: () => void;
}

export default function NoteEditor({
  note,
  editorMode,
  selectedDate,
  onSave,
  onDelete,
  onEnterEdit,
  onCancel,
}: NoteEditorProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");

  // Reset draft when note or mode changes
  useEffect(() => {
    if (editorMode === "new") {
      setTitle("");
      setBody("");
    } else if (note) {
      setTitle(note.title);
      setBody(note.body);
    }
  }, [note?.id, editorMode]);

  function handleSave() {
    const id = editorMode === "new" ? generateNoteId() : note!.id;
    const date = editorMode === "new" ? selectedDate : note!.date;
    onSave({ id, date, title: title.trim(), body });
  }

  function handleDelete() {
    if (!note) return;
    if (window.confirm("Delete this note?")) {
      onDelete(note.id);
    }
  }

  const isEditing = editorMode === "edit" || editorMode === "new";

  return (
    <div className="flex-1 flex flex-col bg-white">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-zinc-200 min-h-[52px]">
        {isEditing ? (
          <>
            <span className="text-xs text-zinc-400">
              {editorMode === "new" ? "New note" : "Editing"}
            </span>
            <div className="flex gap-2">
              <button
                onClick={onCancel}
                className="text-sm text-zinc-500 hover:text-zinc-800 px-3 py-1.5 rounded border border-zinc-200 hover:border-zinc-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-3 py-1.5 rounded transition-colors"
              >
                Save
              </button>
            </div>
          </>
        ) : note ? (
          <>
            <span className="text-xs text-zinc-400">
              {new Date(note.updatedAt).toLocaleString()}
            </span>
            <div className="flex gap-2">
              <button
                onClick={handleDelete}
                className="text-sm text-red-500 hover:text-red-700 px-3 py-1.5 rounded border border-red-200 hover:border-red-400 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={onEnterEdit}
                className="text-sm text-zinc-700 hover:text-zinc-900 px-3 py-1.5 rounded border border-zinc-200 hover:border-zinc-400 transition-colors"
              >
                Edit
              </button>
            </div>
          </>
        ) : null}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-6 py-4 overflow-y-auto thin-scrollbar">
        {isEditing ? (
          <>
            <input
              type="text"
              placeholder="Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-2xl font-semibold text-zinc-800 placeholder-zinc-300 outline-none mb-4 border-b border-zinc-100 pb-2"
              autoFocus
            />
            <textarea
              placeholder="Write your note…"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 w-full text-sm text-zinc-700 placeholder-zinc-300 outline-none resize-none leading-relaxed min-h-[300px]"
            />
          </>
        ) : note ? (
          <>
            <h2 className="text-2xl font-semibold text-zinc-800 mb-4 pb-2 border-b border-zinc-100">
              {note.title || "Untitled"}
            </h2>
            <p className="text-sm text-zinc-700 leading-relaxed whitespace-pre-wrap">
              {note.body}
            </p>
          </>
        ) : null}
      </div>
    </div>
  );
}
