import React, { useState, useEffect } from "react";
import { Agent, AgentApiKeyResponse } from "../lib/utils/apiClient";
import apiClient from "../lib/utils/apiClient";
import { showToast } from "../lib/utils/toast";
import theme from "../lib/utils/theme";
import logger from "../lib/utils/logger";

interface AgentApiKeysProps {
  agent: Agent;
}

const AgentApiKeys: React.FC<AgentApiKeysProps> = ({ agent }) => {
  const [apiKeys, setApiKeys] = useState<AgentApiKeyResponse | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [resetting, setResetting] = useState<boolean>(false);
  const [showKeys, setShowKeys] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Load API keys when component mounts or agent changes
  useEffect(() => {
    if (agent.id) {
      loadApiKeys();
    }
  }, [agent.id]);

  const loadApiKeys = async () => {
    if (!agent.id) return;

    setLoading(true);
    setError(null);

    try {
      logger.info(
        "Loading agent API keys",
        { agentId: agent.id },
        "AgentApiKeys.loadApiKeys"
      );

      const keys = await apiClient.getAgentApiKey(agent.id);
      setApiKeys(keys);

      logger.info(
        "Agent API keys loaded successfully",
        {
          agentId: agent.id,
          hasPrivateKey: !!keys.api_key,
          hasPublicKey: !!keys.api_key_public,
        },
        "AgentApiKeys.loadApiKeys"
      );
    } catch (error: any) {
      logger.error(
        "Failed to load agent API keys",
        { agentId: agent.id, error: error.message },
        "AgentApiKeys.loadApiKeys"
      );

      setError(
        error.response?.data?.detail ||
          error.message ||
          "Failed to load API keys"
      );
      showToast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  };

  const resetApiKeys = async () => {
    if (!agent.id) return;

    setResetting(true);
    setError(null);

    try {
      logger.info(
        "Resetting agent API keys",
        { agentId: agent.id },
        "AgentApiKeys.resetApiKeys"
      );

      const newKeys = await apiClient.resetAgentApiKey(agent.id);
      setApiKeys(newKeys);

      logger.info(
        "Agent API keys reset successfully",
        { agentId: agent.id },
        "AgentApiKeys.resetApiKeys"
      );

      showToast.success("API keys reset successfully");
    } catch (error: any) {
      logger.error(
        "Failed to reset agent API keys",
        { agentId: agent.id, error: error.message },
        "AgentApiKeys.resetApiKeys"
      );

      setError(
        error.response?.data?.detail ||
          error.message ||
          "Failed to reset API keys"
      );
      showToast.error("Failed to reset API keys");
    } finally {
      setResetting(false);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast.success(`${label} copied to clipboard!`);

      logger.info(
        "API key copied to clipboard",
        { agentId: agent.id, label },
        "AgentApiKeys.copyToClipboard"
      );
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = text;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showToast.success(`${label} copied to clipboard!`);
    }
  };

  const maskKey = (key: string) => {
    if (key.length <= 8) return key;
    return `${key.slice(0, 4)}${"•".repeat(
      Math.min(12, key.length - 8)
    )}${key.slice(-4)}`;
  };

  if (!agent.id) {
    return null;
  }

  return (
    <div
      id="agent-api-keys"
      className={`bg-[${theme.colors.background.card}] rounded-lg border border-[#1a1a1a] overflow-hidden shadow-lg`}
    >
      <div
        className={`bg-[${theme.colors.background.secondary}] px-4 py-3 border-b border-[#1a1a1a] flex justify-between items-center`}
      >
        <div className="flex items-center space-x-2">
          <div
            className={`w-9 h-9 bg-[${theme.colors.neon.cyan.subtle}] border border-[${theme.colors.neon.cyan.border}] rounded-lg flex items-center justify-center flex-shrink-0`}
          >
            <svg
              className={`w-5 h-5 text-[${theme.colors.neon.cyan.main}]`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"
              />
            </svg>
          </div>
          <div>
            <h4
              className={`text-sm font-medium text-[${theme.colors.text.primary}]`}
            >
              Agent API Keys
            </h4>
            <p className={`text-xs text-[${theme.colors.text.tertiary}]`}>
              Manage API access for your agent
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          {!loading && !error && (
            <button
              onClick={() => setShowKeys(!showKeys)}
              className={`text-xs px-3 py-1.5 bg-[${theme.colors.background.tertiary}] text-[${theme.colors.primary.main}] border border-[${theme.colors.primary.border}] rounded-lg hover:bg-[${theme.colors.primary.light}] hover:border-[${theme.colors.primary.borderHover}] transition-all duration-200 flex items-center space-x-1 cursor-pointer`}
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
                  d={
                    showKeys
                      ? "M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L12 12m-2.122-2.122L7.343 7.343M12 12l2.122 2.122m0 0l2.121 2.121M12 12V9m0 3v3"
                      : "M15 12a3 3 0 11-6 0 3 3 0 016 0z M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                  }
                />
              </svg>
              <span>{showKeys ? "Hide" : "Show"}</span>
            </button>
          )}

          <button
            onClick={loadApiKeys}
            disabled={loading}
            className={`text-xs px-3 py-1.5 bg-[${theme.colors.background.tertiary}] text-[${theme.colors.secondary.main}] border border-[${theme.colors.secondary.border}] rounded-lg hover:bg-[${theme.colors.secondary.light}] hover:border-[${theme.colors.secondary.borderHover}] transition-all duration-200 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
          >
            <svg
              className={`w-3 h-3 ${loading ? "animate-spin" : ""}`}
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
            <span>{loading ? "Loading..." : "Refresh"}</span>
          </button>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {loading && (
          <div className="text-center py-6">
            <div
              className={`inline-flex items-center space-x-2 text-[${theme.colors.text.tertiary}]`}
            >
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
              <span className="text-sm">Loading API keys...</span>
            </div>
          </div>
        )}

        {error && (
          <div
            className={`bg-[${theme.colors.error.light}] border border-[${theme.colors.error.border}] rounded-lg p-3`}
          >
            <div className="flex items-center space-x-2">
              <svg
                className={`w-4 h-4 text-[${theme.colors.error.main}] flex-shrink-0`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <p
                className={`text-sm text-[${theme.colors.error.main}] font-medium`}
              >
                {error}
              </p>
            </div>
          </div>
        )}

        {apiKeys && !loading && !error && (
          <div className="space-y-3">
            {/* Private API Key */}
            <div
              className={`bg-[${theme.colors.background.input}] border border-[#1a1a1a] rounded-lg p-3`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm font-medium text-[${theme.colors.text.primary}]`}
                  >
                    Private API Key
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 bg-[${theme.colors.error.light}] text-[${theme.colors.error.main}] rounded-full border border-[${theme.colors.error.border}]`}
                  >
                    Secret
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(apiKeys.api_key, "Private API key")
                  }
                  className={`text-xs px-3 py-1.5 bg-[${theme.colors.neon.cyan.subtle}] text-[${theme.colors.neon.cyan.main}] border border-[${theme.colors.neon.cyan.border}] rounded-lg hover:bg-[${theme.colors.neon.cyan.glow}] hover:text-[${theme.colors.neon.cyan.bright}] hover:border-[${theme.colors.neon.cyan.main}] hover:shadow-[${theme.shadows.neonCyan}] transition-all duration-200 flex items-center space-x-1 font-medium cursor-pointer`}
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Copy</span>
                </button>
              </div>
              <div
                className={`font-mono text-xs text-[${theme.colors.text.secondary}] bg-[${theme.colors.background.tertiary}] px-3 py-2 rounded border border-[#1a1a1a] break-all`}
              >
                {showKeys ? apiKeys.api_key : maskKey(apiKeys.api_key)}
              </div>
              <p
                className={`text-xs text-[${theme.colors.text.tertiary}] mt-2`}
              >
                Can access all skills (public and owner-only). Keep this secret!
              </p>
            </div>

            {/* Public API Key */}
            <div
              className={`bg-[${theme.colors.background.input}] border border-[#1a1a1a] rounded-lg p-3 shadow-sm`}
            >
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm font-medium text-[${theme.colors.text.primary}]`}
                  >
                    Public API Key
                  </span>
                  <span
                    className={`text-xs px-2 py-0.5 bg-[${theme.colors.success.light}] text-[${theme.colors.success.main}] rounded-full border border-[${theme.colors.success.border}]`}
                  >
                    Public
                  </span>
                </div>
                <button
                  onClick={() =>
                    copyToClipboard(apiKeys.api_key_public, "Public API key")
                  }
                  className={`text-xs px-3 py-1.5 bg-[${theme.colors.neon.lime.subtle}] text-[${theme.colors.neon.lime.main}] border border-[${theme.colors.neon.lime.border}] rounded-lg hover:bg-[${theme.colors.neon.lime.glow}] hover:text-[${theme.colors.neon.lime.bright}] hover:border-[${theme.colors.neon.lime.main}] hover:shadow-[${theme.shadows.neonLime}] transition-all duration-200 flex items-center space-x-1 font-medium cursor-pointer`}
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
                      d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                    />
                  </svg>
                  <span>Copy</span>
                </button>
              </div>
              <div
                className={`font-mono text-xs text-[${theme.colors.text.secondary}] bg-[${theme.colors.background.tertiary}] px-3 py-2 rounded border border-[#1a1a1a] break-all`}
              >
                {showKeys
                  ? apiKeys.api_key_public
                  : maskKey(apiKeys.api_key_public)}
              </div>
              <p
                className={`text-xs text-[${theme.colors.text.tertiary}] mt-2`}
              >
                Can only access public skills. Safe to share with trusted
                parties.
              </p>
            </div>

            {/* API Information */}
            <div
              className={`bg-[${theme.colors.background.input}] border border-[#1a1a1a] rounded-lg p-3 shadow-sm`}
            >
              <div className="flex items-center space-x-2 mb-3">
                <span
                  className={`text-sm font-medium text-[${theme.colors.text.primary}]`}
                >
                  API Information
                </span>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs text-[${theme.colors.text.tertiary}]`}
                  >
                    Base URL:
                  </span>
                  <button
                    onClick={() =>
                      copyToClipboard(apiKeys.base_url, "Base URL")
                    }
                    className={`text-xs text-[${theme.colors.text.secondary}] hover:text-[${theme.colors.neon.cyan.main}] font-mono bg-[${theme.colors.background.tertiary}] px-2 py-1 rounded border border-[#1a1a1a] hover:border-[${theme.colors.neon.cyan.border}] hover:bg-[${theme.colors.neon.cyan.subtle}] transition-all duration-200 cursor-pointer max-w-xs truncate`}
                    title="Click to copy base URL"
                  >
                    {apiKeys.base_url}
                  </button>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs text-[${theme.colors.text.tertiary}]`}
                  >
                    API Documentation:
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        copyToClipboard(
                          apiKeys.api_doc,
                          "API documentation URL"
                        )
                      }
                      className={`text-xs px-2 py-1 bg-[${theme.colors.background.tertiary}] text-[${theme.colors.text.secondary}] border border-[#1a1a1a] rounded hover:bg-[${theme.colors.neon.cyan.subtle}] hover:text-[${theme.colors.neon.cyan.main}] hover:border-[${theme.colors.neon.cyan.border}] transition-all duration-200 cursor-pointer`}
                    >
                      Copy URL
                    </button>
                    <a
                      href={apiKeys.api_doc}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs px-2 py-1 bg-[${theme.colors.primary.light}] text-[${theme.colors.primary.main}] border border-[${theme.colors.primary.border}] rounded hover:bg-[${theme.colors.primary.glow}] hover:border-[${theme.colors.primary.borderHover}] transition-all duration-200 cursor-pointer`}
                    >
                      View Docs
                    </a>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <span
                    className={`text-xs text-[${theme.colors.text.tertiary}]`}
                  >
                    OpenAPI JSON:
                  </span>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() =>
                        copyToClipboard(apiKeys.doc_for_ai, "OpenAPI JSON URL")
                      }
                      className={`text-xs px-2 py-1 bg-[${theme.colors.background.tertiary}] text-[${theme.colors.text.secondary}] border border-[#1a1a1a] rounded hover:bg-[${theme.colors.neon.cyan.subtle}] hover:text-[${theme.colors.neon.cyan.main}] hover:border-[${theme.colors.neon.cyan.border}] transition-all duration-200 cursor-pointer`}
                    >
                      Copy URL
                    </button>
                    <a
                      href={apiKeys.doc_for_ai}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={`text-xs px-2 py-1 bg-[${theme.colors.secondary.light}] text-[${theme.colors.secondary.main}] border border-[${theme.colors.secondary.border}] rounded hover:bg-[${theme.colors.secondary.glow}] hover:border-[${theme.colors.secondary.borderHover}] transition-all duration-200 cursor-pointer`}
                    >
                      View JSON
                    </a>
                  </div>
                </div>
              </div>
            </div>

            {/* Reset Keys Section */}
            <div
              className={`bg-[${theme.colors.error.light}] border border-[${theme.colors.error.border}] rounded-lg p-3 shadow-sm`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <svg
                    className={`w-4 h-4 text-[${theme.colors.error.main}]`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                    />
                  </svg>
                  <div>
                    <span
                      className={`text-sm font-medium text-[${theme.colors.error.main}]`}
                    >
                      Reset API Keys
                    </span>
                    <p
                      className={`text-xs text-[${theme.colors.text.tertiary}] mt-1`}
                    >
                      This will revoke existing keys and generate new ones
                    </p>
                  </div>
                </div>
                <button
                  onClick={resetApiKeys}
                  disabled={resetting}
                  className={`text-xs px-3 py-1.5 bg-[${theme.colors.error.main}] text-white border border-[${theme.colors.error.main}] rounded-lg hover:bg-[${theme.colors.error.main}]/80 transition-all duration-200 flex items-center space-x-1 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer`}
                >
                  <svg
                    className={`w-3 h-3 ${resetting ? "animate-spin" : ""}`}
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
                  <span>{resetting ? "Resetting..." : "Reset Keys"}</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AgentApiKeys;
