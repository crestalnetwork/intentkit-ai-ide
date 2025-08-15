import React, { useState, useEffect } from "react";
import apiClient, { LLMModel } from "../../lib/utils/apiClient";
import { showToast } from "../../lib/utils/toast";

interface AgentHeaderProps {
  agent: any;
  onAgentUpdate?: () => void;
}

const AgentHeader: React.FC<AgentHeaderProps> = ({ agent, onAgentUpdate }) => {
  const [llmModels, setLlmModels] = useState<LLMModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [isUpdatingModel, setIsUpdatingModel] = useState(false);
  const [showModelDropdown, setShowModelDropdown] = useState(false);

  // Load LLM models when component mounts
  useEffect(() => {
    const loadLLMModels = async () => {
      try {
        setIsLoadingModels(true);
        const models = await apiClient.getLLMs();
        // Filter only enabled models
        setLlmModels(models.filter((model) => model.enabled));
      } catch (error) {
        console.error("Failed to load LLM models:", error);
        showToast.error("Failed to load available models");
      } finally {
        setIsLoadingModels(false);
      }
    };

    loadLLMModels();
  }, []);

  // Handle model selection
  const handleModelSelect = async (selectedModel: LLMModel) => {
    if (!agent.id) {
      showToast.error("Cannot update model for non-deployed agent");
      return;
    }

    try {
      setIsUpdatingModel(true);
      setShowModelDropdown(false);

      // Update the agent with the new model
      // Ensure autonomous tasks have required fields to avoid validation errors
      const cleanedAutonomous = agent.autonomous
        ? agent.autonomous.map((task: any) => ({
            ...task,
            // Ensure required fields are present
            name: task.name || "Untitled Task",
            prompt: task.prompt || "No prompt specified",
            // Keep optional fields if they exist
            ...(task.description && { description: task.description }),
            ...(task.minutes && { minutes: task.minutes }),
            ...(task.cron && { cron: task.cron }),
            ...(task.enabled !== undefined && { enabled: task.enabled }),
          }))
        : [];

      const updatedAgent = {
        ...agent,
        model: selectedModel.id,
        autonomous: cleanedAutonomous,
      };

      await apiClient.updateAgent(agent.id, updatedAgent);
      showToast.success(`Model updated to ${selectedModel.name}`);

      // Trigger agent refresh
      if (onAgentUpdate) {
        onAgentUpdate();
      }
    } catch (error) {
      console.error("Failed to update model:", error);
      showToast.error("Failed to update model");
    } finally {
      setIsUpdatingModel(false);
    }
  };

  // Get current model info
  const currentModel = llmModels.find((model) => model.id === agent.model);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".model-dropdown-container")) {
        setShowModelDropdown(false);
      }
    };

    if (showModelDropdown) {
      document.addEventListener("mousedown", handleClickOutside);
      return () =>
        document.removeEventListener("mousedown", handleClickOutside);
    }
  }, [showModelDropdown]);
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
            {/* Model Dropdown */}
            <div className="relative model-dropdown-container">
              <button
                onClick={() => setShowModelDropdown(!showModelDropdown)}
                disabled={isLoadingModels || isUpdatingModel}
                className="inline-flex items-center px-3 py-2 rounded-lg text-sm font-medium bg-[var(--color-neon-lime-subtle)] text-[var(--color-neon-lime)] border border-[var(--color-neon-lime-border)] hover:bg-[var(--color-neon-lime-glow)] transition-all duration-200 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUpdatingModel ? (
                  <>
                    <svg
                      className="w-4 h-4 mr-2 animate-spin"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                      />
                    </svg>
                    Updating...
                  </>
                ) : (
                  <>
                    <svg
                      className="w-4 h-4 mr-2"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                      />
                    </svg>
                    Model:{" "}
                    {currentModel ? currentModel.name : agent.model || "None"}
                    <svg
                      className={`w-4 h-4 ml-2 transition-transform duration-200 ${
                        showModelDropdown ? "rotate-180" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                      />
                    </svg>
                  </>
                )}
              </button>

              {/* Dropdown Menu */}
              {showModelDropdown && (
                <div className="absolute top-full left-0 mt-1 w-80 bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-lg shadow-lg z-50 max-h-96 overflow-y-auto">
                  <div className="p-3 border-b border-[var(--color-border-primary)]">
                    <h4 className="text-sm font-semibold text-[var(--color-text-primary)]">
                      Select LLM Model
                    </h4>
                    <p className="text-xs text-[var(--color-text-secondary)] mt-1">
                      Choose a model for your agent
                    </p>
                  </div>

                  {isLoadingModels ? (
                    <div className="p-4 text-center">
                      <div className="inline-flex items-center space-x-2 text-[var(--color-text-secondary)]">
                        <svg
                          className="w-4 h-4 animate-spin"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                          />
                        </svg>
                        <span>Loading models...</span>
                      </div>
                    </div>
                  ) : llmModels.length === 0 ? (
                    <div className="p-4 text-center text-[var(--color-text-secondary)]">
                      No models available
                    </div>
                  ) : (
                    <div className="py-2">
                      {llmModels.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => handleModelSelect(model)}
                          className={`w-full px-4 py-3 text-left hover:bg-[var(--color-bg-tertiary)] transition-colors duration-200 ${
                            model.id === agent.model
                              ? "bg-[var(--color-neon-lime-subtle)] border-l-2 border-[var(--color-neon-lime)]"
                              : ""
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="text-sm font-medium text-[var(--color-text-primary)]">
                                {model.name}
                              </div>
                              <div className="text-xs text-[var(--color-text-secondary)] mt-1">
                                {model.provider_name} • Intelligence:{" "}
                                {model.intelligence}/5 • Speed: {model.speed}/5
                              </div>
                              <div className="flex items-center space-x-3 mt-2">
                                {model.supports_skill_calls && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[var(--color-neon-cyan-subtle)] text-[var(--color-neon-cyan)] border border-[var(--color-neon-cyan-border)]">
                                    Skills
                                  </span>
                                )}
                                {model.supports_image_input && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[var(--color-neon-purple-subtle)] text-[var(--color-neon-purple)] border border-[var(--color-neon-purple-border)]">
                                    Vision
                                  </span>
                                )}
                                {model.has_reasoning && (
                                  <span className="inline-flex items-center px-2 py-0.5 rounded text-xs bg-[var(--color-neon-pink-subtle)] text-[var(--color-neon-pink)] border border-[var(--color-neon-pink-border)]">
                                    Reasoning
                                  </span>
                                )}
                              </div>
                            </div>
                            {model.id === agent.model && (
                              <svg
                                className="w-5 h-5 text-[var(--color-neon-lime)]"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M5 13l4 4L19 7"
                                />
                              </svg>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
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
