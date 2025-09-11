import React from "react";
import { useRouter } from "next/router";
import Header from "@/components/Header";
import ChatInterfaceVibe from "@/components/ChatInterfaceVibe";
import AgentEditor from "@/components/vibe/AgentEditor";
import AgentDetailsPanel from "@/components/vibe/AgentDetailsPanel";
import { useVibeLogic } from "@/hooks/useVibeLogic";
import logger from "@/lib/utils/logger";

const VibePage: React.FC = () => {
  const router = useRouter();
  const {
    agent,
    loading,
    generating,
    isCreateMode,
    messages,
    inputValue,
    user,
    isAuthenticated,
    initingLogin,
    handleSendMessage,
    handleInputChange,
    setMessages,
    refreshAgent,
  } = useVibeLogic();

  logger.component("mounted", "VibePage", {
    agentId: router.query.agentId,
    isCreateMode,
    hasAgent: !!agent,
    isAuthenticated,
    userId: user?.id,
  });

  // Show loading while authentication is initializing or data is loading
  if (initingLogin || loading) {
    return (
      <div className="h-screen bg-[var(--color-bg-primary)] flex flex-col">
        <Header title="Vibe Code" />
        <div className="flex-1 container mx-auto px-2 py-4">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[var(--color-neon-lime)]"></div>
            <span className="ml-3 text-[var(--color-text-primary)]">
              {initingLogin ? "Loading..." : "Loading agent..."}
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Redirect will be handled by useVibeLogic hook if user is not authenticated
  if (!isAuthenticated || !user) {
    return null;
  }

  return (
    <div className="h-screen bg-[var(--color-bg-primary)] flex flex-col">
      <Header title="Vibe Code" />
      <div className="flex-1 container mx-auto px-2 py-2 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-12 gap-3 h-full min-h-0">
          {/* Left Panel - Agent Editor */}
          <div className="lg:col-span-1 xl:col-span-3 flex flex-col min-h-0">
            <AgentEditor
              agent={agent}
              isCreateMode={isCreateMode}
              generating={generating}
              inputValue={inputValue}
              messages={messages}
              onInputChange={handleInputChange}
              onSendMessage={handleSendMessage}
              onMessagesChange={setMessages}
            />
          </div>

          {/* Center Panel - Chat Interface */}
          <div className="lg:col-span-1 xl:col-span-5 flex flex-col min-h-0">
            {agent ? (
              <ChatInterfaceVibe
                agent={agent}
                baseUrl={process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000"}
              />
            ) : (
              <div className="flex flex-col h-full bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <div className="w-16 h-16 bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center mb-4">
                      <svg className="w-8 h-8 text-[var(--color-text-tertiary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                      No Agent Yet
                    </h3>
                    <p className="text-[var(--color-text-tertiary)]">
                      {isCreateMode
                        ? "Create your agent on the left to start chatting"
                        : "Loading agent data..."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Panel - Agent Details - Only on XL screens - Wider now */}
          <div className="hidden xl:flex xl:col-span-4 flex-col min-h-0">
            <AgentDetailsPanel agent={agent} onAgentUpdate={refreshAgent} />
          </div>
        </div>
      </div>
    </div>
  );
};

export default VibePage;