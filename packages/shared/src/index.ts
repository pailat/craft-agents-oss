/**
 * @kos/shared
 *
 * Shared business logic for Kos.
 * Used by the Electron app.
 *
 * Import specific modules via subpath exports:
 *   import { KosAgent } from '@kos/shared/agent';
 *   import { loadStoredConfig } from '@kos/shared/config';
 *   import { getCredentialManager } from '@kos/shared/credentials';
 *   import { CraftMcpClient } from '@kos/shared/mcp';
 *   import { debug } from '@kos/shared/utils';
 *   import { loadSource, createSource, getSourceCredentialManager } from '@kos/shared/sources';
 *   import { createWorkspace, loadWorkspace } from '@kos/shared/workspaces';
 *
 * Available modules:
 *   - agent: ClaudeAgent SDK wrapper, plan tools
 *   - auth: OAuth, token management, auth state
 *   - clients: Craft API client
 *   - config: Storage, models, preferences
 *   - credentials: Encrypted credential storage
 *   - mcp: MCP client, connection validation
 *   - prompts: System prompt generation
 *   - sources: Workspace-scoped source management (MCP, API, local)
 *   - utils: Debug logging, file handling, summarization
 *   - validation: URL validation
 *   - version: Version and installation management
 *   - workspaces: Workspace management (top-level organizational unit)
 */

// Export branding (standalone, no dependencies)
export * from './branding.ts';
