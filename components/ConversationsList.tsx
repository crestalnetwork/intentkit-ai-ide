import React, { useState, useEffect } from "react";
import { ChatThread, Agent } from "../lib/utils/apiClient";
import apiClient from "../lib/utils/apiClient";
import logger from "../lib/utils/logger";

interface ConversationsListProps {
  baseUrl: string;
  selectedAgent?: Agent | null;
  selectedThreadId?: string;
  onThreadSelect: (thread: ChatThread) => void;
  onNewChat: () => void;
  onAgentSelect: () => void; // Open agent selector
  refreshKey?: number; // Used to trigger refresh of conversation list
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  baseUrl,
  selectedAgent,
  selectedThreadId,
  onThreadSelect,
  onNewChat,
  onAgentSelect,
  refreshKey,
}) => {
  const [threads, setThreads] = useState<ChatThread[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Get agent display name and ID
  const agentDisplayName =
    selectedAgent?.name || selectedAgent?.id || "Select Agent";
  const selectedAgentId = selectedAgent?.id;

  logger.component("mounted", "ConversationsList", {
    baseUrl,
    selectedAgentId,
    selectedThreadId,
  });

  // Load conversations when agent changes
  useEffect(() => {
    if (selectedAgentId) {
      loadConversations();
    } else {
      setThreads([]);
    }
  }, [selectedAgentId, refreshKey]); // Added refreshKey to trigger refresh

  const loadConversations = async () => {
    if (!selectedAgentId) return;

    logger.info(
      "Loading conversations for agent",
      { agentId: selectedAgentId },
      "ConversationsList.loadConversations"
    );

    setLoading(true);
    setError(null);

    try {
      const chatThreads = await apiClient.getChatThreads(selectedAgentId);
      logger.info(
        "Conversations loaded",
        {
          agentId: selectedAgentId,
          threadCount: chatThreads.length,
        },
        "ConversationsList.loadConversations"
      );

      // Sort by most recent first
      const sortedThreads = chatThreads.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setThreads(sortedThreads);
    } catch (error: any) {
      logger.error(
        "Failed to load conversations",
        {
          agentId: selectedAgentId,
          error: error.message,
        },
        "ConversationsList.loadConversations"
      );

      console.error("Error loading conversations:", error);
      setError("Failed to load conversations");
      setThreads([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return "Just now";
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const truncateSummary = (summary: string, maxLength: number = 50) => {
    if (summary.length <= maxLength) return summary;
    return summary.substring(0, maxLength) + "...";
  };

  return (
    <div className="bg-[var(--color-bg-primary)] border-r border-[var(--color-border-primary)] flex flex-col h-full">
      {/* Agent Selector Section */}
      <div className="p-3 border-b border-[var(--color-border-primary)]">
        <div className="mb-3">
          <h2 className="text-xs font-medium text-[var(--color-text-secondary)] mb-2 uppercase tracking-wide">
            Current Agent
          </h2>
          <button
            onClick={onAgentSelect}
            className="w-full p-3 bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-lg text-left hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-neon-cyan-border)] hover:neon-glow-cyan-subtle transition-all duration-200 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-[var(--color-neon-cyan-subtle)] border border-[var(--color-neon-cyan-border)] rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg
                    className="w-4 h-4 text-[var(--color-neon-cyan)]"
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
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-[var(--color-text-primary)] truncate">
                    {agentDisplayName}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)]">
                    {selectedAgent
                      ? selectedAgent.name && selectedAgent.id
                        ? `ID: ${selectedAgent.id}`
                        : "Click to change agent"
                      : "Click to select an agent"}
                  </div>
                </div>
              </div>
              <svg
                className="w-4 h-4 text-[var(--color-text-tertiary)] flex-shrink-0 ml-2 group-hover:text-[var(--color-neon-cyan)] transition-colors"
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
            </div>
          </button>
        </div>
      </div>

      {/* Conversations Section */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-3 py-2 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-medium text-[var(--color-text-secondary)] uppercase tracking-wide">
              Conversations
            </h2>
            {threads.length > 0 && (
              <span className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)] px-2 py-0.5 rounded-full">
                {threads.length}
              </span>
            )}
          </div>
        </div>

        {/* Conversations List */}
        <div className="flex-1 overflow-y-auto">
          {loading && (
            <div className="p-4 text-center">
              <div className="animate-spin rounded-full h-6 w-6 border-2 border-[var(--color-border-primary)] border-t-[var(--color-neon-cyan)] mx-auto mb-2"></div>
              <p className="text-xs text-[var(--color-text-secondary)]">
                Loading conversations...
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 text-center">
              <p className="text-xs text-[var(--color-error)]">{error}</p>
              <button
                onClick={loadConversations}
                className="mt-2 text-xs text-[var(--color-neon-cyan)] hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && !selectedAgentId && (
            <div className="p-4 text-center">
              <div className="w-12 h-12 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-lg flex items-center justify-center mx-auto mb-3">
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
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-1 font-medium">
                No agent selected
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Choose an agent to see your conversations
              </p>
            </div>
          )}

          {!loading && !error && selectedAgentId && threads.length === 0 && (
            <div className="p-4 text-center">
              <div className="w-12 h-12 bg-[var(--color-neon-cyan-subtle)] border border-[var(--color-neon-cyan-border)] rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-[var(--color-neon-cyan)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                  />
                </svg>
              </div>
              <p className="text-sm text-[var(--color-text-secondary)] mb-1 font-medium">
                No conversations yet
              </p>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Start a new chat to begin
              </p>
            </div>
          )}

          {!loading && !error && threads.length > 0 && (
            <div className="space-y-1 p-3">
              {threads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => onThreadSelect(thread)}
                  className={`w-full p-3 text-left rounded-lg transition-all duration-200 group ${
                    selectedThreadId === thread.id
                      ? "bg-[var(--color-neon-cyan)] text-black neon-glow-cyan"
                      : "bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-neon-cyan-border)] hover:neon-glow-cyan-subtle"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate mb-1">
                        {truncateSummary(
                          thread.summary || "New conversation",
                          40
                        )}
                      </div>
                      <div className="flex items-center space-x-2 text-xs opacity-75">
                        <span className="flex items-center space-x-1">
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
                              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                            />
                          </svg>
                          <span>{thread.rounds}</span>
                        </span>
                        <span>•</span>
                        <span>{formatDate(thread.updated_at)}</span>
                      </div>
                    </div>
                    {selectedThreadId === thread.id && (
                      <div className="ml-2 flex-shrink-0">
                        <div className="w-2 h-2 bg-black rounded-full"></div>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ConversationsList;
