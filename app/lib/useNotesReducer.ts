import { AppState, AppAction, Note } from "./types";
import { todayISO, generateNoteId } from "./noteUtils";

export const initialState: AppState = {
  notes: {},
  selectedDate: todayISO(),
  selectedNoteId: null,
  editorMode: "view",
};

export function notesReducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case "LOAD_NOTES":
      return { ...state, notes: action.payload };

    case "SELECT_DATE":
      return {
        ...state,
        selectedDate: action.payload,
        selectedNoteId: null,
        editorMode: "view",
      };

    case "SELECT_NOTE":
      return {
        ...state,
        selectedNoteId: action.payload,
        editorMode: "view",
      };

    case "ENTER_EDIT_MODE":
      return { ...state, editorMode: "edit" };

    case "NEW_NOTE":
      return {
        ...state,
        selectedNoteId: null,
        editorMode: "new",
      };

    case "SAVE_NOTE": {
      const { id, date, title, body } = action.payload;
      const existing = state.notes[id];
      const now = Date.now();
      const note: Note = {
        id,
        date,
        title,
        body,
        createdAt: existing?.createdAt ?? now,
        updatedAt: now,
      };
      return {
        ...state,
        notes: { ...state.notes, [id]: note },
        selectedNoteId: id,
        selectedDate: date,
        editorMode: "view",
      };
    }

    case "DELETE_NOTE": {
      const { [action.payload]: _removed, ...remaining } = state.notes;
      return {
        ...state,
        notes: remaining,
        selectedNoteId: null,
        editorMode: "view",
      };
    }

    case "CANCEL_EDIT":
      return {
        ...state,
        editorMode: state.selectedNoteId ? "view" : "view",
        selectedNoteId: state.editorMode === "new" ? null : state.selectedNoteId,
      };

    default:
      return state;
  }
}

export { generateNoteId };
