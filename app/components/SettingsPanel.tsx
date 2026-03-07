"use client";

import { useEffect, useState } from "react";
import { UserSettings, DEFAULT_SETTINGS, AdminUser } from "../lib/types";
import { fetchPopularTags, fetchAdminUsers } from "../lib/notesApi";

interface SettingsPanelProps {
  settings: UserSettings;
  onSave: (settings: UserSettings) => void;
  onClose: () => void;
  isAdmin?: boolean;
}

export default function SettingsPanel({ settings, onSave, onClose, isAdmin }: SettingsPanelProps) {
  const [draft, setDraft] = useState<UserSettings>(settings);
  const [popularTags, setPopularTags] = useState<{ tag: string; count: number }[]>([]);
  const [loadingTags, setLoadingTags] = useState(true);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [microphones, setMicrophones] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState(
    () => (typeof window !== "undefined" ? localStorage.getItem("preferredMicrophone") : null) ?? ""
  );

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then((devices) => {
      setMicrophones(devices.filter((d) => d.kind === "audioinput"));
    });
  }, []);

  useEffect(() => {
    fetchPopularTags()
      .then(setPopularTags)
      .finally(() => setLoadingTags(false));
  }, []);

  useEffect(() => {
    if (!isAdmin) return;
    setLoadingUsers(true);
    fetchAdminUsers()
      .then(setAdminUsers)
      .finally(() => setLoadingUsers(false));
  }, [isAdmin]);

  function update<K extends keyof UserSettings>(key: K, value: UserSettings[K]) {
    setDraft((prev) => ({ ...prev, [key]: value }));
  }

  function togglePinnedTag(tag: string) {
    const pinned = draft.pinnedTags.includes(tag)
      ? draft.pinnedTags.filter((t) => t !== tag)
      : [...draft.pinnedTags, tag];
    update("pinnedTags", pinned);
  }

  function handleSave() {
    onSave(draft);
  }

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/20" onClick={onClose} />

      {/* Panel */}
      <div className="relative w-full max-w-sm bg-white shadow-xl flex flex-col overflow-hidden animate-slide-in">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b border-zinc-200">
          <h2 className="text-lg font-semibold text-zinc-800">Settings</h2>
          <button
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-700 transition-colors p-1"
            aria-label="Close settings"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-5 h-5">
              <path d="M6.28 5.22a.75.75 0 00-1.06 1.06L8.94 10l-3.72 3.72a.75.75 0 101.06 1.06L10 11.06l3.72 3.72a.75.75 0 101.06-1.06L11.06 10l3.72-3.72a.75.75 0 00-1.06-1.06L10 8.94 6.28 5.22z" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6 thin-scrollbar">
          {/* Voice Transcription */}
          <section>
            <h3 className="text-sm font-medium text-zinc-700 mb-2">Voice Transcription</h3>
            <select
              value={draft.speechProvider}
              onChange={(e) => update("speechProvider", e.target.value)}
              className="w-full text-sm border border-zinc-200 rounded px-3 py-2 text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="web-speech-api">Browser (Web Speech API)</option>
              <option value="groq-whisper">Groq Whisper</option>
              <option value="deepgram">Deepgram (Coming soon)</option>
            </select>
            {draft.speechProvider === "deepgram" && (
              <p className="text-xs text-amber-600 mt-1">
                This provider is not yet available. Web Speech API will be used as fallback.
              </p>
            )}
            <label className="text-xs text-zinc-500 mt-2 mb-1 block">Microphone</label>
            <select
              value={selectedMic}
              onChange={(e) => {
                const value = e.target.value;
                setSelectedMic(value);
                if (value) {
                  localStorage.setItem("preferredMicrophone", value);
                } else {
                  localStorage.removeItem("preferredMicrophone");
                }
              }}
              className="w-full text-sm border border-zinc-200 rounded px-3 py-2 text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Default</option>
              {microphones.map((mic) => (
                <option key={mic.deviceId} value={mic.deviceId}>
                  {mic.label || `Microphone (${mic.deviceId.slice(0, 8)}…)`}
                </option>
              ))}
            </select>
          </section>

          {/* Text Correction */}
          <section>
            <h3 className="text-sm font-medium text-zinc-700 mb-2">Text Correction</h3>
            <select
              value={draft.autocorrectProvider}
              onChange={(e) => update("autocorrectProvider", e.target.value)}
              className="w-full text-sm border border-zinc-200 rounded px-3 py-2 text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 mb-2"
            >
              <option value="languagetool">LanguageTool</option>
              <option value="disabled">Disabled</option>
            </select>
            {draft.autocorrectProvider !== "disabled" && (
              <div>
                <label className="text-xs text-zinc-500 mb-1 block">Language</label>
                <input
                  type="text"
                  value={draft.autocorrectLanguage}
                  onChange={(e) => update("autocorrectLanguage", e.target.value)}
                  placeholder="en-US"
                  className="w-full text-sm border border-zinc-200 rounded px-3 py-2 text-zinc-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            )}
          </section>

          {/* AI Title Generation */}
          <section>
            <h3 className="text-sm font-medium text-zinc-700 mb-2">AI Title Generation</h3>
            <select
              value={draft.titleModel}
              onChange={(e) => update("titleModel", e.target.value)}
              className="w-full text-sm border border-zinc-200 rounded px-3 py-2 text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="groq/openai/gpt-oss-20b">Groq GPT-OSS-20B</option>
              <option value="huggingface/mistral-7b">HuggingFace Mistral 7B</option>
            </select>
          </section>

          {/* AI Tag Recommendation */}
          <section>
            <h3 className="text-sm font-medium text-zinc-700 mb-2">AI Tag Recommendation</h3>
            <select
              value={draft.tagModel}
              onChange={(e) => update("tagModel", e.target.value)}
              className="w-full text-sm border border-zinc-200 rounded px-3 py-2 text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="groq/openai/gpt-oss-20b">Groq GPT-OSS-20B</option>
              <option value="huggingface/mistral-7b">HuggingFace Mistral 7B</option>
            </select>
          </section>

          {/* AI Summarization */}
          <section>
            <h3 className="text-sm font-medium text-zinc-700 mb-2">AI Summarization</h3>
            <select
              value={draft.summaryModel}
              onChange={(e) => update("summaryModel", e.target.value)}
              className="w-full text-sm border border-zinc-200 rounded px-3 py-2 text-zinc-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="groq/openai/gpt-oss-20b">Groq GPT-OSS-20B</option>
              <option value="huggingface/mistral-7b">HuggingFace Mistral 7B</option>
            </select>
          </section>

          {/* Popular Tags */}
          <section>
            <h3 className="text-sm font-medium text-zinc-700 mb-2">Popular Tags</h3>
            <p className="text-xs text-zinc-400 mb-2">
              Click a tag to pin/unpin it for priority in suggestions.
            </p>
            {loadingTags ? (
              <p className="text-xs text-zinc-400 italic animate-pulse">Loading tags...</p>
            ) : popularTags.length === 0 ? (
              <p className="text-xs text-zinc-400">No tags found in your notes.</p>
            ) : (
              <div className="space-y-1">
                {popularTags.map(({ tag, count }) => {
                  const isPinned = draft.pinnedTags.includes(tag);
                  return (
                    <button
                      key={tag}
                      onClick={() => togglePinnedTag(tag)}
                      className={`flex items-center justify-between w-full text-left text-sm px-3 py-1.5 rounded transition-colors ${
                        isPinned
                          ? "bg-blue-50 text-blue-700 border border-blue-200"
                          : "bg-zinc-50 text-zinc-600 border border-zinc-100 hover:bg-zinc-100"
                      }`}
                    >
                      <span className="flex items-center gap-2">
                        {isPinned && (
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" fill="currentColor" className="w-3.5 h-3.5">
                            <path fillRule="evenodd" d="M8 1a.75.75 0 0 1 .75.75v6.5a.75.75 0 0 1-1.5 0v-6.5A.75.75 0 0 1 8 1ZM4.11 3.05a.75.75 0 0 1 0 1.06L2.872 5.348A5.25 5.25 0 1 0 13.128 5.348L11.89 4.11a.75.75 0 1 1 1.06-1.06l1.237 1.237a6.75 6.75 0 1 1-13.174 0L2.25 3.05a.75.75 0 0 1 1.06 0l.8.8Z" clipRule="evenodd" />
                          </svg>
                        )}
                        {tag}
                      </span>
                      <span className="text-xs text-zinc-400">{count}</span>
                    </button>
                  );
                })}
              </div>
            )}
          </section>

          {/* Admin: Users */}
          {isAdmin && (
            <section>
              <h3 className="text-sm font-medium text-zinc-700 mb-2">Users</h3>
              {loadingUsers ? (
                <p className="text-xs text-zinc-400 italic animate-pulse">Loading users...</p>
              ) : adminUsers.length === 0 ? (
                <p className="text-xs text-zinc-400">No users found.</p>
              ) : (
                <div className="space-y-2">
                  {adminUsers.map((user) => (
                    <div
                      key={user.id}
                      className="flex items-center gap-3 bg-zinc-50 border border-zinc-100 rounded px-3 py-2"
                    >
                      {user.image ? (
                        <img
                          src={user.image}
                          alt=""
                          className="w-8 h-8 rounded-full shrink-0"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-zinc-300 text-white flex items-center justify-center text-xs font-medium shrink-0">
                          {(user.name ?? user.email).charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <p className="text-sm text-zinc-800 truncate">
                          {user.name ?? user.email}
                        </p>
                        {user.name && (
                          <p className="text-xs text-zinc-400 truncate">{user.email}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-zinc-600">
                          {user.noteCount} note{user.noteCount !== 1 ? "s" : ""}
                          {" / "}
                          {user.tagCount} tag{user.tagCount !== 1 ? "s" : ""}
                        </p>
                        <p className="text-xs text-zinc-400">
                          {user.lastActive
                            ? new Date(user.lastActive).toLocaleDateString()
                            : "No activity"}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-200 px-4 py-3 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="text-sm text-zinc-500 hover:text-zinc-800 px-3 py-1.5 rounded border border-zinc-200 hover:border-zinc-400 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="text-sm text-white bg-blue-600 hover:bg-blue-700 px-4 py-1.5 rounded transition-colors"
          >
            Save
          </button>
        </div>
      </div>

      <style>{`
        @keyframes slide-in {
          from { transform: translateX(-100%); }
          to { transform: translateX(0); }
        }
        .animate-slide-in {
          animation: slide-in 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
