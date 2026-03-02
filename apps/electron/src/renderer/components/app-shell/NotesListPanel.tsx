import * as React from 'react'
import { StickyNote, Trash2, FolderOpen } from 'lucide-react'
import { EntityPanel } from '@/components/ui/entity-panel'
import { EntityIcon } from '@/components/ui/entity-icon'
import { EntityListEmptyScreen } from '@/components/ui/entity-list-empty'
import { noteSelection } from '@/hooks/useEntitySelection'
import type { LoadedNote } from '@kos/shared/notes'
import { useMenuComponents } from '@/components/ui/menu-context'
import { getFileManagerName } from '@/lib/platform'

interface NoteMenuProps {
  noteId: string
  noteTitle: string
  workspaceId?: string
  onShowInFinder?: () => void
  onDelete: () => void
}

/**
 * NoteMenu - Renders menu items for note actions.
 * Content only — EntityRow wraps this in DropdownMenu/ContextMenu via MenuComponentsContext.
 */
function NoteMenu({ noteId, noteTitle, workspaceId, onShowInFinder, onDelete }: NoteMenuProps) {
  const { MenuItem, Separator } = useMenuComponents()

  return (
    <>
      {onShowInFinder && (
        <MenuItem onClick={onShowInFinder}>
          <FolderOpen className="h-3.5 w-3.5" />
          <span className="flex-1">{`Show in ${getFileManagerName()}`}</span>
        </MenuItem>
      )}

      <Separator />

      <MenuItem onClick={onDelete} variant="destructive">
        <Trash2 className="h-3.5 w-3.5" />
        <span className="flex-1">Delete Note</span>
      </MenuItem>
    </>
  )
}

export interface NotesListPanelProps {
  notes: LoadedNote[]
  onNoteClick: (note: LoadedNote) => void
  onDeleteNote: (noteId: string) => void
  selectedNoteId?: string | null
  workspaceId?: string
  onCreateNote?: () => void
  className?: string
}

function formatRelativeTime(timestamp: number): string {
  const now = Date.now()
  const diff = now - timestamp
  const minutes = Math.floor(diff / 60000)
  const hours = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)

  if (minutes < 1) return 'just now'
  if (minutes < 60) return `${minutes}m ago`
  if (hours < 24) return `${hours}h ago`
  if (days < 7) return `${days}d ago`
  return new Date(timestamp).toLocaleDateString()
}

export function NotesListPanel({
  notes,
  onNoteClick,
  onDeleteNote,
  selectedNoteId,
  workspaceId,
  onCreateNote,
  className,
}: NotesListPanelProps) {
  return (
    <EntityPanel<LoadedNote>
      items={notes}
      getId={(n) => n.id}
      selection={noteSelection}
      selectedId={selectedNoteId}
      onItemClick={onNoteClick}
      className={className}
      emptyState={
        <EntityListEmptyScreen
          icon={<StickyNote />}
          title="No notes yet"
          description="Create notes, ideas, and documents. Convert them into sessions when ready."
        >
          {onCreateNote && (
            <button
              onClick={onCreateNote}
              className="inline-flex items-center h-7 px-3 text-xs font-medium rounded-[8px] bg-background shadow-minimal hover:bg-foreground/[0.03] transition-colors"
            >
              New Note
            </button>
          )}
        </EntityListEmptyScreen>
      }
      mapItem={(note) => ({
        icon: <EntityIcon icon={{ kind: 'fallback', colorable: false }} size="sm" fallbackIcon={StickyNote} alt={note.title || 'Untitled'} />,
        title: note.title || 'Untitled',
        badges: (
          <span className="truncate">
            {formatRelativeTime(note.updatedAt)}
          </span>
        ),
        menu: (
          <NoteMenu
            noteId={note.id}
            noteTitle={note.title}
            workspaceId={workspaceId}
            onShowInFinder={
              workspaceId
                ? () => window.electronAPI.openNoteInFinder(workspaceId, note.id)
                : undefined
            }
            onDelete={() => onDeleteNote(note.id)}
          />
        ),
      })}
    />
  )
}
