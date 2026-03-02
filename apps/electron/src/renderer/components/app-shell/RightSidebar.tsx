/**
 * RightSidebar - Content router for right sidebar panels
 *
 * Always shows a segmented control (Info / Browser) at the top.
 * Browser state is passed as a separate `browserPanel` prop (independent of navigation
 * state) so it survives session switches.
 *
 * Uses `display: none` (Tailwind `hidden` class) to hide inactive panels.
 * This is critical for Electron's <webview> which creates an OS-level compositor
 * surface that ignores visibility/pointer-events CSS — only display:none prevents
 * the surface from being created.
 */

import * as React from 'react'
import type { RightSidebarPanel } from '../../../shared/types'
import { SessionMetadataPanel } from '../right-sidebar/SessionMetadataPanel'
import { BrowserPanel } from '../right-sidebar/BrowserPanel'
import { SettingsSegmentedControl } from '../settings/SettingsSegmentedControl'
import { Globe, Info } from 'lucide-react'

export interface RightSidebarProps {
  /** Current panel configuration (from navigation state) */
  panel: RightSidebarPanel
  /** Session ID for session-specific panels (currently viewed session) */
  sessionId?: string
  /** Independent browser panel state — survives navigation state changes */
  browserPanel?: { url?: string; requestId?: string; sessionId: string } | null
  /** Close button to display in panel header */
  closeButton?: React.ReactNode
}

/**
 * Routes right sidebar content based on panel type.
 * Always shows segmented control to switch between Info and Browser.
 */
export function RightSidebar({ panel, sessionId, browserPanel, closeButton }: RightSidebarProps) {
  const [activeTab, setActiveTab] = React.useState<'info' | 'browser'>('info')
  // Only show browser when viewing the session that owns it
  const hasBrowser = !!browserPanel && browserPanel.sessionId === sessionId

  // Auto-switch to browser tab when browser opens in this session
  React.useEffect(() => {
    if (hasBrowser) setActiveTab('browser')
  }, [hasBrowser])

  // Switch back to info when leaving the browser-owning session
  React.useEffect(() => {
    if (!hasBrowser && activeTab === 'browser') setActiveTab('info')
  }, [hasBrowser, activeTab])

  return (
    <div className="h-full flex flex-col">
      {/* Segmented control — always visible.
          transform: translateZ(0) forces a separate compositor layer that renders
          above Electron's webview compositor surface. */}
      <div
        className="flex justify-center px-3 pt-3 pb-1 shrink-0 relative z-10"
        style={{ transform: 'translateZ(0)' }}
      >
        <SettingsSegmentedControl
          value={activeTab}
          onValueChange={setActiveTab}
          options={[
            { value: 'info' as const, label: 'Info', icon: <Info className="w-3.5 h-3.5" /> },
            { value: 'browser' as const, label: 'Browser', icon: <Globe className="w-3.5 h-3.5" /> },
          ]}
          size="sm"
          className="bg-foreground/5 rounded-lg p-0.5"
        />
      </div>

      {/* Info panel — hidden via display:none when browser tab is active */}
      <div className={`flex-1 min-h-0 overflow-auto ${activeTab !== 'info' ? 'hidden' : ''}`}>
        <SessionMetadataPanel sessionId={sessionId} closeButton={closeButton} />
      </div>

      {/* Browser panel or empty state — hidden via display:none when info tab is active.
          overflow:hidden + contain:paint clip the webview's compositor surface to
          this container, preventing it from extending over the segmented control.
          (contain:paint, NOT strict — strict includes size containment which breaks flex layout) */}
      <div
        className={`flex-1 min-h-0 ${activeTab !== 'browser' ? 'hidden' : ''}`}
        style={{ overflow: 'hidden', contain: 'paint' }}
      >
        {hasBrowser ? (
          <BrowserPanel
            url={browserPanel.url}
            requestId={browserPanel.requestId}
            sessionId={browserPanel.sessionId}
            closeButton={closeButton}
          />
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-muted-foreground px-6">
            <Globe className="w-8 h-8 mb-3 opacity-40" />
            <p className="text-sm text-center">
              No browser open
            </p>
            <p className="text-xs text-center mt-1 opacity-70">
              Use <code className="bg-foreground/5 px-1 rounded text-[11px]">browser_open</code> to start browsing
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
