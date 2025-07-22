import React, { useState, useEffect, useRef } from "react";
import { Agent } from "../lib/utils/apiClient";
import apiClient from "../lib/utils/apiClient";
import logger from "../lib/utils/logger";

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

  const handleAgentSelect = (agent: Agent) => {
    logger.info(
      "Agent selected",
      { agentId: agent.id, agentName: agent.name },
      "AgentSelector.handleAgentSelect"
    );
    onAgentSelect(agent);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div
        ref={modalRef}
        className="bg-[#161b22] border border-[#30363d] rounded-lg w-full max-w-2xl max-h-[80vh] flex flex-col"
      >
        {/* Header */}
        <div className="p-3 border-b border-[#30363d]">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-[#ffffff]">
              Select Your Agent
            </h2>
            <button
              onClick={onClose}
              className="p-1 text-[#8b949e] hover:text-[#ffffff] transition-colors"
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

          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[#8b949e]"
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
            <input
              ref={searchInputRef}
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search your agents..."
              className="w-full pl-10 pr-4 py-2 bg-[#0d1117] border border-[#30363d] rounded text-[#ffffff] text-sm focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] transition-all"
            />
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-3">
          {loading && (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-[#21262d] border-t-[#58a6ff] mx-auto mb-4"></div>
              <p className="text-sm text-[#8b949e]">Loading agents...</p>
            </div>
          )}

          {error && (
            <div className="text-center py-8">
              <p className="text-sm text-[#f85149] mb-2">{error}</p>
              <button
                onClick={loadAgents}
                className="text-sm text-[#58a6ff] hover:underline"
              >
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filteredAgents.length === 0 && (
            <div className="text-center py-8">
              <div className="text-4xl mb-4">🔍</div>
              <p className="text-sm text-[#8b949e] mb-2">
                {searchTerm
                  ? "No agents found"
                  : "You haven't created any agents yet"}
              </p>
              {searchTerm && (
                <p className="text-xs text-[#6b7280]">
                  Try adjusting your search terms
                </p>
              )}
              {!searchTerm && (
                <p className="text-xs text-[#6b7280]">
                  Create your first agent to get started
                </p>
              )}
            </div>
          )}

          {!loading && !error && filteredAgents.length > 0 && (
            <div className="space-y-2">
              {filteredAgents.map((agent) => (
                <button
                  key={agent.id}
                  onClick={() => handleAgentSelect(agent)}
                  className={`w-full p-3 text-left rounded border transition-all duration-200 ${
                    selectedAgentId === agent.id
                      ? "bg-[#238636] border-[#238636] text-white"
                      : "bg-[#0d1117] border-[#30363d] text-[#c9d1d9] hover:bg-[#161b22] hover:border-[#58a6ff]"
                  }`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2 mb-1">
                        <h3 className="font-medium truncate">{agent.name}</h3>
                        {selectedAgentId === agent.id && (
                          <div className="flex-shrink-0">
                            <svg
                              className="w-4 h-4"
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
                        <p className="text-sm opacity-70 mb-2 line-clamp-2">
                          {agent.purpose}
                        </p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3 text-xs opacity-60">
                          {agent.model && (
                            <span className="bg-[#21262d] px-2 py-1 rounded">
                              {agent.model}
                            </span>
                          )}
                          {agent.skills &&
                            Object.keys(agent.skills).length > 0 && (
                              <span className="bg-[#21262d] px-2 py-1 rounded">
                                {Object.keys(agent.skills).length} skills
                              </span>
                            )}
                          {agent.created_at && (
                            <span>
                              Created{" "}
                              {new Date(agent.created_at).toLocaleDateString()}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center space-x-1 text-xs">
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
                          <span
                            className={`font-medium ${
                              selectedAgentId === agent.id
                                ? "text-white"
                                : "text-[#58a6ff]"
                            }`}
                          >
                            Chat Now
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-2 border-t border-[#30363d] text-center">
          <p className="text-xs text-[#8b949e]">
            Select one of your agents to start chatting • Press Esc to close
          </p>
        </div>
      </div>
    </div>
  );
};

export default AgentSelector;
