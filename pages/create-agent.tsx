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
import theme from "../lib/utils/theme";

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
    <div className="min-h-screen bg-[#0d1117] flex flex-col h-screen">
      <Head>
        <title>Create Agent - IntentKit AI</title>
        <meta
          name="description"
          content="Create a new IntentKit agent with AI assistance"
        />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      {/* Header */}
      <Header
        title="Create New Agent"
        backLink={{
          href: "/",
          label: "Back to Sandbox",
        }}
        showBaseUrl={false}
        baseUrl={baseUrl}
      />

      {/* Authentication Warning */}
      {!isAuthenticated && (
        <div className="bg-[#fef3cd]/10 border-b border-[#fef3cd]/20 px-4 py-3">
          <div className="flex items-center justify-between">
            <p className="text-[#fef3cd] text-sm">
              Please sign in to create agents. You can use the Quick Creator for
              a streamlined experience.
            </p>
            <Link
              href="/quick"
              className={`text-sm py-1.5 px-3 bg-[${theme.colors.primary.main}] text-[${theme.colors.text.onPrimary}] rounded hover:bg-[${theme.colors.primary.hover}] transition-colors`}
            >
              Go to Quick Creator
            </Link>
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="flex-1 overflow-hidden">
        <div className="h-full p-4">
          <AgentCreator
            baseUrl={baseUrl}
            onAgentCreated={handleAgentCreated}
            currentProjectId={undefined}
            selectedTemplate={selectedTemplate}
          />
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
