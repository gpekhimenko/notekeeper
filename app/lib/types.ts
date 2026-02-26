export interface Note {
  id: string;        // crypto.randomUUID()
  date: string;      // "YYYY-MM-DD" local date
  title: string;
  body: string;
  tags: string[];
  createdAt: number; // Date.now()
  updatedAt: number;
}

export type NotesStore = Record<string, Note>; // keyed by id

export interface AppState {
  notes: NotesStore;
  selectedDate: string;         // "YYYY-MM-DD", defaults to today
  selectedNoteId: string | null;
  editorMode: "view" | "edit" | "new";
  searchQuery: string;
  filterTag: string | null;
}

export type AppAction =
  | { type: "LOAD_NOTES"; payload: NotesStore }
  | { type: "SELECT_DATE"; payload: string }
  | { type: "SELECT_NOTE"; payload: string }
  | { type: "ENTER_EDIT_MODE" }
  | { type: "NEW_NOTE" }
  | { type: "SAVE_NOTE"; payload: Omit<Note, "createdAt" | "updatedAt"> }
  | { type: "DELETE_NOTE"; payload: string }
  | { type: "CANCEL_EDIT" }
  | { type: "SET_SEARCH_QUERY"; payload: string }
  | { type: "SET_FILTER_TAG"; payload: string | null };
