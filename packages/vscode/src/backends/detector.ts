/**
 * Backend detection and selection logic
 */

import * as vscode from 'vscode';
import { exec } from 'child_process';
import { promisify } from 'util';
import type { BackendType, DetectionResult } from './types';

const execAsync = promisify(exec);

/**
 * Check if OpenCode CLI is available
 */
async function checkOpenCodeAvailability(): Promise<{
  available: boolean;
  version: string | null;
}> {
  try {
    const { stdout } = await execAsync('opencode --version', { timeout: 5000 });
    const version = stdout.trim();
    return { available: true, version };
  } catch {
    return { available: false, version: null };
  }
}

/**
 * Check if Claude CLI is available
 */
async function checkClaudeAvailability(): Promise<{
  available: boolean;
  version: string | null;
}> {
  try {
    const { stdout } = await execAsync('claude --version', { timeout: 5000 });
    const version = stdout.trim();
    return { available: true, version };
  } catch {
    return { available: false, version: null };
  }
}

/**
 * Check if WSL is available on Windows
 */
async function checkWSLAvailability(): Promise<boolean> {
  if (process.platform !== 'win32') {
    return false;
  }

  try {
    await execAsync('wsl --status', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Detect all available backends
 */
export async function detectAvailableBackends(
  config: vscode.WorkspaceConfiguration
): Promise<DetectionResult> {
  const available: BackendType[] = [];
  let recommended: BackendType | null = null;

  // Check for OpenCode
  const openCodeCheck = await checkOpenCodeAvailability();
  const apiUrl = config.get<string>('apiUrl') || null;

  const openCodeInfo = {
    cliAvailable: openCodeCheck.available,
    version: openCodeCheck.version,
    apiUrl,
  };

  // If there's an API URL configured, OpenCode is preferred
  if (apiUrl || openCodeCheck.available) {
    available.push('opencode');
    if (!recommended) recommended = 'opencode';
  }

  // Check for Claude CLI
  const claudeCheck = await checkClaudeAvailability();
  const wslAvailable = await checkWSLAvailability();

  const claudeInfo = {
    cliAvailable: claudeCheck.available,
    version: claudeCheck.version,
    wslAvailable,
  };

  if (claudeCheck.available) {
    available.push('claude-cli');
    if (!recommended) recommended = 'claude-cli';
  }

  return {
    available,
    recommended,
    openCodeInfo,
    claudeInfo,
  };
}

/**
 * Select backend based on detection and user preferences
 */
export async function selectBackend(
  detection: DetectionResult,
  userOverride?: BackendType
): Promise<BackendType> {
  // If user has manual override, validate it's available
  if (userOverride) {
    if (detection.available.includes(userOverride)) {
      return userOverride;
    }
    throw new Error(
      `Selected backend '${userOverride}' is not available. Available: ${detection.available.join(', ')}`
    );
  }

  // Use recommended backend
  if (detection.recommended) {
    return detection.recommended;
  }

  // No backend available
  throw new Error(
    'No backend available. Please install OpenCode CLI or Claude Code CLI.'
  );
}

/**
 * Get user's backend preference from config
 */
export function getBackendPreference(
  config: vscode.WorkspaceConfiguration
): BackendType | 'auto' {
  const backend = config.get<string>('backend', 'auto');
  if (backend === 'opencode' || backend === 'claude-cli') {
    return backend;
  }
  return 'auto';
}
