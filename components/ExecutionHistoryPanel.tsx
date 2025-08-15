import React, { useState, useEffect } from "react";
import { ChatMessage, AutonomousTask } from "../lib/utils/apiClient";

interface ExecutionHistoryPanelProps {
  isVisible: boolean;
  onClose: () => void;
  executionHistory: (ChatMessage & { _taskInfo?: any })[];
  autonomousTasks: AutonomousTask[];
  selectedTaskId?: string | null;
  onTaskSelect: (taskId: string | null) => void;
  isLoading: boolean;
}

const ExecutionHistoryPanel: React.FC<ExecutionHistoryPanelProps> = ({
  isVisible,
  onClose,
  executionHistory,
  autonomousTasks,
  selectedTaskId,
  onTaskSelect,
  isLoading,
}) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedMessageType, setSelectedMessageType] = useState("all");

  // Filter messages based on search and type
  const filteredHistory = executionHistory.filter((msg) => {
    const matchesSearch =
      msg.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      msg._taskInfo?.taskName?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesType =
      selectedMessageType === "all" ||
      (selectedMessageType === "trigger" && msg.author_type === "trigger") ||
      (selectedMessageType === "agent" && msg.author_type === "agent") ||
      (selectedMessageType === "skill" && msg.author_type === "skill") ||
      (selectedMessageType === "system" && msg.author_type === "system");

    return matchesSearch && matchesType;
  });

  // Group messages by task
  const groupedByTask = filteredHistory.reduce((acc, msg) => {
    const taskId = msg._taskInfo?.taskId || "unknown";
    if (!acc[taskId]) {
      acc[taskId] = [];
    }
    acc[taskId].push(msg);
    return acc;
  }, {} as Record<string, (ChatMessage & { _taskInfo?: any })[]>);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getAuthorIcon = (authorType: string) => {
    switch (authorType) {
      case "trigger":
        return (
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
              d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      case "agent":
        return (
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
              d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
            />
          </svg>
        );
      case "skill":
        return (
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
              d="M13 10V3L4 14h7v7l9-11h-7z"
            />
          </svg>
        );
      case "system":
        return (
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
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        );
      default:
        return (
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
              d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
            />
          </svg>
        );
    }
  };

  const getAuthorColor = (authorType: string) => {
    switch (authorType) {
      case "trigger":
        return "text-[var(--color-neon-cyan)]";
      case "agent":
        return "text-[var(--color-neon-lime)]";
      case "skill":
        return "text-[var(--color-neon-orange)]";
      case "system":
        return "text-[var(--color-neon-pink)]";
      default:
        return "text-[var(--color-text-secondary)]";
    }
  };

  const getAuthorBgColor = (authorType: string) => {
    switch (authorType) {
      case "trigger":
        return "bg-[var(--color-neon-cyan-subtle)] border-[var(--color-neon-cyan-border)]";
      case "agent":
        return "bg-[var(--color-neon-lime-subtle)] border-[var(--color-neon-lime-border)]";
      case "skill":
        return "bg-[var(--color-neon-orange-subtle)] border-[var(--color-neon-orange-border)]";
      case "system":
        return "bg-[var(--color-neon-pink-subtle)] border-[var(--color-neon-pink-border)]";
      default:
        return "bg-[var(--color-bg-tertiary)] border-[var(--color-border-primary)]";
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-y-0 right-0 w-1/2 min-w-[600px] max-w-[900px] bg-[var(--color-bg-secondary)] border-l border-[var(--color-border-primary)] flex flex-col h-full shadow-lg z-50 transform transition-transform duration-300 ease-in-out">
      <div className="flex flex-col h-full">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border-primary)] flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
              Execution History
            </h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              View autonomous task execution logs and messages
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-neon-lime)] transition-colors hover-neon-glow-lime rounded cursor-pointer"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Filters */}
        <div className="p-4 border-b border-[var(--color-border-primary)] space-y-3">
          {/* Task Filter */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Filter by Task
            </label>
            <select
              value={selectedTaskId || "all"}
              onChange={(e) =>
                onTaskSelect(e.target.value === "all" ? null : e.target.value)
              }
              className="w-full py-2 px-3 bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] focus:border-[var(--color-neon-lime-border)] transition-all"
            >
              <option value="all">
                All Tasks ({executionHistory.length} messages)
              </option>
              {autonomousTasks.map((task) => (
                <option key={task.id} value={task.id}>
                  {task.name} ({groupedByTask[task.id]?.length || 0} messages)
                </option>
              ))}
            </select>
          </div>

          {/* Search */}
          <div className="relative">
            <svg
              className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-[var(--color-text-muted)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
            <input
              type="text"
              placeholder="Search messages..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] focus:border-[var(--color-neon-lime-border)] placeholder:text-[var(--color-text-muted)] transition-all"
            />
          </div>

          {/* Message Type Filter */}
          <div>
            <label className="block text-xs font-medium text-[var(--color-text-secondary)] mb-1">
              Message Type
            </label>
            <select
              value={selectedMessageType}
              onChange={(e) => setSelectedMessageType(e.target.value)}
              className="w-full py-2 px-3 bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] focus:border-[var(--color-neon-lime-border)] transition-all"
            >
              <option value="all">All Types</option>
              <option value="trigger">Trigger</option>
              <option value="agent">Agent</option>
              <option value="skill">Skill</option>
              <option value="system">System</option>
            </select>
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <svg
                className="animate-spin w-6 h-6 text-[var(--color-neon-lime)]"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                  className="opacity-25"
                ></circle>
                <path
                  fill="currentColor"
                  className="opacity-75"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              <span className="ml-2 text-[var(--color-text-secondary)]">
                Loading execution history...
              </span>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-[var(--color-text-secondary)]">
                No execution history found.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {filteredHistory.map((msg) => (
                <div
                  key={msg.id}
                  className="bg-[var(--color-bg-card)] border border-[var(--color-border-primary)] rounded-lg p-4 transition-all duration-200 hover:border-[var(--color-neon-lime-border)] hover-neon-glow-lime"
                >
                  {/* Message Header */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <div
                        className={`flex items-center space-x-1 px-2 py-1 rounded-full border ${getAuthorBgColor(
                          msg.author_type
                        )}`}
                      >
                        <div className={getAuthorColor(msg.author_type)}>
                          {getAuthorIcon(msg.author_type)}
                        </div>
                        <span
                          className={`text-xs font-medium ${getAuthorColor(
                            msg.author_type
                          )}`}
                        >
                          {msg.author_type}
                        </span>
                      </div>
                      {msg._taskInfo && (
                        <div className="flex items-center space-x-1 px-2 py-1 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded-full">
                          <span className="text-xs font-medium text-[var(--color-text-secondary)]">
                            {msg._taskInfo.taskName}
                          </span>
                        </div>
                      )}
                    </div>
                    <span className="text-xs text-[var(--color-text-muted)]">
                      {formatDate(msg.created_at)}
                    </span>
                  </div>

                  {/* Message Content */}
                  {msg.message && (
                    <div className="mb-3">
                      <p className="text-sm text-[var(--color-text-primary)] leading-relaxed">
                        {msg.message}
                      </p>
                    </div>
                  )}

                  {/* Skill Calls */}
                  {msg.skill_calls && msg.skill_calls.length > 0 && (
                    <div className="mb-3">
                      <h4 className="text-xs font-medium text-[var(--color-text-secondary)] mb-2">
                        Skill Calls ({msg.skill_calls.length})
                      </h4>
                      <div className="space-y-2">
                        {msg.skill_calls.map((call, index) => (
                          <div
                            key={index}
                            className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)] rounded p-3"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-[var(--color-text-primary)]">
                                {call.name}
                              </span>
                              <div
                                className={`flex items-center space-x-1 px-2 py-1 rounded-full ${
                                  call.success
                                    ? "bg-[var(--color-neon-lime-subtle)] text-[var(--color-neon-lime)]"
                                    : "bg-[var(--color-neon-pink-subtle)] text-[var(--color-neon-pink)]"
                                }`}
                              >
                                <span className="text-xs font-medium">
                                  {call.success ? "Success" : "Failed"}
                                </span>
                              </div>
                            </div>
                            {call.parameters && (
                              <div className="mb-2">
                                <span className="text-xs text-[var(--color-text-muted)]">
                                  Parameters:
                                </span>
                                <pre className="text-xs text-[var(--color-text-secondary)] mt-1 whitespace-pre-wrap">
                                  {JSON.stringify(call.parameters, null, 2)}
                                </pre>
                              </div>
                            )}
                            {call.response && (
                              <div>
                                <span className="text-xs text-[var(--color-text-muted)]">
                                  Response:
                                </span>
                                <pre className="text-xs text-[var(--color-text-secondary)] mt-1 whitespace-pre-wrap">
                                  {call.response}
                                </pre>
                              </div>
                            )}
                            {call.credit_cost && (
                              <div className="mt-2 text-xs text-[var(--color-text-muted)]">
                                Credit Cost: {call.credit_cost}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Message Stats */}
                  <div className="flex items-center justify-between text-xs text-[var(--color-text-muted)]">
                    <div className="flex items-center space-x-4">
                      {(msg.input_tokens ?? 0) > 0 && (
                        <span>Input: {msg.input_tokens} tokens</span>
                      )}
                      {(msg.output_tokens ?? 0) > 0 && (
                        <span>Output: {msg.output_tokens} tokens</span>
                      )}
                      {msg.credit_cost && (
                        <span>Cost: {msg.credit_cost} credits</span>
                      )}
                    </div>
                    {(msg.time_cost ?? 0) > 0 && (
                      <span>Time: {msg.time_cost?.toFixed(2)}s</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ExecutionHistoryPanel;
