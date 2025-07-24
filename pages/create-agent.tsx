import React, { useState, useEffect } from "react";
import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { showToast } from "../lib/utils/toast";
import AgentCreator from "../components/AgentCreator";
import TemplateSelector from "../components/TemplateSelector";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { AgentTemplate } from "../lib/utils/templates";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { STORAGE_KEYS, DEFAULT_BASE_URL } from "../lib/utils/config";

const CreateAgentPage: React.FC = () => {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [showTemplateSelector, setShowTemplateSelector] =
    useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<
    AgentTemplate | undefined
  >(undefined);
  const { isAuthenticated } = useSupabaseAuth();

  // Initialize base URL from config
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL);
      const defaultUrl = DEFAULT_BASE_URL;
      setBaseUrl(storedUrl || defaultUrl);
    }
  }, []);

  const handleAgentCreated = (agent: Record<string, any>) => {
    console.log("Agent deployed successfully:", agent);
    const agentName = agent.name || "Unnamed Agent";
    showToast.success(`🎉 Agent "${agentName}" deployed successfully!`);

    // Redirect to main page after 3 seconds to see the new agent
    setTimeout(() => {
      router.push("/");
    }, 3000);
  };

  const handleTemplateSelect = (template: AgentTemplate) => {
    setSelectedTemplate(template);
    setShowTemplateSelector(false);
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col h-screen">
      <Head>
        <title>Create Agent - IntentKit.ai (IntentKit)</title>
        <meta
          name="description"
          content="Launch and Deploy AI Agents Instantly — No Code Required"
        />
        <link rel="icon" href="/favicon.png" />
      </Head>

      {/* Header */}
      <Header
        title="Create New Agent"
        backLink={{
          href: "/",
          label: "Home",
        }}
        showBaseUrl={false}
        baseUrl={baseUrl}
      />

      {/* Authentication Warning */}
      {!isAuthenticated && (
        <div className="bg-[var(--color-neon-pink-subtle)] border-b border-[var(--color-neon-pink-border)] px-4 py-2 relative overflow-hidden">
          {/* Subtle neon glow background effect */}
          <div className="absolute inset-0 bg-gradient-to-r from-[var(--color-neon-pink-glow)] to-[var(--color-neon-cyan-glow)] opacity-20"></div>

          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center space-x-2">
              <div className="flex-shrink-0">
                <svg
                  className="w-4 h-4 text-[var(--color-neon-pink)]"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-[var(--color-neon-pink)] text-sm font-medium">
                  Please sign in to create agents
                </p>
              </div>
            </div>
            <Link
              href="/quick"
              className="inline-flex items-center space-x-1 text-xs py-1.5 px-3 bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] rounded hover:bg-[var(--color-neon-lime-bright)] neon-glow-lime hover-neon-glow-lime transition-all duration-200 font-medium whitespace-nowrap"
            >
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
                  d="M13 10V3L4 14h7v7l9-11h-7z"
                />
              </svg>
              <span>Quick Creator</span>
            </Link>
          </div>
        </div>
      )}

      {/* Main content - Give maximum space to AgentCreator */}
      <main className="flex-1 overflow-hidden bg-[var(--color-bg-primary)] min-h-0">
        <div className="h-full p-3 max-w-7xl mx-auto">
          <div className="h-full bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg overflow-hidden shadow-lg">
            <AgentCreator
              baseUrl={baseUrl}
              onAgentCreated={handleAgentCreated}
              currentProjectId={undefined}
              selectedTemplate={selectedTemplate}
              onOpenTemplateSelector={() => setShowTemplateSelector(true)}
            />
          </div>
        </div>
      </main>

      {/* Template Selector Modal */}
      <TemplateSelector
        isVisible={showTemplateSelector}
        onTemplateSelect={handleTemplateSelect}
        onClose={() => setShowTemplateSelector(false)}
      />

      {/* Footer */}
      <Footer baseUrl={baseUrl} showConnectionStatus={true} />
    </div>
  );
};

export default CreateAgentPage;
