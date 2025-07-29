import React, { useState, useEffect } from "react";
import { ChatThread, Agent } from "../lib/utils/apiClient";
import apiClient from "../lib/utils/apiClient";
import logger from "../lib/utils/logger";
import { useAuth } from "@/context/AuthProvider";

interface ConversationsListProps {
  baseUrl: string;
  selectedAgent?: Agent | null;
  selectedThreadId?: string;
  onThreadSelect: (thread: ChatThread) => void;
  onAgentSelect: (agent: Agent) => void; // Changed to pass agent directly
  refreshKey?: number; // Used to trigger refresh of conversation list
}

interface ThreadWithAgent extends ChatThread {
  agent?: Agent; // Add agent info to thread
}

const ConversationsList: React.FC<ConversationsListProps> = ({
  baseUrl,
  selectedAgent,
  selectedThreadId,
  onThreadSelect,
  onAgentSelect,
  refreshKey,
}) => {
  const [allThreads, setAllThreads] = useState<ThreadWithAgent[]>([]);
  const [allAgents, setAllAgents] = useState<Agent[]>([]);
  const [filteredThreads, setFilteredThreads] = useState<ThreadWithAgent[]>([]);
  const [selectedFilterAgent, setSelectedFilterAgent] = useState<Agent | null>(
    null
  );
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [showAgentDropdown, setShowAgentDropdown] = useState<boolean>(false);
  const { isAuthenticated } = useAuth();

  logger.component("mounted", "ConversationsList", {
    baseUrl,
    selectedAgentId: selectedAgent?.id,
    selectedThreadId,
    isAuthenticated,
  });

  // Load all conversations and agents when component mounts or refreshKey changes
  useEffect(() => {
    if (isAuthenticated) {
      loadAllConversationsAndAgents();
    } else {
      setAllThreads([]);
      setAllAgents([]);
      setFilteredThreads([]);
    }
  }, [isAuthenticated, refreshKey]);

  // Filter threads when agent filter changes
  useEffect(() => {
    if (selectedFilterAgent) {
      const filtered = allThreads.filter(
        (thread) => thread.agent_id === selectedFilterAgent.id
      );
      setFilteredThreads(filtered);
    } else {
      setFilteredThreads(allThreads);
    }
  }, [allThreads, selectedFilterAgent]);

  const loadAllConversationsAndAgents = async () => {
    logger.info(
      "Loading all conversations and agents",
      {},
      "ConversationsList.loadAllConversationsAndAgents"
    );

    setLoading(true);
    setError(null);

    try {
      // First, load all user agents
      const agentsResponse = await apiClient.getUserAgents({ limit: 100 });
      const agents = agentsResponse.data;
      setAllAgents(agents);

      logger.info(
        "Agents loaded",
        { agentCount: agents.length },
        "ConversationsList.loadAllConversationsAndAgents"
      );

      // Then load conversations for each agent
      const allThreadsPromises = agents.map(async (agent) => {
        try {
          const threads = await apiClient.getChatThreads(agent.id!);
          return threads.map((thread) => ({
            ...thread,
            agent: agent, // Add agent info to each thread
          }));
        } catch (error) {
          logger.warn(
            "Failed to load conversations for agent",
            { agentId: agent.id, error: (error as any).message },
            "ConversationsList.loadAllConversationsAndAgents"
          );
          return [];
        }
      });

      const allThreadsArrays = await Promise.all(allThreadsPromises);
      const allThreadsFlat = allThreadsArrays.flat();

      // Sort all threads by most recent first
      const sortedThreads = allThreadsFlat.sort(
        (a, b) =>
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
      );

      setAllThreads(sortedThreads);

      logger.info(
        "All conversations loaded",
        {
          agentCount: agents.length,
          totalThreads: sortedThreads.length,
        },
        "ConversationsList.loadAllConversationsAndAgents"
      );
    } catch (error: any) {
      logger.error(
        "Failed to load conversations and agents",
        { error: error.message },
        "ConversationsList.loadAllConversationsAndAgents"
      );

      console.error("Error loading conversations and agents:", error);
      setError("Failed to load conversations");
      setAllThreads([]);
      setAllAgents([]);
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

  const truncateSummary = (summary: string, maxLength: number = 45) => {
    if (summary.length <= maxLength) return summary;
    return summary.substring(0, maxLength) + "...";
  };

  const handleAgentFilterSelect = (agent: Agent | null) => {
    setSelectedFilterAgent(agent);
    setShowAgentDropdown(false);
    if (agent) {
      onAgentSelect(agent);
    }
  };

  const handleThreadSelectWrapper = (thread: ThreadWithAgent) => {
    // If the thread's agent is different from currently selected, switch agent first
    if (
      thread.agent &&
      (!selectedAgent || thread.agent.id !== selectedAgent.id)
    ) {
      onAgentSelect(thread.agent);
    }
    onThreadSelect(thread);
  };

  return (
    <div className="bg-[var(--color-bg-primary)] border-r border-[var(--color-border-primary)] flex flex-col h-full">
      {/* Header with Agent Filter */}
      <div className="p-4 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
        {/* Agent Filter Dropdown */}
        <div className="relative">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Active Agent
            </h2>
            <div className="flex items-center space-x-1">
              <div className="w-2 h-2 rounded-full bg-[var(--color-neon-lime)] animate-pulse"></div>
              <span className="text-xs text-[var(--color-text-tertiary)]">
                {allAgents.length} total
              </span>
            </div>
          </div>
          <button
            onClick={() => setShowAgentDropdown(!showAgentDropdown)}
            className="w-full p-3 bg-[var(--color-bg-card)] border-2 border-[var(--color-border-primary)] rounded-xl text-left hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-neon-lime-border)] hover:shadow-lg hover:shadow-[var(--color-neon-lime-glow)] transition-all duration-300 group"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3 flex-1 min-w-0">
                <div className="w-8 h-8 bg-gradient-to-br from-[var(--color-neon-lime-subtle)] to-[var(--color-neon-cyan-subtle)] border-2 border-[var(--color-neon-lime-border)] rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform duration-200">
                  <svg
                    className="w-4 h-4 text-[var(--color-neon-lime)]"
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
                  <div className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                    {selectedFilterAgent
                      ? selectedFilterAgent.name
                      : "All Agents"}
                  </div>
                  <div className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                    {selectedFilterAgent
                      ? `${
                          allThreads.filter(
                            (t) => t.agent_id === selectedFilterAgent.id
                          ).length
                        } conversations`
                      : `${allThreads.length} total conversations`}
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-[var(--color-bg-tertiary)] rounded-full flex items-center justify-center">
                  <svg
                    className={`w-3 h-3 text-[var(--color-text-tertiary)] transition-transform duration-300 ${
                      showAgentDropdown ? "rotate-180" : ""
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
                </div>
              </div>
            </div>
          </button>

          {/* Enhanced Dropdown Menu */}
          {showAgentDropdown && (
            <div className="absolute top-full left-0 right-0 mt-2 bg-[var(--color-bg-secondary)] border-2 border-[var(--color-border-primary)] rounded-xl shadow-2xl z-50 max-h-64 overflow-hidden backdrop-blur-sm">
              <div className="p-2">
                {/* All Agents Option */}
                <button
                  onClick={() => handleAgentFilterSelect(null)}
                  className={`w-full p-3 text-left rounded-lg transition-all duration-200 group ${
                    !selectedFilterAgent
                      ? "bg-gradient-to-r from-[var(--color-neon-lime-subtle)] to-[var(--color-neon-cyan-subtle)] text-[var(--color-text-primary)] shadow-lg border-2 border-[var(--color-neon-lime-border)]"
                      : "hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border-2 border-transparent hover:border-[var(--color-border-secondary)]"
                  }`}
                >
                  <div className="flex items-center space-x-3">
                    <div className="w-6 h-6 bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[var(--color-bg-card)] border border-[var(--color-border-secondary)] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
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
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold text-sm">All Agents</div>
                      <div className="text-xs opacity-70">
                        {allThreads.length} total conversations
                      </div>
                    </div>
                    {!selectedFilterAgent && (
                      <div className="w-2 h-2 bg-[var(--color-neon-lime)] rounded-full animate-pulse"></div>
                    )}
                  </div>
                </button>

                {/* Individual Agents */}
                <div className="max-h-48 overflow-y-auto custom-scrollbar mt-2">
                  {allAgents.map((agent) => {
                    const threadCount = allThreads.filter(
                      (t) => t.agent_id === agent.id
                    ).length;
                    const isSelected = selectedFilterAgent?.id === agent.id;

                    return (
                      <button
                        key={agent.id}
                        onClick={() => handleAgentFilterSelect(agent)}
                        className={`w-full p-3 text-left rounded-lg transition-all duration-200 mb-1 group ${
                          isSelected
                            ? "bg-gradient-to-r from-[var(--color-neon-cyan-subtle)] to-[var(--color-neon-lime-subtle)] text-[var(--color-text-primary)] shadow-lg border-2 border-[var(--color-neon-cyan-border)]"
                            : "hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] border-2 border-transparent hover:border-[var(--color-border-secondary)]"
                        }`}
                      >
                        <div className="flex items-center space-x-3">
                          <div className="w-6 h-6 bg-gradient-to-br from-[var(--color-neon-cyan-subtle)] to-[var(--color-neon-purple-subtle)] border border-[var(--color-neon-cyan-border)] rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
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
                                d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="font-semibold text-sm truncate">
                              {agent.name}
                            </div>
                            <div className="text-xs opacity-70">
                              {threadCount} conversation
                              {threadCount !== 1 ? "s" : ""}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-2 h-2 bg-[var(--color-neon-cyan)] rounded-full animate-pulse"></div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Enhanced Conversations Section */}
      <div className="flex flex-col flex-1 min-h-0">
        <div className="px-4 py-3 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-semibold text-[var(--color-text-secondary)] uppercase tracking-wider">
              Recent Conversations
            </h2>
            {filteredThreads.length > 0 && (
              <div className="flex items-center space-x-2">
                <div className="w-1.5 h-1.5 bg-[var(--color-neon-cyan)] rounded-full animate-pulse"></div>
                <span className="text-xs text-[var(--color-text-tertiary)] bg-[var(--color-bg-tertiary)] px-2 py-1 rounded-full border border-[var(--color-border-secondary)]">
                  {filteredThreads.length}
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Simplified Conversations List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading && (
            <div className="p-6 text-center">
              <div className="relative mx-auto mb-4 w-8 h-8">
                <div className="absolute inset-0 rounded-full border-2 border-[var(--color-border-primary)]"></div>
                <div className="absolute inset-0 rounded-full border-2 border-t-[var(--color-neon-lime)] animate-spin"></div>
              </div>
              <p className="text-xs text-[var(--color-text-secondary)] font-medium">
                Loading conversations...
              </p>
            </div>
          )}

          {error && (
            <div className="p-6 text-center">
              <div className="w-12 h-12 bg-[var(--color-error-light)] border border-[var(--color-error-border)] rounded-xl flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-6 h-6 text-[var(--color-error)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <p className="text-sm text-[var(--color-error)] font-medium mb-2">
                {error}
              </p>
              <button
                onClick={loadAllConversationsAndAgents}
                className="text-xs text-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan-bright)] hover:underline transition-colors font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && !isAuthenticated && (
            <div className="p-6 text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[var(--color-bg-card)] border-2 border-[var(--color-border-primary)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[var(--color-text-tertiary)]"
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
              </div>
              <h3 className="text-sm text-[var(--color-text-secondary)] mb-2 font-semibold">
                Please sign in
              </h3>
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Sign in to view your conversations
              </p>
            </div>
          )}

          {!loading &&
            !error &&
            isAuthenticated &&
            filteredThreads.length === 0 && (
              <div className="p-6 text-center">
                <div className="w-16 h-16 bg-gradient-to-br from-[var(--color-neon-lime-subtle)] to-[var(--color-neon-cyan-subtle)] border-2 border-[var(--color-neon-lime-border)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <svg
                    className="w-8 h-8 text-[var(--color-neon-lime)]"
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
                <h3 className="text-sm text-[var(--color-text-secondary)] mb-2 font-semibold">
                  {selectedFilterAgent
                    ? "No conversations with this agent"
                    : "No conversations yet"}
                </h3>
                <p className="text-xs text-[var(--color-text-tertiary)]">
                  {allAgents.length === 0
                    ? "Create your first agent to get started"
                    : "Start a new chat to begin"}
                </p>
              </div>
            )}

          {!loading && !error && filteredThreads.length > 0 && (
            <div className="space-y-1 p-2">
              {filteredThreads.map((thread) => (
                <button
                  key={thread.id}
                  onClick={() => handleThreadSelectWrapper(thread)}
                  className={`w-full p-3 text-left rounded-lg transition-all duration-200 group ${
                    selectedThreadId === thread.id
                      ? "bg-[var(--color-neon-lime)] text-black shadow-md"
                      : "bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-neon-lime-border)]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="text-sm font-medium truncate mb-1 leading-tight">
                        {truncateSummary(
                          thread.summary || "New conversation",
                          45
                        )}
                      </div>

                      {/* Simple Agent name when showing all agents */}
                      {!selectedFilterAgent && thread.agent && (
                        <div className="flex items-center space-x-1 mb-1 text-xs opacity-70">
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
                              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                            />
                          </svg>
                          <span className="text-xs font-medium opacity-80">
                            {thread.agent.name}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-2 text-xs opacity-60">
                        <div className="flex items-center space-x-1">
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
                          <span className="font-medium">
                            {thread.rounds} msgs
                          </span>
                        </div>
                        <span>•</span>
                        <span className="font-medium">
                          {formatDate(thread.updated_at)}
                        </span>
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

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--color-bg-tertiary);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-border-secondary);
          border-radius: 3px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-neon-lime-border);
        }
      `}</style>
    </div>
  );
};

export default ConversationsList;
