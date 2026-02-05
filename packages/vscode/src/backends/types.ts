/**
 * Backend abstraction layer types for unified OpenCode and Claude CLI support
 */

export type BackendType = 'opencode' | 'claude-cli';
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error';

/**
 * Backend capabilities - what features each backend supports
 */
export interface BackendCapabilities {
  supportedFeatures: {
    agents: boolean;
    skills: boolean;
    terminal: boolean;
    git: boolean;
    github: boolean;
    files: boolean;
    permissions: boolean;
    streaming: boolean;
    sessions: boolean;
  };
  supportsModel: (model: string) => boolean;
  maxContextTokens: number;
}

/**
 * Debug information about the backend
 */
export interface BackendDebugInfo {
  type: BackendType;
  status: ConnectionStatus;
  version: string | null;
  cliAvailable: boolean;
  workingDirectory: string;
  configuredApiUrl: string | null;
  additionalInfo?: Record<string, unknown>;
}

/**
 * Generic backend request following the bridge pattern
 */
export interface BackendRequest {
  id: string;
  type: string;
  payload?: unknown;
  timeout?: number;
}

/**
 * Generic backend response
 */
export interface BackendResponse<T = unknown> {
  id: string;
  type: string;
  success: boolean;
  data?: T;
  error?: string;
}

/**
 * Generic backend message (for streaming/events)
 */
export interface BackendMessage {
  type: string;
  data?: unknown;
}

/**
 * Main backend manager interface - all backends must implement this
 */
export interface BackendManager {
  /**
   * Initialize the backend (detect CLI, check config, prepare resources)
   */
  initialize(): Promise<void>;

  /**
   * Connect to the backend (start server, spawn process, etc.)
   */
  connect(): Promise<void>;

  /**
   * Disconnect from the backend
   */
  disconnect(): Promise<void>;

  /**
   * Restart the backend connection
   */
  restart(): Promise<void>;

  /**
   * Get current connection status
   */
  getStatus(): ConnectionStatus;

  /**
   * Get backend capabilities
   */
  getCapabilities(): BackendCapabilities;

  /**
   * Get debug information
   */
  getDebugInfo(): BackendDebugInfo;

  /**
   * Set working directory for operations
   */
  setWorkingDirectory(path: string): Promise<void>;

  /**
   * Get current working directory
   */
  getWorkingDirectory(): string;

  /**
   * Send a request and wait for response
   */
  sendRequest<T = unknown>(request: BackendRequest): Promise<BackendResponse<T>>;

  /**
   * Subscribe to messages from backend
   * Returns unsubscribe function
   */
  onMessage(handler: (message: BackendMessage) => void): () => void;

  /**
   * Subscribe to status changes
   * Returns unsubscribe function
   */
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void;

  /**
   * Subscribe to errors
   * Returns unsubscribe function
   */
  onError(callback: (error: Error) => void): () => void;

  /**
   * Clean up resources
   */
  dispose(): void;
}

/**
 * Detection result from backend discovery
 */
export interface DetectionResult {
  available: BackendType[];
  recommended: BackendType | null;
  openCodeInfo?: {
    cliAvailable: boolean;
    version: string | null;
    apiUrl: string | null;
  };
  claudeInfo?: {
    cliAvailable: boolean;
    version: string | null;
    wslAvailable?: boolean;
  };
}

/**
 * Initialization result
 */
export interface InitializationResult {
  success: boolean;
  backend: BackendType | null;
  error?: string;
  detection?: DetectionResult;
}
