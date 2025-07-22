import React, { useState, useEffect } from "react";
import { ChatThread, Agent } from "../lib/utils/apiClient";
import apiClient from "../lib/utils/apiClient";
import logger from "../lib/utils/logger";
import theme from "../lib/utils/theme";

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
    <div className="bg-[#000000] border-r border-[#30363d] flex flex-col h-full">
      {/* Header */}
      <div className="p-2 border-b border-[#30363d]">
        <div className="flex items-center justify-between mb-2">
          <h2 className="text-sm font-semibold text-[#ffffff]">
            Conversations
          </h2>
        </div>

        {/* Agent Selector */}
        <button
          onClick={onAgentSelect}
          className="w-full p-2 bg-[#161b22] border border-[#30363d] rounded text-left hover:bg-[#21262d] hover:border-[#8b949e] transition-all duration-200"
        >
          <div className="flex items-center justify-between">
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-[#ffffff] truncate">
                {agentDisplayName}
              </div>
              <div className="text-xs text-[#8b949e]">
                {selectedAgent
                  ? selectedAgent.name && selectedAgent.id
                    ? `ID: ${selectedAgent.id.slice(0, 8)}... • Click to change`
                    : "Click to change agent"
                  : "Click to select an agent"}
              </div>
            </div>
            <svg
              className="w-4 h-4 text-[#8b949e] flex-shrink-0 ml-2"
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

      {/* Conversations List */}
      <div className="flex-1 overflow-y-auto">
        {loading && (
          <div className="p-4 text-center">
            <div className="animate-spin rounded-full h-6 w-6 border-2 border-[#21262d] border-t-[#58a6ff] mx-auto mb-2"></div>
            <p className="text-xs text-[#8b949e]">Loading conversations...</p>
          </div>
        )}

        {error && (
          <div className="p-4 text-center">
            <p className="text-xs text-[#f85149]">{error}</p>
            <button
              onClick={loadConversations}
              className="mt-2 text-xs text-[#58a6ff] hover:underline"
            >
              Try again
            </button>
          </div>
        )}

        {!loading && !error && !selectedAgentId && (
          <div className="p-4 text-center">
            <div className="text-3xl mb-2">🤖</div>
            <p className="text-sm text-[#8b949e] mb-2">No agent selected</p>
            <p className="text-xs text-[#6b7280]">
              Choose an agent to see your conversations
            </p>
          </div>
        )}

        {!loading && !error && selectedAgentId && threads.length === 0 && (
          <div className="p-4 text-center">
            <div className="text-3xl mb-2">💬</div>
            <p className="text-sm text-[#8b949e] mb-2">No conversations yet</p>
            <p className="text-xs text-[#6b7280]">Start a new chat to begin</p>
          </div>
        )}

        {!loading && !error && threads.length > 0 && (
          <div className="space-y-1 p-2">
            {threads.map((thread) => (
              <button
                key={thread.id}
                onClick={() => onThreadSelect(thread)}
                className={`w-full p-2 text-left rounded transition-all duration-200 ${
                  selectedThreadId === thread.id
                    ? "bg-[#238636] text-white"
                    : "bg-transparent text-[#c9d1d9] hover:bg-[#161b22]"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate mb-1">
                      {truncateSummary(thread.summary || "New conversation")}
                    </div>
                    <div className="flex items-center space-x-2 text-xs opacity-70">
                      <span>{thread.rounds} messages</span>
                      <span>•</span>
                      <span>{formatDate(thread.updated_at)}</span>
                    </div>
                  </div>
                  {selectedThreadId === thread.id && (
                    <div className="ml-2 flex-shrink-0">
                      <div className="w-2 h-2 bg-white rounded-full"></div>
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ConversationsList;
