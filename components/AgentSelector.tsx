import React, { useState, useEffect, useRef } from "react";
import { Agent } from "../lib/utils/apiClient";
import apiClient from "../lib/utils/apiClient";
import logger from "../lib/utils/logger";
import { showToast } from "../lib/utils/toast";

interface AgentSelectorProps {
  baseUrl: string;
  selectedAgentId?: string;
  onAgentSelect: (agent: Agent) => void;
  onClose: () => void;
  isOpen: boolean;
}

const AgentSelector: React.FC<AgentSelectorProps> = ({
  baseUrl,
  selectedAgentId,
  onAgentSelect,
  onClose,
  isOpen,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState<string>("");
  const modalRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  logger.component("mounted", "AgentSelector", {
    baseUrl,
    selectedAgentId,
    isOpen,
  });

  // Load agents when modal opens
  useEffect(() => {
    if (isOpen) {
      loadAgents();
      // Focus search input when modal opens
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    }
  }, [isOpen]);

  // Handle escape key and outside clicks
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen, onClose]);

  const loadAgents = async () => {
    logger.info("Loading user agents", {}, "AgentSelector.loadAgents");

    setLoading(true);
    setError(null);

    try {
      const response = await apiClient.getUserAgents({ limit: 100 });
      logger.info(
        "User agents loaded",
        { agentCount: response.data.length },
        "AgentSelector.loadAgents"
      );

      setAgents(response.data);
    } catch (error: any) {
      logger.error(
        "Failed to load user agents",
        { error: error.message },
        "AgentSelector.loadAgents"
      );

      console.error("Error loading user agents:", error);
      setError("Failed to load your agents");
      setAgents([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (agent.description &&
        agent.description.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleAgentSelect = async (agent: Agent) => {
    logger.info(
      "Agent selected, fetching complete data",
      { agentId: agent.id, agentName: agent.name },
      "AgentSelector.handleAgentSelect"
    );

    try {
      // Fetch complete agent data using the single agent endpoint
      const completeAgent = await apiClient.getUserAgent(agent.id!);
      logger.info(
        "Complete agent data loaded",
        {
          agentId: completeAgent.id,
          hasAutonomous: !!completeAgent.autonomous,
        },
        "AgentSelector.handleAgentSelect"
      );
      onAgentSelect(completeAgent);
      onClose();
    } catch (error: any) {
      logger.error(
        "Failed to load complete agent data",
        { agentId: agent.id, error: error.message },
        "AgentSelector.handleAgentSelect"
      );
      // Fallback to the summary data if detailed fetch fails
      onAgentSelect(agent);
      onClose();
      showToast.errorWithSupport("Could not load complete agent data");
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-300">
      <div
        ref={modalRef}
        className="bg-gradient-to-br from-[var(--color-bg-secondary)] to-[var(--color-bg-primary)] border-2 border-[var(--color-border-primary)] rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl shadow-black/50 animate-in slide-in-from-bottom-4 duration-300"
      >
        {/* Enhanced Header */}
        <div className="p-6 border-b-2 border-[var(--color-border-primary)] bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] rounded-t-2xl">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-[var(--color-neon-lime-subtle)] to-[var(--color-neon-cyan-subtle)] border-2 border-[var(--color-neon-lime-border)] rounded-xl flex items-center justify-center">
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
                    d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                  />
                </svg>
              </div>
              <div>
                <h2 className="text-xl font-bold text-[var(--color-text-primary)]">
                  Select Your Agent
                </h2>
                <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
                  Choose an agent to start chatting
                </p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-neon-pink)] hover:bg-[var(--color-neon-pink-subtle)] transition-all duration-200 hover-neon-glow-pink rounded-lg"
            >
              <svg
                className="w-6 h-6"
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

          {/* Enhanced Search */}
          <div className="relative">
            <div className="absolute left-4 top-1/2 transform -translate-y-1/2 z-10">
              <svg
                className="w-5 h-5 text-[var(--color-text-muted)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your agents..."
              className="w-full pl-12 pr-4 py-3 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-primary)] rounded-xl text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] focus:border-[var(--color-neon-lime-border)] placeholder:text-[var(--color-text-muted)] transition-all duration-300 hover:border-[var(--color-border-secondary)]"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm("")}
                className="absolute right-4 top-1/2 transform -translate-y-1/2 text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)] transition-colors"
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
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* Enhanced Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar">
          {loading && (
            <div className="text-center py-12">
              <div className="relative mx-auto mb-6 w-12 h-12">
                <div className="absolute inset-0 rounded-full border-3 border-[var(--color-border-primary)]"></div>
                <div className="absolute inset-0 rounded-full border-3 border-t-[var(--color-neon-lime)] animate-spin"></div>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                Loading your agents
              </h3>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Please wait while we fetch your agents...
              </p>
            </div>
          )}

          {error && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-[var(--color-error-light)] border-2 border-[var(--color-error-border)] rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-[var(--color-error)]"
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
              <h3 className="text-lg font-semibold text-[var(--color-error)] mb-2">
                {error}
              </h3>
              <button
                onClick={loadAgents}
                className="text-sm text-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan-bright)] hover:underline transition-colors font-medium"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filteredAgents.length === 0 && (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-gradient-to-br from-[var(--color-bg-tertiary)] to-[var(--color-bg-card)] border-2 border-[var(--color-border-primary)] rounded-3xl flex items-center justify-center mx-auto mb-6">
                <svg
                  className="w-10 h-10 text-[var(--color-text-tertiary)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                  />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-secondary)] mb-2">
                {searchTerm
                  ? "No agents found"
                  : "You haven't created any agents yet"}
              </h3>
              <p className="text-sm text-[var(--color-text-tertiary)] mb-4 max-w-md mx-auto">
                {searchTerm
                  ? "Try adjusting your search terms or check spelling"
                  : "Create your first agent to get started with IntentKit"}
              </p>
              {!searchTerm && (
                <button
                  onClick={onClose}
                  className="inline-flex items-center space-x-2 px-6 py-3 bg-gradient-to-r from-[var(--color-neon-lime)] to-[var(--color-neon-cyan)] text-black rounded-xl hover:from-[var(--color-neon-lime-bright)] hover:to-[var(--color-neon-cyan-bright)] transition-all duration-300 font-semibold shadow-lg hover:shadow-xl hover:shadow-[var(--color-neon-lime-glow)] transform hover:scale-105"
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
                      d="M12 4v16m8-8H4"
                    />
                  </svg>
                  <span>Create Your First Agent</span>
                </button>
              )}
            </div>
          )}

          {!loading && !error && filteredAgents.length > 0 && (
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredAgents.map((agent) => {
                  const isSelected = selectedAgentId === agent.id;
                  return (
                    <button
                      key={agent.id}
                      onClick={() => handleAgentSelect(agent)}
                      className={`group p-6 text-left rounded-2xl transition-all duration-300 relative overflow-hidden ${
                        isSelected
                          ? "bg-gradient-to-br from-[var(--color-neon-lime-subtle)] to-[var(--color-neon-cyan-subtle)] border-2 border-[var(--color-neon-lime-border)] shadow-lg shadow-[var(--color-neon-lime-glow)] scale-[1.02]"
                          : "bg-[var(--color-bg-card)] border-2 border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-neon-lime-border)] hover:shadow-lg hover:shadow-[var(--color-neon-lime-glow)] hover:scale-[1.01]"
                      }`}
                    >
                      <div className="relative z-10">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex items-center space-x-3">
                            <div className="w-12 h-12 bg-gradient-to-br from-[var(--color-neon-cyan-subtle)] to-[var(--color-neon-purple-subtle)] border-2 border-[var(--color-neon-cyan-border)] rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-200">
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
                                  d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                                />
                              </svg>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h3 className="font-bold text-lg truncate text-[var(--color-text-primary)] mb-1">
                                {agent.name}
                              </h3>
                              {isSelected && (
                                <div className="flex items-center space-x-1">
                                  <div className="w-2 h-2 bg-[var(--color-neon-lime)] rounded-full animate-pulse"></div>
                                  <span className="text-xs font-semibold text-[var(--color-neon-lime)]">
                                    SELECTED
                                  </span>
                                </div>
                              )}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="flex-shrink-0">
                              <svg
                                className="w-6 h-6 text-[var(--color-neon-lime)]"
                                fill="currentColor"
                                viewBox="0 0 20 20"
                              >
                                <path
                                  fillRule="evenodd"
                                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                                  clipRule="evenodd"
                                />
                              </svg>
                            </div>
                          )}
                        </div>

                        {agent.purpose && (
                          <p className="text-sm text-[var(--color-text-secondary)] mb-4 line-clamp-2 leading-relaxed">
                            {agent.purpose}
                          </p>
                        )}

                        <div className="flex items-center justify-between">
                          <div className="flex flex-wrap gap-2">
                            {agent.model && (
                              <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-[var(--color-bg-secondary)] text-[var(--color-text-tertiary)] rounded-full border border-[var(--color-border-secondary)]">
                                {agent.model}
                              </span>
                            )}
                            {agent.skills &&
                              Object.keys(agent.skills).length > 0 && (
                                <span className="inline-flex items-center px-3 py-1 text-xs font-medium bg-[var(--color-neon-cyan-subtle)] text-[var(--color-neon-cyan)] rounded-full border border-[var(--color-neon-cyan-border)]">
                                  {Object.keys(agent.skills).length} skills
                                </span>
                              )}
                          </div>
                          <div className="flex items-center space-x-2 text-xs text-[var(--color-text-tertiary)]">
                            {agent.created_at && (
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
                                    d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                                  />
                                </svg>
                                <span>
                                  {new Date(
                                    agent.created_at
                                  ).toLocaleDateString()}
                                </span>
                              </span>
                            )}
                          </div>
                        </div>

                        <div className="mt-4 pt-4 border-t border-[var(--color-border-secondary)]">
                          <div className="flex items-center justify-between">
                            <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
                              Ready to chat
                            </span>
                            <div className="flex items-center space-x-2">
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
                                  d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
                                />
                              </svg>
                              <span className="text-sm font-semibold text-[var(--color-neon-lime)] group-hover:text-[var(--color-neon-cyan)] transition-colors">
                                Start Chat →
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Gradient overlay for selected state */}
                      {isSelected && (
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[var(--color-neon-lime)]/5 to-transparent"></div>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Enhanced Footer */}
        <div className="p-6 border-t-2 border-[var(--color-border-primary)] bg-gradient-to-r from-[var(--color-bg-secondary)] to-[var(--color-bg-tertiary)] rounded-b-2xl">
          <div className="flex items-center justify-between">
            <p className="text-xs text-[var(--color-text-tertiary)] flex items-center space-x-2">
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
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                Select an agent to start chatting • Press Esc to close
              </span>
            </p>
            {filteredAgents.length > 0 && (
              <div className="flex items-center space-x-2 text-xs text-[var(--color-text-tertiary)]">
                <div className="w-1.5 h-1.5 bg-[var(--color-neon-lime)] rounded-full animate-pulse"></div>
                <span>
                  {filteredAgents.length} agent
                  {filteredAgents.length !== 1 ? "s" : ""} available
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Custom Scrollbar Styles */}
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: var(--color-bg-tertiary);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: var(--color-border-secondary);
          border-radius: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: var(--color-neon-lime-border);
        }
        .line-clamp-2 {
          display: -webkit-box;
          -webkit-line-clamp: 2;
          -webkit-box-orient: vertical;
          overflow: hidden;
        }
      `}</style>
    </div>
  );
};

export default AgentSelector;
