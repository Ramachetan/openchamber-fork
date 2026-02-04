import * as vscode from 'vscode';
import { ChatViewProvider } from './ChatViewProvider';
import { AgentManagerPanelProvider } from './AgentManagerPanelProvider';
import { SessionEditorPanelProvider } from './SessionEditorPanelProvider';
import { UnifiedBackendManager } from './backends/backendManager';
import type { BackendDebugInfo, BackendManager as BackendManagerInterface } from './backends/types';
import type { OpenCodeManager } from './opencode';
import { startGlobalEventWatcher, stopGlobalEventWatcher, setChatViewProvider } from './sessionActivityWatcher';

let chatViewProvider: ChatViewProvider | undefined;
let agentManagerProvider: AgentManagerPanelProvider | undefined;
let sessionEditorProvider: SessionEditorPanelProvider | undefined;
let backendManager: UnifiedBackendManager | undefined;
let outputChannel: vscode.OutputChannel | undefined;

let activeSessionId: string | null = null;
let activeSessionTitle: string | null = null;

const SETTINGS_KEY = 'neusis-code.settings';

const getDebugAdditionalInfo = (debug: BackendDebugInfo | undefined): Record<string, unknown> =>
  debug?.additionalInfo ?? {};

const getDebugAdditionalString = (debug: BackendDebugInfo | undefined, key: string): string | undefined => {
  const value = getDebugAdditionalInfo(debug)[key];
  return typeof value === 'string' ? value : undefined;
};

const getDebugAdditionalNumber = (debug: BackendDebugInfo | undefined, key: string): number | undefined => {
  const value = getDebugAdditionalInfo(debug)[key];
  return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

interface BackendWithApiUrl {
  getApiUrl: () => string | null;
}

interface BackendWithOpenCodeManager {
  getOpenCodeManager: () => OpenCodeManager | null | undefined;
}

const hasApiUrlGetter = (backend: BackendManagerInterface): backend is BackendManagerInterface & BackendWithApiUrl => {
  return 'getApiUrl' in backend && typeof (backend as BackendWithApiUrl).getApiUrl === 'function';
};

const hasOpenCodeManagerGetter = (
  backend: BackendManagerInterface
): backend is BackendManagerInterface & BackendWithOpenCodeManager => {
  return 'getOpenCodeManager' in backend && typeof (backend as BackendWithOpenCodeManager).getOpenCodeManager === 'function';
};

const resolveBackendApiUrl = (backend: BackendManagerInterface | null | undefined): string | null => {
  if (!backend) return null;
  if (hasApiUrlGetter(backend)) {
    return backend.getApiUrl();
  }
  if (hasOpenCodeManagerGetter(backend)) {
    return backend.getOpenCodeManager()?.getApiUrl?.() ?? null;
  }
  return null;
};

const formatIso = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '(none)';
  try {
    return new Date(value).toISOString();
  } catch {
    return String(value);
  }
};

const formatDurationMs = (value: number | null | undefined) => {
  if (typeof value !== 'number' || !Number.isFinite(value)) return '(none)';
  const seconds = Math.round(value / 100) / 10;
  return `${seconds}s`;
};

const formatConnectedDuration = (debug: BackendDebugInfo | undefined) => {
  const lastConnectedAt = getDebugAdditionalNumber(debug, 'lastConnectedAt');
  if (lastConnectedAt === undefined) return '(n/a)';
  return formatDurationMs(Date.now() - lastConnectedAt);
};

export async function activate(context: vscode.ExtensionContext) {
  outputChannel = vscode.window.createOutputChannel('Neusis Code');

  let moveToRightSidebarScheduled = false;

  const isCursorLikeHost = () => /\bcursor\b/i.test(vscode.env.appName);

  const findMoveToRightSidebarCommandId = async (): Promise<string | null> => {
    const commands = await vscode.commands.getCommands(true);

    const preferred = [
      // Newer VS Code naming
      'workbench.action.moveViewToSecondarySideBar',
      'workbench.action.moveViewToSecondarySidebar',
      'workbench.action.moveFocusedViewToSecondarySideBar',
      'workbench.action.moveFocusedViewToSecondarySidebar',

      // Some builds use "Auxiliary Bar" naming
      'workbench.action.moveViewToAuxiliaryBar',
      'workbench.action.moveFocusedViewToAuxiliaryBar',
    ];

    for (const commandId of preferred) {
      if (commands.includes(commandId)) return commandId;
    }

    const fuzzy = commands.find((commandId) => {
      const id = commandId.toLowerCase();
      const looksLikeMoveView = id.includes('workbench.action') && id.includes('move') && id.includes('view');
      if (!looksLikeMoveView) return false;

      // Support both "secondary sidebar" and "auxiliary bar" naming.
      return (id.includes('secondary') && id.includes('side') && id.includes('bar')) || (id.includes('auxiliary') && id.includes('bar'));
    });

    return fuzzy || null;
  };

  const attemptMoveChatToRightSidebar = async (): Promise<'moved' | 'unsupported' | 'failed'> => {
    const moveCommandId = await findMoveToRightSidebarCommandId();
    if (!moveCommandId) return 'unsupported';

    try {
      await vscode.commands.executeCommand('neusis-code.chatView.focus');
      await vscode.commands.executeCommand(moveCommandId);
      return 'moved';
    } catch (error) {
      outputChannel?.appendLine(
        `[Neusis Code] Failed moving chat view to right sidebar (command=${moveCommandId}): ${error instanceof Error ? error.message : String(error)}`
      );
      return 'failed';
    }
  };

  const maybeMoveChatToRightSidebarOnStartup = async () => {
    if (isCursorLikeHost()) return;

    const attempted = context.globalState.get<boolean>('neusis-code.sidebarAutoMoveAttempted') || false;
    if (attempted) return;
    await context.globalState.update('neusis-code.sidebarAutoMoveAttempted', true);

    if (moveToRightSidebarScheduled) return;
    moveToRightSidebarScheduled = true;

    // Defer until after activation to avoid stealing focus during startup.
    setTimeout(() => {
      void (async () => {
        try {
          await attemptMoveChatToRightSidebar();
        } finally {
          moveToRightSidebarScheduled = false;
        }
      })();
    }, 800);
  };


  // Migration: clear legacy auto-set API URLs (ports 47680-47689 were auto-assigned by older extension versions)
  const config = vscode.workspace.getConfiguration('neusis-code');
  const legacyApiUrl = config.get<string>('apiUrl') || '';
  if (/^https?:\/\/localhost:4768\d\/?$/.test(legacyApiUrl.trim())) {
    await config.update('apiUrl', '', vscode.ConfigurationTarget.Global);
  }

  // Create Unified Backend Manager first
  backendManager = new UnifiedBackendManager(context, outputChannel);

  // Initialize backend BEFORE creating view providers
  // This ensures backend detection completes before UI tries to use it
  await backendManager.initialize();

  // Create chat view provider with manager reference
  // Backend is now initialized and ready
  chatViewProvider = new ChatViewProvider(context, context.extensionUri, backendManager);

  context.subscriptions.push(
    vscode.window.registerWebviewViewProvider(
      ChatViewProvider.viewType,
      chatViewProvider,
      { webviewOptions: { retainContextWhenHidden: true } }
    )
  );

  // Register sidebar/focus commands AFTER the webview view provider is registered
  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.openSidebar', async () => {
      // Best-effort: open the container (if available), then focus the chat view.
      try {
        await vscode.commands.executeCommand('workbench.view.extension.neusis-code');
      } catch (e) {
        outputChannel?.appendLine(`[Neusis Code] workbench.view.extension.neusis-code failed: ${e}`);
      }

      try {
        await vscode.commands.executeCommand('neusis-code.chatView.focus');
      } catch (e) {
        outputChannel?.appendLine(`[Neusis Code] neusis-code.chatView.focus failed: ${e}`);
        vscode.window.showErrorMessage(`Neusis Code: Failed to open sidebar - ${e}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.focusChat', async () => {
      await vscode.commands.executeCommand('neusis-code.chatView.focus');
    })
  );

  void maybeMoveChatToRightSidebarOnStartup();

  // Create Agent Manager panel provider
  agentManagerProvider = new AgentManagerPanelProvider(context, context.extensionUri, backendManager);
  sessionEditorProvider = new SessionEditorPanelProvider(context, context.extensionUri, backendManager);

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.openAgentManager', () => {
      agentManagerProvider?.createOrShow();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.setActiveSession', (sessionId: unknown, title?: unknown) => {
      if (typeof sessionId === 'string' && sessionId.trim().length > 0) {
        activeSessionId = sessionId.trim();
        activeSessionTitle = typeof title === 'string' && title.trim().length > 0 ? title.trim() : null;
        return;
      }

      activeSessionId = null;
      activeSessionTitle = null;
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.openActiveSessionInEditor', () => {
      if (!activeSessionId) {
        vscode.window.showInformationMessage('Neusis Code: No active session');
        return;
      }
      sessionEditorProvider?.createOrShow(activeSessionId, activeSessionTitle ?? undefined);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.openSessionInEditor', (sessionId: string, title?: string) => {
      if (typeof sessionId !== 'string' || sessionId.trim().length === 0) {
        return;
      }
      sessionEditorProvider?.createOrShow(sessionId.trim(), title);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.openNewSessionInEditor', () => {
      sessionEditorProvider?.createOrShowNewSession();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.openCurrentOrNewSessionInEditor', () => {
      if (activeSessionId) {
        sessionEditorProvider?.createOrShow(activeSessionId, activeSessionTitle ?? undefined);
      } else {
        sessionEditorProvider?.createOrShowNewSession();
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.restartApi', async () => {
      try {
        await backendManager?.restart();
        vscode.window.showInformationMessage('Neusis Code: Backend restarted');
      } catch (e) {
        vscode.window.showErrorMessage(`Neusis Code: Failed to restart backend - ${e}`);
      }
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.addToContext', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Neusis Code [Add to Context]:No active editor');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showWarningMessage('Neusis Code [Add to Context]: No text selected');
        return;
      }

      // Get file info for context
      const filePath = vscode.workspace.asRelativePath(editor.document.uri);
      const languageId = editor.document.languageId;
      
      // Get line numbers (1-based for display)
      const startLine = selection.start.line + 1;
      const endLine = selection.end.line + 1;
      const lineRange = startLine === endLine ? `${startLine}` : `${startLine}-${endLine}`;

      // Format as file path with line numbers, followed by markdown code block
      const contextText = `${filePath}:${lineRange}\n\`\`\`${languageId}\n${selectedText}\n\`\`\``;

      // Send to webview and reveal the panel
      chatViewProvider?.addTextToInput(contextText);

      // Focus the chat panel
      vscode.commands.executeCommand('neusis-code.focusChat');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.explain', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Neusis Code [Explain]: No active editor');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);
      const filePath = vscode.workspace.asRelativePath(editor.document.uri);
      const languageId = editor.document.languageId;

      let prompt: string;

      if (selectedText) {
        // Selection exists - explain the selected code
        const startLine = selection.start.line + 1;
        const endLine = selection.end.line + 1;
        const lineRange = startLine === endLine ? `${startLine}` : `${startLine}-${endLine}`;
        prompt = `Explain the following Code / Text:\n\n${filePath}:${lineRange}\n\`\`\`${languageId}\n${selectedText}\n\`\`\``;
      } else {
        // No selection - explain the entire file
        prompt = `Explain the following Code / Text:\n\n${filePath}`;
      }

      // Create new session and send the prompt
      chatViewProvider?.createNewSessionWithPrompt(prompt);
      vscode.commands.executeCommand('neusis-code.focusChat');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.improveCode', async () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showWarningMessage('Neusis Code [Improve Code]: No active editor');
        return;
      }

      const selection = editor.selection;
      const selectedText = editor.document.getText(selection);

      if (!selectedText) {
        vscode.window.showWarningMessage('Neusis Code [Improve Code]: No text selected');
        return;
      }

      const filePath = vscode.workspace.asRelativePath(editor.document.uri);
      const languageId = editor.document.languageId;
      const startLine = selection.start.line + 1;
      const endLine = selection.end.line + 1;
      const lineRange = startLine === endLine ? `${startLine}` : `${startLine}-${endLine}`;

      const prompt = `Improve the following Code:\n\n${filePath}:${lineRange}\n\`\`\`${languageId}\n${selectedText}\n\`\`\``;

      // Create new session and send the prompt
      chatViewProvider?.createNewSessionWithPrompt(prompt);
      vscode.commands.executeCommand('neusis-code.focusChat');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.newSession', () => {
      chatViewProvider?.createNewSession();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.showSettings', () => {
      chatViewProvider?.showSettings();
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('neusis-code.showOpenCodeStatus', async () => {
      const config = vscode.workspace.getConfiguration('neusis-code');
      const configuredApiUrl = (config.get<string>('apiUrl') || '').trim();

      const extensionVersion = String(context.extension?.packageJSON?.version || '');
      const workspaceFolders = (vscode.workspace.workspaceFolders || []).map((folder) => folder.uri.fsPath);
      const primaryWorkspace = workspaceFolders[0] || '';

      const backend = backendManager?.getActiveBackend();
      const debug = backend?.getDebugInfo();
      const backendType = backendManager?.getBackendType();
      const resolvedApiUrl = resolveBackendApiUrl(backend);
      const workingDirectory = backend?.getWorkingDirectory() ?? '';
      const workingDirectoryMatchesWorkspace = Boolean(primaryWorkspace && workingDirectory === primaryWorkspace);
      let resolvedApiPath = '';
      if (resolvedApiUrl) {
        try {
          resolvedApiPath = new URL(resolvedApiUrl).pathname || '/';
        } catch {
          resolvedApiPath = '(invalid url)';
        }
      }

      const safeFetch = async (input: string, timeoutMs = 6000) => {
        const controller = new AbortController();
        const timeout = setTimeout(() => controller.abort(), timeoutMs);
        const startedAt = Date.now();
        try {
          const resp = await fetch(input, {
            method: 'GET',
            headers: { Accept: 'application/json' },
            signal: controller.signal,
          });
          const elapsedMs = Date.now() - startedAt;
          const contentType = resp.headers.get('content-type') || '';
          const isJson = contentType.toLowerCase().includes('json') && !contentType.toLowerCase().includes('text/html');

          let summary = '';
          if (isJson) {
            const json = await resp.json().catch(() => null);
            if (Array.isArray(json)) {
              summary = `json[array] len=${json.length}`;
            } else if (json && typeof json === 'object') {
              const keys = Object.keys(json).slice(0, 8);
              summary = `json[object] keys=${keys.join(',')}${Object.keys(json).length > keys.length ? ',…' : ''}`;
            } else {
              summary = `json[${typeof json}]`;
            }
          } else {
            summary = contentType ? `content-type=${contentType}` : 'no content-type';
          }

          return { ok: resp.ok && isJson, status: resp.status, elapsedMs, summary };
        } catch (error) {
          const elapsedMs = Date.now() - startedAt;
          const isAbort =
            controller.signal.aborted ||
            (error instanceof Error && (error.name === 'AbortError' || error.message.toLowerCase().includes('aborted')));
          const message = isAbort
            ? `timeout after ${timeoutMs}ms`
            : error instanceof Error
              ? error.message
              : String(error);
          return { ok: false, status: 0, elapsedMs, summary: `error=${message}` };
        } finally {
          clearTimeout(timeout);
        }
      };

      const buildProbeUrl = (pathname: string, includeDirectory = true) => {
        if (!resolvedApiUrl) return null;
        const base = `${resolvedApiUrl.replace(/\/+$/, '')}/`;
        const url = new URL(pathname.replace(/^\/+/, ''), base);
        if (includeDirectory && workingDirectory) {
          url.searchParams.set('directory', workingDirectory);
        }
        return url.toString();
      };

      const probeTargets: Array<{ label: string; path: string; includeDirectory?: boolean; timeoutMs?: number }> = [
        { label: 'health', path: '/global/health', includeDirectory: false },
        { label: 'config', path: '/config', includeDirectory: true },
        { label: 'providers', path: '/config/providers', includeDirectory: true },
        // Can be slower on large configs; keep the probe from producing false negatives.
        { label: 'agents', path: '/agent', includeDirectory: true, timeoutMs: 12000 },
        { label: 'commands', path: '/command', includeDirectory: true, timeoutMs: 10000 },
        { label: 'project', path: '/project/current', includeDirectory: true },
        { label: 'path', path: '/path', includeDirectory: true },
        // Session listing is what powers the sidebar. This helps diagnose "no sessions shown" bugs.
        { label: 'sessions', path: '/session', includeDirectory: true, timeoutMs: 12000 },
        { label: 'sessionStatus', path: '/session/status', includeDirectory: true },
      ];

      const probes = resolvedApiUrl
        ? await Promise.all(
            probeTargets.map(async (entry) => {
              const url = buildProbeUrl(entry.path, entry.includeDirectory !== false);
              if (!url) {
                return { label: entry.label, url: '(none)', result: null as null };
              }
              const result = await safeFetch(url, typeof entry.timeoutMs === 'number' ? entry.timeoutMs : undefined);
              return { label: entry.label, url, result };
            })
          )
        : [];

      const storedSettings = context.globalState.get<Record<string, unknown>>(SETTINGS_KEY) || {};
      const settingsKeys = Object.keys(storedSettings).filter((key) => key !== 'lastDirectory');

      const lines = [
        `Time: ${new Date().toISOString()}`,
        `Neusis Code version: ${extensionVersion || '(unknown)'}`,
        `Backend Type: ${backendType || '(unknown)'}`,
        `Backend Version: ${debug?.version ?? '(unknown)'}`,
        `VS Code version: ${vscode.version}`,
        `Platform: ${process.platform} ${process.arch}`,
        `Workspace folders: ${workspaceFolders.length}${workspaceFolders.length ? ` (${workspaceFolders.join(', ')})` : ''}`,
        `Status: ${backend?.getStatus() ?? 'unknown'}`,
        `Working directory: ${workingDirectory}`,
        `Working dir matches workspace: ${workingDirectoryMatchesWorkspace ? 'yes' : 'no'}`,
        `API URL (configured): ${configuredApiUrl || '(none)'}`,
        `API URL (resolved): ${resolvedApiUrl ?? '(none)'}`,
        `API URL path: ${resolvedApiPath || '(none)'}`,
        debug
          ? `Backend server URL: ${getDebugAdditionalString(debug, 'serverUrl') ?? '(none)'}`
          : `Backend server URL: (unknown)`,
        debug
          ? `Backend mode: ${getDebugAdditionalString(debug, 'mode') ?? '(unknown)'} (starts=${getDebugAdditionalNumber(debug, 'startCount') ?? 0}, restarts=${getDebugAdditionalNumber(debug, 'restartCount') ?? 0})`
          : `Backend mode: (unknown)`,
        debug
          ? `Backend CLI available: ${debug.cliAvailable ? 'yes' : 'no'}`
          : `Backend CLI available: (unknown)`,
        debug && backendType === 'opencode'
          ? `OpenCode detected port: ${getDebugAdditionalNumber(debug, 'detectedPort') ?? '(none)'}`
          : '',
        debug && backendType === 'opencode'
          ? `OpenCode API prefix: ${getDebugAdditionalInfo(debug).apiPrefixDetected === true ? (getDebugAdditionalString(debug, 'apiPrefix') || '(root)') : '(unknown)'}`
          : '',
        debug
          ? `Last start: ${formatIso(getDebugAdditionalNumber(debug, 'lastStartAt'))}`
          : `Last start: (unknown)`,
        debug && backendType === 'opencode'
          ? `Last ready: ${getDebugAdditionalNumber(debug, 'lastReadyElapsedMs') !== undefined ? `${getDebugAdditionalNumber(debug, 'lastReadyElapsedMs')}ms` : '(unknown)'}`
          : '',
        debug && backendType === 'opencode'
          ? `Ready attempts: ${getDebugAdditionalNumber(debug, 'lastReadyAttempts') ?? '(unknown)'}`
          : '',
        debug && backendType === 'opencode'
          ? `Start attempts: ${getDebugAdditionalNumber(debug, 'lastStartAttempts') ?? '(unknown)'}`
          : '',
        debug
          ? `Last connected: ${formatIso(getDebugAdditionalNumber(debug, 'lastConnectedAt'))}`
          : `Last connected: (unknown)`,
        `Connected for: ${formatConnectedDuration(debug)}`,
        debug && getDebugAdditionalNumber(debug, 'lastExitCode') !== undefined
          ? `Last exit code: ${getDebugAdditionalNumber(debug, 'lastExitCode')}`
          : `Last exit code: (none)`,
        debug && getDebugAdditionalString(debug, 'lastError')
          ? `Last error: ${getDebugAdditionalString(debug, 'lastError')}`
          : `Last error: (none)`,
        `Settings keys (stored): ${settingsKeys.length ? settingsKeys.join(', ') : '(none)'}`,
        probes.length ? '' : '',
        ...(probes.length
          ? [
              'OpenCode API probes:',
              ...probes.map((probe) => {
                if (!probe.result) return `- ${probe.label}: (no url)`;
                const { ok, status, elapsedMs, summary } = probe.result;
                const suffix = ok ? '' : ` url=${probe.url}`;
                return `- ${probe.label}: ${ok ? 'ok' : 'fail'} status=${status} time=${elapsedMs}ms ${summary}${suffix}`;
              }),
            ]
          : []),
        '',
      ];

      outputChannel?.appendLine(lines.join('\n'));
      outputChannel?.show(true);
    })
  );

  context.subscriptions.push(
    vscode.window.onDidChangeActiveColorTheme((theme) => {
      chatViewProvider?.updateTheme(theme.kind);
      agentManagerProvider?.updateTheme(theme.kind);
      sessionEditorProvider?.updateTheme(theme.kind);
    })
  );

  // Theme changes can update the `workbench.colorTheme` setting slightly after the
  // `activeColorTheme` event. Listen for config changes too so we can re-resolve
  // the contributed theme JSON and update Shiki themes in the webview.
  context.subscriptions.push(
    vscode.workspace.onDidChangeConfiguration((event) => {
      if (
        event.affectsConfiguration('workbench.colorTheme') ||
        event.affectsConfiguration('workbench.preferredLightColorTheme') ||
        event.affectsConfiguration('workbench.preferredDarkColorTheme')
      ) {
        chatViewProvider?.updateTheme(vscode.window.activeColorTheme.kind);
        agentManagerProvider?.updateTheme(vscode.window.activeColorTheme.kind);
        sessionEditorProvider?.updateTheme(vscode.window.activeColorTheme.kind);
      }
    })
  );

  // Subscribe to status changes - this broadcasts to webview
  const activeBackend = backendManager?.getActiveBackend();
  if (activeBackend && backendManager) {
    const unsubscribe = activeBackend.onStatusChange((status) => {
      const error = undefined; // Error handling is done via onError
      chatViewProvider?.updateConnectionStatus(status, error);
      agentManagerProvider?.updateConnectionStatus(status, error);
      sessionEditorProvider?.updateConnectionStatus(status, error);

      // Start/stop global event watcher based on connection status
      // Mirrors web server and desktop Tauri behavior
      // Only for OpenCode backend
      if (status === 'connected' && chatViewProvider && backendManager?.getBackendType() === 'opencode') {
        const openCodeManager = hasOpenCodeManagerGetter(activeBackend)
          ? activeBackend.getOpenCodeManager?.()
          : undefined;
        if (openCodeManager) {
          setChatViewProvider(chatViewProvider);
          void startGlobalEventWatcher(openCodeManager, chatViewProvider);
        }
      } else if (status === 'disconnected' || status === 'error') {
        stopGlobalEventWatcher();
      }
    });

    context.subscriptions.push({ dispose: unsubscribe });
  }

  // Backend already initialized earlier (before creating view providers)
  // This ensures proper backend detection and prevents "CLI not found" errors
}

export async function deactivate() {
  stopGlobalEventWatcher();
  await backendManager?.dispose();
  backendManager = undefined;
  chatViewProvider = undefined;
  agentManagerProvider = undefined;
  sessionEditorProvider = undefined;
  outputChannel?.dispose();
  outputChannel = undefined;
}
