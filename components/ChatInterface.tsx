import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { materialDark } from "react-syntax-highlighter/dist/cjs/styles/prism";
import { ChatInterfaceProps, Message } from "../types";

const ChatInterface: React.FC<ChatInterfaceProps> = ({
  baseUrl,
  agentName,
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const [showAuthModal, setShowAuthModal] = useState<boolean>(false);
  const [username, setUsername] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [authError, setAuthError] = useState<string | null>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Add message history navigation state
  const [messageHistory, setMessageHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  // Handle updates to message state
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // Add welcome message when agent changes
    if (agentName) {
      setMessages([
        {
          role: "assistant",
          content: `Hello! I'm the ${agentName} agent. You can ask me questions about token prices, wallet balances, or search for tokens.`,
        },
      ]);
    }
  }, [agentName]);

  // Check for stored credentials
  useEffect(() => {
    const storedUsername = localStorage.getItem("intentkit_username");
    const storedPassword = localStorage.getItem("intentkit_password");

    if (storedUsername && storedPassword) {
      setUsername(storedUsername);
      setPassword(storedPassword);
    }
  }, []);

  // Add key handlers for message history navigation
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowUp") {
      e.preventDefault();
      // If we're not already navigating history, save current input
      if (historyIndex === -1 && inputValue.trim()) {
        setMessageHistory([...messageHistory, inputValue]);
      }

      // Navigate up in history if possible
      if (historyIndex < messageHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInputValue(messageHistory[messageHistory.length - 1 - newIndex]);
      }
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      // Navigate down in history
      if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInputValue(messageHistory[messageHistory.length - 1 - newIndex]);
      } else if (historyIndex === 0) {
        // Clear input when reaching bottom of history
        setHistoryIndex(-1);
        setInputValue("");
      }
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || loading) return;

    const userMessage: Message = { role: "user", content: inputValue };
    setMessages((prev) => [...prev, userMessage]);

    // Add to message history if not already navigating
    if (historyIndex === -1 && !messageHistory.includes(inputValue)) {
      setMessageHistory((prev) => [...prev, inputValue]);
    }

    // Reset history index
    setHistoryIndex(-1);

    const currentInput = inputValue;
    setInputValue("");
    setLoading(true);

    try {
      // Convert localhost to 127.0.0.1 in the baseUrl
      const apiBaseUrl = baseUrl.replace("localhost", "127.0.0.1");
      console.log(
        `chat_interface.js: Sending query to ${apiBaseUrl}/debug/${agentName}/chat?q=${encodeURIComponent(
          currentInput
        )}`
      );

      // Set auth header if credentials are available
      const config: any = {};
      if (username && password) {
        config.auth = {
          username: username,
          password: password,
        };
      }

      const response = await axios.get(
        `${apiBaseUrl}/debug/${agentName}/chat?q=${encodeURIComponent(
          currentInput
        )}`,
        config
      );

      // Get the bot's response
      let botContent = "";

      if (typeof response.data === "object") {
        // If it's a JSON object
        botContent = JSON.stringify(response.data, null, 2);
      } else {
        // If it's a string or other type
        botContent = String(response.data);
      }

      const assistantMessage: Message = {
        role: "assistant",
        content: botContent,
        isJson: typeof response.data === "object",
        rawData: response.data,
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error sending message:", error);

      // Check if it's an auth error
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        setShowAuthModal(true);
        setAuthError("Authentication required. Please enter your credentials.");
      }

      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${
          error instanceof Error ? error.message : "Failed to get response"
        }`,
        isError: true,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Store credentials in localStorage
    localStorage.setItem("intentkit_username", username);
    localStorage.setItem("intentkit_password", password);

    setAuthError(null);
    setShowAuthModal(false);

    // Retry the last message if there is one
    if (messages.length > 0 && messages[messages.length - 2]?.role === "user") {
      const lastUserMessage = messages[messages.length - 2].content;
      setInputValue(lastUserMessage);

      // Trigger submit after state updates
      setTimeout(() => {
        const form = document.querySelector("form");
        if (form) form.dispatchEvent(new Event("submit", { cancelable: true }));
      }, 100);
    }
  };

  const renderMessage = (message: Message, index: number) => {
    const isUser = message.role === "user";
    const messageClasses = isUser
      ? "bg-[#0d1117] border border-[#30363d] text-[#c9d1d9] ml-auto"
      : message.isError
      ? "bg-[#3b1a1a] border border-[#f85149] text-[#f85149]"
      : "bg-[#1e293b] border border-[#30363d] text-[#c9d1d9]";

    return (
      <div
        key={index}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-1.5`}
      >
        <div
          className={`${messageClasses} rounded-md py-1.5 px-2.5 max-w-[85%] break-words`}
        >
          {message.isJson ? (
            <div className="code-block">
              <SyntaxHighlighter
                language="json"
                style={materialDark}
                customStyle={{
                  margin: 0,
                  padding: "0.5rem",
                  borderRadius: "0.25rem",
                  maxHeight: "300px",
                  fontSize: "0.75rem",
                }}
              >
                {message.content}
              </SyntaxHighlighter>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-xs md:text-sm">
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTypingIndicator = () => {
    return (
      <div className="flex justify-start mb-2">
        <div className="bg-[#1e293b] border border-[#30363d] text-[#c9d1d9] rounded-md py-1.5 px-3 inline-flex items-center">
          <div className="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div
      ref={chatContainerRef}
      className="bg-[#161b22] rounded-xl border border-[#30363d] h-full flex flex-col overflow-hidden"
    >
      <div className="p-2 bg-[#161b22] border-b border-[#30363d] flex justify-between items-center">
        <h2 className="text-md font-semibold text-[#c9d1d9] truncate">
          Chat with {agentName || "IntentKit Agent"}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-2 bg-[#0d1117]">
        <div className="flex flex-col">
          {messages.map(renderMessage)}
          {loading && renderTypingIndicator()}
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="p-2 bg-[#161b22] border-t border-[#30363d]">
        <form onSubmit={handleSubmit} className="flex">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type your message..."
            className="flex-1 py-1.5 px-2 bg-[#0d1117] border border-[#30363d] rounded-l text-[#c9d1d9] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] text-sm"
            disabled={loading || !agentName}
          />
          <button
            type="submit"
            className={`px-3 rounded-r text-white focus:outline-none focus:ring-1 focus:ring-[#58a6ff] text-sm ${
              loading || !inputValue.trim() || !agentName
                ? "bg-[#21262d] cursor-not-allowed"
                : "bg-[#238636] hover:bg-[#2ea043]"
            }`}
            disabled={loading || !inputValue.trim() || !agentName}
          >
            Send
          </button>
        </form>
      </div>

      {showAuthModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#161b22] rounded-lg border border-[#30363d] p-4 w-80 auth-modal">
            <h3 className="text-lg font-semibold text-[#c9d1d9] mb-3">
              Authentication Required
            </h3>
            {authError && (
              <div className="mb-3 text-sm text-[#f85149]">{authError}</div>
            )}
            <form onSubmit={handleAuthSubmit}>
              <div className="mb-2">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-[#8b949e] mb-1"
                >
                  Username
                </label>
                <input
                  id="username"
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-1.5 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] text-sm"
                  required
                />
              </div>
              <div className="mb-3">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#8b949e] mb-1"
                >
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-1.5 bg-[#0d1117] border border-[#30363d] rounded text-[#c9d1d9] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] text-sm"
                  required
                />
              </div>
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="mr-2 px-3 py-1 bg-[#21262d] text-[#c9d1d9] rounded border border-[#30363d] text-sm hover:bg-[#30363d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-3 py-1 bg-[#238636] text-white rounded border border-[#238636] text-sm hover:bg-[#2ea043]"
                >
                  Login
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <style jsx>{`
        .typing-indicator {
          display: flex;
          align-items: center;
        }
        .typing-indicator span {
          height: 8px;
          width: 8px;
          margin: 0 1px;
          background-color: #8b949e;
          border-radius: 50%;
          display: inline-block;
          opacity: 0.4;
        }
        .typing-indicator span:nth-child(1) {
          animation: pulse 1s infinite ease-in-out;
        }
        .typing-indicator span:nth-child(2) {
          animation: pulse 1s infinite ease-in-out 0.2s;
        }
        .typing-indicator span:nth-child(3) {
          animation: pulse 1s infinite ease-in-out 0.4s;
        }
        @keyframes pulse {
          0% {
            opacity: 0.4;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.2);
          }
          100% {
            opacity: 0.4;
            transform: scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default ChatInterface;
