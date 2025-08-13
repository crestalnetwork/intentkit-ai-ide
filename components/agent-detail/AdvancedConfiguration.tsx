import React from "react";

interface AdvancedConfigurationProps {
  agent: any;
}

const AdvancedConfiguration: React.FC<AdvancedConfigurationProps> = ({
  agent,
}) => {
  return (
    <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)] p-4 mb-4">
      <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center">
        <svg
          className="w-4 h-4 mr-2 text-[var(--color-neon-cyan)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
          />
        </svg>
        Advanced Configuration
      </h4>
      <div className="space-y-3">
        <div className="grid grid-cols-2 gap-3 text-xs">
          {agent.temperature !== undefined && (
            <div className="bg-[var(--color-bg-secondary)] p-2 rounded border border-[var(--color-border-secondary)]">
              <span className="text-[var(--color-text-tertiary)]">
                Temperature:
              </span>
              <span className="ml-1 text-[var(--color-text-primary)] font-mono">
                {agent.temperature}
              </span>
            </div>
          )}
          {agent.frequency_penalty !== undefined && (
            <div className="bg-[var(--color-bg-secondary)] p-2 rounded border border-[var(--color-border-secondary)]">
              <span className="text-[var(--color-text-tertiary)]">
                Frequency:
              </span>
              <span className="ml-1 text-[var(--color-text-primary)] font-mono">
                {agent.frequency_penalty}
              </span>
            </div>
          )}
          {agent.presence_penalty !== undefined && (
            <div className="bg-[var(--color-bg-secondary)] p-2 rounded border border-[var(--color-border-secondary)]">
              <span className="text-[var(--color-text-tertiary)]">
                Presence:
              </span>
              <span className="ml-1 text-[var(--color-text-primary)] font-mono">
                {agent.presence_penalty}
              </span>
            </div>
          )}
          {agent.short_term_memory_strategy && (
            <div className="bg-[var(--color-bg-secondary)] p-2 rounded border border-[var(--color-border-secondary)]">
              <span className="text-[var(--color-text-tertiary)]">Memory:</span>
              <span className="ml-1 text-[var(--color-text-primary)] font-medium">
                {agent.short_term_memory_strategy}
              </span>
            </div>
          )}
        </div>

        {/* Timestamps */}
        <div className="flex flex-wrap gap-2 text-xs">
          {agent.created_at && (
            <div className="bg-[var(--color-bg-secondary)] px-2 py-1 rounded border border-[var(--color-border-secondary)]">
              <span className="text-[var(--color-text-tertiary)]">
                Created:
              </span>
              <span className="ml-1 text-[var(--color-text-secondary)]">
                {new Date(agent.created_at).toLocaleString()}
              </span>
            </div>
          )}
          {agent.updated_at && agent.updated_at !== agent.created_at && (
            <div className="bg-[var(--color-bg-secondary)] px-2 py-1 rounded border border-[var(--color-border-secondary)]">
              <span className="text-[var(--color-text-tertiary)]">
                Updated:
              </span>
              <span className="ml-1 text-[var(--color-text-secondary)]">
                {new Date(agent.updated_at).toLocaleString()}
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdvancedConfiguration;
