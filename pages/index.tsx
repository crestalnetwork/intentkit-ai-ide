import React, { useState, useEffect, useCallback } from "react";
import Head from "next/head";
import Link from "next/link";
import { showToast } from "../lib/utils/toast";
import ChatInterface from "../components/ChatInterface";
import ConversationsList from "../components/ConversationsList";
import AgentDetail from "../components/AgentDetail";
import Settings from "../components/Settings";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { Agent, ChatThread } from "../lib/utils/apiClient";
import apiClient from "../lib/utils/apiClient";
import { STORAGE_KEYS, DEFAULT_BASE_URL } from "../lib/utils/config";
import logger from "../lib/utils/logger";
import theme from "../lib/utils/theme";
import AuthModal from "../components/AuthModal";
import { useAuth } from "@/context/AuthProvider";

const Home: React.FC = (): JSX.Element => {
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null);
  const [selectedThread, setSelectedThread] = useState<ChatThread | null>(null);
  const [viewMode, setViewMode] = useState<"chat" | "details">("chat");
  const [conversationRefreshKey, setConversationRefreshKey] =
    useState<number>(0);

  const { isAuthenticated, handleStartLogin } = useAuth();

  logger.component("mounted", "Home");

  // Initialize base URL from config
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL);
      const defaultUrl = DEFAULT_BASE_URL;
      setBaseUrl(storedUrl || defaultUrl);

      logger.info(
        "Base URL initialized",
        { storedUrl, defaultUrl, finalUrl: storedUrl || defaultUrl },
        "Home.useEffect"
      );

      // Update API client base URL
      apiClient.updateBaseUrl(storedUrl || defaultUrl);
    }
  }, []);

  // Auto-load first available agent on authentication
  useEffect(() => {
    if (isAuthenticated && !selectedAgent) {
      loadFirstAvailableAgent();
    }
  }, [isAuthenticated]);

  const loadFirstAvailableAgent = async () => {
    try {
      logger.info(
        "Loading first available agent",
        {},
        "Home.loadFirstAvailableAgent"
      );

      const response = await apiClient.getUserAgents({ limit: 1 });
      if (response.data.length > 0) {
        const firstAgentId = response.data[0].id;
        logger.info(
          "Found first available agent, fetching complete data",
          { agentId: firstAgentId, agentName: response.data[0].name },
          "Home.loadFirstAvailableAgent"
        );

        // Fetch complete agent data using the single agent endpoint
        const completeAgent = await apiClient.getUserAgent(firstAgentId!);
        setSelectedAgent(completeAgent);

        logger.info(
          "Complete agent data loaded",
          {
            agentId: completeAgent.id,
            hasAutonomous: !!completeAgent.autonomous,
          },
          "Home.loadFirstAvailableAgent"
        );
      }
    } catch (error: any) {
      logger.error(
        "Failed to load first available agent",
        { error: error.message },
        "Home.loadFirstAvailableAgent"
      );
      // Don't show error to user as this is optional
    }
  };

  // Refresh the selected agent data
  const refreshSelectedAgent = useCallback(async () => {
    if (selectedAgent && isAuthenticated) {
      logger.info(
        "Refreshing selected agent",
        { agentId: selectedAgent.id },
        "Home.refreshSelectedAgent"
      );
      try {
        // Use the user-specific endpoint to fetch updated agent data with system prompts
        const updatedAgent = await apiClient.getUserAgent(selectedAgent.id!);
        setSelectedAgent(updatedAgent);
        logger.info(
          "Agent refreshed successfully",
          { agentId: selectedAgent.id },
          "Home.refreshSelectedAgent"
        );
      } catch (error: any) {
        logger.error(
          "Failed to refresh agent",
          { agentId: selectedAgent.id, error: error.message },
          "Home.refreshSelectedAgent"
        );
        console.error("Error refreshing agent data:", error);
        if (error.response?.status === 401) {
          showToast.error("Authentication expired. Please sign in again.");
        }
      }
    }
  }, [selectedAgent, isAuthenticated]);

  // Set up a global refreshSelectedAgent function
  useEffect(() => {
    if (typeof window !== "undefined") {
      (window as any).refreshSelectedAgent = refreshSelectedAgent;

      // Set up a listener for the refreshAgentsList event
      const handleRefreshAgentsList = () => {
        logger.debug(
          "Agents list refresh event received",
          {},
          "Home.handleRefreshAgentsList"
        );
        // When agents list is refreshed, also refresh the selected agent
        setTimeout(refreshSelectedAgent, 100);
        // Also refresh the conversation list
        setConversationRefreshKey((prev) => prev + 1);
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
    logger.info(
      "Base URL changed",
      { oldUrl: baseUrl, newUrl },
      "Home.handleBaseUrlChange"
    );
    setBaseUrl(newUrl);
    localStorage.setItem(STORAGE_KEYS.BASE_URL, newUrl);
    apiClient.updateBaseUrl(newUrl);
  };

  const handleAgentSelect = async (agent: Agent) => {
    logger.info(
      "Agent selected",
      { agentId: agent.id, agentName: agent.name },
      "Home.handleAgentSelect"
    );

    try {
      // Fetch complete agent data including system prompts
      const completeAgent = await apiClient.getUserAgent(agent.id!);
      setSelectedAgent(completeAgent);
      logger.info(
        "Complete agent data loaded",
        { agentId: agent.id },
        "Home.handleAgentSelect"
      );
    } catch (error: any) {
      logger.error(
        "Failed to load complete agent data, using partial data",
        { agentId: agent.id, error: error.message },
        "Home.handleAgentSelect"
      );
      // Fallback to the agent data from the list if fetch fails
      setSelectedAgent(agent);
    }

    // Clear current thread when switching agents to avoid confusion
    setSelectedThread(null);
    setViewMode("chat");
  };

  const handleThreadSelect = (thread: ChatThread) => {
    logger.info(
      "Thread selected",
      { threadId: thread.id, agentId: thread.agent_id },
      "Home.handleThreadSelect"
    );
    setSelectedThread(thread);
    setViewMode("chat");
  };

  const handleNewChat = () => {
    logger.info(
      "Starting new chat",
      { agentId: selectedAgent?.id },
      "Home.handleNewChat"
    );
    setSelectedThread(null); // Clear current thread to start fresh
    setViewMode("chat");
  };

  const handleNewChatCreated = (newThread: ChatThread) => {
    logger.info(
      "New chat created",
      { threadId: newThread.id, agentId: newThread.agent_id },
      "Home.handleNewChatCreated"
    );
    setSelectedThread(newThread); // Select the new thread
    setConversationRefreshKey((prev) => prev + 1); // Trigger conversation list refresh
  };

  const toggleViewMode = () => {
    const newMode = viewMode === "chat" ? "details" : "chat";
    logger.info(
      "View mode toggled",
      { oldMode: viewMode, newMode },
      "Home.toggleViewMode"
    );
    setViewMode(newMode);
  };

  const handleGetApiKey = () => {
    logger.info("API key button clicked", {}, "Home.handleGetApiKey");
    showToast.info("API Key management coming soon!");
  };

  // Prepare right actions for the header
  const rightActions = (
    <>
      <Link
        href="/create-agent"
        className={`inline-flex items-center space-x-2 text-sm py-2 px-4 bg-[${theme.colors.primary.main}] text-[${theme.colors.text.onPrimary}] font-medium rounded-lg hover:bg-[${theme.colors.primary.hover}] hover:shadow-lg hover:shadow-[${theme.colors.primary.shadow}] transition-all duration-200`}
      >
        <svg className="w-4 h-4" fill="none" stroke="black" viewBox="0 0 24 24">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
          />
        </svg>
        <span className="text-sm text-black">Create Agent</span>
      </Link>
    </>
  );

  return (
    <div
      className={`min-h-screen bg-[${theme.colors.background.primary}] flex flex-col h-screen`}
    >
      <Head>
        <title>IntentKit AI</title>
        <meta
          name="description"
          content="Launch and Deploy AI Agents Instantly — No Code Required"
        />
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Header */}
      <Header
        title="IntentKit AI"
        rightActions={rightActions}
        showBaseUrl={false}
        baseUrl={baseUrl}
        onBaseUrlChange={handleBaseUrlChange}
      />

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        {isAuthenticated ? (
          <div className="max-w-full h-full px-3 py-2">
            <div className="grid grid-cols-12 gap-3 h-full">
              {/* Sidebar - Conversations List */}
              <div className="col-span-12 sm:col-span-5 md:col-span-4 lg:col-span-3 h-full overflow-hidden">
                <ConversationsList
                  baseUrl={baseUrl}
                  selectedAgent={selectedAgent}
                  selectedThreadId={selectedThread?.id}
                  onThreadSelect={handleThreadSelect}
                  onAgentSelect={handleAgentSelect} // Now passes agent directly
                  refreshKey={conversationRefreshKey}
                />
              </div>

              {/* Main content - Chat or Agent Details */}
              <div className="col-span-12 sm:col-span-7 md:col-span-8 lg:col-span-9 h-full overflow-hidden">
                {selectedAgent ? (
                  viewMode === "chat" ? (
                    <ChatInterface
                      baseUrl={baseUrl}
                      agent={selectedAgent}
                      selectedThread={selectedThread}
                      onToggleViewMode={toggleViewMode}
                      viewMode={viewMode}
                      onNewChatCreated={handleNewChatCreated}
                    />
                  ) : (
                    <AgentDetail
                      agent={selectedAgent}
                      onToggleViewMode={toggleViewMode}
                    />
                  )
                ) : (
                  <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] p-6 text-center text-[var(--color-text-tertiary)] flex flex-col items-center justify-center h-full">
                    <svg
                      className="h-16 w-16 text-[var(--color-text-tertiary)]"
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
                    <h3 className="mt-6 text-lg font-medium text-[var(--color-text-primary)]">
                      Select an Agent to Start
                    </h3>
                    <p className="mt-3 max-w-md mx-auto text-base text-[var(--color-text-secondary)]">
                      Your conversations are loading. Select an agent from the
                      sidebar to start chatting.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : (
          // Unauthenticated state - centered sign in message
          <div className="flex items-center justify-center h-full px-6">
            <div className="max-w-md w-full text-center">
              <div className="bg-[var(--color-bg-secondary)] rounded-xl border border-[var(--color-border-primary)] p-8">
                <svg
                  className="h-16 w-16 text-[var(--color-text-tertiary)] mx-auto"
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
                <h3 className="mt-6 text-xl font-semibold text-[var(--color-text-primary)]">
                  Welcome to IntentKit AI
                </h3>
                <p className="mt-3 text-base text-[var(--color-text-secondary)]">
                  Please sign in to view and chat with your agents.
                </p>
                <button
                  onClick={() => handleStartLogin()}
                  className="mt-6 inline-flex items-center px-6 py-3 bg-[var(--color-neon-lime)] text-black text-sm font-medium rounded-lg hover:bg-[var(--color-neon-lime-bright)] neon-glow-lime hover-neon-glow-lime transition-all duration-200"
                >
                  <svg
                    className="w-4 h-4 mr-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
                    />
                  </svg>
                  Sign In & Get Started
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <Footer
        baseUrl={baseUrl}
        showConnectionStatus={true}
        onBaseUrlChange={handleBaseUrlChange}
      />
    </div>
  );
};

export default Home;
