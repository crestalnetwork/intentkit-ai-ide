import React, { useState } from "react";
import { Agent } from "@/lib/utils/apiClient";
import AgentHeader from "../agent-detail/AgentHeader";
import CDPWallet from "../agent-detail/CDPWallet";
import SystemPrompts from "../agent-detail/SystemPrompts";
import SkillsSection from "../agent-detail/SkillsSection";
import AutonomousTasks from "../agent-detail/AutonomousTasks";
import AgentApiKeys from "../AgentApiKeys";
import SkillsPanel from "../SkillsPanel";
import { showToast } from "../../lib/utils/toast";

interface AgentDetailsPanelProps {
  agent: Agent | null;
  onAgentUpdate?: () => void;
}

const AgentDetailsPanel: React.FC<AgentDetailsPanelProps> = ({ agent, onAgentUpdate }) => {
  const [activeTab, setActiveTab] = useState<string>("overview");
  const [showSkillsPanel, setShowSkillsPanel] = useState<boolean>(false);

  if (!agent) {
    return (
      <div className="flex flex-col h-full bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
        <div className="border-b border-[var(--color-border-primary)] p-3">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Agent Details
          </h2>
          <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
            No agent selected
          </p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <svg className="w-12 h-12 text-[var(--color-text-tertiary)] mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <p className="text-[var(--color-text-tertiary)]">No agent available</p>
          </div>
        </div>
      </div>
    );
  }

  const tabs = [
    {
      id: "overview",
      label: "Overview",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
        </svg>
      ),
    },
    {
      id: "wallet",
      label: "Wallet",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
        </svg>
      ),
    },
    {
      id: "skills",
      label: "Skills",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
        </svg>
      ),
    },
    {
      id: "autonomous",
      label: "Tasks",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
      ),
    },
    {
      id: "keys",
      label: "Keys",
      icon: (
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z" />
        </svg>
      ),
    },
  ];

  const renderTabContent = () => {
    switch (activeTab) {
      case "overview":
        return (
          <div className="space-y-4">
            <AgentHeader
              agent={agent}
              onAgentUpdate={() => {
                onAgentUpdate?.();
              }}
            />
            <SystemPrompts agent={agent} />
          </div>
        );
      case "wallet":
        return <CDPWallet agent={agent} />;
      case "skills":
        return (
          <SkillsSection
            agent={agent}
            onOpenSkillsPanel={() => {
              setShowSkillsPanel(true);
            }}
          />
        );
      case "autonomous":
        return <AutonomousTasks agent={agent} />;
      case "keys":
        return <AgentApiKeys agent={agent} />;
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--color-border-primary)] p-3">
        <h2 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center">
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
              d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
            />
          </svg>
          Agent Details
        </h2>
        <p className="text-sm text-[var(--color-text-tertiary)] mt-1 truncate">
          {agent.name}
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-[var(--color-border-primary)]">
        <div className="flex overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-1 px-3 py-2 text-xs font-medium whitespace-nowrap border-b-2 transition-all duration-200 ${
                activeTab === tab.id
                  ? "border-[var(--color-neon-cyan)] text-[var(--color-neon-cyan)] bg-[var(--color-neon-cyan-subtle)]"
                  : "border-transparent text-[var(--color-text-tertiary)] hover:text-[var(--color-text-secondary)] hover:border-[var(--color-border-secondary)]"
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-3">
        {renderTabContent()}
      </div>

      {/* Skills Panel */}
      {showSkillsPanel && (
        <SkillsPanel
          isVisible={showSkillsPanel}
          onClose={() => setShowSkillsPanel(false)}
          agent={agent}
          onAgentUpdate={() => {
            onAgentUpdate?.();
          }}
          onAddSkill={(skillName) => {
            // Legacy callback - now handled by onAgentUpdate
            showToast.success(`Skill "${skillName}" configuration copied to clipboard!`);
            setShowSkillsPanel(false);
          }}
        />
      )}
    </div>
  );
};

export default AgentDetailsPanel;