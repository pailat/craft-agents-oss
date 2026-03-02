/**
 * Browser Panel Handlers
 *
 * Session tools for controlling the embedded browser panel.
 * Communicates with the renderer via async callbacks on SessionToolContext,
 * following the same pattern as call_llm's queryFn.
 */

import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

export interface BrowserOpenArgs {
  url: string;
}

export interface BrowserSnapshotArgs {}

export interface BrowserActionArgs {
  action: 'click' | 'fill' | 'select' | 'scroll' | 'hover';
  ref: string;
  value?: string;
}

/**
 * Handle the browser_open tool call.
 *
 * 1. Validates the browser panel is available
 * 2. Calls the async browserOpen callback (opens panel + navigates)
 * 3. Returns success with page title
 */
export async function handleBrowserOpen(
  ctx: SessionToolContext,
  args: BrowserOpenArgs
): Promise<ToolResult> {
  if (!ctx.browserOpen) {
    return errorResponse('Browser panel is not available in this environment.');
  }

  try {
    const result = await ctx.browserOpen(args.url);
    return successResponse(
      result.title
        ? `Browser opened: ${result.title} (${args.url})`
        : `Browser navigated to ${args.url}`
    );
  } catch (error) {
    return errorResponse(
      `Failed to open browser: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Handle the browser_snapshot tool call.
 *
 * 1. Validates the browser panel is open
 * 2. Calls the async browserSnapshot callback (injects a11y script)
 * 3. Returns the accessibility tree as text
 */
export async function handleBrowserSnapshot(
  ctx: SessionToolContext,
  _args: BrowserSnapshotArgs
): Promise<ToolResult> {
  if (!ctx.browserSnapshot) {
    return errorResponse('Browser panel is not available. Call browser_open first.');
  }

  try {
    const snapshot = await ctx.browserSnapshot();
    return successResponse(snapshot);
  } catch (error) {
    return errorResponse(
      `Failed to take snapshot: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Handle the browser_action tool call.
 *
 * 1. Validates the browser panel is open
 * 2. Calls the async browserAction callback (injects action script)
 * 3. Returns confirmation or updated state
 */
export async function handleBrowserAction(
  ctx: SessionToolContext,
  args: BrowserActionArgs
): Promise<ToolResult> {
  if (!ctx.browserAction) {
    return errorResponse('Browser panel is not available. Call browser_open first.');
  }

  try {
    const result = await ctx.browserAction(args.action, args.ref, args.value);
    return successResponse(result);
  } catch (error) {
    return errorResponse(
      `Action failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
