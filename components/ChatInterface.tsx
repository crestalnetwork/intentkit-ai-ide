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
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-3`}
      >
        <div
          className={`${messageClasses} rounded-md py-2.5 px-3.5 max-w-[85%] break-words`}
        >
          {message.isJson ? (
            <div className="code-block">
              <SyntaxHighlighter
                language="json"
                style={materialDark}
                customStyle={{
                  margin: 0,
                  padding: "0.75rem",
                  borderRadius: "0.375rem",
                  maxHeight: "350px",
                  fontSize: "0.875rem",
                }}
              >
                {message.content}
              </SyntaxHighlighter>
            </div>
          ) : (
            <div className="whitespace-pre-wrap text-sm md:text-base">
              {message.content}
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTypingIndicator = () => {
    return (
      <div className="flex justify-start mb-3">
        <div className="bg-[#1e293b] border border-[#30363d] text-[#c9d1d9] rounded-md py-2.5 px-3.5 inline-flex items-center">
          <div className="typing-indicator flex space-x-1.5">
            <span className="w-2 h-2 rounded-full"></span>
            <span className="w-2 h-2 rounded-full"></span>
            <span className="w-2 h-2 rounded-full"></span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="bg-[#161b22] rounded-xl border border-[#30363d] flex flex-col h-full overflow-hidden">
      <div className="p-3 bg-[#161b22] text-[#c9d1d9] border-b border-[#30363d]">
        <h2 className="text-lg font-semibold">Chat with {agentName}</h2>
      </div>
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto p-4 space-y-3"
      >
        {messages.map((message, index) => renderMessage(message, index))}
        {loading && (
          <div className="flex justify-start mb-3">
            <div className="bg-[#1e293b] border border-[#30363d] text-[#c9d1d9] rounded-md py-2.5 px-3.5 inline-flex items-center">
              <div className="typing-indicator flex space-x-1.5">
                <span className="w-2 h-2 rounded-full"></span>
                <span className="w-2 h-2 rounded-full"></span>
                <span className="w-2 h-2 rounded-full"></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form
        onSubmit={handleSubmit}
        className="border-t border-[#30363d] p-3 flex items-end"
      >
        <input
          ref={inputRef}
          type="text"
          placeholder="Type your message..."
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          className="flex-1 p-2.5 bg-[#0d1117] border border-[#30363d] rounded-lg text-[#c9d1d9] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] text-sm md:text-base"
        />
        <button
          type="submit"
          disabled={loading}
          className="ml-2 px-4 py-2.5 bg-[#238636] text-white rounded-lg hover:bg-[#2ea043] disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none text-sm"
        >
          Send
        </button>
      </form>

      {showAuthModal && (
        <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-[#161b22] rounded-lg p-6 border border-[#30363d] max-w-md w-full">
            <h3 className="text-xl font-semibold text-[#c9d1d9] mb-4">
              Authentication Required
            </h3>
            {authError && (
              <div className="bg-[#3b1a1a] border border-[#f85149] text-[#f85149] p-3 rounded-md mb-4 text-sm">
                {authError}
              </div>
            )}
            <form onSubmit={handleAuthSubmit}>
              <div className="mb-4">
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-[#c9d1d9] mb-2"
                >
                  Username
                </label>
                <input
                  type="text"
                  id="username"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] text-sm"
                  required
                />
              </div>
              <div className="mb-4">
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-[#c9d1d9] mb-2"
                >
                  Password
                </label>
                <input
                  type="password"
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] text-sm"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowAuthModal(false)}
                  className="px-4 py-2 bg-[#21262d] text-[#c9d1d9] rounded-md border border-[#30363d] hover:bg-[#30363d] text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#238636] text-white rounded-md hover:bg-[#2ea043] text-sm"
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
