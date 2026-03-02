/**
 * Centralized branding assets for Kos
 * Used by OAuth callback pages
 */

export const KOS_LOGO = [
  '██   ██  ████   █████  ██       █████  ██████ ',
  '██  ██  ██  ██ ██      ██      ██   ██ ██   ██',
  '█████   ██  ██  █████  ██      ███████ ██████ ',
  '██  ██  ██  ██      ██ ██      ██   ██ ██   ██',
  '██   ██  ████  █████   ██████  ██   ██ ██████ ',
] as const;

/** Logo as a single string for HTML templates */
export const KOS_LOGO_HTML = KOS_LOGO.map((line) => line.trimEnd()).join('\n');

/** Session viewer base URL */
export const VIEWER_URL = 'https://agents.craft.do';
