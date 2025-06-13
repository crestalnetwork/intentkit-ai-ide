import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import ConversationHistory from "../components/ConversationHistory";

const ConversationsPage: React.FC = () => {
  const [baseUrl, setBaseUrl] = useState<string>("http://127.0.0.1:8000");

  // Check for stored base URL in localStorage
  useEffect(() => {
    const storedBaseUrl = localStorage.getItem("intentkit_base_url");
    if (storedBaseUrl) {
      setBaseUrl(storedBaseUrl);
    }
  }, []);

  const handleProjectSelect = (projectId: string) => {
    console.log("Selected project:", projectId);
    // You could navigate to a detailed view or do something else with the selected project
  };

  return (
    <div className="min-h-screen bg-[#0d1117] flex flex-col h-screen">
      <Head>
        <title>Conversation History - IntentKit Sandbox</title>
        <meta
          name="description"
          content="View your agent creation conversation history"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <header className="bg-[#161b22] border-b border-[#30363d] py-3">
        <div className="max-w-full mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center space-x-4">
            <Link
              href="/"
              className="text-sm py-1.5 px-3 bg-[#21262d] text-[#c9d1d9] rounded border border-[#30363d] hover:bg-[#30363d] transition-colors"
            >
              ← Back to Sandbox
            </Link>
            <h1 className="text-xl font-bold text-[#c9d1d9]">
              Conversation History
            </h1>
          </div>
          <div className="flex items-center space-x-3">
            <Link
              href="/create-agent"
              className="text-sm py-1.5 px-3 bg-[#238636] text-white rounded hover:bg-[#2ea043] transition-colors"
            >
              + Create New Agent
            </Link>
            <span className="text-sm text-[#8b949e]">
              Connected to: {baseUrl}
            </span>
          </div>
        </div>
      </header>

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="max-w-6xl mx-auto h-full px-4 py-6">
          <ConversationHistory
            baseUrl={baseUrl}
            onProjectSelect={handleProjectSelect}
          />
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-[#161b22] border-t border-[#30363d] py-2">
        <div className="max-w-full mx-auto px-4 text-center">
          <p className="text-xs text-[#8b949e]">
            IntentKit Conversation History
          </p>
        </div>
      </footer>
    </div>
  );
};

export default ConversationsPage;
