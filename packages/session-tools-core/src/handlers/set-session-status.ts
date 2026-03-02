/**
 * Set Session Status Handler
 *
 * Allows the agent to update the current session's workflow status.
 * Uses an injected setSessionStatus callback to avoid depending on @kos/shared.
 */

import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';
import { successResponse, errorResponse } from '../response.ts';

export interface SetSessionStatusArgs {
  statusId: string;
}

/**
 * Handle the set_session_status tool call.
 *
 * Validates the statusId argument, then delegates to the
 * context-provided setSessionStatus callback for actual persistence.
 */
export async function handleSetSessionStatus(
  ctx: SessionToolContext,
  args: SetSessionStatusArgs
): Promise<ToolResult> {
  if (!ctx.setSessionStatus) {
    return errorResponse('Session status update is not available in this environment.');
  }

  if (!args.statusId || typeof args.statusId !== 'string') {
    return errorResponse('statusId is required and must be a string.');
  }

  try {
    const result = ctx.setSessionStatus(args.statusId);

    if (result && typeof result === 'object' && 'error' in result) {
      return errorResponse(result.error as string);
    }

    return successResponse(`Session status updated to "${args.statusId}".`);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return errorResponse(`Failed to update session status: ${message}`);
  }
}
