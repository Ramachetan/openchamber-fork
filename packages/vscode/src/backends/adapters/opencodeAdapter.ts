/**
 * OpenCode backend adapter - wraps existing OpenCode functionality
 */

import * as vscode from 'vscode';
import type {
  BackendManager,
  BackendCapabilities,
  BackendDebugInfo,
  BackendRequest,
  BackendResponse,
  BackendMessage,
  ConnectionStatus,
} from '../types';
import { createOpenCodeManager, type OpenCodeManager } from '../../opencode';

/**
 * Adapter for OpenCode backend
 */
export class OpenCodeAdapter implements BackendManager {
  private _manager: OpenCodeManager;
  private _messageHandlers = new Set<(msg: BackendMessage) => void>();
  private _statusHandlers = new Set<(status: ConnectionStatus) => void>();
  private _errorHandlers = new Set<(error: Error) => void>();
  private _statusDisposable: vscode.Disposable | null = null;

  constructor(
    private readonly _context: vscode.ExtensionContext,
    private readonly _outputChannel: vscode.OutputChannel
  ) {
    this._manager = createOpenCodeManager(_context);
    this._setupStatusListener();
  }

  private _setupStatusListener(): void {
    this._statusDisposable = this._manager.onStatusChange((status, error) => {
      // Notify status handlers
      this._statusHandlers.forEach(handler => handler(status));

      // Notify error handlers if there's an error
      if (error) {
        const err = new Error(error);
        this._errorHandlers.forEach(handler => handler(err));
      }

      this._outputChannel.appendLine(
        `[OpenCode Adapter] Status changed to: ${status}${error ? ` (${error})` : ''}`
      );
    });
  }

  async initialize(): Promise<void> {
    this._outputChannel.appendLine('[OpenCode Adapter] Initializing...');

    // Check if CLI is available
    const isAvailable = this._manager.isCliAvailable();
    this._outputChannel.appendLine(
      `[OpenCode Adapter] CLI available: ${isAvailable}`
    );

    if (!isAvailable) {
      const config = vscode.workspace.getConfiguration('neusis-code');
      const apiUrl = config.get<string>('apiUrl');

      if (!apiUrl) {
        throw new Error('OpenCode CLI not found and no API URL configured');
      }

      this._outputChannel.appendLine(
        `[OpenCode Adapter] Using configured API URL: ${apiUrl}`
      );
    }
  }

  async connect(): Promise<void> {
    this._outputChannel.appendLine('[OpenCode Adapter] Connecting...');
    const workdir = this._manager.getWorkingDirectory();
    await this._manager.start(workdir);
    this._outputChannel.appendLine('[OpenCode Adapter] Connected');
  }

  async disconnect(): Promise<void> {
    this._outputChannel.appendLine('[OpenCode Adapter] Disconnecting...');
    await this._manager.stop();
    this._outputChannel.appendLine('[OpenCode Adapter] Disconnected');
  }

  async restart(): Promise<void> {
    this._outputChannel.appendLine('[OpenCode Adapter] Restarting...');
    await this._manager.restart();
    this._outputChannel.appendLine('[OpenCode Adapter] Restarted');
  }

  getStatus(): ConnectionStatus {
    return this._manager.getStatus();
  }

  getCapabilities(): BackendCapabilities {
    // OpenCode supports all features
    return {
      supportedFeatures: {
        agents: true,
        skills: true,
        terminal: true,
        git: true,
        github: true,
        files: true,
        permissions: true,
        streaming: true,
        sessions: true,
      },
      supportsModel: () => {
        // OpenCode supports all major models
        return true;
      },
      maxContextTokens: 200000, // Claude Sonnet 4 context
    };
  }

  getDebugInfo(): BackendDebugInfo {
    const info = this._manager.getDebugInfo();

    return {
      type: 'opencode',
      status: info.status,
      version: info.version,
      cliAvailable: info.cliAvailable,
      workingDirectory: info.workingDirectory,
      configuredApiUrl: info.configuredApiUrl,
      additionalInfo: {
        mode: info.mode,
        serverUrl: info.serverUrl,
        startCount: info.startCount,
        restartCount: info.restartCount,
        lastStartAt: info.lastStartAt,
        lastConnectedAt: info.lastConnectedAt,
      },
    };
  }

  async setWorkingDirectory(path: string): Promise<void> {
    this._outputChannel.appendLine(
      `[OpenCode Adapter] Setting working directory: ${path}`
    );
    const result = await this._manager.setWorkingDirectory(path);

    if (!result.success) {
      throw new Error(`Failed to set working directory to ${path}`);
    }

    this._outputChannel.appendLine(
      `[OpenCode Adapter] Working directory set (restarted: ${result.restarted})`
    );
  }

  getWorkingDirectory(): string {
    return this._manager.getWorkingDirectory();
  }

  async sendRequest<T = unknown>(
    request: BackendRequest
  ): Promise<BackendResponse<T>> {
    // The actual request handling is done in bridge.ts
    // This is just a pass-through that will be called by the view providers
    // The view providers already have the bridge logic, so we just need to
    // provide the OpenCodeManager for them to use

    // For now, return a simple response
    // The actual implementation will be in the bridge integration
    return {
      id: request.id,
      type: request.type,
      success: true,
      data: undefined as T,
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
    this._outputChannel.appendLine('[OpenCode Adapter] Disposing...');

    if (this._statusDisposable) {
      this._statusDisposable.dispose();
      this._statusDisposable = null;
    }

    this._messageHandlers.clear();
    this._statusHandlers.clear();
    this._errorHandlers.clear();

    this._outputChannel.appendLine('[OpenCode Adapter] Disposed');
  }

  /**
   * Get the underlying OpenCodeManager for compatibility with existing code
   * This allows gradual migration
   */
  getOpenCodeManager(): OpenCodeManager {
    return this._manager;
  }
}
