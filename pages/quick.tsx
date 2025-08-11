import React, { useState, useEffect } from "react";
import Head from "next/head";
import { useRouter } from "next/router";
import { AgentTemplate } from "../lib/utils/templates";
import { templateToPrompt } from "../lib/utils/templateUtils";
import { showToast } from "../lib/utils/toast";
import apiClient, { AgentGenerateRequest } from "../lib/utils/apiClient";
import Header from "../components/Header";
import Footer from "../components/Footer";
import { AGENT_TEMPLATES } from "../lib/utils/templates";
import ChatInterface from "../components/ChatInterface";
import { Agent } from "../lib/types";
import logger from "../lib/utils/logger";
import { DEFAULT_BASE_URL, STORAGE_KEYS } from "../lib/utils/config";
import { trackQuickCreatorEvents } from "../lib/utils/mixpanel";
import { useAuth } from "@/context/AuthProvider";

const Quick: React.FC = () => {
  const [step, setStep] = useState<"templates" | "creating" | "chat">(
    "templates"
  );
  const [selectedTemplate, setSelectedTemplate] =
    useState<AgentTemplate | null>(null);
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [baseUrl, setBaseUrl] = useState<string>("");
  const { user, isAuthenticated, handleStartLogin } = useAuth();
  const router = useRouter();

  logger.component("mounted", "Quick", {
    step,
    hasTemplate: !!selectedTemplate,
    templateId: selectedTemplate?.id,
    isAuthenticated,
    userId: user?.id,
  });

  // Track page view on component mount
  useEffect(() => {
    trackQuickCreatorEvents.pageView();
  }, []);

  // Initialize base URL from config
  useEffect(() => {
    if (typeof window !== "undefined") {
      const storedUrl = localStorage.getItem(STORAGE_KEYS.BASE_URL);
      const defaultUrl = DEFAULT_BASE_URL;
      setBaseUrl(storedUrl || defaultUrl);
    }
  }, []);

  const handleBaseUrlChange = (newUrl: string) => {
    setBaseUrl(newUrl);
    localStorage.setItem(STORAGE_KEYS.BASE_URL, newUrl);
  };

  const handleTemplateSelect = (template: AgentTemplate) => {
    logger.info(
      "Template selected in quick creator",
      {
        templateId: template.id,
        templateName: template.name,
      },
      "Quick.handleTemplateSelect"
    );

    // Track template selection
    trackQuickCreatorEvents.templateSelected(template.id, template.name);

    setSelectedTemplate(template);

    if (!isAuthenticated) {
      logger.warn(
        "User not authenticated, showing auth modal",
        { templateId: template.id },
        "Quick.handleTemplateSelect"
      );
      handleStartLogin();
    } else {
      logger.info(
        "User authenticated, proceeding to create agent",
        { templateId: template.id },
        "Quick.handleTemplateSelect"
      );
      createAgentFromTemplate(template);
    }
  };

  const createAgentFromTemplate = async (template: AgentTemplate) => {
    if (!isAuthenticated || !user) {
      logger.error(
        "Cannot create agent - not authenticated",
        {
          hasTemplate: !!template,
          isAuthenticated,
          hasUser: !!user,
        },
        "Quick.createAgentFromTemplate"
      );
      showToast.error("Please sign in to create agents");
      return;
    }

    logger.info(
      "Starting agent generation from template using API",
      {
        templateId: template.id,
        userId: user.id,
      },
      "Quick.createAgentFromTemplate"
    );

    // Track agent creation started
    trackQuickCreatorEvents.agentCreationStarted(template.id, user.id);

    setStep("creating");
    setLoading(true);

    try {
      // Generate agent using the generation API
      const generateRequest: AgentGenerateRequest = {
        prompt: templateToPrompt(template),
        user_id: user.id,
        existing_agent: null,
        project_id: null,
      };

      logger.info(
        "Calling generateAgent API",
        {
          templateId: template.id,
          promptLength: generateRequest.prompt.length,
          userId: user.id,
        },
        "Quick.createAgentFromTemplate"
      );

      const response = await apiClient.generateAgent(generateRequest);

      logger.info(
        "Agent generation successful via API",
        {
          templateId: template.id,
          projectId: response.project_id,
          agentName: response.agent.name,
          skillsCount: response.activated_skills?.length || 0,
          autonomousTasksCount: response.autonomous_tasks?.length || 0,
        },
        "Quick.createAgentFromTemplate"
      );

      // Now create the agent using the generated configuration
      const createdAgent = await apiClient.createAgent(response.agent);

      logger.info(
        "Agent created successfully from generated configuration",
        {
          agentId: createdAgent.id,
          agentName: createdAgent.name,
          templateId: template.id,
          userId: user.id,
        },
        "Quick.createAgentFromTemplate"
      );

      setCreatedAgent(createdAgent);
      setStep("chat");

      // Track successful agent creation
      if (createdAgent.id && createdAgent.name) {
        trackQuickCreatorEvents.agentCreationCompleted(
          createdAgent.id,
          createdAgent.name,
          template.id,
          user.id
        );

        // Track chat started
        trackQuickCreatorEvents.chatStarted(
          createdAgent.id,
          template.id,
          user.id
        );
      }

      showToast.success(
        `Agent "${createdAgent.name}" created and ready to chat!`
      );
    } catch (error: any) {
      logger.error(
        "Failed to create agent from template",
        {
          templateId: template.id,
          error: error.message,
          status: error.response?.status,
          userId: user.id,
        },
        "Quick.createAgentFromTemplate"
      );

      console.error("Error creating agent:", error);
      setStep("templates");

      // Track failed agent creation
      trackQuickCreatorEvents.agentCreationFailed(
        template.id,
        error.message || "Unknown error",
        user.id
      );

      let errorMessage = "Failed to create agent";
      if (error.response?.status === 401) {
        errorMessage = "Authentication expired. Please sign in again.";
      } else if (error.response?.status === 422) {
        errorMessage =
          "Invalid agent configuration. Please try a different template.";
      } else if (error.response?.data?.message) {
        errorMessage = `Creation failed: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Creation failed: ${error.message}`;
      }

      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSuccess = () => {
    // After successful auth, create the agent if template is selected
    if (selectedTemplate) {
      logger.info(
        "Creating agent after successful auth",
        { templateId: selectedTemplate.id },
        "Quick.handleAuthSuccess"
      );
      createAgentFromTemplate(selectedTemplate);
    }
  };

  const handleBackToTemplates = () => {
    logger.info(
      "Navigating back to templates",
      {
        currentStep: step,
        agentId: createdAgent?.id,
      },
      "Quick.handleBackToTemplates"
    );
    setStep("templates");
    setSelectedTemplate(null);
    setCreatedAgent(null);
  };

  const handleGoToMainApp = () => {
    logger.info(
      "Navigating to main app",
      {
        agentId: createdAgent?.id,
      },
      "Quick.handleGoToMainApp"
    );

    // Track navigation to main app
    trackQuickCreatorEvents.navigatedToMainApp(step, createdAgent?.id);

    router.push("/");
  };

  const renderTemplateStep = () => (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-primary)]">
      {/* Compact Header Section */}
      <div className="p-4 text-center flex-shrink-0 border-b border-[var(--color-border-primary)]">
        <h1 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
          Quick Agent Creator
        </h1>
        <p className="text-sm text-[var(--color-text-secondary)] max-w-xl mx-auto">
          Choose a template to instantly create and chat with an AI agent.
        </p>
      </div>

      {/* Templates Grid */}
      <div className="flex-1 overflow-y-auto p-4">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {AGENT_TEMPLATES.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                disabled={loading}
                className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-lg p-4 text-left transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:scale-[1.02] hover:border-[var(--color-neon-lime-border)] hover-neon-glow-lime group"
              >
                <div className="flex items-start space-x-3">
                  {/* Icon */}
                  <div className="flex-shrink-0 w-10 h-10 bg-[var(--color-neon-lime-subtle)] border border-[var(--color-neon-lime-border)] rounded-lg flex items-center justify-center text-xl group-hover:bg-[var(--color-neon-lime)] group-hover:text-[var(--color-text-on-primary)] transition-all duration-200">
                    {template.icon}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-[var(--color-text-primary)] mb-1 text-sm group-hover:text-[var(--color-neon-lime)] transition-colors duration-200">
                      {template.name}
                    </h3>
                    <p className="text-xs text-[var(--color-text-secondary)] mb-2 line-clamp-2 leading-relaxed">
                      {template.description}
                    </p>

                    {/* Category Badge */}
                    <div className="flex items-center justify-between">
                      <span className="inline-block px-2 py-0.5 bg-[var(--color-neon-cyan-subtle)] text-xs text-[var(--color-neon-cyan)] rounded font-medium border border-[var(--color-neon-cyan-border)]">
                        {template.category}
                      </span>

                      {/* Skills Count */}
                      <span className="text-xs text-[var(--color-text-tertiary)]">
                        {Object.keys(template.skills).length} skills
                      </span>
                    </div>
                  </div>
                </div>

                {/* Hover Indicator */}
                <div className="mt-3 pt-2 border-t border-[var(--color-border-primary)] opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                  <div className="flex items-center justify-center space-x-2">
                    <svg
                      className="w-3 h-3 text-[var(--color-neon-lime)]"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M13 7l5 5m0 0l-5 5m5-5H6"
                      />
                    </svg>
                    <span className="text-xs font-medium text-[var(--color-neon-lime)]">
                      Create & Chat
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  const renderCreatingStep = () => (
    <div className="flex-1 flex flex-col overflow-hidden bg-[var(--color-bg-primary)]">
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center max-w-md mx-auto">
          {/* Loading Animation */}
          <div className="relative mb-8">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-[var(--color-border-primary)] border-t-[var(--color-neon-lime)] mx-auto neon-glow-lime" />
            <div className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-[var(--color-neon-cyan)] animate-pulse mx-auto" />
          </div>

          {/* Status Text */}
          <h2 className="text-xl sm:text-2xl font-bold text-[var(--color-text-primary)] mb-3">
            Creating Your Agent
          </h2>
          <p className="text-sm sm:text-base text-[var(--color-text-secondary)] mb-4">
            Generating and deploying {selectedTemplate?.name}...
          </p>

          {/* Progress Steps */}
          <div className="space-y-2">
            <div className="flex items-center justify-center space-x-2 text-xs text-[var(--color-text-tertiary)]">
              <div className="w-2 h-2 rounded-full bg-[var(--color-neon-lime)] animate-pulse neon-glow-lime" />
              <span>Analyzing template and generating agent configuration</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-xs text-[var(--color-text-tertiary)]">
              <div
                className="w-2 h-2 rounded-full bg-[var(--color-neon-cyan)] animate-pulse delay-200"
                style={{ boxShadow: "0 0 10px var(--color-neon-cyan-glow)" }}
              />
              <span>Setting up skills and autonomous tasks</span>
            </div>
            <div className="flex items-center justify-center space-x-2 text-xs text-[var(--color-text-tertiary)]">
              <div
                className="w-2 h-2 rounded-full bg-[var(--color-neon-purple)] animate-pulse delay-500"
                style={{ boxShadow: "0 0 10px var(--color-neon-purple-glow)" }}
              />
              <span>Deploying agent to network</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderChatStep = () => (
    <div className="flex-1 flex flex-col overflow-hidden min-h-0 bg-[var(--color-bg-primary)] h-full">
      {/* Chat Header */}
      <div className="p-3 border-b border-[var(--color-border-primary)] flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-2 sm:space-y-0 flex-shrink-0">
        <div className="flex-1 min-w-0">
          <h2 className="font-bold text-[var(--color-text-primary)] truncate text-base sm:text-lg">
            {createdAgent?.name}
          </h2>
          <div className="flex items-center space-x-2 mt-0.5">
            <span className="text-xs text-[var(--color-text-tertiary)]">
              {selectedTemplate?.name} Template
            </span>
            <span className="w-1 h-1 rounded-full bg-[var(--color-text-tertiary)]" />
            <span className="text-xs text-[var(--color-neon-lime)]">
              ● Ready
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex space-x-2 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={handleBackToTemplates}
            className="text-xs py-1.5 px-2 sm:px-3 rounded-lg whitespace-nowrap flex-1 sm:flex-none bg-[var(--color-bg-card)] border border-[var(--color-neon-cyan-border)] text-[var(--color-neon-cyan)] hover:bg-[var(--color-neon-cyan-subtle)] hover:border-[var(--color-neon-cyan)] transition-all duration-200"
          >
            New Agent
          </button>
          <button
            onClick={handleGoToMainApp}
            className="text-xs py-1.5 px-3 sm:px-4 rounded-lg text-[var(--color-text-on-primary)] whitespace-nowrap flex-1 sm:flex-none bg-[var(--color-neon-lime)] hover:bg-[var(--color-neon-lime-bright)] neon-glow-lime hover-neon-glow-lime transition-all duration-200 font-medium"
          >
            Advanced Interface
          </button>
        </div>
      </div>

      {/* Chat Interface */}
      <div className="flex-1 overflow-hidden min-h-0 h-full">
        {createdAgent && (
          <ChatInterface
            baseUrl={DEFAULT_BASE_URL}
            agent={createdAgent}
            viewMode="chat"
            onToggleViewMode={() => {}} // Not needed in quick mode
          />
        )}
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-[var(--color-bg-primary)] flex flex-col overflow-hidden">
      <Head>
        <title>Quick Agent Creator - IntentKit AI</title>
        <meta
          name="description"
          content="Create and chat with AI agents instantly using pre-built templates"
        />
        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no"
        />
      </Head>

      {/* Header */}
      <Header
        title="Quick Creator"
        showBaseUrl={false}
        baseUrl={baseUrl}
        onBaseUrlChange={handleBaseUrlChange}
      />

      {/* Main content - Full height for creating and chat steps */}
      <main
        className={`flex-1 flex flex-col overflow-hidden ${
          step === "creating" || step === "chat" ? "min-h-0" : ""
        }`}
      >
        {step === "templates" && renderTemplateStep()}
        {step === "creating" && renderCreatingStep()}
        {step === "chat" && renderChatStep()}
      </main>

      {/* Footer - Only show on templates step */}
      {step === "templates" && (
        <Footer
          baseUrl={baseUrl}
          showConnectionStatus={true}
          onBaseUrlChange={handleBaseUrlChange}
        />
      )}
    </div>
  );
};

export default Quick;
