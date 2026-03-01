/**
 * Notes Types
 *
 * Type definitions for workspace notes.
 * Notes are user-created documents that can be converted to chat sessions.
 */

/**
 * Note metadata stored in meta.json
 */
export interface NoteMetadata {
  /** Unique identifier */
  id: string;
  /** Display title */
  title: string;
  /** Optional tags for organization */
  tags?: string[];
  /** Creation timestamp (epoch ms) */
  createdAt: number;
  /** Last modification timestamp (epoch ms) */
  updatedAt: number;
  /** Session ID if this note was converted to a session */
  convertedToSessionId?: string;
}

/**
 * A loaded note with parsed content
 */
export interface LoadedNote extends NoteMetadata {
  /** Tiptap JSON document content */
  content: Record<string, unknown>;
  /** Markdown export of the content */
  markdown: string;
  /** Absolute path to note directory */
  path: string;
}
