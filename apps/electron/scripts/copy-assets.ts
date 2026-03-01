/**
 * Cross-platform asset copy script.
 *
 * Copies the resources/ directory to dist/resources/.
 * All bundled assets (docs, themes, permissions, tool-icons) now live in resources/
 * which electron-builder handles natively via directories.buildResources.
 *
 * At Electron startup, setBundledAssetsRoot(__dirname) is called, and then
 * getBundledAssetsDir('docs') resolves to <__dirname>/resources/docs/, etc.
 *
 * Run: bun scripts/copy-assets.ts
 */

import { cpSync, copyFileSync, mkdirSync } from 'fs';
import { join } from 'path';

// Copy all resources (icons, themes, docs, permissions, tool-icons, etc.)
cpSync('resources', 'dist/resources', { recursive: true });

console.log('✓ Copied resources/ → dist/resources/');

// Copy Excalidraw fonts for production (served locally, no CDN dependency).
// The renderer sets EXCALIDRAW_ASSET_PATH = '/excalidraw-assets/' and the
// Vite plugin handles this in dev; in production we need the actual files.
const excalidrawFontsSrc = join('..', '..', 'node_modules', '@excalidraw', 'excalidraw', 'dist', 'prod', 'fonts');
const excalidrawFontsDest = join('dist', 'renderer', 'excalidraw-assets', 'fonts');
try {
  mkdirSync(join('dist', 'renderer', 'excalidraw-assets'), { recursive: true });
  cpSync(excalidrawFontsSrc, excalidrawFontsDest, { recursive: true });
  console.log('✓ Copied Excalidraw fonts → dist/renderer/excalidraw-assets/');
} catch (err) {
  console.log('⚠ Excalidraw fonts copy skipped (optional for dev)');
}

// Copy PowerShell parser script (for Windows command validation in Explore mode)
// Source: packages/shared/src/agent/powershell-parser.ps1
// Destination: dist/resources/powershell-parser.ps1
const psParserSrc = join('..', '..', 'packages', 'shared', 'src', 'agent', 'powershell-parser.ps1');
const psParserDest = join('dist', 'resources', 'powershell-parser.ps1');
try {
  copyFileSync(psParserSrc, psParserDest);
  console.log('✓ Copied powershell-parser.ps1 → dist/resources/');
} catch (err) {
  // Only warn - PowerShell validation is optional on non-Windows platforms
  console.log('⚠ powershell-parser.ps1 copy skipped (not critical on non-Windows)');
}
