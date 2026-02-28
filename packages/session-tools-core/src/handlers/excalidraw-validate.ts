/**
 * Excalidraw Validate Handler
 *
 * Validates Excalidraw scene JSON structure.
 * No DOM required — works identically in Claude and Codex.
 */

import type { SessionToolContext } from '../context.ts';
import type { ToolResult } from '../types.ts';

export interface ExcalidrawValidateArgs {
  code: string;
}

const VALID_ELEMENT_TYPES = new Set([
  'rectangle', 'ellipse', 'diamond', 'line', 'arrow',
  'text', 'freedraw', 'image', 'frame', 'embeddable',
]);

/**
 * Handle the excalidraw_validate tool call.
 *
 * Validates the JSON structure of an Excalidraw scene:
 * - Valid JSON syntax
 * - Presence of `elements` array
 * - Valid element types
 */
export async function handleExcalidrawValidate(
  _ctx: SessionToolContext,
  args: ExcalidrawValidateArgs
): Promise<ToolResult> {
  const { code } = args;

  try {
    const scene = JSON.parse(code);

    // Check for elements array
    if (!scene.elements || !Array.isArray(scene.elements)) {
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: false,
            error: 'Missing or invalid "elements" array',
            suggestion: 'The scene JSON must have an "elements" array at the top level',
          }, null, 2),
        }],
        isError: true,
      };
    }

    // Check for unknown element types
    const unknownTypes = scene.elements
      .filter((el: any) => el.type && !VALID_ELEMENT_TYPES.has(el.type))
      .map((el: any) => el.type);

    if (unknownTypes.length > 0) {
      const unique = [...new Set(unknownTypes)];
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            valid: false,
            error: `Unknown element types: ${unique.join(', ')}`,
            validTypes: [...VALID_ELEMENT_TYPES],
            suggestion: 'Check the element types against ~/.craft-agent/docs/excalidraw.md',
          }, null, 2),
        }],
        isError: true,
      };
    }

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          valid: true,
          message: `Valid scene: ${scene.elements.length} elements`,
        }, null, 2),
      }],
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown parse error';

    return {
      content: [{
        type: 'text',
        text: JSON.stringify({
          valid: false,
          error: `Invalid JSON: ${errorMessage}`,
          suggestion: 'Check the JSON syntax — the scene must be valid JSON',
        }, null, 2),
      }],
      isError: true,
    };
  }
}
