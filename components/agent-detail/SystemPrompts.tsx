import React, { useState, useEffect } from "react";
import { showToast } from "../../lib/utils/toast";
import apiClient from "../../lib/utils/apiClient";
import axios from "axios";

interface SystemPromptsProps {
  agent: any;
}

const SystemPrompts: React.FC<SystemPromptsProps> = ({ agent }) => {
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

  const handleSavePrompts = async () => {
    try {
      setIsPromptsSaving(true);
      setPromptsSaveResult(null);

      // Create updated agent object with new prompts
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
        purpose: editedPrompts.purpose,
        personality: editedPrompts.personality,
        principles: editedPrompts.principles,
        autonomous: cleanedAutonomous,
      };

      // Use the same API call as the JSON editor
      await apiClient.updateAgent(agent.id!, updatedAgent);

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

  return (
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
                  No purpose defined - this helps the agent understand its main
                  goal and role
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
                  No principles defined - these establish the agent's ethical
                  guidelines and boundaries
                </span>
              )}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default SystemPrompts;
