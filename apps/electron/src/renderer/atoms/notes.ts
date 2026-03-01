/**
 * Notes Atom
 *
 * Simple atom for storing workspace notes.
 * AppShell populates this when notes are loaded.
 */

import { atom } from 'jotai'
import type { LoadedNote } from '@craft-agent/shared/notes'

/**
 * Atom to store the current workspace's notes.
 * AppShell populates this when notes are loaded.
 */
export const notesAtom = atom<LoadedNote[]>([])
