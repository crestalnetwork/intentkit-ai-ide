import React, { useState, useEffect, useRef } from "react";
import { AgentCreatorProps, ConversationMessage } from "../lib/types";
import { showToast } from "../lib/utils/toast";
import { templateToAgentConfig } from "../lib/utils/templateUtils";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import apiClient, { Agent, AgentGenerateRequest } from "../lib/utils/apiClient";
import logger from "../lib/utils/logger";

const AgentCreator: React.FC<AgentCreatorProps> = ({
  baseUrl,
  onAgentCreated,
  currentProjectId,
  selectedTemplate,
  onOpenTemplateSelector,
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [createdAgent, setCreatedAgent] = useState<Agent | null>(null);
  const [deployLoading, setDeployLoading] = useState<boolean>(false);
  const [inputValue, setInputValue] = useState<string>("");
  const [projectId, setProjectId] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useSupabaseAuth();

  logger.component("mounted", "AgentCreator", {
    baseUrl,
    currentProjectId,
    hasTemplate: !!selectedTemplate,
    templateId: selectedTemplate?.id,
    isAuthenticated,
    userId: user?.id,
  });

  // Initialize with welcome message
  useEffect(() => {
    logger.info(
      "Initializing AgentCreator with welcome message",
      { hasTemplate: !!selectedTemplate },
      "AgentCreator.useEffect"
    );
    const welcomeMessage: ConversationMessage = {
      role: "assistant",
      content: `Hello! I'm here to help you create a new IntentKit agent. ${
        selectedTemplate
          ? `I see you want to create a ${selectedTemplate.name} agent. I'll configure it for you.`
          : 'Click "Create Agent" to get started with a simple form, or describe what you want your agent to do and I\'ll help you set it up.\n\nFor example:\n• "Create an agent that helps track crypto prices"\n• "I need an agent for managing my DeFi portfolio"\n• "Build an agent that can answer questions about blockchain data"'
      }`,
      created_at: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  }, [selectedTemplate]);

  // Handle template selection
  useEffect(() => {
    if (selectedTemplate) {
      logger.info(
        "Template selected, creating agent from template",
        {
          templateId: selectedTemplate.id,
          templateName: selectedTemplate.name,
        },
        "AgentCreator.useEffect"
      );
      handleDirectTemplateCreation();
    }
  }, [selectedTemplate]);

  const handleDirectTemplateCreation = async () => {
    if (!selectedTemplate || !isAuthenticated || !user) {
      logger.error(
        "Cannot create agent from template",
        {
          hasTemplate: !!selectedTemplate,
          isAuthenticated,
          hasUser: !!user,
        },
        "AgentCreator.handleDirectTemplateCreation"
      );
      showToast.error("Please sign in to create agents");
      return;
    }

    logger.info(
      "Starting direct template creation",
      {
        templateId: selectedTemplate.id,
        userId: user.id,
      },
      "AgentCreator.handleDirectTemplateCreation"
    );

    try {
      // Convert template to agent configuration
      const agentConfig = templateToAgentConfig(selectedTemplate);
      logger.debug(
        "Template converted to agent config",
        {
          templateId: selectedTemplate.id,
          agentName: agentConfig.name,
        },
        "AgentCreator.handleDirectTemplateCreation"
      );

      // Create the agent data with user ownership
      const agentData: Agent = {
        name: agentConfig.name,
        purpose: agentConfig.purpose,
        personality: agentConfig.personality,
        principles: agentConfig.principles,
        model: agentConfig.model || "gpt-4o-mini",
        skills: agentConfig.skills,
        example_intro: agentConfig.example_intro,
        owner: user.id,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      setCreatedAgent(agentData);
      logger.info(
        "Agent configured from template",
        {
          templateId: selectedTemplate.id,
          agentName: agentData.name,
          userId: user.id,
        },
        "AgentCreator.handleDirectTemplateCreation"
      );

      // Add a success message to the conversation
      const successMessage: ConversationMessage = {
        role: "assistant",
        content: `✅ Your ${selectedTemplate.name} agent configuration is ready! Would you like to deploy this agent now, or make further edits before going live?\n\n🔧 CDP wallet integration will be automatically set up during deployment.`,
        created_at: new Date().toISOString(),
        metadata: {
          agent: agentData,
          template: selectedTemplate,
        },
      };
      setMessages((prev) => [...prev, successMessage]);
    } catch (error: any) {
      logger.error(
        "Failed to create agent from template",
        {
          templateId: selectedTemplate.id,
          error: error.message,
        },
        "AgentCreator.handleDirectTemplateCreation"
      );
      console.error("Error creating agent from template:", error);
      showToast.error("Failed to configure agent from template");

      const errorMessage: ConversationMessage = {
        role: "assistant",
        content:
          "Sorry, I encountered an error while configuring your agent from the template. Please try again.",
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || loading || !isAuthenticated) {
      logger.warn(
        "Message send blocked",
        {
          hasInput: !!inputValue.trim(),
          isLoading: loading,
          isAuthenticated,
        },
        "AgentCreator.handleSendMessage"
      );

      if (!isAuthenticated) {
        showToast.error("Please sign in to interact with the agent creator");
      }
      return;
    }

    const userInput = inputValue.trim();

    // Validate prompt length as per API requirements (10-1000 characters)
    if (userInput.length < 10) {
      showToast.error(
        "Please provide a more detailed description (at least 10 characters)"
      );
      return;
    }
    if (userInput.length > 1000) {
      showToast.error("Description is too long (maximum 1000 characters)");
      return;
    }

    logger.info(
      "User message sent to agent creator",
      {
        message: userInput,
        messageLength: userInput.length,
        hasProjectId: !!projectId,
        hasExistingAgent: !!createdAgent,
        userId: user?.id,
      },
      "AgentCreator.handleSendMessage"
    );

    // Add user message to conversation
    const userMessage: ConversationMessage = {
      role: "user",
      content: userInput,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");
    setLoading(true);

    try {
      // Call the generator API with proper payload structure
      const generateRequest: AgentGenerateRequest = {
        prompt: userInput,
        user_id: user!.id,
        project_id: projectId || null, // Explicitly set null if no project ID
        existing_agent: createdAgent || null, // Explicitly set null if no existing agent
      };

      logger.info(
        "Sending agent generation request",
        {
          promptLength: generateRequest.prompt.length,
          hasProjectId: !!generateRequest.project_id,
          hasExistingAgent: !!generateRequest.existing_agent,
          userId: generateRequest.user_id,
        },
        "AgentCreator.handleSendMessage"
      );

      const response = await apiClient.generateAgent(generateRequest);

      logger.info(
        "Agent generation successful",
        {
          projectId: response.project_id,
          agentName: response.agent.name,
          skillsCount: response.activated_skills?.length || 0,
          autonomousTasksCount: response.autonomous_tasks?.length || 0,
          tagsCount: response.tags?.length || 0,
          userId: user?.id,
        },
        "AgentCreator.handleSendMessage"
      );

      // Update project ID for future requests
      setProjectId(response.project_id);

      // The API now returns a complete Agent object, so we use it directly
      const generatedAgent: Agent = {
        ...response.agent,
        owner: user!.id, // Ensure owner is set
        created_at: response.agent.created_at || new Date().toISOString(),
        updated_at: response.agent.updated_at || new Date().toISOString(),
      };

      // Set the generated agent config (not deployed yet)
      setCreatedAgent(generatedAgent);

      // Create a more detailed summary message
      let summaryContent = response.summary;

      // Add information about activated skills and autonomous tasks
      if (response.activated_skills && response.activated_skills.length > 0) {
        summaryContent += `\n\n**Activated Skills:** ${response.activated_skills.join(
          ", "
        )}`;
      }

      if (response.autonomous_tasks && response.autonomous_tasks.length > 0) {
        summaryContent += `\n\n**Autonomous Tasks:** ${response.autonomous_tasks.length} task(s) configured`;
      }

      // Add AI response to conversation
      const aiMessage: ConversationMessage = {
        role: "assistant",
        content: summaryContent,
        created_at: new Date().toISOString(),
        metadata: {
          agent: generatedAgent,
          projectId: response.project_id,
          activatedSkills: response.activated_skills || [],
          autonomousTasks: response.autonomous_tasks || [],
          tags: response.tags || [],
        },
      };
      setMessages((prev) => [...prev, aiMessage]);

      showToast.success(
        "Agent configuration ready! Click Deploy Agent to make it live."
      );
    } catch (error: any) {
      logger.error(
        "Failed to generate agent",
        {
          message: userInput,
          error: error.message,
          status: error.response?.status,
          responseData: error.response?.data,
          userId: user?.id,
        },
        "AgentCreator.handleSendMessage"
      );

      console.error("Error generating agent:", error);

      let errorMessage = "Failed to generate agent configuration";

      // Handle different error types
      if (error.response?.status === 400) {
        // Bad request - could be validation error
        if (error.response?.data?.detail) {
          if (Array.isArray(error.response.data.detail)) {
            // Validation errors array
            const validationErrors = error.response.data.detail
              .map((err: any) => err.msg || err.message || String(err))
              .join(", ");
            errorMessage = `Validation error: ${validationErrors}`;
          } else {
            errorMessage = `Invalid request: ${error.response.data.detail}`;
          }
        } else if (error.response?.data?.message) {
          errorMessage = `Bad request: ${error.response.data.message}`;
        }
      } else if (error.response?.status === 401) {
        errorMessage = "Authentication expired. Please sign in again.";
      } else if (error.response?.status === 500) {
        errorMessage =
          "Agent generation failed on server. Please try again with a different description.";
      } else if (error.message.includes("Prompt must be between")) {
        errorMessage = error.message; // Our client-side validation message
      } else if (error.message.includes("user_id is required")) {
        errorMessage =
          "Authentication error. Please refresh and sign in again.";
      } else if (error.response?.data?.message) {
        errorMessage = `Generation failed: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Generation failed: ${error.message}`;
      }

      // Add error message to conversation
      const errorMsg: ConversationMessage = {
        role: "assistant",
        content: `I apologize, but I encountered an error while generating your agent: ${errorMessage}. Please try again with a different description, or copy support@crestal.network from your profile menu if the issue persists.`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);

      showToast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleDeployAgent = async () => {
    if (!createdAgent || deployLoading || !isAuthenticated) {
      logger.warn(
        "Cannot deploy agent",
        {
          hasAgent: !!createdAgent,
          isDeploying: deployLoading,
          isAuthenticated,
        },
        "AgentCreator.handleDeployAgent"
      );
      return;
    }

    logger.info(
      "Starting agent deployment",
      {
        agentName: createdAgent.name,
        userId: user?.id,
      },
      "AgentCreator.handleDeployAgent"
    );

    setDeployLoading(true);

    try {
      // Deploy the agent using the API client
      const deployedAgent = await apiClient.createAgent(createdAgent);
      logger.info(
        "Agent deployed successfully",
        {
          agentId: deployedAgent.id,
          agentName: deployedAgent.name,
          userId: user?.id,
        },
        "AgentCreator.handleDeployAgent"
      );

      showToast.success(
        `Agent "${createdAgent.name || "Unnamed Agent"}" deployed successfully!`
      );

      // Add deployment success message with wallet info if available
      let deployContent = `🎉 Excellent! Your agent "${deployedAgent.name}" has been successfully deployed and is now ready to use! You can find it in the agents list on the main page.`;

      if (deployedAgent.cdp_wallet_address) {
        deployContent += `\n\n💼 CDP Wallet provisioned: ${deployedAgent.cdp_wallet_address.slice(
          0,
          6
        )}...${deployedAgent.cdp_wallet_address.slice(-4)}`;
        if (deployedAgent.network_id || deployedAgent.cdp_network_id) {
          deployContent += `\n🌐 Network: ${
            deployedAgent.network_id || deployedAgent.cdp_network_id
          }`;
        }
      }

      const deployMessage: ConversationMessage = {
        role: "assistant",
        content: deployContent,
        created_at: new Date().toISOString(),
        metadata: {
          deployedAgent: deployedAgent,
          success: true,
        },
      };
      setMessages((prev) => [...prev, deployMessage]);

      // Update the created agent with deployed version (includes ID)
      setCreatedAgent(deployedAgent);

      // Notify parent component
      if (onAgentCreated) {
        logger.debug(
          "Notifying parent of agent creation",
          { agentId: deployedAgent.id },
          "AgentCreator.handleDeployAgent"
        );
        onAgentCreated(deployedAgent);
      }
    } catch (error: any) {
      logger.error(
        "Failed to deploy agent",
        {
          agentName: createdAgent.name,
          error: error.message,
          status: error.response?.status,
        },
        "AgentCreator.handleDeployAgent"
      );

      console.error("Error deploying agent:", error);
      let errorMessage = "Failed to deploy agent";

      if (error.response?.status === 401) {
        errorMessage = "Authentication expired. Please sign in again.";
      } else if (error.response?.data?.message) {
        errorMessage = `Deployment failed: ${error.response.data.message}`;
      } else if (error.message) {
        errorMessage = `Deployment failed: ${error.message}`;
      }

      showToast.error(errorMessage);

      const failureMessage: ConversationMessage = {
        role: "assistant",
        content: `❌ ${errorMessage}. If this error persists, copy support@crestal.network from your profile menu for assistance.`,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, failureMessage]);
    } finally {
      setDeployLoading(false);
    }
  };

  const handleExportAgent = () => {
    if (!createdAgent) return;

    logger.info(
      "Exporting agent schema",
      { agentName: createdAgent.name },
      "AgentCreator.handleExportAgent"
    );

    const dataStr = JSON.stringify(createdAgent, null, 2);
    const dataUri =
      "data:application/json;charset=utf-8," + encodeURIComponent(dataStr);
    const exportFileDefaultName = `${createdAgent.name || "agent"}.json`;

    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportFileDefaultName);
    linkElement.click();
  };

  const removeSkillFromAgent = (skillName: string) => {
    if (!createdAgent || !createdAgent.skills) {
      logger.warn(
        "Cannot remove skill - no agent or skills",
        { skillName },
        "AgentCreator.removeSkillFromAgent"
      );
      return;
    }

    logger.info(
      "Removing skill from agent",
      {
        skillName,
        agentName: createdAgent.name,
      },
      "AgentCreator.removeSkillFromAgent"
    );

    const updatedAgent = {
      ...createdAgent,
      skills: { ...createdAgent.skills },
    };

    delete updatedAgent.skills[skillName];
    setCreatedAgent(updatedAgent);

    // Update all existing messages that contain agent metadata
    setMessages((prevMessages) => {
      return prevMessages.map((msg) => {
        if (msg.metadata?.agent && msg.role === "assistant") {
          return {
            ...msg,
            metadata: {
              ...msg.metadata,
              agent: updatedAgent,
            },
          };
        }
        return msg;
      });
    });

    // Add a message showing the skill was removed
    const removalMessage: ConversationMessage = {
      role: "assistant",
      content: `✅ Removed "${skillName}" skill from the agent. The agent schema has been updated.`,
      created_at: new Date().toISOString(),
      metadata: {
        agent: updatedAgent,
        skillRemoved: skillName,
      },
    };

    setMessages((prev) => [...prev, removalMessage]);
  };

  const renderMessage = (message: ConversationMessage, index: number) => {
    const isUser = message.role === "user";

    return (
      <div
        key={index}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-3 py-2 ${
            isUser
              ? "bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] neon-glow-lime"
              : "bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
          }`}
        >
          <div className="whitespace-pre-wrap break-words text-sm">
            {message.content}
          </div>

          {/* Show agent preview if this message contains agent data */}
          {message.metadata?.agent && (
            <div className="mt-3 p-3 bg-[var(--color-bg-secondary)] rounded border border-[var(--color-border-secondary)]">
              <div className="flex items-center justify-between mb-2">
                <div className="text-sm font-medium text-[var(--color-neon-cyan)]">
                  ✅ Your agent configuration is ready!
                </div>
                {!message.metadata.agent.id && (
                  <button
                    onClick={handleDeployAgent}
                    disabled={deployLoading}
                    className="text-xs py-1.5 px-3 bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] rounded hover:bg-[var(--color-neon-lime-bright)] disabled:opacity-50 disabled:cursor-not-allowed neon-glow-lime hover-neon-glow-lime transition-all font-medium"
                  >
                    {deployLoading ? "🚀 Deploying..." : "🚀 Deploy Agent"}
                  </button>
                )}
                {message.metadata.agent.id && (
                  <span className="text-xs py-1.5 px-3 bg-[var(--color-success)] text-[var(--color-text-on-primary)] rounded font-medium">
                    ✅ Deployed
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--color-text-tertiary)] mb-2">
                Would you like to deploy this agent now, or make further edits
                before going live?
              </p>
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-[var(--color-text-tertiary)]">
                    Name:
                  </span>{" "}
                  <span className="text-[var(--color-text-primary)]">
                    {message.metadata.agent.name || "Unnamed Agent"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-tertiary)]">
                    Purpose:
                  </span>{" "}
                  <span className="text-[var(--color-text-secondary)]">
                    {message.metadata.agent.purpose || "No purpose defined"}
                  </span>
                </div>
                <div>
                  <span className="text-[var(--color-text-tertiary)]">
                    Model:
                  </span>{" "}
                  <span className="text-[var(--color-text-secondary)]">
                    {message.metadata.agent.model || "Default"}
                  </span>
                </div>

                {/* Show activated skills from API response */}
                {message.metadata.activatedSkills &&
                  message.metadata.activatedSkills.length > 0 && (
                    <div>
                      <span className="text-[var(--color-text-tertiary)]">
                        Activated Skills:
                      </span>
                      <div className="mt-1">
                        {message.metadata.activatedSkills.map(
                          (skillName: string) => (
                            <span
                              key={skillName}
                              className="inline-flex items-center bg-[var(--color-neon-cyan-subtle)] text-[var(--color-neon-cyan)] text-xs px-2 py-1 rounded mr-1 mb-1 border border-[var(--color-neon-cyan-border)]"
                            >
                              {skillName}
                            </span>
                          )
                        )}
                      </div>
                    </div>
                  )}

                {/* Show configured skills (editable) */}
                <div>
                  <span className="text-[var(--color-text-tertiary)]">
                    Configured Skills:
                  </span>{" "}
                  {Object.keys(message.metadata.agent.skills || {}).length >
                  0 ? (
                    <div className="mt-1">
                      {Object.keys(message.metadata.agent.skills || {}).map(
                        (skillName) => (
                          <span
                            key={skillName}
                            className="inline-flex items-center bg-[var(--color-neon-lime-subtle)] text-[var(--color-neon-lime)] text-xs px-2 py-1 rounded mr-1 mb-1 border border-[var(--color-neon-lime-border)] group"
                          >
                            {skillName}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeSkillFromAgent(skillName);
                              }}
                              className="ml-1 text-[var(--color-text-muted)] hover:text-[var(--color-neon-pink)] transition-colors opacity-0 group-hover:opacity-100"
                              title={`Remove ${skillName} skill`}
                            >
                              ×
                            </button>
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    <span className="text-[var(--color-text-secondary)]">
                      No skills configured
                    </span>
                  )}
                </div>

                {/* Show autonomous tasks if any */}
                {message.metadata.autonomousTasks &&
                  message.metadata.autonomousTasks.length > 0 && (
                    <div>
                      <span className="text-[var(--color-text-tertiary)]">
                        Autonomous Tasks:
                      </span>{" "}
                      <span className="text-[var(--color-text-secondary)]">
                        {message.metadata.autonomousTasks.length} task(s)
                        configured
                      </span>
                    </div>
                  )}

                {/* Show CDP wallet information if available */}
                {message.metadata?.agent &&
                  (message.metadata.agent.wallet_provider === "cdp" ||
                    message.metadata.agent.cdp_wallet_address) && (
                    <div>
                      <span className="text-[var(--color-text-tertiary)]">
                        Wallet:
                      </span>{" "}
                      <span className="text-[var(--color-neon-cyan)]">
                        CDP enabled
                      </span>
                      {message.metadata.agent.cdp_wallet_address && (
                        <div className="mt-1 flex items-center space-x-2">
                          <span className="text-[var(--color-text-tertiary)] text-xs">
                            Address:
                          </span>
                          <code className="text-[var(--color-text-secondary)] font-mono text-xs bg-[var(--color-bg-secondary)] px-1 py-0.5 rounded">
                            {message.metadata.agent.cdp_wallet_address}
                          </code>
                          <button
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              if (message.metadata?.agent?.cdp_wallet_address) {
                                navigator.clipboard.writeText(
                                  message.metadata.agent.cdp_wallet_address
                                );
                              }
                            }}
                            className="text-[var(--color-text-muted)] hover:text-[var(--color-neon-cyan)] transition-colors text-xs"
                            title="Copy wallet address"
                          >
                            📋
                          </button>
                        </div>
                      )}
                      {(message.metadata.agent.network_id ||
                        message.metadata.agent.cdp_network_id) && (
                        <div className="mt-1">
                          <span className="text-[var(--color-text-tertiary)] text-xs">
                            Network:
                          </span>{" "}
                          <span className="text-[var(--color-text-secondary)] text-xs">
                            {message.metadata.agent.network_id ||
                              message.metadata.agent.cdp_network_id}
                          </span>
                        </div>
                      )}
                    </div>
                  )}

                {/* Show project ID for tracking */}
                {message.metadata.projectId && (
                  <div>
                    <span className="text-[var(--color-text-tertiary)]">
                      Project ID:
                    </span>{" "}
                    <span className="text-[var(--color-text-secondary)] font-mono text-xs">
                      {message.metadata.projectId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {message.created_at && (
            <div className="text-xs text-[var(--color-text-muted)] mt-2 opacity-70">
              {new Date(message.created_at).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTypingIndicator = () => {
    return (
      <div className="flex justify-start mb-3">
        <div className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)] rounded-lg px-3 py-2">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-[var(--color-neon-lime)] rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-[var(--color-neon-lime)] rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-[var(--color-neon-lime)] rounded-full animate-bounce"
              style={{ animationDelay: "0.2s" }}
            ></div>
          </div>
        </div>
      </div>
    );
  };

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)] h-full flex flex-col">
      {/* Compact Header */}
      <div className="border-b border-[var(--color-border-primary)] p-3">
        <div className="flex justify-between items-center">
          <div className="flex-1">
            <div className="flex items-center space-x-3">
              <div>
                <h2 className="text-base font-semibold text-[var(--color-text-primary)]">
                  {selectedTemplate
                    ? `Create ${selectedTemplate.name}`
                    : "AI Agent Creator"}
                </h2>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-0.5">
                  {createdAgent
                    ? createdAgent.id
                      ? "Agent successfully deployed and ready to use"
                      : "Agent configuration ready - deploy to make it live"
                    : "Describe your agent and I'll help you create it"}
                </p>
              </div>

              {/* Selected Template Display */}
              {selectedTemplate && (
                <div className="flex items-center space-x-2 px-2 py-1 bg-[var(--color-neon-lime-subtle)] border border-[var(--color-neon-lime-border)] rounded text-xs">
                  <span className="text-sm">{selectedTemplate.icon}</span>
                  <span className="text-[var(--color-text-primary)] font-medium">
                    {selectedTemplate.name}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Template Button - Only show if no agent is created yet */}
            {!createdAgent && (
              <button
                onClick={() => {
                  if (onOpenTemplateSelector) {
                    onOpenTemplateSelector();
                  }
                }}
                className="inline-flex items-center space-x-1 text-xs py-1.5 px-3 bg-[var(--color-bg-card)] text-[var(--color-neon-cyan)] border border-[var(--color-neon-cyan-border)] rounded hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-neon-cyan)] hover-neon-glow-cyan transition-all duration-200 font-medium"
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
                    d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
                  />
                </svg>
                <span>Templates</span>
              </button>
            )}

            {/* Agent Action Buttons */}
            {createdAgent && (
              <>
                {createdAgent.id && (
                  <span className="text-xs py-1.5 px-3 bg-[var(--color-success)] text-[var(--color-text-on-primary)] rounded font-medium">
                    ✅ Deployed
                  </span>
                )}
                <button
                  onClick={handleExportAgent}
                  className="text-xs py-1.5 px-3 bg-[var(--color-neon-cyan)] text-[var(--color-text-on-primary)] rounded hover:bg-[var(--color-neon-cyan-bright)] hover-neon-glow-cyan transition-all font-medium"
                >
                  📥 Export
                </button>
              </>
            )}
          </div>
        </div>
        {!isAuthenticated && (
          <div className="mt-2 p-2 bg-[var(--color-neon-pink-subtle)] border border-[var(--color-neon-pink-border)] rounded text-xs">
            <p className="text-[var(--color-neon-pink)]">
              <strong>Authentication Required:</strong> Please sign in to create
              agents
            </p>
          </div>
        )}
      </div>

      {/* Messages - Flexible height */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 min-h-0">
        {messages.map((message, index) => renderMessage(message, index))}
        {loading && renderTypingIndicator()}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input - Fixed at bottom */}
      {isAuthenticated && (
        <div className="border-t border-[var(--color-border-primary)] p-3">
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the agent you want to create..."
                className="flex-1 bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded px-3 py-2 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-neon-lime-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] transition-all text-sm"
                disabled={loading}
                maxLength={1000}
              />
              <button
                onClick={handleSendMessage}
                disabled={
                  loading || !inputValue.trim() || inputValue.trim().length < 10
                }
                className="bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] px-4 py-2 rounded hover:bg-[var(--color-neon-lime-bright)] disabled:opacity-50 disabled:cursor-not-allowed neon-glow-lime hover-neon-glow-lime transition-all font-medium text-sm"
              >
                {loading ? "Generating..." : "Send"}
              </button>
            </div>

            {/* Character count and validation */}
            <div className="flex justify-between text-xs">
              <div className="text-[var(--color-text-tertiary)]">
                {inputValue.length < 10 && inputValue.length > 0 && (
                  <span className="text-[var(--color-neon-pink)]">
                    Minimum 10 characters required
                  </span>
                )}
                {inputValue.length >= 10 && (
                  <span className="text-[var(--color-neon-lime)]">
                    Ready to generate
                  </span>
                )}
              </div>
              <div
                className={`${
                  inputValue.length > 900
                    ? "text-[var(--color-neon-pink)]"
                    : inputValue.length > 800
                    ? "text-[var(--color-warning)]"
                    : "text-[var(--color-text-tertiary)]"
                }`}
              >
                {inputValue.length}/1000
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Authentication Warning */}
      {!isAuthenticated && (
        <div className="border-t border-[var(--color-border-primary)] p-3">
          <div className="bg-[var(--color-neon-pink-subtle)] border border-[var(--color-neon-pink-border)] rounded p-3 text-center">
            <p className="text-[var(--color-neon-pink)] text-sm">
              Please sign in to create and deploy agents
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCreator;
