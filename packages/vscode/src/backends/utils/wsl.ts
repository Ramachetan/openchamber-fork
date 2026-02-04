/**
 * WSL (Windows Subsystem for Linux) utilities
 */

import * as vscode from 'vscode';
import * as cp from 'child_process';
import { promisify } from 'util';

const exec = promisify(cp.exec);

/**
 * Check if WSL is available on Windows
 */
export async function isWSLAvailable(): Promise<boolean> {
  if (process.platform !== 'win32') {
    return false;
  }

  try {
    await exec('wsl --status', { timeout: 3000 });
    return true;
  } catch {
    return false;
  }
}

/**
 * Get WSL configuration from VS Code settings
 */
export interface WSLConfig {
  enabled: boolean;
  distro: string;
  nodePath: string;
  claudePath: string;
}

export function getWSLConfig(): WSLConfig {
  const config = vscode.workspace.getConfiguration('neusis-code.claudeCli');

  return {
    enabled: config.get<boolean>('wslEnabled', false),
    distro: config.get<string>('wslDistro', 'Ubuntu'),
    nodePath: config.get<string>('wslNodePath', '/usr/bin/node'),
    claudePath: config.get<string>('wslClaudePath', '/usr/local/bin/claude'),
  };
}

/**
 * Convert Windows path to WSL path
 */
export function windowsPathToWSL(windowsPath: string): string {
  // Convert C:\Users\... to /mnt/c/Users/...
  const match = windowsPath.match(/^([A-Z]):(.*)/i);
  if (match) {
    const drive = match[1].toLowerCase();
    const path = match[2].replace(/\\/g, '/');
    return `/mnt/${drive}${path}`;
  }
  return windowsPath.replace(/\\/g, '/');
}

/**
 * Spawn a process in WSL
 */
export function spawnInWSL(
  distro: string,
  command: string,
  args: string[],
  options: cp.SpawnOptions
): cp.ChildProcess {
  const wslCommand = `${command} ${args.map(arg => `'${arg.replace(/'/g, "'\\''")}'`).join(' ')}`;

  return cp.spawn('wsl', ['-d', distro, 'bash', '-ic', wslCommand], {
    ...options,
    shell: false, // Don't use shell when calling wsl
  });
}
