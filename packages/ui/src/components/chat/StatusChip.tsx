import React from 'react';
import { cn } from '@/lib/utils';
import { isVSCodeRuntime } from '@/lib/desktop';
import { useConfigStore } from '@/stores/useConfigStore';
import { useSessionStore } from '@/stores/useSessionStore';
import { useContextStore } from '@/stores/contextStore';
import { formatEffortLabel, getAgentDisplayName, getModelDisplayName } from './mobileControlsUtils';
import { useVSCodeBackendType } from '@/hooks/useVSCodeBackendType';

interface StatusChipProps {
    onClick: () => void;
    className?: string;
}

export const StatusChip: React.FC<StatusChipProps> = ({ onClick, className }) => {
    const vscodeBackendType = useVSCodeBackendType();
    const hideAgent = isVSCodeRuntime() && vscodeBackendType === 'claude-cli';
    const {
        currentModelId,
        currentVariant,
        currentAgentName,
        getCurrentProvider,
        getCurrentModelVariants,
        getVisibleAgents,
    } = useConfigStore();
    const currentSessionId = useSessionStore((state) => state.currentSessionId);
    const sessionAgentName = useContextStore((state) =>
        currentSessionId ? state.getSessionAgentSelection(currentSessionId) : null
    );

    const agents = getVisibleAgents();
    const uiAgentName = currentSessionId ? (sessionAgentName || currentAgentName) : currentAgentName;
    const agentLabel = getAgentDisplayName(agents, uiAgentName);
    const currentProvider = getCurrentProvider();
    const modelLabel = getModelDisplayName(currentProvider, currentModelId);
    const hasEffort = getCurrentModelVariants().length > 0;
    const effortLabel = hasEffort ? formatEffortLabel(currentVariant) : null;
    const fullLabel = hideAgent
        ? [modelLabel, effortLabel].filter(Boolean).join(' · ')
        : [agentLabel, modelLabel, effortLabel].filter(Boolean).join(' · ');

    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'inline-flex min-w-0 items-center justify-center',
                'rounded-md border border-border/50 px-1.5',
                'text-[11px] font-medium text-foreground/80',
                'focus:outline-none hover:bg-[var(--interactive-hover)]',
                className
            )}
            style={{ 
                height: '28px',
                maxHeight: '28px',
                minHeight: '28px',
            }}
            title={fullLabel}
        >
            {!hideAgent && (
                <>
                    <span className="shrink-0">{agentLabel}</span>
                    <span className="shrink-0 text-muted-foreground mx-0.5">·</span>
                </>
            )}
            <span className="min-w-0 truncate">{modelLabel}</span>
            {effortLabel && (
                <>
                    <span className="shrink-0 text-muted-foreground mx-0.5">·</span>
                    <span className="shrink-0">{effortLabel}</span>
                </>
            )}
        </button>
    );
};

export default StatusChip;
