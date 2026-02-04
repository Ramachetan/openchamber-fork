import React from 'react';

export type VSCodeBackendType = 'opencode' | 'claude-cli' | 'unknown';

const readBackendType = (): VSCodeBackendType => {
  if (typeof window === 'undefined') return 'unknown';
  const configured = (window as unknown as { __VSCODE_CONFIG__?: { backendType?: unknown } }).__VSCODE_CONFIG__?.backendType;
  return configured === 'opencode' || configured === 'claude-cli' ? configured : 'unknown';
};

export const useVSCodeBackendType = (): VSCodeBackendType => {
  const [backendType, setBackendType] = React.useState<VSCodeBackendType>(() => readBackendType());

  React.useEffect(() => {
    const handleBackendChanged = () => {
      setBackendType(readBackendType());
    };

    window.addEventListener('openchamber:backend-changed', handleBackendChanged as EventListener);
    window.addEventListener('openchamber:connection-status', handleBackendChanged as EventListener);
    return () => {
      window.removeEventListener('openchamber:backend-changed', handleBackendChanged as EventListener);
      window.removeEventListener('openchamber:connection-status', handleBackendChanged as EventListener);
    };
  }, []);

  return backendType;
};
