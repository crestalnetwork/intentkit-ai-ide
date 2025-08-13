import React, { useState, useEffect } from "react";
import { AgentDetailProps } from "../lib/types";
import { PrismLight as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import json from "react-syntax-highlighter/dist/cjs/languages/prism/json";
import axios from "axios";
// import theme from "../lib/utils/theme";
import { showToast } from "../lib/utils/toast";
import apiClient from "../lib/utils/apiClient";
import AgentApiKeys from "./AgentApiKeys";
import SkillsPanel from "./SkillsPanel";
import SidebarNavigation from "./agent-detail/SidebarNavigation";
import AgentHeader from "./agent-detail/AgentHeader";
import CDPWallet from "./agent-detail/CDPWallet";
import SystemPrompts from "./agent-detail/SystemPrompts";
import AdvancedConfiguration from "./agent-detail/AdvancedConfiguration";
import SkillsSection from "./agent-detail/SkillsSection";
import AutonomousTasks from "./agent-detail/AutonomousTasks";

// Register the json language for PrismLight
SyntaxHighlighter.registerLanguage("json", json);

const AgentDetail: React.FC<AgentDetailProps> = ({
  agent,
  onToggleViewMode,
}) => {
  const [showRawConfig, setShowRawConfig] = useState<boolean>(false);
  const [showEditMode, setShowEditMode] = useState<boolean>(false);
  const [editedConfig, setEditedConfig] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Removed username and password state - using API client with Bearer token authentication

  // Skills panel state
  const [showSkillsPanel, setShowSkillsPanel] = useState<boolean>(false);

  // Sidebar navigation state
  const [activeSection, setActiveSection] = useState<string>("agent-header");

  if (!agent) {
    return <div>No agent selected</div>;
  }

  // Helper to format skill data
  const formatSkillData = (skill: any) => {
    if (!skill) return null;

    return (
      <div className="mt-2 ml-2">
        <div className="flex items-center">
          <span className="text-xs text-[#8b949e]">Status:</span>
          <span
            className={`ml-1 inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium ${
              skill.enabled
                ? "bg-[#132e21] text-[#56d364]"
                : "bg-[#21262d] text-[#8b949e]"
            }`}
          >
            {skill.enabled ? "Enabled" : "Disabled"}
          </span>
        </div>
        {skill.api_key && (
          <div className="mt-1 text-xs">
            <span className="text-[#8b949e]">API Key:</span>
            <span className="ml-1 text-[#c9d1d9]">●●●●●●●●●●●●●●●●</span>
          </div>
        )}
        {skill.api_key_provider && (
          <div className="mt-1 text-xs">
            <span className="text-[#8b949e]">Provider:</span>
            <span className="ml-1 text-[#c9d1d9]">
              {skill.api_key_provider}
            </span>
          </div>
        )}
        {skill.states && Object.keys(skill.states).length > 0 && (
          <div className="mt-2">
            <span className="text-xs font-medium text-[#8b949e]">States:</span>
            <div className="mt-1 grid grid-cols-2 gap-1">
              {Object.entries(skill.states).map(([stateName, stateValue]) => (
                <div
                  key={stateName}
                  className="text-[9px] bg-[#0d1117] p-1 rounded border border-[#30363d]"
                >
                  <span className="text-[#8b949e]">{stateName}:</span>
                  <span className="ml-1 text-[#c9d1d9]">
                    {String(stateValue)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const handleEditClick = () => {
    setEditedConfig(JSON.stringify(agent, null, 2));
    setShowEditMode(true);
    setShowRawConfig(false);
    setSaveResult(null);
  };

  const handleConfigChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setEditedConfig(e.target.value);
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(editedConfig);
      const formatted = JSON.stringify(parsed, null, 2);
      setEditedConfig(formatted);
      showToast.success("JSON formatted successfully!");
    } catch (error) {
      showToast.error("Invalid JSON format. Cannot format.");
    }
  };

  // Navigation sections for sidebar
  const sections = [
    {
      id: "agent-header",
      label: "Overview",
      icon: (
        <svg
          className="w-4 h-4"
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
      ),
    },
    {
      id: "cdp-wallet",
      label: "CDP Wallet",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
      ),
    },
    {
      id: "system-prompts",
      label: "System Prompts",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
    },
    {
      id: "advanced-config",
      label: "Advanced Config",
      icon: (
        <svg
          className="w-4 h-4"
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
      ),
    },
    {
      id: "skills-section",
      label: "Skills",
      icon: (
        <svg
          className="w-4 h-4"
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
      ),
    },
    {
      id: "autonomous-tasks",
      label: "Autonomous Tasks",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
          />
        </svg>
      ),
    },
    {
      id: "api-keys",
      label: "API Keys",
      icon: (
        <svg
          className="w-4 h-4"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"
          />
        </svg>
      ),
    },
  ];

  const handleSectionChange = (sectionId: string) => {
    setActiveSection(sectionId);
  };

  const handleOpenSkillsPanel = () => {
    setShowSkillsPanel(true);
    // Also scroll to skills section
    const element = document.getElementById("skills-section");
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
    }
    setActiveSection("skills-section");
  };

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      setSaveResult(null);

      // Validate and format JSON
      let configObj;
      try {
        configObj = JSON.parse(editedConfig);
        // Auto-format the JSON for better display
        const formattedJson = JSON.stringify(configObj, null, 2);
        setEditedConfig(formattedJson);
      } catch (err) {
        setSaveResult({
          success: false,
          message: "Invalid JSON format. Please check your configuration.",
        });
        setIsSaving(false);
        return;
      }

      // Ensure required fields are present
      const requiredFields = ["name", "purpose", "personality", "principles"];
      const missingFields = requiredFields.filter(
        (field) => !configObj[field] || configObj[field].trim() === ""
      );

      if (missingFields.length > 0) {
        setSaveResult({
          success: false,
          message: `Missing required fields: ${missingFields.join(
            ", "
          )}. These fields are required by the API.`,
        });
        setIsSaving(false);
        return;
      }

      // Use API client for consistent authentication
      const response = await apiClient.updateAgent(agent.id!, configObj);

      setSaveResult({
        success: true,
        message: "Agent updated successfully!",
      });

      showToast.success("Agent updated successfully!");

      // Refresh the agent data if global function is available
      if (
        typeof window !== "undefined" &&
        (window as any).refreshSelectedAgent
      ) {
        (window as any).refreshSelectedAgent();
      }

      // Add a small delay to show the success message
      setTimeout(() => {
        setShowEditMode(false);
      }, 1500);
    } catch (error: any) {
      console.error("Error updating agent:", error);

      let errorMessage = "Failed to update agent.";

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage = "Authentication failed. Please sign in again.";
        } else if (error.response?.status === 400) {
          errorMessage = `Bad request: ${
            error.response.data?.detail || "Invalid data"
          }`;
        } else if (error.response?.status === 403) {
          errorMessage = "Permission denied. You don't own this agent.";
        } else if (error.response?.status === 404) {
          errorMessage = "Agent not found.";
        } else if (error.response?.status === 422) {
          errorMessage = `Validation error: ${
            error.response.data?.detail || "Invalid agent configuration"
          }`;
        } else if (error.response?.data?.detail) {
          errorMessage = `Error: ${error.response.data.detail}`;
        }
      }

      setSaveResult({
        success: false,
        message: errorMessage,
      });

      showToast.error(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-primary)] h-full flex flex-col overflow-hidden">
      <div className="p-3 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-b border-[var(--color-border-primary)] flex justify-between items-center">
        <div className="flex items-center space-x-3">
          <h2 className="text-lg font-semibold">Agent Details</h2>
        </div>
        <div className="flex items-center space-x-2">
          {onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="inline-flex items-center space-x-2 text-sm py-2 px-4 bg-[var(--color-bg-card)] text-[var(--color-neon-cyan)] border border-[var(--color-neon-cyan-border)] rounded hover:bg-[var(--color-neon-cyan-subtle)] hover:border-[var(--color-neon-cyan)] hover-neon-glow-cyan transition-all duration-200 whitespace-nowrap"
              title="Back to Chat"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Back to Chat</span>
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Navigation */}
        <SidebarNavigation
          sections={sections}
          activeSection={activeSection}
          onSectionClick={handleSectionChange}
        />

        {/* Main Content */}
        <div className="flex-1 overflow-y-auto bg-[var(--color-bg-secondary)] p-4">
          <div className="space-y-6">
            {/* Agent Header */}
            <div id="agent-header">
              <AgentHeader agent={agent} />
            </div>

            {/* CDP Wallet Information */}
            <div id="cdp-wallet">
              <CDPWallet agent={agent} />
            </div>

            {/* System Prompts */}
            <div id="system-prompts">
              <SystemPrompts agent={agent} />
            </div>

            {/* Advanced Configuration */}
            <div id="advanced-config">
              <AdvancedConfiguration agent={agent} />
            </div>

            {/* Skills Section */}
            <div id="skills-section">
              <SkillsSection
                agent={agent}
                onOpenSkillsPanel={handleOpenSkillsPanel}
              />
            </div>

            {/* Autonomous Tasks */}
            <div id="autonomous-tasks">
              <AutonomousTasks agent={agent} />
            </div>

            {/* Agent API Keys Section */}
            <div id="api-keys">
              <AgentApiKeys agent={agent} />
            </div>
          </div>
        </div>
      </div>

      {/* Skills Panel */}
      {showSkillsPanel && (
        <SkillsPanel
          isVisible={showSkillsPanel}
          onClose={() => setShowSkillsPanel(false)}
          agent={agent}
          onAgentUpdate={() => {
            // Refresh the agent data
            if (
              typeof window !== "undefined" &&
              (window as any).refreshSelectedAgent
            ) {
              (window as any).refreshSelectedAgent();
            }
          }}
          onAddSkill={(skillName, skillConfig) => {
            // Legacy callback - now handled by onAgentUpdate
            showToast.success(
              `Skill "${skillName}" configuration copied to clipboard!`
            );
            setShowSkillsPanel(false);
          }}
        />
      )}
    </div>
  );
};

export default AgentDetail;
