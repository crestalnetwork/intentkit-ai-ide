import React, { useState, useEffect } from "react";
import { showToast } from "../lib/utils/toast";
import apiClient from "../lib/utils/apiClient";

interface JsonEditorPanelProps {
  isVisible: boolean;
  onClose: () => void;
  agent: any;
  onAgentUpdate?: () => void;
  startInEditMode?: boolean;
}

const JsonEditorPanel: React.FC<JsonEditorPanelProps> = ({
  isVisible,
  onClose,
  agent,
  onAgentUpdate,
  startInEditMode = false,
}) => {
  const [showEditMode, setShowEditMode] = useState<boolean>(false);
  const [editedConfig, setEditedConfig] = useState<string>("");
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveResult, setSaveResult] = useState<{
    success: boolean;
    message: string;
  } | null>(null);

  // Initialize config when agent changes
  useEffect(() => {
    if (agent) {
      setEditedConfig(JSON.stringify(agent, null, 2));
    }
  }, [agent]);

  // Start in edit mode if requested
  useEffect(() => {
    if (isVisible && startInEditMode) {
      setShowEditMode(true);
      setSaveResult(null);
    } else if (isVisible && !startInEditMode) {
      setShowEditMode(false);
    }
  }, [isVisible, startInEditMode]);

  if (!isVisible) return null;

  const handleEditClick = () => {
    setEditedConfig(JSON.stringify(agent, null, 2));
    setShowEditMode(true);
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

      // Validate autonomous tasks if they exist
      if (configObj.autonomous && Array.isArray(configObj.autonomous)) {
        const autonomousErrors: string[] = [];
        configObj.autonomous.forEach((task: any, index: number) => {
          if (!task.name) {
            autonomousErrors.push(`Task ${index + 1}: missing "name" field`);
          }
          if (!task.prompt) {
            autonomousErrors.push(`Task ${index + 1}: missing "prompt" field`);
          }
        });

        if (autonomousErrors.length > 0) {
          setSaveResult({
            success: false,
            message: `Autonomous task validation errors: ${autonomousErrors.join(
              "; "
            )}. Each autonomous task requires "name" and "prompt" fields.`,
          });
          setIsSaving(false);
          return;
        }
      }

      // Use API client for consistent authentication
      const response = await apiClient.updateAgent(agent.id!, configObj);

      setSaveResult({
        success: true,
        message: "Agent updated successfully!",
      });

      showToast.success("Agent updated successfully!");

      // Refresh the agent data if global function is available
      if (onAgentUpdate) {
        onAgentUpdate();
      } else if (
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

      setSaveResult({
        success: false,
        message: errorMessage,
      });

      showToast.errorWithSupport(errorMessage);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 min-w-[600px] max-w-[900px] bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-primary)] flex flex-col h-full shadow-lg z-50 transform transition-transform duration-300 ease-in-out">
      {/* Panel */}
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border-primary)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              JSON Configuration Editor
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Edit the raw JSON configuration of your agent. Be careful when
              making changes.
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-neon-lime)] transition-colors hover-neon-glow-lime rounded cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-card)]">
          <div className="flex items-center space-x-3">
            {!showEditMode ? (
              <>
                <button
                  onClick={handleEditClick}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[var(--color-warning)] text-[var(--color-text-on-primary)] rounded-lg hover:bg-[var(--color-neon-pink)] transition-all duration-200 font-medium shadow-lg hover-neon-glow-pink"
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
                      d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                    />
                  </svg>
                  <span>Start Editing</span>
                </button>
                <div className="flex items-center text-xs text-[var(--color-text-secondary)] space-x-1">
                  <svg
                    className="w-3 h-3 text-[var(--color-text-muted)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>
                    Read-only view - Click "Start Editing" to make changes
                  </span>
                </div>
              </>
            ) : (
              <>
                <button
                  onClick={handleFormatJson}
                  className="px-3 py-2 text-sm bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border border-[var(--color-border-secondary)] rounded hover:bg-[var(--color-bg-tertiary)] transition-all duration-200"
                >
                  Format JSON
                </button>
                <button
                  onClick={() => {
                    setShowEditMode(false);
                    setSaveResult(null);
                  }}
                  className="px-3 py-2 text-sm text-[var(--color-text-secondary)] border border-[var(--color-border-secondary)] rounded hover:bg-[var(--color-bg-tertiary)] transition-all duration-200"
                >
                  Cancel
                </button>
                <button
                  onClick={handleSaveConfig}
                  disabled={isSaving}
                  className="inline-flex items-center space-x-2 px-4 py-2 bg-[var(--color-success)] text-[var(--color-text-on-primary)] rounded-lg hover:bg-[var(--color-neon-lime-bright)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 font-medium shadow-lg hover-neon-glow-lime"
                >
                  {isSaving ? (
                    <>
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
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
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
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                      <span>Save Changes</span>
                    </>
                  )}
                </button>
              </>
            )}
          </div>
        </div>

        {/* Save Result */}
        {saveResult && (
          <div className="p-4 border-b border-[var(--color-border-primary)]">
            <div
              className={`p-4 rounded-lg border ${
                saveResult.success
                  ? "bg-[var(--color-neon-lime-subtle)] border-[var(--color-neon-lime-border)] text-[var(--color-neon-lime)]"
                  : "bg-[var(--color-neon-red-subtle)] border-[var(--color-neon-red-border)] text-[var(--color-neon-red)]"
              }`}
            >
              <div className="flex items-start space-x-2">
                <svg
                  className={`w-5 h-5 mt-0.5 ${
                    saveResult.success
                      ? "text-[var(--color-neon-lime)]"
                      : "text-[var(--color-neon-red)]"
                  }`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  {saveResult.success ? (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M5 13l4 4L19 7"
                    />
                  ) : (
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  )}
                </svg>
                <div>
                  <h4 className="font-medium">
                    {saveResult.success ? "Success" : "Error"}
                  </h4>
                  <p className="text-sm mt-1">{saveResult.message}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* JSON Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {showEditMode ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium text-[var(--color-text-primary)]">
                  JSON Editor
                </h3>
                <div className="flex items-center text-xs text-[var(--color-text-secondary)] space-x-1">
                  <svg
                    className="w-3 h-3 text-[var(--color-neon-orange)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                    />
                  </svg>
                  <span>Required: name, purpose, personality, principles</span>
                </div>
              </div>

              <div className="relative">
                <textarea
                  value={editedConfig}
                  onChange={handleConfigChange}
                  className="w-full h-[calc(100vh-400px)] p-4 bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded-lg text-[var(--color-text-primary)] font-mono text-sm resize-none focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-orange-glow)] focus:border-[var(--color-neon-orange-border)]"
                  placeholder="Enter your agent JSON configuration here..."
                  spellCheck={false}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium text-[var(--color-text-primary)]">
                  Current Configuration
                </h3>
                <div className="flex items-center text-xs text-[var(--color-text-secondary)] space-x-1">
                  <svg
                    className="w-3 h-3 text-[var(--color-neon-cyan)]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                    />
                  </svg>
                  <span>Read-only view</span>
                </div>
              </div>

              <div className="bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded-lg overflow-hidden">
                <pre
                  className="text-sm text-[var(--color-text-primary)] font-mono whitespace-pre-wrap break-words"
                  style={{
                    margin: 0,
                    padding: "1rem",
                    background: "var(--color-bg-input)",
                    fontSize: "13px",
                    lineHeight: "1.4",
                    maxHeight: "calc(100vh - 300px)",
                    overflow: "auto",
                  }}
                >
                  <code>{JSON.stringify(agent, null, 2)}</code>
                </pre>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JsonEditorPanel;
