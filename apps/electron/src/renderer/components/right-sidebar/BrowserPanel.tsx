/**
 * BrowserPanel — Embedded Chromium browser in the right sidebar
 *
 * Uses Electron's <webview> tag for a real browser instance.
 * Partition: "persist:browser-panel" (isolated from app, survives panel close).
 * Agent controls via session events; user controls via direct webview methods.
 *
 * The requestId prop solves a race condition: the main process emits
 * browser_panel_open AND waits for a response, but this component isn't
 * mounted yet when the event fires. By passing requestId as a prop,
 * we respond once the webview finishes loading on mount.
 */

import * as React from 'react'
import { useState, useEffect, useRef, useCallback } from 'react'
import { ArrowLeft, ArrowRight, RotateCw, X } from 'lucide-react'
import { SNAPSHOT_SCRIPT, buildActionScript } from '../../lib/browser-a11y'

export interface BrowserPanelProps {
  url?: string
  /** requestId from the browser_open tool call — respond on mount when webview loads */
  requestId?: string
  /** The session that owns this browser panel (may differ from viewed session) */
  sessionId?: string
  closeButton?: React.ReactNode
}

export function BrowserPanel({ url, requestId, sessionId, closeButton }: BrowserPanelProps) {
  const webviewRef = useRef<Electron.WebviewTag>(null)
  const [currentUrl, setCurrentUrl] = useState(url || '')
  const [inputUrl, setInputUrl] = useState(url || '')
  const [isLoading, setIsLoading] = useState(false)
  const [canGoBack, setCanGoBack] = useState(false)
  const [canGoForward, setCanGoForward] = useState(false)
  const [pageTitle, setPageTitle] = useState('')
  // Track which requestId we've already responded to (prevent double-respond)
  const respondedRequestIds = useRef(new Set<string>())

  // Navigate when url prop changes (agent-initiated subsequent navigations)
  useEffect(() => {
    if (url && webviewRef.current && url !== currentUrl) {
      webviewRef.current.loadURL(url)
    }
  }, [url])

  // Register webview event listeners
  useEffect(() => {
    const wv = webviewRef.current
    if (!wv) return

    const onStartLoading = () => setIsLoading(true)
    const onStopLoading = () => {
      setIsLoading(false)
      setCanGoBack(wv.canGoBack())
      setCanGoForward(wv.canGoForward())
    }
    const onNavigate = (e: { url: string }) => {
      setCurrentUrl(e.url)
      setInputUrl(e.url)
    }
    const onTitleUpdate = (e: { title: string }) => setPageTitle(e.title)

    wv.addEventListener('did-start-loading', onStartLoading)
    wv.addEventListener('did-stop-loading', onStopLoading)
    wv.addEventListener('did-navigate', onNavigate)
    wv.addEventListener('did-navigate-in-page', onNavigate)
    wv.addEventListener('page-title-updated', onTitleUpdate)

    return () => {
      wv.removeEventListener('did-start-loading', onStartLoading)
      wv.removeEventListener('did-stop-loading', onStopLoading)
      wv.removeEventListener('did-navigate', onNavigate)
      wv.removeEventListener('did-navigate-in-page', onNavigate)
      wv.removeEventListener('page-title-updated', onTitleUpdate)
    }
  }, [])

  // Respond to the initial browser_open requestId when webview finishes loading.
  // This solves the race condition: the panel mounts AFTER the event fires,
  // so we respond via the prop instead of the event listener.
  useEffect(() => {
    if (!requestId || respondedRequestIds.current.has(requestId)) return
    const wv = webviewRef.current
    if (!wv) return

    const respond = (title: string) => {
      if (respondedRequestIds.current.has(requestId)) return
      respondedRequestIds.current.add(requestId)
      window.electronAPI.browserResult(requestId, { title })
    }

    const onStop = () => {
      wv.removeEventListener('did-stop-loading', onStop)
      respond(wv.getTitle())
    }
    wv.addEventListener('did-stop-loading', onStop)

    // Timeout fallback — respond even if page load is slow
    const timeout = setTimeout(() => {
      wv.removeEventListener('did-stop-loading', onStop)
      respond(wv.getTitle() || '')
    }, 15000)

    return () => {
      clearTimeout(timeout)
      wv.removeEventListener('did-stop-loading', onStop)
    }
  }, [requestId])

  // Listen for agent-initiated browser commands via session events
  // Handles: browser_panel_open (subsequent navigations), browser_panel_snapshot, browser_panel_action
  useEffect(() => {
    if (!sessionId) return
    const cleanup = window.electronAPI.onSessionEvent(async (event) => {
      if (!('sessionId' in event) || event.sessionId !== sessionId) return
      const wv = webviewRef.current
      if (!wv) return

      try {
        if (event.type === 'browser_panel_open') {
          // Subsequent browser_open calls (panel already mounted).
          // Navigate to new URL and respond when loaded.
          wv.loadURL(event.url)
          const title = await new Promise<string>((resolve) => {
            const onStop = () => {
              wv.removeEventListener('did-stop-loading', onStop)
              resolve(wv.getTitle())
            }
            wv.addEventListener('did-stop-loading', onStop)
            setTimeout(() => {
              wv.removeEventListener('did-stop-loading', onStop)
              resolve(wv.getTitle())
            }, 15000)
          })
          await window.electronAPI.browserResult(event.requestId, { title })
        }

        if (event.type === 'browser_panel_snapshot') {
          const snapshot = await wv.executeJavaScript(SNAPSHOT_SCRIPT)
          await window.electronAPI.browserResult(event.requestId, snapshot)
        }

        if (event.type === 'browser_panel_action') {
          const script = buildActionScript(event.action, event.ref, event.value)
          const result = await wv.executeJavaScript(script)
          await window.electronAPI.browserResult(event.requestId, result)
        }
      } catch (error) {
        const rid = 'requestId' in event ? (event as { requestId: string }).requestId : undefined
        if (rid) {
          await window.electronAPI.browserResult(rid, {
            error: error instanceof Error ? error.message : 'Unknown error',
          })
        }
      }
    })
    return cleanup
  }, [sessionId])

  const handleUrlSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault()
    let navigateUrl = inputUrl.trim()
    if (navigateUrl && !navigateUrl.match(/^https?:\/\//)) {
      navigateUrl = `https://${navigateUrl}`
    }
    if (navigateUrl) {
      webviewRef.current?.loadURL(navigateUrl)
    }
  }, [inputUrl])

  return (
    <div className="h-full flex flex-col">
      {/* URL bar + navigation */}
      <div className="px-2 py-1.5 border-b border-border flex items-center gap-1">
        <button
          className="p-1 rounded hover:bg-foreground-2 disabled:opacity-30"
          disabled={!canGoBack}
          onClick={() => webviewRef.current?.goBack()}
        >
          <ArrowLeft className="w-3.5 h-3.5" />
        </button>
        <button
          className="p-1 rounded hover:bg-foreground-2 disabled:opacity-30"
          disabled={!canGoForward}
          onClick={() => webviewRef.current?.goForward()}
        >
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
        <button
          className="p-1 rounded hover:bg-foreground-2"
          onClick={() => isLoading ? webviewRef.current?.stop() : webviewRef.current?.reload()}
        >
          {isLoading ? <X className="w-3.5 h-3.5" /> : <RotateCw className="w-3.5 h-3.5" />}
        </button>
        <form onSubmit={handleUrlSubmit} className="flex-1 min-w-0">
          <input
            value={inputUrl}
            onChange={(e) => setInputUrl(e.target.value)}
            className="w-full h-7 px-2 text-xs rounded bg-foreground-2 border-0 outline-none focus:ring-1 focus:ring-accent"
            placeholder="Enter URL..."
          />
        </form>
      </div>

      {/* Loading indicator */}
      {isLoading && <div className="h-0.5 bg-accent animate-pulse" />}

      {/* Webview */}
      <webview
        ref={webviewRef as React.RefObject<HTMLElement>}
        src={url || 'about:blank'}
        className="flex-1"
        partition="persist:browser-panel"
        style={{ minHeight: 0 }}
      />
    </div>
  )
}
