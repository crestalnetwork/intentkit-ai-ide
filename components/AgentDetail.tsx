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

  // System prompts editing state
  const [showPromptsEditMode, setShowPromptsEditMode] =
    useState<boolean>(false);
  const [editedPrompts, setEditedPrompts] = useState({
    purpose: agent.purpose || "",
    personality: agent.personality || "",
    principles: agent.principles || "",
  });
  const [isPromptsSaving, setIsPromptsSaving] = useState<boolean>(false);
  const [promptsSaveResult, setPromptsSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  const [username, setUsername] = useState<string>(
    localStorage.getItem("intentkit_username") || ""
  );
  const [password, setPassword] = useState<string>(
    localStorage.getItem("intentkit_password") || ""
  );

  // Skills panel state
  const [showSkillsPanel, setShowSkillsPanel] = useState<boolean>(false);

  // Update edited prompts when agent changes
  useEffect(() => {
    setEditedPrompts({
      purpose: agent.purpose || "",
      personality: agent.personality || "",
      principles: agent.principles || "",
    });
    setShowPromptsEditMode(false);
    setPromptsSaveResult(null);
  }, [agent.id]);

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

  const handleSavePrompts = async () => {
    try {
      setIsPromptsSaving(true);
      setPromptsSaveResult(null);

      // Create updated agent object with new prompts
      const updatedAgent = {
        ...agent,
        purpose: editedPrompts.purpose,
        personality: editedPrompts.personality,
        principles: editedPrompts.principles,
      };

      // Use the same API call as the JSON editor
      const response = await apiClient.updateAgent(agent.id!, updatedAgent);

      setPromptsSaveResult({
        success: true,
        message: "Agent prompts updated successfully!",
      });

      showToast.success("Agent prompts updated successfully!");

      // Refresh the agent data if global function is available
      if (
        typeof window !== "undefined" &&
        (window as any).refreshSelectedAgent
      ) {
        (window as any).refreshSelectedAgent();
      }

      // Add a small delay to show the success message
      setTimeout(() => {
        setShowPromptsEditMode(false);
      }, 1500);
    } catch (error: any) {
      console.error("Error updating agent prompts:", error);

      let errorMessage = "Failed to update agent prompts.";

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage =
            "Authentication failed. Please check your credentials.";
        } else if (error.response?.status === 400) {
          errorMessage = `Bad request: ${
            error.response.data?.detail || "Invalid data"
          }`;
        } else if (error.response?.status === 404) {
          errorMessage = "Agent not found.";
        } else if (error.response?.data?.detail) {
          errorMessage = `Error: ${error.response.data.detail}`;
        }
      }

      setPromptsSaveResult({
        success: false,
        message: errorMessage,
      });

      showToast.error(errorMessage);
    } finally {
      setIsPromptsSaving(false);
    }
  };

  const handleSaveConfig = async () => {
    try {
      setIsSaving(true);
      setSaveResult(null);

      // Validate JSON
      let configObj;
      try {
        configObj = JSON.parse(editedConfig);
      } catch (err) {
        setSaveResult({
          success: false,
          message: "Invalid JSON format. Please check your configuration.",
        });
        setIsSaving(false);
        return;
      }

      // Get base URL from localStorage
      const baseUrl =
        localStorage.getItem("intentkit_base_url") || "http://127.0.0.1:8000";
      const apiBaseUrl = baseUrl.replace("localhost", "127.0.0.1");

      // Set auth headers if credentials are available
      const config: any = {};
      if (username && password) {
        config.auth = {
          username: username,
          password: password,
        };
      }

      // Send PATCH request to update the agent
      const response = await axios.patch(
        `${apiBaseUrl}/agents/${agent.id}`,
        configObj,
        config
      );

      setSaveResult({
        success: true,
        message: "Agent updated successfully!",
      });

      // Refresh the agents list using the global function
      if (typeof window !== "undefined" && (window as any).refreshAgentsList) {
        (window as any).refreshAgentsList();
      }

      // Add a small delay to show the success message
      setTimeout(() => {
        setShowEditMode(false);
      }, 1500);
    } catch (error) {
      console.error("Error updating agent:", error);

      let errorMessage = "Failed to update agent.";

      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage =
            "Authentication failed. Please check your credentials.";
        } else if (error.response?.status === 400) {
          errorMessage = `Bad request: ${
            error.response.data?.detail || "Invalid data"
          }`;
        } else if (error.response?.status === 404) {
          errorMessage = "Agent not found.";
        } else if (error.response?.data?.detail) {
          errorMessage = `Error: ${error.response.data.detail}`;
        }
      }

      setSaveResult({
        success: false,
        message: errorMessage,
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border-primary)] h-full flex flex-col overflow-hidden">
      <div className="p-3 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-b border-[var(--color-border-primary)] flex justify-between items-center">
        <div className="flex items-center space-x-3">
          {onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="inline-flex items-center space-x-1 text-xs py-1.5 px-2 bg-[var(--color-bg-card)] text-[var(--color-neon-cyan)] border border-[var(--color-neon-cyan-border)] rounded hover:bg-[var(--color-neon-cyan-subtle)] hover:border-[var(--color-neon-cyan)] hover-neon-glow-cyan transition-all duration-200"
              title="Back to Chat"
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
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              <span>Back to Chat</span>
            </button>
          )}
          <h2 className="text-lg font-semibold">Agent Details</h2>
        </div>
        <div className="flex items-center space-x-2">
          {!showEditMode && (
            <button
              onClick={handleEditClick}
              className="text-xs text-[var(--color-neon-lime)] hover:text-[var(--color-neon-lime-bright)] flex items-center py-1.5 px-3 bg-[var(--color-bg-card)] rounded border border-[var(--color-neon-lime-border)] hover:bg-[var(--color-neon-lime-subtle)] hover:border-[var(--color-neon-lime)] hover-neon-glow-lime transition-all duration-200 font-medium"
            >
              <svg
                className="mr-1 h-3 w-3"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              Edit
            </button>
          )}
          {!showEditMode && (
            <button
              onClick={() => setShowRawConfig(!showRawConfig)}
              className="text-xs text-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan-bright)] flex items-center py-1.5 px-3 bg-[var(--color-bg-card)] rounded border border-[var(--color-neon-cyan-border)] hover:bg-[var(--color-neon-cyan-subtle)] hover:border-[var(--color-neon-cyan)] hover-neon-glow-cyan transition-all duration-200 font-medium"
            >
              {showRawConfig ? "Hide" : "JSON"}
              <svg
                className={`ml-1 h-3 w-3 transition-transform ${
                  showRawConfig ? "transform rotate-180" : ""
                }`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>
          )}
        </div>
      </div>

      <div className="p-3 flex-1 overflow-y-auto bg-[var(--color-bg-secondary)]">
        {showEditMode ? (
          <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)] overflow-hidden">
            <div className="bg-[var(--color-bg-secondary)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border-primary)] flex justify-between items-center">
              <span>Edit Agent Configuration</span>
              <div className="flex space-x-2">
                <button
                  onClick={() => setShowEditMode(false)}
                  className="text-xs text-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan-bright)] py-1 px-2 bg-[var(--color-bg-card)] rounded border border-[var(--color-neon-cyan-border)] hover:bg-[var(--color-neon-cyan-subtle)] transition-all duration-200"
                  disabled={isSaving}
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  className={`text-xs py-1 px-2 rounded border transition-all duration-200 ${
                    isSaving
                      ? "bg-[var(--color-text-muted)] cursor-not-allowed text-[var(--color-bg-primary)]"
                      : "bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] border-[var(--color-neon-lime-border)] hover:bg-[var(--color-neon-lime-bright)] neon-glow-lime font-medium"
                  }`}
                  disabled={isSaving}
                >
                  {isSaving ? "Saving..." : "Save"}
                </button>
              </div>
            </div>

            {saveResult && (
              <div
                className={`px-3 py-2 text-sm border-b ${
                  saveResult.success
                    ? "bg-[var(--color-neon-lime-subtle)] text-[var(--color-neon-lime)] border-[var(--color-neon-lime-border)]"
                    : "bg-[var(--color-neon-pink-subtle)] text-[var(--color-neon-pink)] border-[var(--color-neon-pink-border)]"
                }`}
              >
                {saveResult.message}
              </div>
            )}

            <textarea
              value={editedConfig}
              onChange={handleConfigChange}
              className="w-full h-full p-3 bg-[var(--color-bg-input)] text-[var(--color-text-primary)] font-mono text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] border-none resize-none"
              style={{ minHeight: "calc(100vh - 200px)" }}
              spellCheck="false"
              disabled={isSaving}
            />
          </div>
        ) : showRawConfig ? (
          <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)] overflow-hidden">
            <div className="bg-[var(--color-bg-secondary)] px-3 py-2 text-sm font-medium text-[var(--color-text-primary)] border-b border-[var(--color-border-primary)] flex justify-between items-center">
              <span>JSON Configuration</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(JSON.stringify(agent, null, 2));
                  // Refocus the input after copying
                  setTimeout(
                    () => document.getElementById("search-agents")?.focus(),
                    50
                  );
                }}
                className="text-xs text-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan-bright)] py-1 px-2 bg-[var(--color-bg-card)] rounded border border-[var(--color-neon-cyan-border)] hover:bg-[var(--color-neon-cyan-subtle)] transition-all duration-200"
              >
                📋 Copy
              </button>
            </div>
            {(SyntaxHighlighter as any)({
              language: "json",
              style: materialDark,
              customStyle: {
                margin: 0,
                padding: "1rem",
                maxHeight: "calc(100vh - 200px)",
                overflowY: "auto",
                background: "var(--color-bg-input)",
                borderRadius: 0,
                fontSize: "0.75rem",
              },
              children: JSON.stringify(agent, null, 2),
            })}
          </div>
        ) : (
          <>
            {/* Agent Header */}
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
                        {agent.mode === "public" ? "🌐 Public" : "🔒 Private"}
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

            {/* CDP Wallet Information */}
            {(agent.wallet_provider === "cdp" || agent.cdp_wallet_address) && (
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
                      d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
                    />
                  </svg>
                  CDP Wallet
                </h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-[var(--color-text-tertiary)]">
                      Status:
                    </span>
                    <span className="text-[var(--color-neon-cyan)] font-medium">
                      ✅ Enabled
                    </span>
                  </div>
                  {agent.cdp_wallet_address && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-tertiary)]">
                        Address:
                      </span>
                      <button
                        onClick={() => {
                          navigator.clipboard.writeText(
                            agent.cdp_wallet_address!
                          );
                          showToast.success(
                            "Wallet address copied to clipboard!"
                          );
                        }}
                        className="text-[var(--color-text-secondary)] hover:text-[var(--color-neon-cyan)] font-mono text-xs bg-[var(--color-bg-secondary)] px-2 py-1 rounded border border-[var(--color-border-secondary)] hover:border-[var(--color-neon-cyan-border)] transition-all duration-200 cursor-pointer"
                        title="Click to copy wallet address"
                      >
                        {agent.cdp_wallet_address.slice(0, 6)}...
                        {agent.cdp_wallet_address.slice(-4)}
                      </button>
                    </div>
                  )}
                  {(agent.network_id || agent.cdp_network_id) && (
                    <div className="flex items-center justify-between">
                      <span className="text-[var(--color-text-tertiary)]">
                        Network:
                      </span>
                      <span className="text-[var(--color-text-secondary)] font-medium">
                        {agent.network_id || agent.cdp_network_id}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* System Prompts */}
            <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)] p-4 mb-4">
              <div className="flex items-center justify-between mb-3">
                <h4 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center">
                  <svg
                    className="w-4 h-4 mr-2 text-[var(--color-neon-purple)]"
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
                  System Prompts
                </h4>
                {!showPromptsEditMode ? (
                  <button
                    onClick={() => {
                      setEditedPrompts({
                        purpose: agent.purpose || "",
                        personality: agent.personality || "",
                        principles: agent.principles || "",
                      });
                      setShowPromptsEditMode(true);
                      setPromptsSaveResult(null);
                    }}
                    className="text-xs text-[var(--color-neon-lime)] hover:text-[var(--color-neon-lime-bright)] py-1 px-2 bg-[var(--color-bg-card)] rounded border border-[var(--color-neon-lime-border)] hover:bg-[var(--color-neon-lime-subtle)] hover:border-[var(--color-neon-lime)] hover-neon-glow-lime transition-all duration-200 font-medium"
                  >
                    Edit Prompts
                  </button>
                ) : (
                  <div className="flex space-x-2">
                    <button
                      onClick={() => {
                        setShowPromptsEditMode(false);
                        setPromptsSaveResult(null);
                      }}
                      className="text-xs text-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan-bright)] py-1 px-2 bg-[var(--color-bg-card)] rounded border border-[var(--color-neon-cyan-border)] hover:bg-[var(--color-neon-cyan-subtle)] transition-all duration-200"
                      disabled={isPromptsSaving}
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSavePrompts}
                      className={`text-xs py-1 px-2 rounded border transition-all duration-200 ${
                        isPromptsSaving
                          ? "bg-[var(--color-text-muted)] cursor-not-allowed text-[var(--color-bg-primary)]"
                          : "bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] border-[var(--color-neon-lime-border)] hover:bg-[var(--color-neon-lime-bright)] neon-glow-lime font-medium"
                      }`}
                      disabled={isPromptsSaving}
                    >
                      {isPromptsSaving ? "Saving..." : "Save Prompts"}
                    </button>
                  </div>
                )}
              </div>

              {promptsSaveResult && (
                <div
                  className={`px-3 py-2 text-sm rounded border mb-3 ${
                    promptsSaveResult.success
                      ? "bg-[var(--color-neon-lime-subtle)] text-[var(--color-neon-lime)] border-[var(--color-neon-lime-border)]"
                      : "bg-[var(--color-neon-pink-subtle)] text-[var(--color-neon-pink)] border-[var(--color-neon-pink-border)]"
                  }`}
                >
                  {promptsSaveResult.message}
                </div>
              )}

              <div className="space-y-3">
                {/* Purpose Field */}
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-tertiary)] mb-1">
                    Purpose
                  </h5>
                  {showPromptsEditMode ? (
                    <textarea
                      value={editedPrompts.purpose}
                      onChange={(e) =>
                        setEditedPrompts((prev) => ({
                          ...prev,
                          purpose: e.target.value,
                        }))
                      }
                      className="w-full text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-input)] p-3 rounded border border-[var(--color-border-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] focus:border-[var(--color-neon-lime-border)] transition-all resize-none"
                      rows={3}
                      placeholder="Define the agent's main purpose and role..."
                      disabled={isPromptsSaving}
                    />
                  ) : (
                    <p className="text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] p-3 rounded border border-[var(--color-border-secondary)] leading-relaxed">
                      {agent.purpose && agent.purpose.trim() ? (
                        agent.purpose
                      ) : (
                        <span className="italic text-[var(--color-text-tertiary)]">
                          No purpose defined - this helps the agent understand
                          its main goal and role
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Personality Field */}
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-tertiary)] mb-1">
                    Personality
                  </h5>
                  {showPromptsEditMode ? (
                    <textarea
                      value={editedPrompts.personality}
                      onChange={(e) =>
                        setEditedPrompts((prev) => ({
                          ...prev,
                          personality: e.target.value,
                        }))
                      }
                      className="w-full text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-input)] p-3 rounded border border-[var(--color-border-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] focus:border-[var(--color-neon-lime-border)] transition-all resize-none"
                      rows={3}
                      placeholder="Describe the agent's personality traits and communication style..."
                      disabled={isPromptsSaving}
                    />
                  ) : (
                    <p className="text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] p-3 rounded border border-[var(--color-border-secondary)] leading-relaxed">
                      {agent.personality && agent.personality.trim() ? (
                        agent.personality
                      ) : (
                        <span className="italic text-[var(--color-text-tertiary)]">
                          No personality defined - this shapes how the agent
                          communicates and behaves
                        </span>
                      )}
                    </p>
                  )}
                </div>

                {/* Principles Field */}
                <div>
                  <h5 className="text-xs font-medium text-[var(--color-text-tertiary)] mb-1">
                    Principles
                  </h5>
                  {showPromptsEditMode ? (
                    <textarea
                      value={editedPrompts.principles}
                      onChange={(e) =>
                        setEditedPrompts((prev) => ({
                          ...prev,
                          principles: e.target.value,
                        }))
                      }
                      className="w-full text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-input)] p-3 rounded border border-[var(--color-border-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] focus:border-[var(--color-neon-lime-border)] transition-all resize-none"
                      rows={3}
                      placeholder="Define the agent's core principles, guidelines, and boundaries..."
                      disabled={isPromptsSaving}
                    />
                  ) : (
                    <p className="text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] p-3 rounded border border-[var(--color-border-secondary)] leading-relaxed">
                      {agent.principles && agent.principles.trim() ? (
                        agent.principles
                      ) : (
                        <span className="italic text-[var(--color-text-tertiary)]">
                          No principles defined - these establish the agent's
                          ethical guidelines and boundaries
                        </span>
                      )}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Additional Configuration */}
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
                      <span className="text-[var(--color-text-tertiary)]">
                        Memory:
                      </span>
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
                  {agent.updated_at &&
                    agent.updated_at !== agent.created_at && (
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

            {agent.skills && Object.keys(agent.skills).length > 0 && (
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
                    Skills ({Object.keys(agent.skills).length})
                  </h4>

                  {/* View All Skills Button */}
                  <button
                    onClick={() => setShowSkillsPanel(true)}
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
                    <span>View All Skills</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {Object.entries(agent.skills).map(
                    ([skillName, skillData]) => (
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
                            {(skillData as any)?.enabled
                              ? "✓ Enabled"
                              : "○ Disabled"}
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
                            Object.keys((skillData as any).states).length >
                              0 && (
                              <div>
                                <span className="text-[var(--color-text-tertiary)] font-medium">
                                  States:
                                </span>
                                <div className="mt-1 grid grid-cols-1 gap-1">
                                  {Object.entries(
                                    (skillData as any).states
                                  ).map(([stateName, stateValue]) => (
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
                                  ))}
                                </div>
                              </div>
                            )}
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

            {/* Agent API Keys Section */}
            <div className="mt-4">
              <AgentApiKeys agent={agent} />
            </div>
          </>
        )}
      </div>

      {/* Skills Panel */}
      {showSkillsPanel && (
        <SkillsPanel
          isVisible={showSkillsPanel}
          onClose={() => setShowSkillsPanel(false)}
          onAddSkill={(skillName, skillConfig) => {
            // Show feedback to user - in a real implementation you'd update the agent
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
