import React, { useRef, useEffect, useState } from "react";
import { Agent } from "@/lib/utils/apiClient";
import JsonEditorPanel from "../JsonEditorPanel";

export interface ConversationMessage {
  role: "user" | "assistant";
  content: string;
  created_at: string;
  metadata?: {
    agent?: Agent;
    projectId?: string;
    activatedSkills?: string[];
    autonomousTasks?: any[];
    tags?: any[];
    deployedAgent?: Agent;
    updatedAgent?: Agent;
    success?: boolean;
  };
}

interface AgentEditorProps {
  agent: Agent | null;
  isCreateMode: boolean;
  generating: boolean;
  inputValue: string;
  messages: ConversationMessage[];
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  onMessagesChange?: (messages: ConversationMessage[]) => void;
}

const AgentEditor: React.FC<AgentEditorProps> = ({
  agent,
  isCreateMode,
  generating,
  inputValue,
  messages,
  onInputChange,
  onSendMessage,
}) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const [showJsonEditorPanel, setShowJsonEditorPanel] = useState(false);

  // Auto-scroll to bottom when messages change or generating state changes
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, generating]);

  // Handle input key events
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  const renderMessage = (message: ConversationMessage, index: number) => {
    const isUser = message.role === "user";

    return (
      <div
        key={index}
        className={`flex ${isUser ? "justify-end" : "justify-start"} mb-2`}
      >
        <div
          className={`max-w-[85%] rounded-lg px-3 py-2 ${
            isUser
              ? "bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] neon-glow-lime"
              : "bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] text-[var(--color-text-primary)]"
          }`}
        >
          <div 
            className="whitespace-pre-wrap break-words text-sm"
            dangerouslySetInnerHTML={{ __html: message.content.replace(/\n/g, '<br>').replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
          />
          
          {/* Show success indicators */}
          {message.metadata?.success && (
            <div className="mt-2 text-xs text-[var(--color-success)]">
              Changes applied successfully!
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

  const renderTypingIndicator = () => (
    <div className="flex justify-start mb-2">
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

  return (
    <div className="flex flex-col h-full bg-[var(--color-bg-primary)] rounded-lg border border-[var(--color-border-primary)]">
      {/* Header */}
      <div className="border-b border-[var(--color-border-primary)] p-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              {isCreateMode ? "Create New Agent" : `Edit ${agent?.name || "Agent"}`}
            </h2>
            <p className="text-sm text-[var(--color-text-tertiary)] mt-1">
              {isCreateMode 
                ? "Describe the agent you want to create and I'll generate it for you."
                : "Describe the changes you want to make and I'll update your agent."
              }
            </p>
          </div>
          
          {/* JSON Editor Button - Only show for existing agents */}
          {!isCreateMode && agent && (
            <button
              onClick={() => setShowJsonEditorPanel(true)}
              className="inline-flex items-center space-x-1 text-xs py-1.5 px-3 bg-[var(--color-warning)] text-[var(--color-text-on-primary)] border border-[var(--color-neon-pink-border)] rounded hover:bg-[var(--color-neon-pink)] hover-neon-glow-pink transition-all duration-200 font-medium"
              title="Edit Agent JSON Configuration"
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
                  d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"
                />
              </svg>
              <span>Edit JSON</span>
            </button>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-0">
        {messages.map((message, index) => renderMessage(message, index))}
        {generating && renderTypingIndicator()}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="border-t border-[var(--color-border-primary)] p-2">
        <div className="flex space-x-3">
          <textarea
            ref={inputRef}
            value={inputValue}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              isCreateMode
                ? "Describe the agent you want to create..."
                : "Describe the changes you want to make..."
            }
            className="flex-1 bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded px-3 py-2 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-neon-lime-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] transition-all text-sm resize-none overflow-y-auto min-h-[40px] max-h-[120px]"
            disabled={generating}
            maxLength={1000}
            rows={2}
          />
          <button
            onClick={onSendMessage}
            disabled={generating || !inputValue.trim() || inputValue.trim().length < 10}
            className="bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] px-6 py-2 rounded hover:bg-[var(--color-neon-lime-bright)] disabled:opacity-50 disabled:cursor-not-allowed neon-glow-lime hover-neon-glow-lime transition-all font-medium text-sm whitespace-nowrap"
          >
            {generating ? "Generating..." : isCreateMode ? "Create" : "Update"}
          </button>
        </div>
        
        {/* Character count and validation */}
        <div className="flex justify-between text-xs mt-2">
          <div className="text-[var(--color-text-tertiary)]">
            {inputValue.length < 10 && inputValue.length > 0 && (
              <span className="text-[var(--color-neon-pink)]">
                Minimum 10 characters required
              </span>
            )}
            {inputValue.length >= 10 && (
              <span className="text-[var(--color-neon-lime)]">
                Ready to {isCreateMode ? "create" : "update"}
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

      {/* JSON Editor Panel */}
      {showJsonEditorPanel && (
        <JsonEditorPanel
          isVisible={showJsonEditorPanel}
          onClose={() => setShowJsonEditorPanel(false)}
          agent={agent}
          startInEditMode={true}
          onAgentUpdate={() => {
            // Refresh the agent data
            if (
              typeof window !== "undefined" &&
              (window as any).refreshSelectedAgent
            ) {
              (window as any).refreshSelectedAgent();
            }
          }}
        />
      )}
    </div>
  );
};

export default AgentEditor;