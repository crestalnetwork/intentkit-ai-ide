import React, { useRef, useEffect, useState } from "react";

interface ChatInputProps {
  inputValue: string;
  onInputChange: (value: string) => void;
  onSendMessage: () => void;
  isLoading: boolean;
  placeholder?: string;
  disabled?: boolean;
  maxLength?: number;
  className?: string;
  messageHistory?: string[];
}

const ChatInput: React.FC<ChatInputProps> = ({
  inputValue,
  onInputChange,
  onSendMessage,
  isLoading,
  placeholder = "Type your message...",
  disabled = false,
  maxLength = 2000,
  className = "",
  messageHistory = [],
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [originalInputValue, setOriginalInputValue] = useState("");

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;
      textarea.style.height = "auto";
      textarea.style.height = Math.min(textarea.scrollHeight, 120) + "px";
    }
  }, [inputValue]);

  // Reset history navigation when user manually changes input
  useEffect(() => {
    if (historyIndex >= 0) {
      const currentHistoryValue =
        messageHistory[messageHistory.length - 1 - historyIndex];
      if (
        inputValue !== currentHistoryValue &&
        inputValue !== originalInputValue
      ) {
        setHistoryIndex(-1);
        setOriginalInputValue("");
      }
    }
  }, [inputValue, historyIndex, messageHistory, originalInputValue]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (!isLoading && !disabled && inputValue.trim()) {
        // Reset history navigation when sending
        setHistoryIndex(-1);
        setOriginalInputValue("");
        onSendMessage();
      }
    } else if (e.key === "ArrowUp" && !e.shiftKey && !e.ctrlKey && !e.metaKey) {
      e.preventDefault();
      if (messageHistory.length > 0) {
        // Save current input value when starting navigation
        if (historyIndex === -1) {
          setOriginalInputValue(inputValue);
        }

        const newIndex = Math.min(historyIndex + 1, messageHistory.length - 1);
        setHistoryIndex(newIndex);
        onInputChange(messageHistory[messageHistory.length - 1 - newIndex]);
      }
    } else if (
      e.key === "ArrowDown" &&
      !e.shiftKey &&
      !e.ctrlKey &&
      !e.metaKey
    ) {
      e.preventDefault();
      if (historyIndex > -1) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);

        if (newIndex === -1) {
          // Restore original input value
          onInputChange(originalInputValue);
          setOriginalInputValue("");
        } else {
          onInputChange(messageHistory[messageHistory.length - 1 - newIndex]);
        }
      }
    }
  };

  const handleSend = () => {
    if (!isLoading && !disabled && inputValue.trim()) {
      // Reset history navigation when sending
      setHistoryIndex(-1);
      setOriginalInputValue("");
      onSendMessage();
    }
  };

  const charactersRemaining = maxLength - inputValue.length;
  const isNearLimit = charactersRemaining < 100;

  return (
    <div
      className={`border-t border-[var(--color-border-primary)] p-1 ${className}`}
    >
      <div className="space-y-3">
        <div className="flex space-x-3 items-end">
          <div className="flex-1 relative  ">
            <textarea
              ref={textareaRef}
              value={inputValue}
              onChange={(e) => onInputChange(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={placeholder}
              disabled={disabled}
              maxLength={maxLength}
              rows={1}
              className="w-full bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded-lg px-4 py-3 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:border-[var(--color-neon-lime-border)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] transition-all resize-none overflow-y-auto min-h-[48px] max-h-[120px] text-sm leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed"
              style={{
                scrollbarWidth: "thin",
                scrollbarColor: "var(--color-neon-lime) transparent",
              }}
            />

            {/* Character count indicator */}
            {isNearLimit && (
              <div className="absolute -top-6 right-2 text-xs text-[var(--color-text-tertiary)]">
                <span
                  className={
                    charactersRemaining < 50
                      ? "text-[var(--color-neon-pink)]"
                      : ""
                  }
                >
                  {charactersRemaining} chars remaining
                </span>
              </div>
            )}
          </div>

          <button
            onClick={handleSend}
            disabled={disabled || isLoading || !inputValue.trim()}
            className="bg-gradient-to-r from-[var(--color-neon-lime)] to-[var(--color-neon-lime-bright)] text-[var(--color-text-on-primary)] px-6 rounded-lg font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap min-w-[80px] flex items-center justify-center"
            style={{ minHeight: "48px" }}
          >
            {isLoading ? (
              <div className="flex items-center space-x-2">
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Sending...</span>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <span>Send</span>
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
                    d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                  />
                </svg>
              </div>
            )}
          </button>
        </div>

        {/* Helper text */}
        <div className="flex justify-between items-center text-xs">
          <div className="text-[var(--color-text-tertiary)]">
            Press Enter to send, Shift+Enter for new line
          </div>
          <div className="text-[var(--color-text-tertiary)]">
            {inputValue.length}/{maxLength}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatInput;
