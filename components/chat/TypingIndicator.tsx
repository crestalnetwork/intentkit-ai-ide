import React from "react";

interface TypingIndicatorProps {
  className?: string;
}

const TypingIndicator: React.FC<TypingIndicatorProps> = ({ className = "" }) => {
  return (
    <div className={`flex justify-start mb-4 ${className}`}>
      <div className="bg-gradient-to-br from-[var(--color-bg-card)] to-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-xl px-4 py-3 shadow-lg">
        <div className="flex space-x-1 items-center">
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
          <span className="text-xs text-[var(--color-text-tertiary)] ml-2">
            Agent is thinking...
          </span>
        </div>
      </div>
    </div>
  );
};

export default TypingIndicator;