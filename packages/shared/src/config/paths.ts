/**
 * Centralized path configuration for Kos.
 *
 * Supports multi-instance development via KOS_CONFIG_DIR environment variable.
 * When running from a numbered folder (e.g., craft-tui-agent-1), the detect-instance.sh
 * script sets KOS_CONFIG_DIR to ~/.kos-1, allowing multiple instances to run
 * simultaneously with separate configurations.
 *
 * Default (non-numbered folders): ~/.kos/
 * Instance 1 (-1 suffix): ~/.kos-1/
 * Instance 2 (-2 suffix): ~/.kos-2/
 */

import { homedir } from 'os';
import { join } from 'path';

// Allow override via environment variable for multi-instance dev
// Falls back to default ~/.kos/ for production and non-numbered dev folders
export const CONFIG_DIR = process.env.KOS_CONFIG_DIR || join(homedir(), '.kos');
