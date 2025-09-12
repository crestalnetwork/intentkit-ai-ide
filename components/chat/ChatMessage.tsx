import React from "react";
import { ExtendedMessage } from "../../lib/types";
import MarkdownRenderer from "./MarkdownRenderer";
import SkillCallsSection from "./SkillCallsSection";

interface ChatMessageProps {
  message: ExtendedMessage;
  index: number;
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message, index }) => {
  const isUser = message.sender === "user";
  const isSystem = message.sender === "system";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} mb-1`}>
      <div
        className={`max-w-[75%] relative ${
          isUser
            ? "bg-[var(--color-neon-lime)] text-black rounded-tl-2xl rounded-tr-lg rounded-bl-2xl rounded-br-sm shadow-lg"
            : isSystem
            ? "bg-red-500/20 text-red-400 border border-red-500/30 rounded-2xl"
            : "bg-[var(--color-bg-card)] text-[var(--color-text-primary)] border border-[var(--color-border-primary)] rounded-tl-sm rounded-tr-2xl rounded-bl-2xl rounded-br-2xl"
        } px-3 py-2 shadow-sm`}
      >
        {/* Message content */}
        <div className="message-content">
          {isUser ? (
            <div className="whitespace-pre-wrap break-words text-sm leading-snug">
              {message.content}
            </div>
          ) : (
            <div className="text-sm leading-snug">
              <MarkdownRenderer content={message.content} />
            </div>
          )}
        </div>

        {/* Skills section - only show for agent messages with skill calls */}
        {!isUser && message.skillCalls && message.skillCalls.length > 0 && (
          <div className="mt-2">
            <SkillCallsSection skillCalls={message.skillCalls} />
          </div>
        )}

        {/* Timestamp */}
        <div
          className={`text-xs mt-1 opacity-60 text-right ${
            isUser
              ? "text-gray-800"
              : isSystem
              ? "text-red-400"
              : "text-[var(--color-text-muted)]"
          }`}
        >
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </div>
      </div>
    </div>
  );
};

export default ChatMessage;