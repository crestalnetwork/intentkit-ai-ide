import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import {
  AgentCreatorProps,
  ConversationMessage,
  AgentGenerateRequest,
  AgentGenerateResponse,
  GenerationsListResponse,
} from "../types";

const AgentCreator: React.FC<AgentCreatorProps> = ({
  baseUrl,
  onAgentCreated,
  projectId,
}) => {
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [currentProjectId, setCurrentProjectId] = useState<string | null>(null);
  const [createdAgent, setCreatedAgent] = useState<Record<string, any> | null>(
    null
  );
  const [conversationHistory, setConversationHistory] = useState<
    ConversationMessage[]
  >([]);
  const [deployedAgent, setDeployedAgent] = useState<Record<
    string,
    any
  > | null>(null);
  const [deployLoading, setDeployLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load conversation when projectId changes
  useEffect(() => {
    if (projectId) {
      loadExistingConversation(projectId);
    } else {
      // Reset to welcome message for new conversation
      setMessages([
        {
          role: "assistant",
          content:
            'Hello! I\'m here to help you create a new IntentKit agent. Just describe what you want your agent to do, and I\'ll help you build it step by step. For example:\n\n• "Create an agent that helps track crypto prices"\n• "I need an agent for managing my DeFi portfolio"\n• "Build an agent that can answer questions about blockchain data"\n\nWhat kind of agent would you like to create?',
        },
      ]);
      setCurrentProjectId(null);
      setCreatedAgent(null);
      setDeployedAgent(null);
    }
  }, [projectId]);

  const loadExistingConversation = async (projectId: string) => {
    try {
      const apiBaseUrl = baseUrl.replace("localhost", "127.0.0.1");

      const response = await axios.get(
        `${apiBaseUrl}/agent/generations/${projectId}`
      );

      const conversationData = response.data;

      // Set the conversation history
      if (conversationData.conversation_history) {
        setMessages(conversationData.conversation_history);

        // Find the last agent in the conversation (without reversing the original array)
        const lastAgentMessage = [...conversationData.conversation_history]
          .reverse()
          .find((msg: ConversationMessage) => msg.metadata?.agent);

        if (lastAgentMessage?.metadata?.agent) {
          setCreatedAgent(lastAgentMessage.metadata.agent);
        }
      }

      setCurrentProjectId(projectId);
    } catch (error) {
      console.error("Error loading conversation:", error);
      // Fallback to welcome message if loading fails
      setMessages([
        {
          role: "assistant",
          content:
            "Sorry, I couldn't load that conversation. Let's start fresh! What kind of agent would you like to create?",
        },
      ]);
    }
  };

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle updates to message state
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage: ConversationMessage = {
      role: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue("");
    setLoading(true);

    try {
      // Convert localhost to 127.0.0.1 in the baseUrl
      const apiBaseUrl = baseUrl.replace("localhost", "127.0.0.1");

      // Prepare request payload
      const requestPayload: AgentGenerateRequest = {
        prompt: currentInput,
        user_id: "sandbox-user", // make this dynamic later
        project_id: currentProjectId || undefined,
        existing_agent: createdAgent || undefined, // Include existing agent for modifications
      };

      console.log("Sending agent generation request:", requestPayload);

      const response = await axios.post<AgentGenerateResponse>(
        `${apiBaseUrl}/agent/generate`,
        requestPayload
      );

      const { agent, project_id, summary, tags } = response.data;

      // Update current project ID if it's new
      if (!currentProjectId) {
        setCurrentProjectId(project_id);
      }

      // Set the created agent
      setCreatedAgent(agent);
      console.log("Agent schema created:", agent);

      // Add assistant response
      const assistantMessage: ConversationMessage = {
        role: "assistant",
        content: summary,
        metadata: {
          agent: agent,
          project_id: project_id,
          tags: tags,
        },
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error creating agent:", error);

      let errorMessage = "Failed to create agent";
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.detail) {
          errorMessage = `Error: ${
            error.response.data.detail.msg || error.response.data.detail
          }`;
        } else if (error.response?.data?.msg) {
          errorMessage = `Error: ${error.response.data.msg}`;
        } else if (error.message) {
          errorMessage = `Error: ${error.message}`;
        }
      }

      const errorMsg: ConversationMessage = {
        role: "assistant",
        content: errorMessage,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
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
                ✨ Agent Created Successfully!
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
                <div>
                  <span className="text-[#7d8590]">Skills:</span>{" "}
                  {Object.keys(message.metadata.agent.skills || {}).length >
                  0 ? (
                    <div className="mt-1">
                      {Object.keys(message.metadata.agent.skills || {}).map(
                        (skillName, index) => (
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
              </div>
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

  const exportAgent = () => {
    if (!createdAgent) return;

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
    console.log("Removing skill:", skillName);
    console.log("Current createdAgent:", createdAgent);

    if (!createdAgent || !createdAgent.skills) {
      console.log("No created agent or skills found");
      return;
    }

    // Create a copy of the agent without the specified skill
    const updatedAgent = {
      ...createdAgent,
      skills: { ...createdAgent.skills },
    };

    // Remove the skill
    delete updatedAgent.skills[skillName];

    console.log("Updated agent after skill removal:", updatedAgent);

    // Update the created agent
    setCreatedAgent(updatedAgent);

    // Update all existing messages that contain agent metadata to reflect the skill removal
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

    // Add a message to the chat showing the skill was removed
    const removalMessage: ConversationMessage = {
      role: "assistant",
      content: `✅ Removed "${skillName}" skill from the agent. The agent schema has been updated.`,
      metadata: {
        agent: updatedAgent,
        skillRemoved: skillName,
      },
    };

    setMessages((prev) => [...prev, removalMessage]);
  };

  const deployAgent = async () => {
    if (!createdAgent || deployLoading) return;

    setDeployLoading(true);

    try {
      const apiBaseUrl = baseUrl.replace("localhost", "127.0.0.1");

      // Get credentials from localStorage if available
      const username = localStorage.getItem("intentkit_username");
      const password = localStorage.getItem("intentkit_password");

      const config: any = {};
      if (username && password) {
        config.auth = {
          username,
          password,
        };
      }

      console.log("Deploying agent:", createdAgent);

      const response = await axios.post(
        `${apiBaseUrl}/agents`,
        createdAgent,
        config
      );

      setDeployedAgent(response.data);

      // Add success message to chat
      const successMessage: ConversationMessage = {
        role: "assistant",
        content: `🎉 Excellent! Your agent "${
          createdAgent.name || "Unnamed Agent"
        }" has been successfully deployed and is now ready to use! You can find it in the agents list on the main page.`,
        metadata: {
          deployedAgent: response.data,
          success: true,
        },
      };

      setMessages((prev) => [...prev, successMessage]);

      // Call callback if provided
      if (onAgentCreated) {
        onAgentCreated(response.data);
      }
    } catch (error) {
      console.error("Error deploying agent:", error);

      let errorMessage = "Failed to deploy agent";
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 401) {
          errorMessage =
            "Authentication required. Please check your credentials in the main settings.";
        } else if (error.response?.data?.detail) {
          errorMessage = `Deployment Error: ${error.response.data.detail}`;
        } else if (error.message) {
          errorMessage = `Deployment Error: ${error.message}`;
        }
      }

      const errorMsg: ConversationMessage = {
        role: "assistant",
        content: `❌ ${errorMessage}`,
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setDeployLoading(false);
    }
  };

  console.log("Render - createdAgent:", createdAgent);
  console.log("Render - deployedAgent:", deployedAgent);

  return (
    <div className="bg-[#0d1117] rounded-xl border border-[#30363d] h-full flex flex-col">
      {/* Header */}
      <div className="border-b border-[#30363d] p-4">
        <div className="flex justify-between items-center">
          <h2 className="text-lg font-semibold text-[#c9d1d9]">
            AI Agent Creator
          </h2>
          {createdAgent && (
            <div className="flex space-x-2">
              {!deployedAgent && (
                <button
                  onClick={deployAgent}
                  disabled={deployLoading}
                  className="text-sm py-1.5 px-3 bg-[#0969da] text-white rounded hover:bg-[#0550ae] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {deployLoading ? "Deploying..." : "🚀 Deploy Agent"}
                </button>
              )}
              <button
                onClick={exportAgent}
                className="text-sm py-1.5 px-3 bg-[#238636] text-white rounded hover:bg-[#2ea043] transition-colors"
              >
                📥 Export Schema
              </button>
            </div>
          )}
        </div>
        <p className="text-sm text-[#8b949e] mt-1">
          {deployedAgent
            ? "✅ Agent deployed successfully!"
            : createdAgent
            ? "Agent schema ready - deploy or export when satisfied"
            : "Describe your agent and I'll help you create it"}
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((message, index) => renderMessage(message, index))}
        {loading && renderTypingIndicator()}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[#30363d] p-4">
        <form onSubmit={handleSubmit} className="flex space-x-2">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Describe the agent you want to create..."
            className="flex-1 bg-[#161b22] border border-[#30363d] rounded-lg px-4 py-2 text-[#c9d1d9] placeholder-[#8b949e] focus:border-[#58a6ff] focus:outline-none"
            disabled={loading}
          />
          <button
            type="submit"
            disabled={loading || !inputValue.trim()}
            className="bg-[#238636] text-white px-4 py-2 rounded-lg hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? "Creating..." : "Send"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AgentCreator;
