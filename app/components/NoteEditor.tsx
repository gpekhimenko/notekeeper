"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
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
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");

  // Reset draft when note or mode changes
  useEffect(() => {
    if (editorMode === "new") {
      setTitle("");
      setBody("");
      setTags([]);
      setTagInput("");
    } else if (note) {
      setTitle(note.title);
      setBody(note.body);
      setTags(note.tags);
      setTagInput("");
    }
  }, [note?.id, editorMode]);

  function handleSave() {
    const id = editorMode === "new" ? generateNoteId() : note!.id;
    const date = editorMode === "new" ? selectedDate : note!.date;
    onSave({ id, date, title: title.trim(), body, tags });
  }

  function handleDelete() {
    if (!note) return;
    if (window.confirm("Delete this note?")) {
      onDelete(note.id);
    }
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = tagInput.trim().toLowerCase();
      if (tag && !tags.includes(tag)) {
        setTags([...tags, tag]);
      }
      setTagInput("");
    }
  }

  function removeTag(tag: string) {
    setTags(tags.filter((t) => t !== tag));
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
              placeholder="Write your note… (supports Markdown)"
              value={body}
              onChange={(e) => setBody(e.target.value)}
              className="flex-1 w-full text-sm text-zinc-700 placeholder-zinc-300 outline-none resize-none leading-relaxed min-h-[300px] font-mono"
            />

            {/* Tag editing */}
            <div className="mt-4 pt-4 border-t border-zinc-100">
              <div className="flex flex-wrap gap-1.5 mb-2">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                    <button
                      onClick={() => removeTag(tag)}
                      className="text-blue-400 hover:text-blue-700 leading-none"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="Add tag and press Enter…"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                className="text-sm text-zinc-700 placeholder-zinc-300 outline-none border border-zinc-200 rounded px-2 py-1 w-48"
              />
            </div>
          </>
        ) : note ? (
          <>
            <h2 className="text-2xl font-semibold text-zinc-800 mb-4 pb-2 border-b border-zinc-100">
              {note.title || "Untitled"}
            </h2>
            {note.tags.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mb-4">
                {note.tags.map((tag) => (
                  <span
                    key={tag}
                    className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="prose prose-sm max-w-none text-zinc-700 leading-relaxed">
              <ReactMarkdown
                components={{
                  h1: ({ children }) => <h1 className="text-2xl font-bold text-zinc-800 mt-6 mb-3">{children}</h1>,
                  h2: ({ children }) => <h2 className="text-xl font-semibold text-zinc-800 mt-5 mb-2">{children}</h2>,
                  h3: ({ children }) => <h3 className="text-lg font-semibold text-zinc-800 mt-4 mb-2">{children}</h3>,
                  p: ({ children }) => <p className="mb-3 leading-relaxed">{children}</p>,
                  ul: ({ children }) => <ul className="list-disc pl-5 mb-3 space-y-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-3 space-y-1">{children}</ol>,
                  li: ({ children }) => <li className="text-sm">{children}</li>,
                  strong: ({ children }) => <strong className="font-semibold text-zinc-900">{children}</strong>,
                  em: ({ children }) => <em className="italic">{children}</em>,
                  code: ({ children, className }) => {
                    const isBlock = className?.includes("language-");
                    if (isBlock) {
                      return <code className="block bg-zinc-100 text-zinc-800 rounded p-3 text-xs font-mono overflow-x-auto mb-3 whitespace-pre">{children}</code>;
                    }
                    return <code className="bg-zinc-100 text-zinc-800 rounded px-1.5 py-0.5 text-xs font-mono">{children}</code>;
                  },
                  pre: ({ children }) => <pre className="mb-3">{children}</pre>,
                  blockquote: ({ children }) => <blockquote className="border-l-4 border-zinc-300 pl-4 italic text-zinc-500 mb-3">{children}</blockquote>,
                  a: ({ href, children }) => <a href={href} className="text-blue-600 hover:underline" target="_blank" rel="noopener noreferrer">{children}</a>,
                  hr: () => <hr className="border-zinc-200 my-4" />,
                }}
              >
                {note.body}
              </ReactMarkdown>
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
}
