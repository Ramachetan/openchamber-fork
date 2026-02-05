/**
 * Child process utilities
 */

import * as cp from 'child_process';
import { promisify } from 'util';

const exec = promisify(cp.exec);

/**
 * Check if a command is available in PATH
 */
export async function isCommandAvailable(command: string): Promise<boolean> {
  try {
    if (process.platform === 'win32') {
      await exec(`where ${command}`, { timeout: 3000 });
    } else {
      await exec(`which ${command}`, { timeout: 3000 });
    }
    return true;
  } catch {
    return false;
  }
}

/**
 * Get command version
 */
export async function getCommandVersion(
  command: string,
  versionFlag = '--version'
): Promise<string | null> {
  try {
    const { stdout } = await exec(`${command} ${versionFlag}`, { timeout: 5000 });
    return stdout.trim();
  } catch {
    return null;
  }
}

/**
 * Kill process tree (cross-platform)
 */
export function killProcessTree(pid: number, signal: NodeJS.Signals = 'SIGTERM'): void {
  if (process.platform === 'win32') {
    try {
      cp.execSync(`taskkill /pid ${pid} /T /F`, { stdio: 'ignore' });
    } catch {
      // Ignore errors
    }
  } else {
    try {
      process.kill(-pid, signal);
    } catch {
      // Ignore errors
    }
  }
}
