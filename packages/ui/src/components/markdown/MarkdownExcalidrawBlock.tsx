import * as React from 'react'
import { Maximize2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { CodeBlock } from './CodeBlock'
import { ExcalidrawFullscreenOverlay } from '../overlay/ExcalidrawFullscreenOverlay'

// v0.18 requires explicit CSS import (no longer auto-injected)
import '@excalidraw/excalidraw/index.css'

// ============================================================================
// MarkdownExcalidrawBlock — renders excalidraw code fences as interactive drawings.
//
// Uses @excalidraw/excalidraw React component with lazy loading to avoid
// impacting initial bundle size (~46MB unpacked). The module is only downloaded
// when the first excalidraw code block is encountered.
//
// Renders in view-only mode (viewModeEnabled) with zoom controls visible.
// Falls back to a plain code block if JSON is invalid.
//
// Theming: Uses the `theme` prop ("dark" | "light") detected from the app's
// root <html> class, observed reactively via MutationObserver.
// ============================================================================

// Tell Excalidraw to load fonts from our local server instead of CDN.
// Must be set before the lazy import resolves so the font loader picks it up.
if (typeof window !== 'undefined') {
  ;(window as any).EXCALIDRAW_ASSET_PATH = '/excalidraw-assets/'
}

// Lazy-load Excalidraw — only fetched when the first excalidraw block renders.
const ExcalidrawLazy = React.lazy(() =>
  import('@excalidraw/excalidraw').then(mod => ({
    default: mod.Excalidraw
  }))
)

// Height for inline rendering. Tall enough for most diagrams while fitting in chat.
const INLINE_HEIGHT = 500

interface MarkdownExcalidrawBlockProps {
  code: string
  className?: string
  /** Whether to show the inline expand button. Default true. */
  showExpandButton?: boolean
}

export function MarkdownExcalidrawBlock({
  code, className, showExpandButton = true
}: MarkdownExcalidrawBlockProps) {
  const [isFullscreen, setIsFullscreen] = React.useState(false)

  // Reactive dark mode detection — observes class changes on <html> element
  const [isDark, setIsDark] = React.useState(
    () => document.documentElement.classList.contains('dark')
  )
  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains('dark'))
    })
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] })
    return () => observer.disconnect()
  }, [])

  // Parse scene JSON — memoized to avoid re-parsing on re-renders
  const sceneData = React.useMemo(() => {
    try {
      const parsed = JSON.parse(code)
      return {
        elements: parsed.elements ?? [],
        appState: {
          ...parsed.appState,
          viewBackgroundColor: 'transparent',
        },
        files: parsed.files ?? undefined,
        scrollToContent: true,
      }
    } catch {
      return null
    }
  }, [code])

  // Invalid JSON — fall back to a plain code block
  if (!sceneData) {
    return <CodeBlock code={code} language="json" mode="full" className={className} />
  }

  return (
    <>
      <div className={cn('relative group rounded-md overflow-hidden border border-border/50', className)}>
        {showExpandButton && (
          <button
            onClick={() => setIsFullscreen(true)}
            className={cn(
              "absolute top-2 right-2 p-1 rounded-[6px] transition-all z-20 select-none",
              "opacity-0 group-hover:opacity-100",
              "bg-background shadow-minimal",
              "text-muted-foreground/50 hover:text-foreground",
              "focus:outline-none focus-visible:ring-1 focus-visible:ring-ring focus-visible:opacity-100"
            )}
            title="View Fullscreen"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        )}
        <div style={{ height: INLINE_HEIGHT }} className="excalidraw-wrapper">
          <React.Suspense fallback={
            <div className="animate-pulse bg-muted/30 w-full h-full rounded-md" />
          }>
            <ExcalidrawLazy
              initialData={sceneData}
              viewModeEnabled={true}
              gridModeEnabled={false}
              theme={isDark ? 'dark' : 'light'}
              UIOptions={{
                canvasActions: {
                  changeViewBackgroundColor: false,
                  clearCanvas: false,
                  export: false,
                  loadScene: false,
                  saveToActiveFile: false,
                  toggleTheme: false,
                  saveAsImage: false,
                },
                tools: { image: false },
                welcomeScreen: false,
              }}
            />
          </React.Suspense>
        </div>
      </div>
      {isFullscreen && (
        <ExcalidrawFullscreenOverlay
          code={code}
          sceneData={sceneData}
          isDark={isDark}
          onClose={() => setIsFullscreen(false)}
        />
      )}
    </>
  )
}
