import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import axios from "axios";
import AgentCreator from "../components/AgentCreator";
import { GenerationsListResponse, ConversationProject } from "../types";

const CreateAgentPage: React.FC = () => {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState<string>("http://127.0.0.1:8000");
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [conversations, setConversations] = useState<ConversationProject[]>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    null
  );
  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(false);
  const [loadingConversations, setLoadingConversations] =
    useState<boolean>(true);

  // Check for stored base URL in localStorage
  useEffect(() => {
    const storedBaseUrl = localStorage.getItem("intentkit_base_url");
    if (storedBaseUrl) {
      setBaseUrl(storedBaseUrl);
    }
  }, []);

  // Load conversation history
  useEffect(() => {
    if (baseUrl) {
      loadConversations();
    }
  }, [baseUrl]);

  const loadConversations = async () => {
    try {
      setLoadingConversations(true);
      const apiBaseUrl = baseUrl.replace("localhost", "127.0.0.1");

      const response = await axios.get<GenerationsListResponse>(
        `${apiBaseUrl}/agent/generations`
      );

      setConversations(response.data.projects || []);
    } catch (error) {
      console.error("Error loading conversations:", error);
      setConversations([]);
    } finally {
      setLoadingConversations(false);
    }
  };

  const handleAgentCreated = (agent: Record<string, any>) => {
    console.log("Agent deployed successfully:", agent);
    const agentName = agent.name || "Unnamed Agent";
    setSuccessMessage(`🎉 Agent "${agentName}" deployed successfully!`);

    // Reload conversations to show the updated list
    loadConversations();

    // Redirect to main page after 3 seconds to see the new agent
    setTimeout(() => {
      router.push("/");
    }, 3000);
  };

  const handleNewConversation = () => {
    setSelectedProjectId(null);
  };

  const handleSelectConversation = (projectId: string) => {
    setSelectedProjectId(projectId);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffTime = Math.abs(now.getTime() - date.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) return "Today";
    if (diffDays === 2) return "Yesterday";
    if (diffDays <= 7) return `${diffDays - 1} days ago`;
    return date.toLocaleDateString();
  };

  const getConversationTitle = (conversation: ConversationProject) => {
    if (conversation.first_message?.content) {
      return (
        conversation.first_message.content.slice(0, 50) +
        (conversation.first_message.content.length > 50 ? "..." : "")
      );
    }
    return `Conversation ${conversation.project_id.slice(0, 8)}`;
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col h-screen">
      <Head>
        <title>Create Agent - IntentKit Sandbox</title>
        <meta
          name="description"
          content="Create a new IntentKit agent with AI assistance"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-[#161b22] border-b border-[#30363d] py-3 flex-shrink-0">
        <div className="max-w-full mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <button
              onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
              className="text-[#c9d1d9] hover:text-[#58a6ff] transition-colors p-1"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="currentColor"
              >
                <path d="M1 2.75A.75.75 0 011.75 2h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 2.75zm0 5A.75.75 0 011.75 7h12.5a.75.75 0 010 1.5H1.75A.75.75 0 011 7.75zM1.75 12a.75.75 0 000 1.5h12.5a.75.75 0 000-1.5H1.75z" />
              </svg>
            </button>
            <Link
              href="/"
              className="text-sm py-1.5 px-3 bg-[#21262d] text-[#c9d1d9] rounded border border-[#30363d] hover:bg-[#30363d] transition-colors"
            >
              ← Back to Sandbox
            </Link>
            <h1 className="text-xl font-bold text-[#c9d1d9]">
              Create New Agent
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            {successMessage && (
              <div className="text-green-400 text-sm font-medium py-1 px-2 bg-green-400/10 rounded border border-green-400/20">
                {successMessage}
              </div>
            )}
            <span className="text-sm text-[#8b949e]">
              Connected to: {baseUrl}
            </span>
          </div>
        </div>
      </header>

      {/* Main layout with sidebar */}
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <div
          className={`bg-[#161b22] border-r border-[#30363d] flex-shrink-0 transition-all duration-300 ${
            sidebarCollapsed ? "w-0" : "w-80"
          } overflow-hidden`}
        >
          <div className="h-full flex flex-col">
            {/* New conversation button */}
            <div className="p-4 border-b border-[#30363d]">
              <button
                onClick={handleNewConversation}
                className="w-full text-sm py-2 px-3 bg-[#238636] text-white rounded hover:bg-[#2ea043] transition-colors flex items-center justify-center space-x-2"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="currentColor"
                >
                  <path d="M7.75 2a.75.75 0 01.75.75V7h4.25a.75.75 0 010 1.5H8.5v4.25a.75.75 0 01-1.5 0V8.5H2.75a.75.75 0 010-1.5H7V2.75A.75.75 0 017.75 2z" />
                </svg>
                <span>New Conversation</span>
              </button>
            </div>

            {/* Conversations list */}
            <div className="flex-1 overflow-y-auto">
              {loadingConversations ? (
                <div className="p-4 text-center text-[#8b949e]">
                  Loading conversations...
                </div>
              ) : conversations.length === 0 ? (
                <div className="p-4 text-center text-[#8b949e]">
                  No conversations yet
                </div>
              ) : (
                <div className="p-2">
                  {conversations.map((conversation) => (
                    <button
                      key={conversation.project_id}
                      onClick={() =>
                        handleSelectConversation(conversation.project_id)
                      }
                      className={`w-full text-left p-3 rounded mb-2 transition-colors ${
                        selectedProjectId === conversation.project_id
                          ? "bg-[#0969da] text-white"
                          : "hover:bg-[#21262d] text-[#c9d1d9]"
                      }`}
                    >
                      <div className="text-sm font-medium truncate">
                        {getConversationTitle(conversation)}
                      </div>
                      <div className="text-xs text-[#8b949e] mt-1">
                        {conversation.last_activity &&
                          formatDate(conversation.last_activity)}
                        {conversation.message_count && (
                          <span className="ml-2">
                            {conversation.message_count} messages
                          </span>
                        )}
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full">
            <AgentCreator
              baseUrl={baseUrl}
              onAgentCreated={handleAgentCreated}
              projectId={selectedProjectId}
            />
          </div>
        </main>
      </div>
    </div>
  );
};

export default CreateAgentPage;
