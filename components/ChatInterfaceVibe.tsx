import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/router";
import { ChatInterfaceProps, ExtendedMessage } from "../lib/types";
import apiClient, {
  ChatThread,
  ChatMessage,
  SendMessageRequest,
} from "../lib/utils/apiClient";
import logger from "../lib/utils/logger";
import { showToast } from "../lib/utils/toast";
import MessageComponent from "./chat/ChatMessage";
import TypingIndicator from "./chat/TypingIndicator";
import ChatInput from "./chat/ChatInput";

const ChatInterfaceVibe: React.FC<ChatInterfaceProps> = ({
  baseUrl,
  agent,
  selectedThread,
  onToggleViewMode,
  onNewChatCreated,
}) => {
  const router = useRouter();
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [currentThread, setCurrentThread] = useState<ChatThread | null>(
    selectedThread || null
  );
  const [showApiKeyPrompt, setShowApiKeyPrompt] = useState(false);
  const [messageHistory, setMessageHistory] = useState<string[]>([]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Helper function to generate enhanced welcome message
  const generateWelcomeMessage = (agent: any): string => {
    if (agent.example_intro) {
      return agent.example_intro;
    }

    let welcomeMessage = `Hello! I'm **${agent.name}**. `;
    
    if (agent.description) {
      welcomeMessage += `${agent.description}\n\n`;
    }
    
    if (agent.purpose) {
      welcomeMessage += `**Purpose:** ${agent.purpose}\n\n`;
    }
    
    if (agent.personality) {
      welcomeMessage += `**Personality:** ${agent.personality}\n\n`;
    }
    
    if (agent.principles) {
      welcomeMessage += `**Principles:** ${agent.principles}\n\n`;
    }
    
    welcomeMessage += "How can I help you today?";
    
    return welcomeMessage;
  };

  logger.component("mounted", "ChatInterfaceVibe", {
    agentId: agent.id,
    agentName: agent.name,
    threadId: currentThread?.id,
    baseUrl,
  });

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load chat history when thread changes
  useEffect(() => {
    if (selectedThread && selectedThread.id !== currentThread?.id) {
      setCurrentThread(selectedThread);
      loadChatHistory(selectedThread);
    }
  }, [selectedThread]);

  // Initialize with welcome message if no thread selected
  useEffect(() => {
    if (!currentThread && messages.length === 0) {
      const welcomeMessage: ExtendedMessage = {
        id: "welcome",
        content: generateWelcomeMessage(agent),
        sender: "agent",
        timestamp: new Date().toISOString(),
      };
      setMessages([welcomeMessage]);
    }
  }, [agent, currentThread, messages.length]);

  const loadChatHistory = async (thread: ChatThread) => {
    setIsLoadingHistory(true);
    try {
      logger.info(
        "Loading chat history",
        { threadId: thread.id },
        "ChatInterfaceVibe.loadChatHistory"
      );

      const chatResponse = await apiClient.getChatMessages(
        agent.id!,
        thread.id
      );
      const chatMessages = chatResponse.data || [];

      const formattedMessages: ExtendedMessage[] = chatMessages.map(
        (msg: ChatMessage) => ({
          id: msg.id,
          content: msg.message,
          sender: msg.author_type === "api" ? "user" : "agent",
          timestamp: msg.created_at,
          skillCalls: msg.skill_calls || [],
        })
      );

      setMessages(formattedMessages);
      
      // Extract user messages for history (only user messages, not agent responses)
      const userMessages = formattedMessages
        .filter(msg => msg.sender === "user")
        .map(msg => msg.content);
      setMessageHistory(userMessages);
      logger.info(
        "Chat history loaded",
        {
          threadId: thread.id,
          messageCount: formattedMessages.length,
        },
        "ChatInterfaceVibe.loadChatHistory"
      );
    } catch (error: any) {
      logger.error(
        "Failed to load chat history",
        {
          threadId: thread.id,
          error: error.message,
        },
        "ChatInterfaceVibe.loadChatHistory"
      );
      showToast.error("Failed to load chat history");
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const handleSendMessage = async () => {
    const messageContent = inputValue.trim();
    if (!messageContent || isLoading) return;

    logger.info(
      "Sending message",
      {
        agentId: agent.id,
        threadId: currentThread?.id,
        messageLength: messageContent.length,
      },
      "ChatInterfaceVibe.handleSendMessage"
    );

    // Add user message to UI immediately
    const userMessage: ExtendedMessage = {
      id: Date.now().toString(),
      content: messageContent,
      sender: "user",
      timestamp: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, userMessage]);
    setMessageHistory((prev) => [...prev, messageContent]);
    setInputValue("");
    setIsLoading(true);

    try {
      let threadId = currentThread?.id;

      // Create new thread if none exists
      if (!threadId) {
        logger.info(
          "Creating new chat thread",
          { agentId: agent.id },
          "ChatInterfaceVibe.handleSendMessage"
        );
        const newThread = await apiClient.createChatThread(agent.id!);
        threadId = newThread.id;
        setCurrentThread(newThread);

        if (onNewChatCreated) {
          onNewChatCreated(newThread);
        }

        logger.info(
          "New chat thread created",
          {
            threadId: newThread.id,
            agentId: agent.id,
          },
          "ChatInterfaceVibe.handleSendMessage"
        );
      }

      // Send message to API
      const sendRequest: SendMessageRequest = {
        message: messageContent,
      };

      const responses = await apiClient.sendMessage(
        agent.id!,
        threadId,
        sendRequest
      );

      // Add agent responses to UI (API returns array of messages)
      const newMessages: ExtendedMessage[] = responses
        .filter((msg) => msg.author_type !== "api") // Filter out user message (already added)
        .map((msg) => ({
          id: msg.id,
          content: msg.message,
          sender: msg.author_type === "api" ? "user" : "agent",
          timestamp: msg.created_at,
          skillCalls: msg.skill_calls || [],
        }));

      if (newMessages.length > 0) {
        setMessages((prev) => [...prev, ...newMessages]);

        logger.info(
          "Message sent successfully",
          {
            agentId: agent.id,
            threadId,
            responseCount: newMessages.length,
            skillCallsCount: newMessages.reduce(
              (acc, msg) => acc + (msg.skillCalls?.length || 0),
              0
            ),
          },
          "ChatInterfaceVibe.handleSendMessage"
        );
      }
    } catch (error: any) {
      logger.error(
        "Failed to send message",
        {
          agentId: agent.id,
          error: error.message,
          status: error.response?.status,
        },
        "ChatInterfaceVibe.handleSendMessage"
      );

      // Remove user message on error and show error message
      setMessages((prev) => prev.slice(0, -1));

      let errorMessage = "Failed to send message";
      if (error.response?.status === 401) {
        errorMessage = "Authentication required. Please sign in.";
      } else if (error.response?.status === 403) {
        errorMessage = "Access denied. Check your permissions.";
      } else if (error.response?.status === 429) {
        errorMessage =
          "Rate limit exceeded. Please wait before sending another message.";
      } else if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      } else if (error.message) {
        errorMessage = error.message;
      }

      // Add error message to chat
      const errorMsg: ExtendedMessage = {
        id: Date.now().toString(),
        content: `Error: ${errorMessage}`,
        sender: "system",
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMsg]);

      showToast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const handleNewChat = async () => {
    logger.info(
      "Starting new chat",
      { agentId: agent.id },
      "ChatInterfaceVibe.handleNewChat"
    );

    setCurrentThread(null);
    setMessages([]);
    setMessageHistory([]);

    // Add welcome message
    const welcomeMessage: ExtendedMessage = {
      id: "welcome",
      content: generateWelcomeMessage(agent),
      sender: "agent",
      timestamp: new Date().toISOString(),
    };
    setMessages([welcomeMessage]);
  };

  const handleEditAgent = () => {
    logger.info(
      "Navigating to edit agent",
      { agentId: agent.id },
      "ChatInterfaceVibe.handleEditAgent"
    );
    router.push(`/vibe?agentId=${agent.id}`);
  };

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
      {/* Chat Header - Simplified for Vibe */}
      <div className="border-b border-[var(--color-border-primary)] p-3 bg-gradient-to-r from-[var(--color-bg-card)] to-[var(--color-bg-secondary)]">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div>
              <h2 className="text-lg font-medium text-[var(--color-text-primary)]">
                {currentThread ? "Chat Session" : "Chat with " + agent.name}
              </h2>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            {/* Edit Agent and New Chat buttons for Vibe page */}
            <button
              onClick={handleEditAgent}
              className="inline-flex items-center space-x-1 text-xs py-1.5 px-3 bg-[var(--color-bg-tertiary)] text-[var(--color-neon-purple)] border border-[var(--color-neon-purple-border)] rounded hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-neon-purple)] hover-neon-glow-purple transition-all duration-200 font-medium"
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
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
              <span>Edit Agent</span>
            </button>
            <button
              onClick={handleNewChat}
              className="inline-flex items-center space-x-1 text-xs py-1.5 px-3 bg-[var(--color-bg-tertiary)] text-[var(--color-neon-cyan)] border border-[var(--color-neon-cyan-border)] rounded hover:bg-[var(--color-bg-secondary)] hover:border-[var(--color-neon-cyan)] hover-neon-glow-cyan transition-all duration-200 font-medium"
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
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>New Chat</span>
            </button>
          </div>
        </div>
      </div>

      {/* Messages Area - Fixed height with scrolling */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-2 bg-[var(--color-bg-primary)] min-h-0"
        style={{
          scrollbarWidth: "thin",
          scrollbarColor: "var(--color-neon-lime) transparent",
        }}
      >
        {isLoadingHistory ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[var(--color-neon-lime)]"></div>
            <span className="ml-3 text-[var(--color-text-secondary)]">
              Loading chat history...
            </span>
          </div>
        ) : (
          <>
            {messages.map((message, index) => (
              <MessageComponent
                key={message.id}
                message={message}
                index={index}
              />
            ))}
            {isLoading && <TypingIndicator />}
            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Chat Input - Always visible at bottom */}
      <ChatInput
        inputValue={inputValue}
        onInputChange={setInputValue}
        onSendMessage={handleSendMessage}
        isLoading={isLoading}
        placeholder={`Chat with ${agent.name}...`}
        maxLength={2000}
        messageHistory={messageHistory}
      />
    </div>
  );
};

export default ChatInterfaceVibe;