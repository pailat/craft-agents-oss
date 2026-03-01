/**
 * Notes Module
 *
 * Workspace notes are user-created documents that can be converted to chat sessions.
 */

export * from './types.ts';
export {
  loadAllNotes,
  loadNote,
  saveNote,
  createNote,
  deleteNote,
  noteExists,
  listNoteIds,
} from './storage.ts';
