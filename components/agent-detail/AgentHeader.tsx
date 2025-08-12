import React from "react";

interface AgentHeaderProps {
  agent: any;
}

const AgentHeader: React.FC<AgentHeaderProps> = ({ agent }) => {
  return (
    <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)] p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
            {agent.name || agent.id}
          </h3>
          {agent.description && (
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              {agent.description}
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[var(--color-neon-cyan-subtle)] text-[var(--color-neon-cyan)] border border-[var(--color-neon-cyan-border)]">
              ID: {agent.id}
            </span>
            {agent.model && (
              <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[var(--color-neon-lime-subtle)] text-[var(--color-neon-lime)] border border-[var(--color-neon-lime-border)]">
                Model: {agent.model}
              </span>
            )}
            {agent.mode && (
              <span
                className={`inline-flex items-center px-2 py-1 rounded text-xs font-medium ${
                  agent.mode === "public"
                    ? "bg-[var(--color-neon-lime-subtle)] text-[var(--color-neon-lime)] border border-[var(--color-neon-lime-border)]"
                    : "bg-[var(--color-neon-purple-subtle)] text-[var(--color-neon-purple)] border border-[var(--color-neon-purple-border)]"
                }`}
              >
                {agent.mode === "public" ? "Public" : "Private"}
              </span>
            )}
          </div>
        </div>
        {agent.picture && (
          <img
            src={agent.picture}
            alt={agent.name || "Agent"}
            className="w-16 h-16 rounded-lg border border-[var(--color-border-primary)]"
          />
        )}
      </div>
    </div>
  );
};

export default AgentHeader;
