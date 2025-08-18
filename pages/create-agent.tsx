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
import { STORAGE_KEYS, DEFAULT_BASE_URL } from "../lib/utils/config";
import { useAuth } from "@/context/AuthProvider";

const CreateAgentPage: React.FC = () => {
  const router = useRouter();
  const [baseUrl, setBaseUrl] = useState<string>("");
  const [showTemplateSelector, setShowTemplateSelector] =
    useState<boolean>(false);
  const [selectedTemplate, setSelectedTemplate] = useState<
    AgentTemplate | undefined
  >(undefined);
  const { isAuthenticated } = useAuth();

  // Redirect to home if not authenticated
  useEffect(() => {
    if (!isAuthenticated) {
      router.push("/");
      return;
    }
  }, [isAuthenticated, router]);

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

  const handleBaseUrlChange = (newUrl: string) => {
    setBaseUrl(newUrl);
    localStorage.setItem(STORAGE_KEYS.BASE_URL, newUrl);
  };

  // Show loading/redirect state if not authenticated
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-border-secondary)] border-t-[var(--color-neon-lime)] mb-4 mx-auto"></div>
          <p className="text-[var(--color-text-tertiary)]">Redirecting...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col h-screen">
      <Head>
        <title>Create Agent - IntentKit AI</title>
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
        onBaseUrlChange={handleBaseUrlChange}
      />

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
      <Footer
        baseUrl={baseUrl}
        showConnectionStatus={true}
        onBaseUrlChange={handleBaseUrlChange}
      />
    </div>
  );
};

export default CreateAgentPage;
