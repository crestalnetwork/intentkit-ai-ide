import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import ChatInterface from "../components/ChatInterface";
import AgentsList from "../components/AgentsList";
import AgentDetail from "../components/AgentDetail";
import Settings from "../components/Settings";
import { Agent } from "../types";
import axios from "axios";

const Home: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState<string>("http://127.0.0.1:8000");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [viewMode, setViewMode] = useState<"chat" | "details">("chat");

  // Check for stored base URL in localStorage
  useEffect(() => {
    const storedBaseUrl = localStorage.getItem("intentkit_base_url");
    if (storedBaseUrl) {
      setBaseUrl(storedBaseUrl);
    }
  }, []);

  // Refresh the selected agent data
  const refreshSelectedAgent = useCallback(async () => {
    if (selectedAgent) {
      try {
        // Get credentials from localStorage
        const username = localStorage.getItem("intentkit_username");
        const password = localStorage.getItem("intentkit_password");

        // Set auth config if credentials are available
        const config: any = {};
        if (username && password) {
          config.auth = {
            username,
            password,
          };
        }

        // Convert localhost to 127.0.0.1 in the baseUrl
        const apiBaseUrl = baseUrl.replace("localhost", "127.0.0.1");

        // Fetch the updated agent data
        const response = await axios.get<Agent>(
          `${apiBaseUrl}/agents/${selectedAgent.id}`,
          config
        );

        // Update the selected agent with the latest data
        setSelectedAgent(response.data);
      } catch (error) {
        console.error("Error refreshing agent data:", error);
      }
    }
  }, [selectedAgent, baseUrl]);

  // Set up a global refreshSelectedAgent function
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).refreshSelectedAgent = refreshSelectedAgent;

      // Set up a listener for the refreshAgentsList event
      const handleRefreshAgentsList = () => {
        // When agents list is refreshed, also refresh the selected agent
        setTimeout(refreshSelectedAgent, 100);
      };

      window.addEventListener(
        "refreshAgentsListComplete",
        handleRefreshAgentsList
      );

      return () => {
        delete (window as any).refreshSelectedAgent;
        window.removeEventListener(
          "refreshAgentsListComplete",
          handleRefreshAgentsList
        );
      };
    }
  }, [refreshSelectedAgent]);

  // Store base URL in localStorage when changed
  const handleBaseUrlChange = (newUrl: string) => {
    setBaseUrl(newUrl);
    localStorage.setItem("intentkit_base_url", newUrl);
  };

  const handleAgentSelect = (agent: Agent) => {
    setSelectedAgent(agent);
    // Default to chat view when selecting an agent
    setViewMode("chat");
  };

  const toggleViewMode = () => {
    setViewMode(viewMode === "chat" ? "details" : "chat");
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col h-screen">
      <Head>
        <title>IntentKit Sandbox UI</title>
        <meta name="description" content="Chat with your IntentKit agents" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-[#161b22] border-b border-[#30363d] py-3">
        <div className="max-w-full mx-auto px-4 flex justify-between items-center">
          <h1 className="text-xl font-bold text-[#c9d1d9]">
            IntentKit Sandbox
          </h1>
          <div className="flex items-center space-x-3">
            {selectedAgent && (
              <button
                onClick={toggleViewMode}
                className="text-sm py-1.5 px-3 bg-[#21262d] text-[#c9d1d9] rounded border border-[#30363d] hover:bg-[#30363d]"
              >
                {viewMode === "chat" ? "View Details" : "Back to Chat"}
              </button>
            )}
            <Settings baseUrl={baseUrl} onBaseUrlChange={handleBaseUrlChange} />
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-full h-full px-4 py-3">
          <div className="grid grid-cols-12 gap-4 h-full">
            {/* Sidebar - Agent List */}
            <div className="col-span-12 sm:col-span-4 md:col-span-3 lg:col-span-2 h-full overflow-hidden agent-list-container">
              <AgentsList
                baseUrl={baseUrl}
                onAgentSelect={handleAgentSelect}
                selectedAgentId={selectedAgent?.id}
              />
            </div>

            {/* Main content - Chat or Agent Details */}
            <div className="col-span-12 sm:col-span-8 md:col-span-9 lg:col-span-10 h-full overflow-hidden">
              {selectedAgent ? (
                viewMode === "chat" ? (
                  <ChatInterface
                    baseUrl={baseUrl}
                    agentName={selectedAgent.id}
                  />
                ) : (
                  <AgentDetail agent={selectedAgent} />
                )
              ) : (
                <div className="bg-[#161b22] rounded-xl border border-[#30363d] p-6 text-center text-[#8b949e] flex flex-col items-center justify-center h-full">
                  <svg
                    className="h-16 w-16 text-[#8b949e]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={1}
                      d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"
                    />
                  </svg>
                  <h3 className="mt-6 text-lg font-medium text-[#c9d1d9]">
                    Select an Agent to Start
                  </h3>
                  <p className="mt-3 max-w-md mx-auto text-base">
                    Choose an agent from the list to start chatting.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#161b22] border-t border-[#30363d] py-2">
        <div className="max-w-full mx-auto px-4 text-center">
          <p className="text-xs text-[#8b949e]">IntentKit Sandbox UI</p>
        </div>
      </footer>
    </div>
  );
};

export default Home;
