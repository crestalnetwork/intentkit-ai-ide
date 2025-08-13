import React from "react";

interface SkillsSectionProps {
  agent: any;
  onOpenSkillsPanel: () => void;
}

const SkillsSection: React.FC<SkillsSectionProps> = ({
  agent,
  onOpenSkillsPanel,
}) => {
  return (
    <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)] p-4">
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center">
          <svg
            className="w-4 h-4 mr-2 text-[var(--color-neon-lime)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          Skills ({agent.skills ? Object.keys(agent.skills).length : 0})
        </h4>

        {/* View All Skills Button */}
        <button
          onClick={onOpenSkillsPanel}
          className="inline-flex items-center space-x-1 text-xs py-1.5 px-3 bg-[var(--color-bg-card)] text-[var(--color-neon-purple)] border border-[var(--color-neon-purple-border)] rounded hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-neon-purple)] hover-neon-glow-purple transition-all duration-200 font-medium"
        >
          <svg
            className="w-3 h-3"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
          <span>
            {agent.skills && Object.keys(agent.skills).length > 0
              ? "View All Skills"
              : "Browse Skills"}
          </span>
        </button>
      </div>

      {agent.skills && Object.keys(agent.skills).length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Object.entries(agent.skills).map(([skillName, skillData]) => (
            <div
              key={skillName}
              className="bg-[var(--color-bg-secondary)] rounded-lg border border-[var(--color-border-secondary)] p-3"
            >
              <div className="flex items-center justify-between mb-3">
                <h5 className="text-sm font-medium text-[var(--color-text-primary)] capitalize flex items-center">
                  <span className="w-2 h-2 rounded-full bg-[var(--color-neon-cyan)] mr-2"></span>
                  {skillName}
                </h5>
                <span
                  className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                    (skillData as any)?.enabled
                      ? "bg-[var(--color-neon-lime-subtle)] text-[var(--color-neon-lime)] border border-[var(--color-neon-lime-border)]"
                      : "bg-[var(--color-text-muted)] text-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]"
                  }`}
                >
                  {(skillData as any)?.enabled ? "Enabled" : "Disabled"}
                </span>
              </div>

              <div className="space-y-2 text-xs">
                {(skillData as any)?.api_key_provider && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-tertiary)]">
                      Provider:
                    </span>
                    <span className="text-[var(--color-text-secondary)] font-medium">
                      {(skillData as any).api_key_provider}
                    </span>
                  </div>
                )}

                {(skillData as any)?.api_key && (
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-tertiary)]">
                      API Key:
                    </span>
                    <span className="text-[var(--color-text-secondary)] font-mono">
                      ●●●●●●●●●●●●●●●●
                    </span>
                  </div>
                )}

                {(skillData as any)?.states &&
                  Object.keys((skillData as any).states).length > 0 && (
                    <div>
                      <span className="text-[var(--color-text-tertiary)] font-medium">
                        States:
                      </span>
                      <div className="mt-1 grid grid-cols-1 gap-1">
                        {Object.entries((skillData as any).states).map(
                          ([stateName, stateValue]) => (
                            <div
                              key={stateName}
                              className="flex items-center justify-between bg-[var(--color-bg-tertiary)] px-2 py-1 rounded border border-[var(--color-border-tertiary)]"
                            >
                              <span className="text-[var(--color-text-tertiary)] text-xs">
                                {stateName}:
                              </span>
                              <span
                                className={`text-xs font-medium ${
                                  stateValue === "public"
                                    ? "text-[var(--color-neon-lime)]"
                                    : stateValue === "private"
                                    ? "text-[var(--color-neon-purple)]"
                                    : "text-[var(--color-text-secondary)]"
                                }`}
                              >
                                {String(stateValue)}
                              </span>
                            </div>
                          )
                        )}
                      </div>
                    </div>
                  )}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <div className="flex flex-col items-center space-y-3">
            <div className="w-12 h-12 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg flex items-center justify-center">
              <svg
                className="w-6 h-6 text-[var(--color-text-tertiary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                />
              </svg>
            </div>
            <div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-1">
                No skills configured
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Click "Browse Skills" above to add capabilities to your agent
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SkillsSection;
