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
        content: `Great! I've configured your ${selectedTemplate.name} agent from the template. Your agent configuration is ready! Click the "Deploy Agent" button to make it live.`,
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

      showToast.success("Agent configuration generated successfully!");
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
        content: `I apologize, but I encountered an error while generating your agent: ${errorMessage}. Please try again with a different description.`,
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

      // Add deployment success message
      const deployMessage: ConversationMessage = {
        role: "assistant",
        content: `🎉 Excellent! Your agent "${deployedAgent.name}" has been successfully deployed and is now ready to use! You can find it in the agents list on the main page.`,
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
        content: `❌ ${errorMessage}`,
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
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`max-w-[80%] rounded-lg px-4 py-3 ${
            isUser
              ? "bg-[#0969da] text-white"
              : "bg-[#161b22] border border-[#30363d] text-[#c9d1d9]"
          }`}
        >
          <div className="whitespace-pre-wrap break-words">
            {message.content}
          </div>

          {/* Show agent preview if this message contains agent data */}
          {message.metadata?.agent && (
            <div className="mt-4 p-3 bg-[#0d1117] rounded border border-[#21262d]">
              <div className="text-sm font-medium text-[#58a6ff] mb-2">
                ✨ Agent Configuration Generated!
              </div>
              <div className="text-xs space-y-1">
                <div>
                  <span className="text-[#7d8590]">Name:</span>{" "}
                  {message.metadata.agent.name || "Unnamed Agent"}
                </div>
                <div>
                  <span className="text-[#7d8590]">Purpose:</span>{" "}
                  {message.metadata.agent.purpose || "No purpose defined"}
                </div>
                <div>
                  <span className="text-[#7d8590]">Model:</span>{" "}
                  {message.metadata.agent.model || "Default"}
                </div>

                {/* Show activated skills from API response */}
                {message.metadata.activatedSkills &&
                  message.metadata.activatedSkills.length > 0 && (
                    <div>
                      <span className="text-[#7d8590]">Activated Skills:</span>
                      <div className="mt-1">
                        {message.metadata.activatedSkills.map(
                          (skillName: string) => (
                            <span
                              key={skillName}
                              className="inline-flex items-center bg-[#21262d] text-[#58a6ff] text-xs px-2 py-1 rounded mr-1 mb-1"
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
                  <span className="text-[#7d8590]">Configured Skills:</span>{" "}
                  {Object.keys(message.metadata.agent.skills || {}).length >
                  0 ? (
                    <div className="mt-1">
                      {Object.keys(message.metadata.agent.skills || {}).map(
                        (skillName) => (
                          <span
                            key={skillName}
                            className="inline-flex items-center bg-[#21262d] text-[#58a6ff] text-xs px-2 py-1 rounded mr-1 mb-1 group"
                          >
                            {skillName}
                            <button
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                removeSkillFromAgent(skillName);
                              }}
                              className="ml-1 text-[#8b949e] hover:text-[#f85149] transition-colors opacity-0 group-hover:opacity-100"
                              title={`Remove ${skillName} skill`}
                            >
                              ×
                            </button>
                          </span>
                        )
                      )}
                    </div>
                  ) : (
                    "No skills configured"
                  )}
                </div>

                {/* Show autonomous tasks if any */}
                {message.metadata.autonomousTasks &&
                  message.metadata.autonomousTasks.length > 0 && (
                    <div>
                      <span className="text-[#7d8590]">Autonomous Tasks:</span>{" "}
                      <span className="text-[#c9d1d9]">
                        {message.metadata.autonomousTasks.length} task(s)
                        configured
                      </span>
                    </div>
                  )}

                {/* Show project ID for tracking */}
                {message.metadata.projectId && (
                  <div>
                    <span className="text-[#7d8590]">Project ID:</span>{" "}
                    <span className="text-[#c9d1d9] font-mono text-xs">
                      {message.metadata.projectId}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}

          {message.created_at && (
            <div className="text-xs opacity-70 mt-2">
              {new Date(message.created_at).toLocaleTimeString()}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTypingIndicator = () => {
    return (
      <div className="flex justify-start mb-4">
        <div className="bg-[#161b22] border border-[#30363d] text-[#c9d1d9] rounded-lg px-4 py-3">
          <div className="flex space-x-1">
            <div className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce"></div>
            <div
              className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce"
              style={{ animationDelay: "0.1s" }}
            ></div>
            <div
              className="w-2 h-2 bg-[#58a6ff] rounded-full animate-bounce"
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
    <div className="bg-[#0d1117] rounded-xl border border-[#30363d] h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-[#30363d] p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#c9d1d9]">
            {selectedTemplate
              ? `Create ${selectedTemplate.name}`
              : "AI Agent Creator"}
          </h2>
          {createdAgent && (
            <div className="flex space-x-2">
              {!createdAgent.id ? (
                <button
                  onClick={handleDeployAgent}
                  disabled={deployLoading}
                  className="text-sm py-1.5 px-3 bg-[#0969da] text-white rounded hover:bg-[#0550ae] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deployLoading ? "🚀 Deploying..." : "🚀 Deploy Agent"}
                </button>
              ) : (
                <span className="text-sm py-1.5 px-3 bg-[#238636] text-white rounded">
                  ✅ Deployed
                </span>
              )}
              <button
                onClick={handleExportAgent}
                className="text-sm py-1.5 px-3 bg-[#238636] text-white rounded hover:bg-[#2ea043] transition-colors"
              >
                📥 Export Schema
              </button>
            </div>
          )}
        </div>
        <p className="text-sm text-[#8b949e] mt-1">
          {createdAgent
            ? createdAgent.id
              ? "Agent successfully deployed and ready to use"
              : "Agent configuration ready - deploy to make it live"
            : "Describe your agent and I'll help you create it"}
        </p>
        {!isAuthenticated && (
          <div className="mt-2 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs">
            <p className="text-yellow-800">
              <strong>Authentication Required:</strong> Please sign in to create
              agents
            </p>
          </div>
        )}
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => renderMessage(message, index))}
        {loading && renderTypingIndicator()}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input */}
      {isAuthenticated && (
        <div className="border-t border-[#30363d] p-4">
          <div className="space-y-2">
            <div className="flex space-x-2">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Describe the agent you want to create..."
                className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2 text-[#c9d1d9] placeholder-[#8b949e] focus:border-[#58a6ff] focus:outline-none"
                disabled={loading}
                maxLength={1000}
              />
              <button
                onClick={handleSendMessage}
                disabled={
                  loading || !inputValue.trim() || inputValue.trim().length < 10
                }
                className="bg-[#238636] text-white px-4 py-2 rounded-lg hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? "Generating..." : "Send"}
              </button>
            </div>

            {/* Character count and validation */}
            <div className="flex justify-between text-xs">
              <div className="text-[#8b949e]">
                {inputValue.length < 10 && inputValue.length > 0 && (
                  <span className="text-[#f85149]">
                    Minimum 10 characters required
                  </span>
                )}
                {inputValue.length >= 10 && (
                  <span className="text-[#238636]">Ready to generate</span>
                )}
              </div>
              <div
                className={`${
                  inputValue.length > 900
                    ? "text-[#f85149]"
                    : inputValue.length > 800
                    ? "text-[#e3b341]"
                    : "text-[#8b949e]"
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
        <div className="border-t border-[#30363d] p-4">
          <div className="bg-[#fef3cd]/10 border border-[#fef3cd]/20 rounded-lg p-3 text-center">
            <p className="text-[#fef3cd] text-sm">
              Please sign in to create and deploy agents
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default AgentCreator;
