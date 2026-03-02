/**
 * NoteEditorPage
 *
 * Full-page note editor with Tiptap rich text editing.
 * Follows the same pattern as SkillInfoPage but with an editable content area.
 *
 * Uses refs for save functions to avoid stale closures in Tiptap's onUpdate
 * callback and debounced timeouts.
 */

import { useState, useEffect, useCallback, useRef } from 'react'
import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import Placeholder from '@tiptap/extension-placeholder'
import TaskList from '@tiptap/extension-task-list'
import TaskItem from '@tiptap/extension-task-item'
import Link from '@tiptap/extension-link'
import Image from '@tiptap/extension-image'
import {
  Bold,
  Italic,
  Strikethrough,
  Code,
  List,
  ListOrdered,
  ListTodo,
  Quote,
  Minus,
  Heading1,
  Heading2,
  Heading3,
  Undo,
  Redo,
  MessageSquarePlus,
  Trash2,
  FolderOpen,
} from 'lucide-react'
import { toast } from 'sonner'
import { cn } from '@/lib/utils'
import { Tooltip, TooltipTrigger, TooltipContent } from '@kos/ui'
import {
  StyledDropdownMenuItem,
  StyledDropdownMenuSeparator,
} from '@/components/ui/styled-dropdown'
import { PanelHeader } from '@/components/app-shell/PanelHeader'
import { HeaderMenu } from '@/components/ui/HeaderMenu'
import { routes } from '@/lib/navigate'
import type { LoadedNote } from '@kos/shared/notes'

// =============================================================================
// Tiptap Toolbar Button
// =============================================================================

interface ToolbarButtonProps {
  onClick: () => void
  isActive?: boolean
  disabled?: boolean
  title: string
  children: React.ReactNode
}

function ToolbarButton({ onClick, isActive, disabled, title, children }: ToolbarButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          onClick={onClick}
          disabled={disabled}
          className={cn(
            'h-7 w-7 flex items-center justify-center rounded-md transition-colors',
            'hover:bg-foreground/[0.06]',
            'disabled:opacity-30 disabled:cursor-not-allowed',
            isActive && 'bg-foreground/[0.08] text-foreground',
            !isActive && 'text-muted-foreground',
          )}
        >
          {children}
        </button>
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={4}>
        {title}
      </TooltipContent>
    </Tooltip>
  )
}

function ToolbarSeparator() {
  return <div className="w-px h-4 bg-border/50 mx-1" />
}

// =============================================================================
// NoteToolbar
// =============================================================================

interface NoteToolbarProps {
  editor: ReturnType<typeof useEditor>
}

function NoteToolbar({ editor }: NoteToolbarProps) {
  if (!editor) return null

  return (
    <div className="flex items-center gap-0.5 px-3 py-1.5 border-b border-border/50 bg-background/50 overflow-x-auto">
      <ToolbarButton
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        title="Undo"
      >
        <Undo className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        title="Redo"
      >
        <Redo className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
        isActive={editor.isActive('heading', { level: 1 })}
        title="Heading 1"
      >
        <Heading1 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
        isActive={editor.isActive('heading', { level: 2 })}
        title="Heading 2"
      >
        <Heading2 className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
        isActive={editor.isActive('heading', { level: 3 })}
        title="Heading 3"
      >
        <Heading3 className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBold().run()}
        isActive={editor.isActive('bold')}
        title="Bold"
      >
        <Bold className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleItalic().run()}
        isActive={editor.isActive('italic')}
        title="Italic"
      >
        <Italic className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleStrike().run()}
        isActive={editor.isActive('strike')}
        title="Strikethrough"
      >
        <Strikethrough className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleCode().run()}
        isActive={editor.isActive('code')}
        title="Inline Code"
      >
        <Code className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Ordered List"
      >
        <ListOrdered className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleTaskList().run()}
        isActive={editor.isActive('taskList')}
        title="Task List"
      >
        <ListTodo className="h-3.5 w-3.5" />
      </ToolbarButton>

      <ToolbarSeparator />

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <Quote className="h-3.5 w-3.5" />
      </ToolbarButton>
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Horizontal Rule"
      >
        <Minus className="h-3.5 w-3.5" />
      </ToolbarButton>
    </div>
  )
}

// =============================================================================
// NoteEditorPage
// =============================================================================

interface NoteEditorPageProps {
  noteId: string
  workspaceId: string
  onConvertToSession?: (noteId: string, title: string, markdown: string) => void
  onDelete?: (noteId: string) => void
}

export default function NoteEditorPage({
  noteId,
  workspaceId,
  onConvertToSession,
  onDelete,
}: NoteEditorPageProps) {
  const [note, setNote] = useState<LoadedNote | null>(null)
  const [loading, setLoading] = useState(true)
  const [title, setTitle] = useState('')
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const isInitialLoadRef = useRef(true)

  // Refs that always point to the latest values — avoids stale closures in
  // Tiptap's onUpdate callback and debounced timeouts.
  const noteRef = useRef<LoadedNote | null>(null)
  const titleRef = useRef('')
  noteRef.current = note
  titleRef.current = title

  // Stable save function that reads from refs (never stale)
  const doSave = useCallback(async (editorInstance: ReturnType<typeof useEditor>) => {
    const currentNote = noteRef.current
    if (!currentNote || isInitialLoadRef.current) return
    if (!editorInstance) return

    try {
      const content = editorInstance.getJSON()
      const markdown = editorInstance.getText()

      await window.electronAPI.saveNote(workspaceId, {
        id: currentNote.id,
        title: titleRef.current || 'Untitled',
        content,
        markdown,
        tags: currentNote.tags,
        convertedToSessionId: currentNote.convertedToSessionId,
      })
    } catch (err) {
      console.error('[NoteEditor] Failed to save note:', err)
    }
  }, [workspaceId])

  // Debounced save — schedules a save 800ms from now, cancelling any pending one.
  const scheduleSave = useCallback((editorInstance: ReturnType<typeof useEditor>) => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
    }
    saveTimeoutRef.current = setTimeout(() => {
      doSave(editorInstance)
    }, 800)
  }, [doSave])

  // Tiptap editor
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
      }),
      Placeholder.configure({
        placeholder: 'Start writing...',
      }),
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Link.configure({
        openOnClick: false,
        autolink: true,
      }),
      Image,
    ],
    editorProps: {
      attributes: {
        class: 'prose prose-sm dark:prose-invert max-w-none focus:outline-none min-h-[200px] px-6 py-4',
      },
    },
    onUpdate: ({ editor: ed }) => {
      // scheduleSave is stable (only depends on doSave which only depends on workspaceId).
      // doSave reads note/title from refs, so it always has the latest values.
      scheduleSave(ed)
    },
  })

  // Load note data
  useEffect(() => {
    let isMounted = true
    isInitialLoadRef.current = true
    setLoading(true)

    const loadNote = async () => {
      try {
        const loaded = await window.electronAPI.getNote(workspaceId, noteId)
        if (!isMounted) return

        if (loaded) {
          setNote(loaded)
          setTitle(loaded.title)

          // Set editor content from saved JSON
          if (editor && loaded.content && Object.keys(loaded.content).length > 0) {
            editor.commands.setContent(loaded.content)
          }
        }
      } catch (err) {
        console.error('[NoteEditor] Failed to load note:', err)
      } finally {
        if (isMounted) {
          setLoading(false)
          // Allow save after initial load settles
          setTimeout(() => {
            isInitialLoadRef.current = false
          }, 500)
        }
      }
    }

    loadNote()
    return () => { isMounted = false }
  }, [workspaceId, noteId, editor])

  // Save on title change (debounced)
  const handleTitleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setTitle(e.target.value)
    // Schedule save — editor ref may be null during initial render
    if (editor) scheduleSave(editor)
  }, [editor, scheduleSave])

  // Save immediately on title blur
  const handleTitleBlur = useCallback(() => {
    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current)
      saveTimeoutRef.current = null
    }
    if (editor) doSave(editor)
  }, [editor, doSave])

  // Cleanup save timeout on unmount — also flush pending save
  useEffect(() => {
    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current)
      }
    }
  }, [])

  // Save on Cmd+S
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault()
        if (saveTimeoutRef.current) {
          clearTimeout(saveTimeoutRef.current)
          saveTimeoutRef.current = null
        }
        if (editor) {
          doSave(editor)
          toast.success('Note saved')
        }
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [editor, doSave])

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-pulse text-muted-foreground text-sm">Loading note...</div>
      </div>
    )
  }

  // Not found state
  if (!note) {
    return (
      <div className="flex items-center justify-center h-full text-muted-foreground">
        <p className="text-sm">Note not found</p>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with actions menu (uses PanelHeader for titlebar-no-drag) */}
      <PanelHeader
        title={title || 'Untitled'}
        actions={
          <HeaderMenu route={routes.view.notes(noteId)}>
            {onConvertToSession && (
              <StyledDropdownMenuItem
                onClick={() => {
                  const markdown = editor?.getText() ?? ''
                  onConvertToSession(note.id, title || 'Untitled', markdown)
                }}
              >
                <MessageSquarePlus className="h-3.5 w-3.5" />
                <span className="flex-1">Convert to Session</span>
              </StyledDropdownMenuItem>
            )}
            <StyledDropdownMenuItem
              onClick={() => window.electronAPI.openNoteInFinder(workspaceId, note.id)}
            >
              <FolderOpen className="h-3.5 w-3.5" />
              <span className="flex-1">Show in Finder</span>
            </StyledDropdownMenuItem>
            {onDelete && (
              <>
                <StyledDropdownMenuSeparator />
                <StyledDropdownMenuItem
                  onClick={() => onDelete(note.id)}
                  className="text-destructive"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  <span className="flex-1">Delete Note</span>
                </StyledDropdownMenuItem>
              </>
            )}
          </HeaderMenu>
        }
      />

      {/* Editable title input (below header, in content area) */}
      <div className="px-6 pt-3 pb-1">
        <input
          ref={titleInputRef}
          value={title}
          onChange={handleTitleChange}
          onBlur={handleTitleBlur}
          placeholder="Untitled"
          className="w-full text-lg font-semibold bg-transparent border-none outline-none placeholder:text-muted-foreground/50"
        />
      </div>

      {/* Tiptap toolbar */}
      <NoteToolbar editor={editor} />

      {/* Editor content */}
      <div className="flex-1 overflow-y-auto">
        <EditorContent editor={editor} />
      </div>
    </div>
  )
}
