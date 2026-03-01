/**
 * Lucide Icon Name Registry
 *
 * Format-based validation for Lucide icon names.
 * NO React or lucide-react dependencies - safe for browser/renderer/Node import.
 *
 * Lucide icon names follow a strict format: lowercase kebab-case (e.g., "globe", "arrow-right").
 * Actual component resolution happens in the renderer via lucide-react/dynamicIconImports.
 *
 * Detection priority in the icon pipeline:
 *   1. Lucide name (kebab-case ASCII string matching known format)
 *   2. Emoji (Unicode emoji characters)
 *   3. URL (http:// or https://)
 *   4. Local file (auto-discovered)
 *   5. Fallback (type-specific Lucide component)
 */

/**
 * Regex for valid Lucide icon names: lowercase letters, digits, and hyphens.
 * Must start and end with a letter. No consecutive hyphens.
 * Examples: "globe", "arrow-right", "file-text-2"
 */
const LUCIDE_NAME_REGEX = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * Check if a string looks like a Lucide icon name.
 *
 * This is a format-based check (kebab-case, reasonable length).
 * Actual validation against the full Lucide icon set happens at render time
 * via dynamicIconImports — if the name doesn't match, it falls through to fallback.
 *
 * @param str - The string to check
 * @returns true if the string matches the Lucide icon name format
 */
export function isLucideIconName(str: string | undefined): boolean {
  if (!str || str.length === 0) return false;
  // Lucide names are short — longest is ~40 chars
  if (str.length > 50) return false;
  return LUCIDE_NAME_REGEX.test(str);
}
