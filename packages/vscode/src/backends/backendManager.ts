/**
 * Unified backend manager - factory and lifecycle management
 */

import * as vscode from 'vscode';
import type {
  BackendManager,
  BackendType,
  DetectionResult,
  InitializationResult,
  ConnectionStatus,
} from './types';
import {
  detectAvailableBackends,
  selectBackend,
  getBackendPreference,
} from './detector';

/**
 * Unified backend manager handles detection, initialization, and switching
 */
export class UnifiedBackendManager {
  private _activeBackend: BackendManager | null = null;
  private _detectionResult: DetectionResult | null = null;
  private _backendType: BackendType | null = null;
  private _isInitialized = false;

  constructor(
    private readonly _context: vscode.ExtensionContext,
    private readonly _outputChannel: vscode.OutputChannel
  ) {}

  private async _sleep(ms: number): Promise<void> {
    await new Promise((resolve) => setTimeout(resolve, ms));
  }

  private async _createConnectedAdapter(type: BackendType): Promise<BackendManager> {
    const maxAttempts = type === 'opencode' ? 2 : 1;
    let lastError: unknown;

    for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
      const backend = await this._createAdapter(type);
      try {
        this._outputChannel.appendLine(
          `[Backend Manager] Initializing ${type} backend (attempt ${attempt}/${maxAttempts})...`
        );
        await backend.initialize();
        this._outputChannel.appendLine(
          `[Backend Manager] Connecting to ${type} backend (attempt ${attempt}/${maxAttempts})...`
        );
        await backend.connect();
        return backend;
      } catch (error) {
        lastError = error;
        const errorMessage = error instanceof Error ? error.message : String(error);
        this._outputChannel.appendLine(
          `[Backend Manager] ${type} connection attempt ${attempt} failed: ${errorMessage}`
        );
        try {
          await backend.disconnect();
        } catch {
          // ignore disconnect errors for failed attempts
        }
        backend.dispose();
        if (attempt < maxAttempts) {
          await this._sleep(800);
        }
      }
    }

    throw lastError instanceof Error ? lastError : new Error(String(lastError));
  }

  /**
   * Initialize backend with auto-detection
   */
  async initialize(): Promise<InitializationResult> {
    if (this._isInitialized) {
      this._outputChannel.appendLine('[Backend Manager] Already initialized');
      return {
        success: true,
        backend: this._backendType,
      };
    }

    try {
      // Step 1: Detect available backends
      this._outputChannel.appendLine('[Backend Manager] Detecting available backends...');
      const config = vscode.workspace.getConfiguration('neusis-code');
      this._detectionResult = await detectAvailableBackends(config);

      this._outputChannel.appendLine(
        `[Backend Manager] Available backends: ${this._detectionResult.available.join(', ') || 'none'}`
      );

      if (this._detectionResult.openCodeInfo) {
        this._outputChannel.appendLine(
          `[Backend Manager] OpenCode - CLI: ${this._detectionResult.openCodeInfo.cliAvailable}, Version: ${this._detectionResult.openCodeInfo.version || 'N/A'}, API URL: ${this._detectionResult.openCodeInfo.apiUrl || 'none'}`
        );
      }

      if (this._detectionResult.claudeInfo) {
        this._outputChannel.appendLine(
          `[Backend Manager] Claude Code - Available: ${this._detectionResult.claudeInfo.cliAvailable}, Version: ${this._detectionResult.claudeInfo.version || 'N/A'}, WSL: ${this._detectionResult.claudeInfo.wslAvailable || false}`
        );
      }

      // Step 2: Select backend based on preference
      const preference = getBackendPreference(config);
      const userOverride = preference === 'auto' ? undefined : preference;

      this._outputChannel.appendLine(
        `[Backend Manager] User preference: ${preference}`
      );

      const selectedBackend = await selectBackend(
        this._detectionResult,
        userOverride
      );

      this._outputChannel.appendLine(
        `[Backend Manager] Selected backend: ${selectedBackend}`
      );

      // Step 3: Create, initialize, and connect adapter
      this._activeBackend = await this._createConnectedAdapter(selectedBackend);
      this._backendType = selectedBackend;

      this._isInitialized = true;

      this._outputChannel.appendLine(
        `[Backend Manager] Successfully connected to ${selectedBackend}`
      );

      return {
        success: true,
        backend: selectedBackend,
        detection: this._detectionResult,
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this._outputChannel.appendLine(
        `[Backend Manager] Initialization failed: ${errorMessage}`
      );

      // Show user-friendly error
      if (this._detectionResult && this._detectionResult.available.length === 0) {
        void vscode.window.showErrorMessage(
          'No AI backend available. Please install OpenCode CLI or Claude Code CLI to use Neusis Code.',
          'Install OpenCode',
          'Install Claude Code'
        ).then((choice) => {
          if (choice === 'Install OpenCode') {
            void vscode.env.openExternal(vscode.Uri.parse('https://www.opencode.ai'));
          } else if (choice === 'Install Claude Code') {
            void vscode.env.openExternal(vscode.Uri.parse('https://claude.ai/download'));
          }
        });
      } else {
        void vscode.window.showErrorMessage(
          `Failed to initialize backend: ${errorMessage}`
        );
      }

      return {
        success: false,
        backend: null,
        error: errorMessage,
        detection: this._detectionResult ?? undefined,
      };
    }
  }

  /**
   * Create backend adapter
   */
  private async _createAdapter(type: BackendType): Promise<BackendManager> {
    switch (type) {
      case 'opencode': {
        // Dynamic import to avoid circular dependencies
        const { OpenCodeAdapter } = await import('./adapters/opencodeAdapter');
        return new OpenCodeAdapter(this._context, this._outputChannel);
      }
      case 'claude-cli': {
        // Dynamic import
        const { ClaudeAdapter } = await import('./adapters/claudeAdapter');
        return new ClaudeAdapter(this._context, this._outputChannel);
      }
      default:
        throw new Error(`Unknown backend type: ${type}`);
    }
  }

  /**
   * Get active backend instance
   */
  getActiveBackend(): BackendManager | null {
    return this._activeBackend;
  }

  /**
   * Get current backend type
   */
  getBackendType(): BackendType | null {
    return this._backendType;
  }

  /**
   * Get detection result
   */
  getDetectionResult(): DetectionResult | null {
    return this._detectionResult;
  }

  /**
   * Check if initialized
   */
  isInitialized(): boolean {
    return this._isInitialized;
  }

  /**
   * Get current status
   */
  getStatus(): ConnectionStatus {
    if (!this._activeBackend) {
      return 'disconnected';
    }
    return this._activeBackend.getStatus();
  }

  /**
   * Switch to a different backend
   */
  async switchBackend(newBackendType: BackendType): Promise<void> {
    if (this._backendType === newBackendType && this._activeBackend) {
      this._outputChannel.appendLine(
        `[Backend Manager] Already using ${newBackendType}, skipping switch`
      );
      return;
    }

    this._outputChannel.appendLine(
      `[Backend Manager] Switching to ${newBackendType}...`
    );

    // Atomic switch: keep current backend alive until replacement is connected.
    const previousBackend = this._activeBackend;
    const previousBackendType = this._backendType;
    let nextBackend: BackendManager | null = null;

    try {
      nextBackend = await this._createConnectedAdapter(newBackendType);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this._outputChannel.appendLine(
        `[Backend Manager] Failed to switch to ${newBackendType}, keeping ${previousBackendType || 'current'} backend active: ${errorMessage}`
      );
      throw error;
    }

    if (previousBackend) {
      this._outputChannel.appendLine('[Backend Manager] Disconnecting previous backend...');
      try {
        await previousBackend.disconnect();
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        this._outputChannel.appendLine(
          `[Backend Manager] Previous backend disconnect error: ${errorMessage}`
        );
      }
      previousBackend.dispose();
    }

    this._activeBackend = nextBackend;
    this._backendType = newBackendType;
    this._isInitialized = true;

    this._outputChannel.appendLine(
      `[Backend Manager] Successfully switched to ${newBackendType}`
    );
  }

  /**
   * Restart current backend
   */
  async restart(): Promise<void> {
    if (!this._activeBackend) {
      throw new Error('No active backend to restart');
    }

    this._outputChannel.appendLine('[Backend Manager] Restarting backend...');
    await this._activeBackend.restart();
    this._outputChannel.appendLine('[Backend Manager] Backend restarted');
  }

  /**
   * Dispose all resources
   */
  async dispose(): Promise<void> {
    this._outputChannel.appendLine('[Backend Manager] Disposing...');

    if (this._activeBackend) {
      await this._activeBackend.disconnect();
      this._activeBackend.dispose();
      this._activeBackend = null;
    }

    this._isInitialized = false;
    this._backendType = null;
    this._detectionResult = null;

    this._outputChannel.appendLine('[Backend Manager] Disposed');
  }
}
