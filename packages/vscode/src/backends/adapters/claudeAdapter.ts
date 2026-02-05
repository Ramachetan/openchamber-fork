/**
 * Claude CLI backend adapter - spawns claude process with stream-JSON protocol
 */

import * as vscode from 'vscode';
import * as cp from 'child_process';
import * as os from 'os';
import type {
  BackendManager,
  BackendCapabilities,
  BackendDebugInfo,
  BackendRequest,
  BackendResponse,
  BackendMessage,
  ConnectionStatus,
} from '../types';
import { getWSLConfig, spawnInWSL } from '../utils/wsl';
import { isCommandAvailable, getCommandVersion, killProcessTree } from '../utils/childProcess';

interface ClaudeMessage {
  type: string;
  session_id?: string;
  message?: {
    role: string;
    content: Array<{ type: string; text?: string; [key: string]: unknown }>;
  };
  [key: string]: unknown;
}

/**
 * Adapter for Claude CLI backend
 */
export class ClaudeAdapter implements BackendManager {
  private _process: cp.ChildProcess | null = null;
  private _status: ConnectionStatus = 'disconnected';
  private _workingDirectory: string;
  private _messageHandlers = new Set<(msg: BackendMessage) => void>();
  private _statusHandlers = new Set<(status: ConnectionStatus) => void>();
  private _errorHandlers = new Set<(error: Error) => void>();
  private _readBuffer = '';
  private _sessionId: string | null = null;
  private _abortController: AbortController | null = null;
  private _cliVersion: string | null = null;
  private _isInitialized = false;

  constructor(
    private readonly _context: vscode.ExtensionContext,
    private readonly _outputChannel: vscode.OutputChannel
  ) {
    this._workingDirectory =
      vscode.workspace.workspaceFolders?.[0]?.uri.fsPath || os.homedir();
  }

  async initialize(): Promise<void> {
    this._outputChannel.appendLine('[Claude Adapter] Initializing...');

    // Check if claude CLI is available
    const isAvailable = await isCommandAvailable('claude');

    if (!isAvailable) {
      throw new Error('Claude Code CLI not found. Please install Claude Code to use this backend.');
    }

    // Get version
    this._cliVersion = await getCommandVersion('claude');
    this._outputChannel.appendLine(`[Claude Adapter] CLI version: ${this._cliVersion}`);

    this._isInitialized = true;
    this._outputChannel.appendLine('[Claude Adapter] Initialized');
  }

  async connect(): Promise<void> {
    if (this._process) {
      this._outputChannel.appendLine('[Claude Adapter] Already connected');
      return;
    }

    this._setStatus('connecting');
    this._outputChannel.appendLine('[Claude Adapter] Connecting...');

    try {
      await this._startClaudeProcess();
      this._setStatus('connected');
      this._outputChannel.appendLine('[Claude Adapter] Connected');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this._setStatus('error');
      this._outputChannel.appendLine(`[Claude Adapter] Connection failed: ${errorMessage}`);
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this._outputChannel.appendLine('[Claude Adapter] Disconnecting...');

    if (this._abortController) {
      this._abortController.abort();
      this._abortController = null;
    }

    if (this._process && !this._process.killed) {
      // Try graceful shutdown first
      if (this._process.stdin && !this._process.stdin.destroyed) {
        this._process.stdin.end();
      }

      // Wait a bit for graceful shutdown
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Force kill if still running
      if (!this._process.killed && this._process.pid) {
        killProcessTree(this._process.pid, 'SIGTERM');
      }

      this._process = null;
    }

    this._setStatus('disconnected');
    this._outputChannel.appendLine('[Claude Adapter] Disconnected');
  }

  async restart(): Promise<void> {
    this._outputChannel.appendLine('[Claude Adapter] Restarting...');
    await this.disconnect();
    await this.connect();
    this._outputChannel.appendLine('[Claude Adapter] Restarted');
  }

  private async _startClaudeProcess(): Promise<void> {
    this._abortController = new AbortController();
    this._readBuffer = '';

    // Build command arguments
    const args = [
      'code',
      'chat',
      '--output-format',
      'stream-json',
      '--input-format',
      'stream-json',
      '--verbose',
      '--permission-prompt-tool',
      'stdio',
    ];

    // Add session resumption if available
    if (this._sessionId) {
      args.push('--resume', this._sessionId);
    }

    // Get WSL config
    const wslConfig = getWSLConfig();

    // Spawn process
    if (wslConfig.enabled && process.platform === 'win32') {
      this._outputChannel.appendLine('[Claude Adapter] Spawning in WSL mode...');
      this._process = spawnInWSL(wslConfig.distro, 'claude', args, {
        cwd: this._workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe'],
      });
    } else {
      this._outputChannel.appendLine('[Claude Adapter] Spawning in native mode...');
      this._process = cp.spawn('claude', args, {
        cwd: this._workingDirectory,
        stdio: ['pipe', 'pipe', 'pipe'],
        shell: process.platform === 'win32',
        detached: process.platform !== 'win32',
        env: {
          ...process.env,
          FORCE_COLOR: '0',
          NO_COLOR: '1',
        },
      });
    }

    this._setupProcessHandlers();

    // Send initialization request
    await this._sendInitRequest();
  }

  private _setupProcessHandlers(): void {
    if (!this._process) return;

    // Handle stdout (JSON stream)
    this._process.stdout?.on('data', (data: Buffer) => {
      this._readBuffer += data.toString();
      this._processJsonStreamLines();
    });

    // Handle stderr (errors and logs)
    this._process.stderr?.on('data', (data: Buffer) => {
      const message = data.toString();
      this._outputChannel.appendLine(`[Claude stderr] ${message}`);
    });

    // Handle process exit
    this._process.on('exit', (code, signal) => {
      this._outputChannel.appendLine(
        `[Claude Adapter] Process exited with code ${code}, signal ${signal}`
      );
      this._process = null;
      this._setStatus('disconnected');
    });

    // Handle errors
    this._process.on('error', (error) => {
      this._outputChannel.appendLine(`[Claude Adapter] Process error: ${error.message}`);
      this._errorHandlers.forEach(handler => handler(error));
      this._setStatus('error');
    });
  }

  private _processJsonStreamLines(): void {
    const lines = this._readBuffer.split('\n');
    this._readBuffer = lines.pop() || '';

    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed) continue;

      try {
        const message = JSON.parse(trimmed);
        this._handleClaudeMessage(message);
      } catch {
        this._outputChannel.appendLine(`[Claude Adapter] Failed to parse JSON: ${trimmed}`);
      }
    }
  }

  private _handleClaudeMessage(message: ClaudeMessage): void {
    // Extract session ID if present
    if (message.type === 'system' && message.session_id) {
      this._sessionId = message.session_id;
      this._outputChannel.appendLine(`[Claude Adapter] Session ID: ${this._sessionId}`);
    }

    // Emit message to handlers
    this._messageHandlers.forEach(handler => {
      handler({
        type: message.type,
        data: message,
      });
    });
  }

  private async _sendInitRequest(): Promise<void> {
    if (!this._process || !this._process.stdin) {
      throw new Error('Process not ready');
    }

    const initRequest = {
      type: 'control_request',
      request_id: 'init-' + Date.now(),
      request: {
        subtype: 'initialize',
      },
    };

    const jsonString = JSON.stringify(initRequest) + '\n';
    this._process.stdin.write(jsonString);
    this._outputChannel.appendLine('[Claude Adapter] Sent init request');
  }

  private _setStatus(status: ConnectionStatus): void {
    if (this._status !== status) {
      this._status = status;
      this._statusHandlers.forEach(handler => handler(status));
    }
  }

  getStatus(): ConnectionStatus {
    return this._status;
  }

  getCapabilities(): BackendCapabilities {
    // Claude CLI has limited capabilities compared to OpenCode
    return {
      supportedFeatures: {
        agents: false, // Claude CLI doesn't support custom agents
        skills: false, // Claude CLI doesn't support skills
        terminal: false, // No terminal integration
        git: false, // No git integration
        github: false, // No GitHub integration
        files: true, // Basic file operations via Claude itself
        permissions: true, // Permission system via stdio
        streaming: true, // JSON streaming supported
        sessions: true, // Session management supported
      },
      supportsModel: (model: string) => {
        // Claude CLI supports Claude models
        return model.toLowerCase().includes('claude');
      },
      maxContextTokens: 200000, // Claude Sonnet 4 context
    };
  }

  getDebugInfo(): BackendDebugInfo {
    return {
      type: 'claude-cli',
      status: this._status,
      version: this._cliVersion,
      cliAvailable: this._isInitialized,
      workingDirectory: this._workingDirectory,
      configuredApiUrl: null,
      additionalInfo: {
        sessionId: this._sessionId,
        processRunning: this._process !== null && !this._process.killed,
        wslConfig: getWSLConfig(),
      },
    };
  }

  async setWorkingDirectory(path: string): Promise<void> {
    this._outputChannel.appendLine(`[Claude Adapter] Setting working directory: ${path}`);
    this._workingDirectory = path;

    // Restart process if already running
    if (this._process) {
      await this.restart();
    }
  }

  getWorkingDirectory(): string {
    return this._workingDirectory;
  }

  async sendRequest<T = unknown>(
    request: BackendRequest
  ): Promise<BackendResponse<T>> {
    if (!this._process || !this._process.stdin) {
      return {
        id: request.id,
        type: request.type,
        success: false,
        error: 'Claude process not running',
      };
    }

    try {
      // Map request to Claude CLI format
      // This is a simplified version - full implementation would handle different request types
      const claudeMessage = this._mapRequestToClaudeMessage(request);

      const jsonString = JSON.stringify(claudeMessage) + '\n';
      this._process.stdin.write(jsonString);

      // For now, return immediate success
      // In a full implementation, this would wait for responses using a promise map
      return {
        id: request.id,
        type: request.type,
        success: true,
        data: undefined as T,
      };
    } catch (error) {
      return {
        id: request.id,
        type: request.type,
        success: false,
        error: error instanceof Error ? error.message : String(error),
      };
    }
  }

  private _mapRequestToClaudeMessage(request: BackendRequest): ClaudeMessage {
    // Map bridge requests to Claude CLI format
    // This is a basic implementation - would need expansion for all request types

    if (request.type === 'sendMessage') {
      return {
        type: 'user',
        session_id: this._sessionId || '',
        message: {
          role: 'user',
          content: [
            {
              type: 'text',
              text: (request.payload as { text?: string })?.text || '',
            },
          ],
        },
        parent_tool_use_id: null,
      };
    }

    // Default passthrough
    return {
      type: request.type,
      ...(request.payload as object),
    };
  }

  onMessage(handler: (message: BackendMessage) => void): () => void {
    this._messageHandlers.add(handler);
    return () => {
      this._messageHandlers.delete(handler);
    };
  }

  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this._statusHandlers.add(callback);
    return () => {
      this._statusHandlers.delete(callback);
    };
  }

  onError(callback: (error: Error) => void): () => void {
    this._errorHandlers.add(callback);
    return () => {
      this._errorHandlers.delete(callback);
    };
  }

  dispose(): void {
    this._outputChannel.appendLine('[Claude Adapter] Disposing...');

    if (this._process && this._process.pid) {
      killProcessTree(this._process.pid, 'SIGKILL');
      this._process = null;
    }

    this._messageHandlers.clear();
    this._statusHandlers.clear();
    this._errorHandlers.clear();

    this._outputChannel.appendLine('[Claude Adapter] Disposed');
  }
}
