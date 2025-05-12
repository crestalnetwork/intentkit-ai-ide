import React, { useState, useEffect } from "react";
import axios from "axios";
import { AgentsListProps, Agent } from "../types";

const AgentsList: React.FC<AgentsListProps> = ({
  baseUrl,
  onAgentSelect,
  selectedAgentId,
}) => {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [lastRefresh, setLastRefresh] = useState<number>(Date.now());

  useEffect(() => {
    // Get stored credentials from localStorage
    const storedUsername = localStorage.getItem("intentkit_username");
    const storedPassword = localStorage.getItem("intentkit_password");

    if (storedUsername && storedPassword) {
      setUsername(storedUsername);
      setPassword(storedPassword);
    }

    fetchAgents();
  }, [baseUrl, lastRefresh]);

  const fetchAgents = async () => {
    setLoading(true);
    setError(null);

    try {
      // Convert localhost to 127.0.0.1 in the baseUrl
      const apiBaseUrl = baseUrl.replace("localhost", "127.0.0.1");
      console.log(`agents_list.js: Fetching agents from ${apiBaseUrl}/agents`);

      // Set auth header if credentials are available
      const config: any = {};
      if (username && password) {
        config.auth = {
          username: username,
          password: password,
        };
      }

      const response = await axios.get<Agent[]>(`${apiBaseUrl}/agents`, config);
      setAgents(response.data);
    } catch (err) {
      console.error("Error fetching agents:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch agents");
    } finally {
      setLoading(false);
    }
  };

  // Function to refresh the agent list after updates
  const refreshAgents = () => {
    setLastRefresh(Date.now());
  };

  // Make the refresh function available to other components
  // through a global window property
  useEffect(() => {
    (window as any).refreshAgentsList = refreshAgents;
    return () => {
      delete (window as any).refreshAgentsList;
    };
  }, []);

  const filteredAgents = agents.filter(
    (agent) =>
      agent.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.id?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      agent.purpose?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] h-full flex flex-col">
        <div className="flex items-center justify-center flex-1">
          <div className="loader ease-linear rounded-full border-3 border-t-3 border-[#30363d] h-10 w-10 mb-4"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-[#161b22] rounded-xl border border-[#30363d] h-full flex flex-col p-3">
        <div className="bg-[#21262d] border-l-4 border-[#f85149] p-3 mb-2 rounded-md">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-4 w-4 text-[#f85149]"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-2">
              <h3 className="text-xs font-medium text-[#f85149]">
                Error loading agents
              </h3>
              <div className="mt-1 text-xs text-[#c9d1d9]">
                <p>{error}</p>
              </div>
              <div className="mt-2">
                <button
                  type="button"
                  onClick={fetchAgents}
                  className="text-xs bg-[#21262d] text-[#c9d1d9] px-2 py-1 rounded border border-[#30363d] hover:bg-[#30363d]"
                >
                  Try again
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[#161b22] rounded-xl border border-[#30363d] h-full flex flex-col">
      <div className="p-2 bg-[#161b22] text-[#c9d1d9] border-b border-[#30363d]">
        <h2 className="text-lg font-semibold">Agents</h2>
      </div>

      <div className="p-2 border-b border-[#30363d]">
        <input
          id="search-agents"
          type="text"
          placeholder="Search agents..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full p-1.5 bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] text-xs"
        />
      </div>

      <div className="flex-1 overflow-y-auto agent-list-scroll">
        <div className="divide-y divide-[#30363d]">
          {filteredAgents.length === 0 ? (
            <div className="p-3 text-center text-[#8b949e] text-xs">
              {searchQuery
                ? "No agents found matching your search"
                : "No agents available"}
            </div>
          ) : (
            filteredAgents.map((agent) => (
              <div
                key={agent.id}
                onClick={() => onAgentSelect(agent)}
                className={`p-2 hover:bg-[#21262d] cursor-pointer transition-colors agent-item ${
                  selectedAgentId === agent.id ? "bg-[#1f2937]" : ""
                }`}
              >
                <h3 className="font-medium text-[#c9d1d9] text-xs">
                  {agent.name || agent.id}
                </h3>
                {agent.purpose && (
                  <p className="text-xs text-[#8b949e] mt-1 line-clamp-1">
                    {agent.purpose}
                  </p>
                )}
                <div className="mt-1.5 flex flex-wrap items-center gap-1 text-xs">
                  <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#0d1117] text-[#58a6ff] border border-[#30363d]">
                    {agent.id}
                  </span>
                  {agent.model && (
                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-medium bg-[#0d1117] text-[#58a6ff] border border-[#30363d]">
                      {agent.model}
                    </span>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      <div className="p-1.5 bg-[#161b22] border-t border-[#30363d] flex justify-between items-center">
        <span className="text-[10px] text-[#8b949e]">
          {filteredAgents.length} agents
        </span>
        <button
          onClick={refreshAgents}
          className="text-[10px] text-[#58a6ff] hover:underline flex items-center"
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
              d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
            />
          </svg>
          Refresh
        </button>
      </div>
    </div>
  );
};

export default AgentsList;
