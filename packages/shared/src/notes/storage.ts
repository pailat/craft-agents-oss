/**
 * Notes Storage
 *
 * CRUD operations for workspace notes.
 * Notes are stored in {workspace}/notes/{id}/ directories.
 */

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  rmSync,
  statSync,
  writeFileSync,
} from 'fs';
import { join } from 'path';
import { randomUUID } from 'crypto';
import { getWorkspaceNotesPath } from '../workspaces/storage.ts';
import type { LoadedNote, NoteMetadata } from './types.ts';

// ============================================================
// Load Operations
// ============================================================

/**
 * Load a single note from a directory
 */
function loadNoteFromDir(notesDir: string, noteId: string): LoadedNote | null {
  const noteDir = join(notesDir, noteId);
  const metaFile = join(noteDir, 'meta.json');
  const contentFile = join(noteDir, 'content.json');
  const markdownFile = join(noteDir, 'note.md');

  // Check directory exists
  if (!existsSync(noteDir) || !statSync(noteDir).isDirectory()) {
    return null;
  }

  // Check meta.json exists
  if (!existsSync(metaFile)) {
    return null;
  }

  // Read metadata
  let metadata: NoteMetadata;
  try {
    metadata = JSON.parse(readFileSync(metaFile, 'utf-8'));
  } catch {
    return null;
  }

  // Read Tiptap JSON content (optional — new notes might not have it yet)
  let content: Record<string, unknown> = { type: 'doc', content: [] };
  try {
    if (existsSync(contentFile)) {
      content = JSON.parse(readFileSync(contentFile, 'utf-8'));
    }
  } catch {
    // Use empty doc
  }

  // Read markdown export (optional)
  let markdown = '';
  try {
    if (existsSync(markdownFile)) {
      markdown = readFileSync(markdownFile, 'utf-8');
    }
  } catch {
    // Use empty
  }

  return {
    ...metadata,
    content,
    markdown,
    path: noteDir,
  };
}

/**
 * Load all notes from a workspace
 * @param workspaceRoot - Absolute path to workspace root
 */
export function loadAllNotes(workspaceRoot: string): LoadedNote[] {
  const notesDir = getWorkspaceNotesPath(workspaceRoot);

  if (!existsSync(notesDir)) {
    return [];
  }

  const notes: LoadedNote[] = [];

  try {
    const entries = readdirSync(notesDir, { withFileTypes: true });
    for (const entry of entries) {
      if (!entry.isDirectory()) continue;

      const note = loadNoteFromDir(notesDir, entry.name);
      if (note) {
        notes.push(note);
      }
    }
  } catch {
    // Ignore errors reading notes directory
  }

  // Sort by updatedAt descending (most recent first)
  notes.sort((a, b) => b.updatedAt - a.updatedAt);

  return notes;
}

/**
 * Load a single note from a workspace
 * @param workspaceRoot - Absolute path to workspace root
 * @param noteId - Note identifier
 */
export function loadNote(workspaceRoot: string, noteId: string): LoadedNote | null {
  const notesDir = getWorkspaceNotesPath(workspaceRoot);
  return loadNoteFromDir(notesDir, noteId);
}

// ============================================================
// Write Operations
// ============================================================

/**
 * Save a note to disk (create or update)
 */
export function saveNote(
  workspaceRoot: string,
  note: {
    id: string;
    title: string;
    content: Record<string, unknown>;
    markdown: string;
    tags?: string[];
    convertedToSessionId?: string;
  },
): void {
  const notesDir = getWorkspaceNotesPath(workspaceRoot);
  const noteDir = join(notesDir, note.id);
  const metaFile = join(noteDir, 'meta.json');
  const contentFile = join(noteDir, 'content.json');
  const markdownFile = join(noteDir, 'note.md');

  // Ensure directory exists
  mkdirSync(noteDir, { recursive: true });

  // Read existing metadata to preserve createdAt
  let createdAt = Date.now();
  try {
    if (existsSync(metaFile)) {
      const existing = JSON.parse(readFileSync(metaFile, 'utf-8'));
      createdAt = existing.createdAt || createdAt;
    }
  } catch {
    // Use current time
  }

  // Write metadata
  const metadata: NoteMetadata = {
    id: note.id,
    title: note.title,
    tags: note.tags,
    createdAt,
    updatedAt: Date.now(),
    convertedToSessionId: note.convertedToSessionId,
  };
  writeFileSync(metaFile, JSON.stringify(metadata, null, 2), 'utf-8');

  // Write Tiptap JSON content
  writeFileSync(contentFile, JSON.stringify(note.content, null, 2), 'utf-8');

  // Write markdown export
  writeFileSync(markdownFile, note.markdown, 'utf-8');
}

/**
 * Create a new empty note
 * @param workspaceRoot - Absolute path to workspace root
 * @param title - Optional initial title
 */
export function createNote(workspaceRoot: string, title?: string): LoadedNote {
  const id = randomUUID().slice(0, 10);
  const now = Date.now();
  const emptyContent: Record<string, unknown> = {
    type: 'doc',
    content: [{ type: 'paragraph' }],
  };

  saveNote(workspaceRoot, {
    id,
    title: title || 'Untitled',
    content: emptyContent,
    markdown: '',
  });

  return {
    id,
    title: title || 'Untitled',
    content: emptyContent,
    markdown: '',
    createdAt: now,
    updatedAt: now,
    path: join(getWorkspaceNotesPath(workspaceRoot), id),
  };
}

// ============================================================
// Delete Operations
// ============================================================

/**
 * Delete a note from a workspace
 * @param workspaceRoot - Absolute path to workspace root
 * @param noteId - Note identifier
 */
export function deleteNote(workspaceRoot: string, noteId: string): boolean {
  const notesDir = getWorkspaceNotesPath(workspaceRoot);
  const noteDir = join(notesDir, noteId);

  if (!existsSync(noteDir)) {
    return false;
  }

  try {
    rmSync(noteDir, { recursive: true });
    return true;
  } catch {
    return false;
  }
}

// ============================================================
// Utility Functions
// ============================================================

/**
 * Check if a note exists in a workspace
 */
export function noteExists(workspaceRoot: string, noteId: string): boolean {
  const notesDir = getWorkspaceNotesPath(workspaceRoot);
  const noteDir = join(notesDir, noteId);
  const metaFile = join(noteDir, 'meta.json');

  return existsSync(noteDir) && existsSync(metaFile);
}

/**
 * List note IDs in a workspace
 */
export function listNoteIds(workspaceRoot: string): string[] {
  const notesDir = getWorkspaceNotesPath(workspaceRoot);

  if (!existsSync(notesDir)) {
    return [];
  }

  try {
    return readdirSync(notesDir, { withFileTypes: true })
      .filter((entry) => {
        if (!entry.isDirectory()) return false;
        const metaFile = join(notesDir, entry.name, 'meta.json');
        return existsSync(metaFile);
      })
      .map((entry) => entry.name);
  } catch {
    return [];
  }
}
