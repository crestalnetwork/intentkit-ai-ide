import React, { useState, useEffect, useRef } from "react";
import { ChatInterfaceProps, ExtendedMessage } from "../lib/types";
import apiClient, {
  ChatThread,
  ChatMessage,
  SendMessageRequest,
} from "../lib/utils/apiClient";
import logger from "../lib/utils/logger";
import { showToast } from "../lib/utils/toast";
import theme from "../lib/utils/theme";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism";

// Custom markdown components with neon theme styling
const MarkdownComponents = {
  // Links
  a: ({ href, children, ...props }: any) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan-bright)] underline decoration-[var(--color-neon-cyan)] hover:decoration-[var(--color-neon-cyan-bright)] transition-colors font-medium"
      {...props}
    >
      {children}
    </a>
  ),

  // Code blocks
  code: ({ node, inline, className, children, ...props }: any) => {
    const match = /language-(\w+)/.exec(className || "");
    const language = match ? match[1] : "";

    if (!inline && language) {
      return (
        <div className="my-2">
          <SyntaxHighlighter
            style={oneDark}
            language={language}
            PreTag="div"
            className="rounded-md border border-[var(--color-border-secondary)]"
            {...props}
          >
            {String(children).replace(/\n$/, "")}
          </SyntaxHighlighter>
        </div>
      );
    }

    return (
      <code
        className="bg-[var(--color-bg-secondary)] text-[var(--color-neon-lime)] px-1 py-0.5 rounded text-sm font-mono border border-[var(--color-border-secondary)]"
        {...props}
      >
        {children}
      </code>
    );
  },

  // Headings
  h1: ({ children, ...props }: any) => (
    <h1
      className="text-xl font-bold text-[var(--color-text-primary)] mb-2 mt-4"
      {...props}
    >
      {children}
    </h1>
  ),
  h2: ({ children, ...props }: any) => (
    <h2
      className="text-lg font-semibold text-[var(--color-text-primary)] mb-2 mt-3"
      {...props}
    >
      {children}
    </h2>
  ),
  h3: ({ children, ...props }: any) => (
    <h3
      className="text-base font-medium text-[var(--color-text-primary)] mb-1 mt-2"
      {...props}
    >
      {children}
    </h3>
  ),

  // Lists
  ul: ({ children, ...props }: any) => (
    <ul
      className="list-disc list-inside space-y-1 my-2 text-[var(--color-text-primary)]"
      {...props}
    >
      {children}
    </ul>
  ),
  ol: ({ children, ...props }: any) => (
    <ol
      className="list-decimal list-inside space-y-1 my-2 text-[var(--color-text-primary)]"
      {...props}
    >
      {children}
    </ol>
  ),
  li: ({ children, ...props }: any) => (
    <li className="text-[var(--color-text-primary)]" {...props}>
      {children}
    </li>
  ),

  // Emphasis
  strong: ({ children, ...props }: any) => (
    <strong className="font-bold text-[var(--color-text-primary)]" {...props}>
      {children}
    </strong>
  ),
  em: ({ children, ...props }: any) => (
    <em className="italic text-[var(--color-text-secondary)]" {...props}>
      {children}
    </em>
  ),

  // Blockquotes
  blockquote: ({ children, ...props }: any) => (
    <blockquote
      className="border-l-4 border-[var(--color-neon-lime)] pl-4 my-2 bg-[var(--color-bg-secondary)] p-2 rounded-r italic text-[var(--color-text-secondary)]"
      {...props}
    >
      {children}
    </blockquote>
  ),

  // Paragraphs
  p: ({ children, ...props }: any) => (
    <p className="mb-2 last:mb-0" {...props}>
      {children}
    </p>
  ),

  // Tables
  table: ({ children, ...props }: any) => (
    <div className="overflow-x-auto my-2">
      <table
        className="min-w-full border border-[var(--color-border-primary)] rounded-md"
        {...props}
      >
        {children}
      </table>
    </div>
  ),
  thead: ({ children, ...props }: any) => (
    <thead className="bg-[var(--color-bg-secondary)]" {...props}>
      {children}
    </thead>
  ),
  tbody: ({ children, ...props }: any) => <tbody {...props}>{children}</tbody>,
  tr: ({ children, ...props }: any) => (
    <tr className="border-t border-[var(--color-border-primary)]" {...props}>
      {children}
    </tr>
  ),
  th: ({ children, ...props }: any) => (
    <th
      className="px-3 py-2 text-left font-medium text-[var(--color-text-primary)] border-r border-[var(--color-border-primary)] last:border-r-0"
      {...props}
    >
      {children}
    </th>
  ),
  td: ({ children, ...props }: any) => (
    <td
      className="px-3 py-2 text-[var(--color-text-secondary)] border-r border-[var(--color-border-primary)] last:border-r-0"
      {...props}
    >
      {children}
    </td>
  ),

  // Horizontal rule
  hr: ({ ...props }: any) => (
    <hr
      className="border-t border-[var(--color-border-primary)] my-4"
      {...props}
    />
  ),
};

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  baseUrl,
  agent,
  selectedThread,
  onToggleViewMode,
  viewMode = "chat",
  onNewChatCreated,
}) => {
  const [messages, setMessages] = useState<ExtendedMessage[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [chatThread, setChatThread] = useState<ChatThread | null>(null);
  const [initializingChat, setInitializingChat] = useState<boolean>(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add message history navigation state
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Get display name and agent ID
  const agentDisplayName = agent.name || agent.id || "Unknown Agent";
  const agentId = agent.id!;

  logger.component("mounted", "ChatInterface", {
    baseUrl,
    agentId,
    agentDisplayName,
  });

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle updates to message state
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Auto-resize textarea when input value changes programmatically
  useEffect(() => {
    if (inputRef.current) {
      const textarea = inputRef.current;
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 128) + "px";
    }
  }, [inputValue]);

  // Initialize chat thread when agent changes or when selectedThread is provided
  useEffect(() => {
    if (agentId) {
      if (selectedThread) {
        logger.info(
          "Using provided chat thread",
          { agentId, threadId: selectedThread.id },
          "ChatInterface.useEffect"
        );
        setChatThread(selectedThread);
        loadChatMessages(selectedThread.id);
        setInitializingChat(false);
      } else {
        logger.info(
          "Initializing new chat for agent",
          { agentId },
          "ChatInterface.useEffect"
        );
        initializeChatThread(false); // Don't force new on initial load
      }
    }
  }, [agentId, selectedThread]);

  const initializeChatThread = async (forceNew: boolean = false) => {
    logger.info(
      "Starting chat thread initialization",
      { agentId, forceNew },
      "ChatInterface.initializeChatThread"
    );
    setInitializingChat(true);

    try {
      let currentThread: ChatThread;

      if (forceNew) {
        // Always create a new thread when explicitly requested
        logger.info(
          "Creating new chat thread (forced)",
          { agentId },
          "ChatInterface.initializeChatThread"
        );
        currentThread = await apiClient.createChatThread(agentId);
        logger.info(
          "Created new chat thread (forced)",
          { agentId, threadId: currentThread.id },
          "ChatInterface.initializeChatThread"
        );

        // Notify parent component about new chat creation
        if (onNewChatCreated) {
          onNewChatCreated(currentThread);
        }
      } else {
        // Default behavior: try to get existing threads first
        const threads = await apiClient.getChatThreads(agentId);
        logger.info(
          "Retrieved chat threads",
          { agentId, threadCount: threads.length },
          "ChatInterface.initializeChatThread"
        );

        if (threads.length > 0) {
          // Use the most recent thread
          currentThread = threads[0];
          logger.info(
            "Using existing chat thread",
            { agentId, threadId: currentThread.id },
            "ChatInterface.initializeChatThread"
          );
        } else {
          // Create a new thread if none exist
          logger.info(
            "Creating new chat thread (no existing threads)",
            { agentId },
            "ChatInterface.initializeChatThread"
          );
          currentThread = await apiClient.createChatThread(agentId);
          logger.info(
            "Created new chat thread (no existing threads)",
            { agentId, threadId: currentThread.id },
            "ChatInterface.initializeChatThread"
          );
        }
      }

      setChatThread(currentThread);

      // Load existing messages for this thread (will be empty for new threads)
      await loadChatMessages(currentThread.id);
    } catch (error: any) {
      logger.error(
        "Failed to initialize chat thread",
        { agentId, forceNew, error: error.message },
        "ChatInterface.initializeChatThread"
      );
      console.error("Error initializing chat thread:", error);
    } finally {
      setInitializingChat(false);
    }
  };

  const loadChatMessages = async (threadId: string) => {
    logger.info(
      "Loading chat messages",
      { agentId, threadId },
      "ChatInterface.loadChatMessages"
    );
    try {
      const messagesResponse = await apiClient.getChatMessages(
        agentId,
        threadId
      );
      const chatMessages = messagesResponse.data || [];

      logger.info(
        "Chat messages loaded",
        { agentId, threadId, messageCount: chatMessages.length },
        "ChatInterface.loadChatMessages"
      );

      // Convert ChatMessage to ExtendedMessage format
      const extendedMessages: ExtendedMessage[] = chatMessages.map(
        (msg: ChatMessage) => ({
          id: msg.id,
          content: msg.message,
          sender: (msg.author_type === "web"
            ? "user"
            : msg.author_type === "agent"
            ? "agent"
            : "system") as "user" | "agent" | "system",
          timestamp: msg.created_at || new Date().toISOString(),
          skillCalls: msg.skill_calls || [],
        })
      );

      // Reverse the messages so oldest appear first (normal chat order)
      setMessages(extendedMessages.reverse());
    } catch (error: any) {
      logger.error(
        "Failed to load chat messages",
        { agentId, threadId, error: error.message },
        "ChatInterface.loadChatMessages"
      );
      console.error("Error loading chat messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!inputValue.trim() || !chatThread || loading) {
      logger.warn(
        "Message send blocked",
        {
          hasInput: !!inputValue.trim(),
          hasThread: !!chatThread,
          isLoading: loading,
        },
        "ChatInterface.sendMessage"
      );
      return;
    }

    const messageContent = inputValue.trim();
    logger.info(
      "Sending message",
      {
        agentId,
        threadId: chatThread.id,
        messageLength: messageContent.length,
      },
      "ChatInterface.sendMessage"
    );

    setLoading(true);

    // Add user message to UI immediately
    const userMessage: ExtendedMessage = {
      id: `temp-${Date.now()}`,
      content: messageContent,
      sender: "user",
      timestamp: new Date().toISOString(),
      skillCalls: [],
    };

    setMessages((prev) => [...prev, userMessage]);
    setInputValue("");

    // Add to message history for navigation
    setMessageHistory((prev) => [messageContent, ...prev.slice(0, 19)]); // Keep last 20
    setHistoryIndex(-1);

    try {
      const messageRequest: SendMessageRequest = {
        message: messageContent,
      };

      const responseMessages = await apiClient.sendMessage(
        agentId,
        chatThread.id,
        messageRequest
      );

      logger.info(
        "Message sent successfully",
        {
          agentId,
          threadId: chatThread.id,
          responseCount: responseMessages.length,
        },
        "ChatInterface.sendMessage"
      );

      // Remove the temporary user message and add all response messages
      setMessages((prev) => {
        const withoutTemp = prev.filter((msg) => msg.id !== userMessage.id);
        const newMessages = responseMessages.map((msg) => ({
          id: msg.id,
          content: msg.message,
          sender: (msg.author_type === "web"
            ? "user"
            : msg.author_type === "agent"
            ? "agent"
            : "system") as "user" | "agent" | "system",
          timestamp: msg.created_at || new Date().toISOString(),
          skillCalls: msg.skill_calls || [],
        }));

        // Check if the API response includes the user message
        const hasUserMessage = newMessages.some(
          (msg) => msg.sender === "user" && msg.content === messageContent
        );

        if (hasUserMessage) {
          // API included user message, use all response messages
          return [...withoutTemp, ...newMessages];
        } else {
          // API didn't include user message, keep the user message and add response messages
          const permanentUserMessage: ExtendedMessage = {
            ...userMessage,
            id: `user-${Date.now()}`, // Give it a permanent ID
          };
          return [...withoutTemp, permanentUserMessage, ...newMessages];
        }
      });
    } catch (error: any) {
      logger.error(
        "Failed to send message",
        {
          agentId,
          threadId: chatThread.id,
          error: error.message,
        },
        "ChatInterface.sendMessage"
      );

      console.error("Error sending message:", error);

      // Remove the temporary message and show error
      setMessages((prev) => prev.filter((msg) => msg.id !== userMessage.id));

      const errorMessage: ExtendedMessage = {
        id: `error-${Date.now()}`,
        content: `Error: ${error.message || "Failed to send message"}`,
        sender: "system",
        timestamp: new Date().toISOString(),
        skillCalls: [],
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
      // Refocus input after sending message for better UX
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      logger.debug(
        "Enter key pressed, sending message",
        { agentId },
        "ChatInterface.handleKeyDown"
      );
      sendMessage();
    } else if (
      e.key === "ArrowUp" &&
      messageHistory.length > 0 &&
      e.target instanceof HTMLTextAreaElement
    ) {
      // Only navigate history if cursor is at the beginning of the first line
      const textarea = e.target;
      const cursorPosition = textarea.selectionStart;
      const textBeforeCursor = textarea.value.substring(0, cursorPosition);
      const isAtFirstLine = !textBeforeCursor.includes("\n");
      const isAtBeginning = cursorPosition === 0;

      if (isAtFirstLine && isAtBeginning) {
        e.preventDefault();
        const newIndex = Math.min(historyIndex + 1, messageHistory.length - 1);
        setHistoryIndex(newIndex);
        setInputValue(messageHistory[newIndex]);
        logger.debug(
          "Message history navigation up",
          { newIndex, agentId },
          "ChatInterface.handleKeyDown"
        );
      }
    } else if (
      e.key === "ArrowDown" &&
      e.target instanceof HTMLTextAreaElement
    ) {
      // Only navigate history if cursor is at the end of the last line
      const textarea = e.target;
      const cursorPosition = textarea.selectionStart;
      const textAfterCursor = textarea.value.substring(cursorPosition);
      const isAtLastLine = !textAfterCursor.includes("\n");
      const isAtEnd = cursorPosition === textarea.value.length;

      if (isAtLastLine && isAtEnd) {
        e.preventDefault();
        if (historyIndex > 0) {
          const newIndex = historyIndex - 1;
          setHistoryIndex(newIndex);
          setInputValue(messageHistory[newIndex]);
          logger.debug(
            "Message history navigation down",
            { newIndex, agentId },
            "ChatInterface.handleKeyDown"
          );
        } else if (historyIndex === 0) {
          setHistoryIndex(-1);
          setInputValue("");
          logger.debug(
            "Message history cleared",
            { agentId },
            "ChatInterface.handleKeyDown"
          );
        }
      }
    }
  };

  const handleAgentApiKeys = () => {
    logger.info(
      "Agent API Keys button clicked",
      { agentId, agentName: agent.name },
      "ChatInterface.handleAgentApiKeys"
    );

    // Show feedback to user
    showToast.info("🔑 Navigating to Agent API Keys...");

    // Switch to detail view if currently in chat mode
    if (viewMode === "chat" && onToggleViewMode) {
      onToggleViewMode();
    }

    // Scroll to API keys section with improved timing and fallback
    const scrollToApiKeys = () => {
      const apiKeysElement = document.getElementById("agent-api-keys");
      logger.info(
        "Attempting to scroll to API keys section",
        { elementFound: !!apiKeysElement },
        "ChatInterface.scrollToApiKeys"
      );

      if (apiKeysElement) {
        // First, ensure the element is visible
        apiKeysElement.scrollIntoView({
          behavior: "smooth",
          block: "center",
          inline: "nearest",
        });

        // Add a subtle highlight effect
        apiKeysElement.style.boxShadow = `0 0 20px ${theme.colors.neon.cyan.glow}`;
        setTimeout(() => {
          apiKeysElement.style.boxShadow = "";
        }, 2000);

        logger.info(
          "Successfully scrolled to API keys section",
          {},
          "ChatInterface.scrollToApiKeys"
        );
      } else {
        logger.warn(
          "API keys element not found, retrying...",
          {},
          "ChatInterface.scrollToApiKeys"
        );
        // Retry after another delay if element not found
        setTimeout(scrollToApiKeys, 500);
      }
    };

    // Initial delay based on view mode
    setTimeout(scrollToApiKeys, viewMode === "chat" ? 600 : 200);
  };

  const renderTypingIndicator = () => (
    <div className="flex justify-start mb-4">
      <div className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] rounded-2xl rounded-bl-md px-4 py-3 max-w-xs">
        <div className="flex items-center space-x-1">
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
          <span className="text-sm text-[var(--color-text-tertiary)] ml-2">
            Agent is typing...
          </span>
        </div>
      </div>
    </div>
  );

  const renderMessage = (message: ExtendedMessage, index: number) => {
    const isUser = message.sender === "user";
    const isSystem = message.sender === "system";

    return (
      <div
        key={message.id}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-4`}
      >
        <div
          className={`max-w-[85%] sm:max-w-[70%] px-4 py-3 ${
            isUser
              ? "bg-[var(--color-neon-lime-subtle)] text-[var(--color-text-primary)] border-2 border-[var(--color-neon-lime-border)] rounded-2xl rounded-br-md"
              : isSystem
              ? "bg-[var(--color-neon-pink-subtle)] border border-[var(--color-neon-pink-border)] text-[var(--color-neon-pink)] rounded-2xl rounded-bl-md"
              : "bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] rounded-2xl rounded-bl-md"
          }`}
        >
          <div className="text-sm sm:text-base markdown-content">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={MarkdownComponents}
            >
              {message.content}
            </ReactMarkdown>
          </div>

          {/* Skill calls display */}
          {message.skillCalls && message.skillCalls.length > 0 && (
            <div className="mt-2 pt-2 border-t border-[var(--color-border-primary)]">
              <div className="text-xs text-[var(--color-text-tertiary)] mb-1">
                Skills used:
              </div>
              {message.skillCalls.map((skill: any, skillIndex: number) => (
                <div
                  key={skillIndex}
                  className="text-xs bg-[var(--color-bg-secondary)] rounded px-2 py-1 mb-1"
                >
                  <span className="text-[var(--color-neon-cyan)] font-medium">
                    {skill.name}
                  </span>
                  {skill.success ? (
                    <span className="text-[var(--color-neon-lime)] ml-2">
                      ✓
                    </span>
                  ) : (
                    <span className="text-[var(--color-neon-pink)] ml-2">
                      ✗
                    </span>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="text-xs text-[var(--color-text-muted)] mt-1 opacity-70">
            {new Date(message.timestamp).toLocaleTimeString()}
          </div>
        </div>
      </div>
    );
  };

  if (initializingChat) {
    return (
      <div className="bg-[var(--color-bg-primary)] sm:rounded-xl sm:border border-[var(--color-border-primary)] flex flex-col h-full overflow-hidden">
        <div className="p-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-b border-[var(--color-border-primary)] flex justify-between items-center">
          <div>
            <h2 className="text-base sm:text-lg font-semibold">
              Chat with {agentDisplayName}
            </h2>
          </div>
          {onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="inline-flex items-center space-x-1 sm:space-x-2 text-xs sm:text-sm py-1.5 sm:py-2 px-2 sm:px-4 bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] rounded-lg border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-neon-lime-border)] hover-neon-glow-lime transition-all duration-200"
            >
              <svg
                className="w-3 h-3 sm:w-4 sm:h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span className="hidden sm:inline">
                {viewMode === "chat" ? "View Details" : "Back to Chat"}
              </span>
              <span className="sm:hidden">
                {viewMode === "chat" ? "Details" : "Chat"}
              </span>
            </button>
          )}
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-2 border-[var(--color-border-secondary)] border-t-[var(--color-neon-lime)] mb-4 mx-auto"></div>
            <p className="text-[var(--color-text-tertiary)]">
              Initializing chat...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-[var(--color-bg-primary)] sm:rounded-xl sm:border border-[var(--color-border-primary)] flex flex-col h-full overflow-hidden">
      <div className="p-2 bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] border-b border-[var(--color-border-primary)] flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-1 sm:space-y-0">
        <div className="flex-1 min-w-0">
          <h2 className="text-base sm:text-lg font-semibold truncate">
            Chat with {agentDisplayName}
          </h2>
          {chatThread && (
            <p className="text-xs text-[var(--color-text-tertiary)] truncate">
              Thread: {chatThread.id}
            </p>
          )}
        </div>
        {/* Action Buttons */}
        <div className="flex space-x-2 flex-shrink-0 w-full sm:w-auto">
          <button
            onClick={() => {
              // Start a new chat - clear current thread and create new one
              setChatThread(null);
              setMessages([]);
              initializeChatThread(true); // Force new chat
              logger.info(
                "Starting new chat",
                { agentId },
                "ChatInterface.newChat"
              );
            }}
            className="inline-flex items-center space-x-2 text-sm py-2 px-4 bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] rounded hover:bg-[var(--color-neon-lime-bright)] neon-glow-lime hover:neon-glow-lime transition-all duration-200 whitespace-nowrap font-medium"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="var(--color-text-on-primary)"
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

          <button
            onClick={handleAgentApiKeys}
            className="inline-flex items-center space-x-2 text-sm py-2 px-4 bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] rounded border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-neon-cyan-border)] hover-neon-glow-cyan transition-all duration-200 whitespace-nowrap"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1721 9z"
              />
            </svg>
            <span>Agent API Keys</span>
          </button>

          {onToggleViewMode && (
            <button
              onClick={onToggleViewMode}
              className="inline-flex items-center space-x-2 text-sm py-2 px-4 bg-[var(--color-bg-card)] text-[var(--color-text-secondary)] rounded border border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)] hover:border-[var(--color-neon-cyan-border)] hover-neon-glow-cyan transition-all duration-200 whitespace-nowrap"
            >
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <span>
                {viewMode === "chat" ? "View Details" : "Back to Chat"}
              </span>
            </button>
          )}
        </div>
      </div>
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0"
      >
        {messages.length === 0 && !loading && (
          <div className="flex items-center justify-center h-full text-center">
            <div>
              <div className="text-4xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                Start chatting with {agentDisplayName}
              </h3>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                Type a message below to begin the conversation
              </p>
            </div>
          </div>
        )}
        {messages.map((message, index) => renderMessage(message, index))}
        {loading && renderTypingIndicator()}
        <div ref={messagesEndRef} />
      </div>
      <div className="border-t border-[var(--color-border-primary)] p-2 flex-shrink-0">
        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 p-3 sm:p-2 bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] focus:border-[var(--color-neon-lime-border)] placeholder:text-[var(--color-text-muted)] transition-all resize-none overflow-y-auto min-h-[2.75rem] max-h-32"
            disabled={loading || !chatThread}
            rows={1}
            style={{
              height: "auto",
            }}
            onInput={(e) => {
              // Auto-resize textarea based on content
              const target = e.target as HTMLTextAreaElement;
              target.style.height = "auto";
              target.style.height = Math.min(target.scrollHeight, 128) + "px"; // 128px = max-h-32
            }}
          />
          <button
            onClick={sendMessage}
            disabled={loading || !inputValue.trim() || !chatThread}
            className="px-4 py-3 sm:py-2 bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] rounded hover:bg-[var(--color-neon-lime-bright)] disabled:opacity-50 disabled:cursor-not-allowed neon-glow-lime hover:neon-glow-lime transition-all font-medium whitespace-nowrap"
          >
            {loading ? "..." : "Send"}
          </button>
        </div>
        {messageHistory.length > 0 && (
          <div className="text-xs text-[var(--color-text-muted)] mt-1 hidden sm:block">
            Use ↑↓ arrows to navigate message history • Shift+Enter for new line
          </div>
        )}
      </div>
    </div>
  );
};

export default ChatInterface;
