/**
 * ExcalidrawFullscreenOverlay — fullscreen view of Excalidraw drawings.
 *
 * Uses PreviewOverlay as the base component for consistent overlay behavior
 * (modal vs fullscreen responsive modes, escape to close, backdrop click).
 *
 * Unlike MermaidPreviewOverlay which needs 471 lines of custom zoom/pan logic,
 * Excalidraw has built-in zoom/pan — so this overlay is simple.
 */

import * as React from 'react'
import { PenTool } from 'lucide-react'
import { PreviewOverlay } from './PreviewOverlay'
import { CopyButton } from './CopyButton'

// Lazy-load Excalidraw — shares the cached module with MarkdownExcalidrawBlock
const ExcalidrawLazy = React.lazy(() =>
  import('@excalidraw/excalidraw').then(mod => ({
    default: mod.Excalidraw
  }))
)

export interface ExcalidrawFullscreenOverlayProps {
  code: string
  sceneData: { elements: any[]; appState: any; files?: any; scrollToContent?: boolean }
  isDark: boolean
  onClose: () => void
}

export function ExcalidrawFullscreenOverlay({
  code, sceneData, isDark, onClose
}: ExcalidrawFullscreenOverlayProps) {
  return (
    <PreviewOverlay
      isOpen={true}
      onClose={onClose}
      typeBadge={{ icon: PenTool, label: 'Drawing', variant: 'blue' }}
      title="Excalidraw"
      headerActions={
        <CopyButton content={code} title="Copy JSON" />
      }
    >
      <div className="w-full excalidraw-wrapper" style={{ height: '70vh' }}>
        <React.Suspense fallback={
          <div className="animate-pulse bg-muted/30 w-full h-full" />
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
    </PreviewOverlay>
  )
}
