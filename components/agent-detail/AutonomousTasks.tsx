import React, { useState } from "react";
import { showToast } from "../../lib/utils/toast";
import apiClient, {
  AutonomousTask,
  AutonomousTaskCreate,
  Agent,
  ChatMessage,
  PaginatedResponse,
} from "../../lib/utils/apiClient";
import AutonomousTaskModal from "../AutonomousTaskModal";
import ConfirmationModal from "../ConfirmationModal";
import ExecutionHistoryPanel from "../ExecutionHistoryPanel";

interface AutonomousTasksProps {
  agent: Agent;
}

const AutonomousTasks: React.FC<AutonomousTasksProps> = ({ agent }) => {
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<AutonomousTask | null>(null);
  const [taskModalMode, setTaskModalMode] = useState<"add" | "edit">("add");

  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<AutonomousTask | null>(null);
  const [taskLogs, setTaskLogs] = useState<{
    [taskId: string]: ChatMessage[];
  }>({});
  const [loadingLogs, setLoadingLogs] = useState<{
    [taskId: string]: boolean;
  }>({});
  const [allExecutionHistory, setAllExecutionHistory] = useState<ChatMessage[]>(
    []
  );
  const [loadingAllHistory, setLoadingAllHistory] = useState(false);
  const [selectedTaskForHistory, setSelectedTaskForHistory] = useState<
    string | null
  >(null);
  const [showExecutionHistoryPanel, setShowExecutionHistoryPanel] =
    useState<boolean>(false);

  // Autonomous task handlers
  const handleAddTask = () => {
    setTaskModalMode("add");
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: AutonomousTask) => {
    setTaskModalMode("edit");
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleToggleTask = async (task: AutonomousTask) => {
    try {
      const updatedAgent = {
        ...agent,
        autonomous:
          agent.autonomous?.map((t: AutonomousTask) =>
            t.id === task.id ? { ...t, enabled: !(t.enabled ?? false) } : t
          ) || [],
      };

      await apiClient.updateAgent(agent.id!, updatedAgent);
      showToast.success(
        `Task "${task.name}" ${task.enabled ? "disabled" : "enabled"}`
      );

      // Trigger a page refresh to update the agent data
      window.location.reload();
    } catch (error) {
      console.error("Failed to toggle task:", error);
      showToast.error("Failed to update task. Please try again.");
    }
  };

  const handleDeleteTask = (task: AutonomousTask) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const handleConfirmDelete = async () => {
    if (!taskToDelete) return;

    try {
      const updatedAgent = {
        ...agent,
        autonomous:
          agent.autonomous?.filter(
            (t: AutonomousTask) => t.id !== taskToDelete.id
          ) || [],
      };

      await apiClient.updateAgent(agent.id!, updatedAgent);
      showToast.success(`Task "${taskToDelete.name}" deleted`);

      // Trigger a page refresh to update the agent data
      window.location.reload();
    } catch (error) {
      console.error("Failed to delete task:", error);
      showToast.error("Failed to delete task. Please try again.");
    } finally {
      setShowDeleteConfirm(false);
      setTaskToDelete(null);
    }
  };

  const handleTaskSave = async (taskData: AutonomousTaskCreate) => {
    try {
      let updatedAutonomous = agent.autonomous || [];

      if (taskModalMode === "add") {
        // Generate ID for new task
        const id = `task-${Date.now()}`;
        const newTask: AutonomousTask = {
          id,
          ...taskData,
        };
        updatedAutonomous = [...updatedAutonomous, newTask];
        showToast.success(`Task "${taskData.name}" created`);
      } else if (editingTask) {
        // Update existing task
        if (!editingTask) {
          throw new Error("No task selected for editing");
        }
        updatedAutonomous = updatedAutonomous.map((t: AutonomousTask) =>
          t.id === editingTask.id ? { ...editingTask, ...taskData } : t
        );
        showToast.success(`Task "${taskData.name}" updated`);
      }

      const updatedAgent = {
        ...agent,
        autonomous: updatedAutonomous,
      };

      await apiClient.updateAgent(agent.id!, updatedAgent);
      setShowTaskModal(false);
      setEditingTask(null);

      // Trigger a page refresh to update the agent data
      window.location.reload();
    } catch (error) {
      console.error("Failed to save task:", error);
      showToast.error("Failed to save task. Please try again.");
    }
  };

  const loadTaskLogs = async (taskId: string) => {
    if (loadingLogs[taskId] || taskLogs[taskId]) {
      return; // Already loading or loaded
    }

    setLoadingLogs((prev) => ({ ...prev, [taskId]: true }));

    try {
      const chatId = `autonomous-${taskId}`;
      const response: PaginatedResponse<ChatMessage> =
        await apiClient.getChatMessages(agent.id!, chatId, { limit: 50 });

      setTaskLogs((prev) => ({ ...prev, [taskId]: response.data }));
    } catch (error) {
      console.error(`Failed to load logs for task ${taskId}:`, error);
      // Don't show error toast as logs might not exist yet for new tasks
      setTaskLogs((prev) => ({ ...prev, [taskId]: [] }));
    } finally {
      setLoadingLogs((prev) => ({ ...prev, [taskId]: false }));
    }
  };

  const loadAllExecutionHistory = async () => {
    if (loadingAllHistory) return;

    setLoadingAllHistory(true);
    try {
      const allMessages: ChatMessage[] = [];

      // Load chat messages for each autonomous task
      for (const task of autonomousTasks) {
        try {
          const chatId = `autonomous-${task.id}`;
          const response: PaginatedResponse<ChatMessage> =
            await apiClient.getChatMessages(agent.id!, chatId, { limit: 100 });

          // Add task context to each message for display
          const messagesWithTaskInfo = response.data.map((msg) => ({
            ...msg,
            _taskInfo: {
              taskId: task.id,
              taskName: task.name,
              taskPrompt: task.prompt,
            },
          }));

          allMessages.push(...messagesWithTaskInfo);
        } catch (error) {
          console.error(`Failed to load history for task ${task.id}:`, error);
        }
      }

      // Sort messages by creation date (newest first)
      allMessages.sort(
        (a, b) =>
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      );

      setAllExecutionHistory(allMessages);
    } catch (error) {
      console.error("Failed to load execution history:", error);
      showToast.error("Failed to load execution history");
    } finally {
      setLoadingAllHistory(false);
    }
  };

  const formatSchedule = (task: AutonomousTask) => {
    if (task.minutes) {
      return `Every ${task.minutes} minutes`;
    } else if (task.cron) {
      return `Cron: ${task.cron}`;
    }
    return "No schedule";
  };

  const formatLastRun = (taskId: string) => {
    const logs = taskLogs[taskId];
    if (!logs || logs.length === 0) {
      return "Never";
    }

    const lastMessage = logs[logs.length - 1];
    return new Date(lastMessage.created_at).toLocaleString();
  };

  const autonomousTasks = agent.autonomous || [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold text-[var(--color-text-primary)] mb-1">
            Autonomous Tasks
          </h3>
          <p className="text-sm text-[var(--color-text-secondary)]">
            Configure automated tasks that run on a schedule
          </p>
        </div>
        <button
          onClick={handleAddTask}
          className="inline-flex items-center space-x-2 text-sm py-2 px-4 bg-[var(--color-neon-purple)] text-[var(--color-text-on-primary)] border border-[var(--color-neon-purple-border)] rounded hover:bg-[var(--color-neon-purple-bright)] neon-glow-purple transition-all duration-200"
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
              d="M12 6v6m0 0v6m0-6h6m-6 0H6"
            />
          </svg>
          <span>Add Task</span>
        </button>
      </div>

      {/* Agent Context Information */}
      <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)] p-4">
        <h4 className="text-sm font-medium text-[var(--color-text-primary)] mb-3 flex items-center">
          <svg
            className="w-4 h-4 mr-2 text-[var(--color-neon-blue)]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
            />
          </svg>
          Agent Context for Autonomous Tasks
        </h4>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Agent Basic Info */}
          <div>
            <h5 className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2">
              Agent Information
            </h5>
            <div className="space-y-2 text-sm">
              <div className="flex items-center space-x-2">
                <span className="text-[var(--color-text-secondary)]">
                  Name:
                </span>
                <span className="text-[var(--color-text-primary)] font-medium">
                  {agent.name}
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-[var(--color-text-secondary)]">
                  Model:
                </span>
                <span className="text-[var(--color-text-primary)] font-mono text-xs bg-[var(--color-bg-tertiary)] px-2 py-1 rounded">
                  {agent.model || "gpt-4o-mini"}
                </span>
              </div>
              {agent.temperature !== undefined && (
                <div className="flex items-center space-x-2">
                  <span className="text-[var(--color-text-secondary)]">
                    Temperature:
                  </span>
                  <span className="text-[var(--color-text-primary)]">
                    {agent.temperature}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Agent Prompt */}
          <div>
            <h5 className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2">
              System Prompt
            </h5>
            <details className="group">
              <summary className="cursor-pointer text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200 list-none">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 transform group-open:rotate-90 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span>View Agent Prompt</span>
                </div>
              </summary>
              <div className="mt-3 p-3 bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border-secondary)] max-h-32 overflow-y-auto">
                <pre className="text-xs text-[var(--color-text-primary)] whitespace-pre-wrap break-words">
                  {agent.prompt ||
                    agent.purpose ||
                    "No system prompt configured"}
                </pre>
              </div>
            </details>
          </div>
        </div>

        {/* Additional Prompt Info */}
        {agent.prompt_append && (
          <div className="mt-4 pt-4 border-t border-[var(--color-border-secondary)]">
            <h5 className="text-xs font-medium text-[var(--color-text-tertiary)] mb-2">
              Additional Prompt
            </h5>
            <details className="group">
              <summary className="cursor-pointer text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200 list-none">
                <div className="flex items-center space-x-2">
                  <svg
                    className="w-4 h-4 transform group-open:rotate-90 transition-transform duration-200"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                  <span>View Additional Prompt</span>
                </div>
              </summary>
              <div className="mt-3 p-3 bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border-secondary)] max-h-32 overflow-y-auto">
                <pre className="text-xs text-[var(--color-text-primary)] whitespace-pre-wrap break-words">
                  {agent.prompt_append}
                </pre>
              </div>
            </details>
          </div>
        )}

        <div className="mt-3 pt-3 border-t border-[var(--color-border-secondary)]">
          <p className="text-xs text-[var(--color-text-tertiary)]">
            <svg
              className="w-3 h-3 inline mr-1"
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
            Autonomous tasks will execute with this agent's configuration and
            prompt context.
          </p>
        </div>
      </div>

      {/* Task List */}
      <div className="space-y-4">
        {autonomousTasks.length === 0 ? (
          <div className="text-center py-12 bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)]">
            <div className="max-w-md mx-auto">
              <svg
                className="w-12 h-12 mx-auto text-[var(--color-text-muted)] mb-4"
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
              <h4 className="text-lg font-medium text-[var(--color-text-primary)] mb-2">
                No Autonomous Tasks
              </h4>
              <p className="text-[var(--color-text-secondary)] mb-4">
                Create your first autonomous task to automate agent actions on a
                schedule.
              </p>
              <button
                onClick={handleAddTask}
                className="inline-flex items-center space-x-2 text-sm py-2 px-4 bg-[var(--color-neon-purple)] text-[var(--color-text-on-primary)] border border-[var(--color-neon-purple-border)] rounded hover:bg-[var(--color-neon-purple-bright)] neon-glow-purple transition-all duration-200"
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
                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                  />
                </svg>
                <span>Add Your First Task</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="grid gap-4">
            {autonomousTasks.map((task: AutonomousTask) => (
              <div
                key={task.id}
                className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)] p-4"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-3 mb-2">
                      <h4 className="text-lg font-medium text-[var(--color-text-primary)] truncate">
                        {task.name}
                      </h4>
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          task.enabled ?? false
                            ? "bg-[var(--color-neon-green-subtle)] text-[var(--color-neon-green)] border border-[var(--color-neon-green-border)]"
                            : "bg-[var(--color-bg-tertiary)] text-[var(--color-text-muted)] border border-[var(--color-border-secondary)]"
                        }`}
                      >
                        {task.enabled ?? false ? "Enabled" : "Disabled"}
                      </span>
                    </div>

                    {task.description && (
                      <p className="text-sm text-[var(--color-text-secondary)] mb-3">
                        {task.description}
                      </p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-sm">
                      <div>
                        <span className="text-[var(--color-text-tertiary)] block">
                          Schedule:
                        </span>
                        <span className="text-[var(--color-text-primary)] font-mono">
                          {formatSchedule(task)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-tertiary)] block">
                          Last Run:
                        </span>
                        <span className="text-[var(--color-text-primary)]">
                          {formatLastRun(task.id)}
                        </span>
                      </div>
                      <div>
                        <span className="text-[var(--color-text-tertiary)] block">
                          Actions:
                        </span>
                        <div className="flex items-center space-x-2 mt-1">
                          <button
                            onClick={() => loadTaskLogs(task.id)}
                            disabled={loadingLogs[task.id]}
                            className="text-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan-bright)] disabled:opacity-50 disabled:cursor-not-allowed"
                            title="View Logs"
                          >
                            {loadingLogs[task.id] ? (
                              <svg
                                className="w-4 h-4 animate-spin"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                              >
                                <path
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                  strokeWidth={2}
                                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                                />
                              </svg>
                            ) : (
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
                                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                                />
                              </svg>
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Show logs if loaded */}
                    {taskLogs[task.id] && (
                      <div className="mt-4 border-t border-[var(--color-border-secondary)] pt-4">
                        <h5 className="text-sm font-medium text-[var(--color-text-primary)] mb-2">
                          Recent Execution Logs ({taskLogs[task.id].length})
                        </h5>
                        {taskLogs[task.id].length === 0 ? (
                          <p className="text-sm text-[var(--color-text-tertiary)]">
                            No execution logs found for this task.
                          </p>
                        ) : (
                          <div className="space-y-2 max-h-40 overflow-y-auto">
                            {taskLogs[task.id].slice(-5).map((log) => (
                              <div
                                key={log.id}
                                className="bg-[var(--color-bg-tertiary)] rounded p-2 text-xs"
                              >
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-[var(--color-text-secondary)]">
                                    {new Date(log.created_at).toLocaleString()}
                                  </span>
                                  <span
                                    className={`px-2 py-0.5 rounded text-xs ${
                                      log.author_type === "system"
                                        ? "bg-[var(--color-neon-red-subtle)] text-[var(--color-neon-red)]"
                                        : "bg-[var(--color-neon-green-subtle)] text-[var(--color-neon-green)]"
                                    }`}
                                  >
                                    {log.author_type}
                                  </span>
                                </div>
                                <p className="text-[var(--color-text-primary)] line-clamp-2">
                                  {log.message}
                                </p>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleToggleTask(task)}
                      className={`p-2 rounded transition-all duration-200 ${
                        task.enabled ?? false
                          ? "text-[var(--color-neon-orange)] hover:text-[var(--color-neon-orange-bright)] hover:bg-[var(--color-neon-orange-subtle)]"
                          : "text-[var(--color-neon-green)] hover:text-[var(--color-neon-green-bright)] hover:bg-[var(--color-neon-green-subtle)]"
                      }`}
                      title={
                        task.enabled ?? false ? "Disable Task" : "Enable Task"
                      }
                    >
                      {task.enabled ?? false ? (
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
                            d="M10 9v6m4-6v6m7-3a9 9 0 11-18 0 9 9 0 0118 0z"
                          />
                        </svg>
                      ) : (
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
                            d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8a2 2 0 002-2V7a2 2 0 00-2-2H8a2 2 0 00-2 2v5a2 2 0 002 2z"
                          />
                        </svg>
                      )}
                    </button>

                    <button
                      onClick={() => handleEditTask(task)}
                      className="p-2 text-[var(--color-neon-blue)] hover:text-[var(--color-neon-blue-bright)] hover:bg-[var(--color-neon-blue-subtle)] rounded transition-all duration-200"
                      title="Edit Task"
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
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task)}
                      className="p-2 text-[var(--color-neon-red)] hover:text-[var(--color-neon-red-bright)] hover:bg-[var(--color-neon-red-subtle)] rounded transition-all duration-200"
                      title="Delete Task"
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
                          d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                        />
                      </svg>
                    </button>
                  </div>
                </div>

                {/* Execution History Button */}
                <div className="mt-4 pt-4 border-t border-[var(--color-border-secondary)]">
                  <button
                    onClick={() => {
                      setSelectedTaskForHistory(task.id);
                      loadAllExecutionHistory();
                      setShowExecutionHistoryPanel(true);
                    }}
                    className="w-full inline-flex items-center justify-center space-x-2 px-4 py-3 bg-[var(--color-neon-cyan)] text-[var(--color-text-on-primary)] rounded-lg hover:bg-[var(--color-neon-cyan-bright)] transition-all duration-200 shadow-md hover:shadow-lg font-medium"
                    title="View Execution History for this task"
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
                        d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                      />
                    </svg>
                    <span>View Execution History</span>
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </button>
                </div>

                {/* Task Prompt Preview */}
                <div className="mt-4 pt-4 border-t border-[var(--color-border-secondary)]">
                  <details className="group">
                    <summary className="cursor-pointer text-sm font-medium text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors duration-200 list-none">
                      <div className="flex items-center space-x-2">
                        <svg
                          className="w-4 h-4 transform group-open:rotate-90 transition-transform duration-200"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M9 5l7 7-7 7"
                          />
                        </svg>
                        <span>View Task Prompt</span>
                      </div>
                    </summary>
                    <div className="mt-3 p-3 bg-[var(--color-bg-tertiary)] rounded border border-[var(--color-border-secondary)]">
                      <pre className="text-sm text-[var(--color-text-primary)] whitespace-pre-wrap break-words">
                        {task.prompt}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Task Modal */}
      <AutonomousTaskModal
        isOpen={showTaskModal}
        onClose={() => {
          setShowTaskModal(false);
          setEditingTask(null);
        }}
        onSave={handleTaskSave}
        mode={taskModalMode}
        existingTask={editingTask}
      />

      {/* Delete Confirmation Modal */}
      <ConfirmationModal
        isOpen={showDeleteConfirm}
        onClose={() => {
          setShowDeleteConfirm(false);
          setTaskToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        title="Delete Autonomous Task"
        message={`Are you sure you want to delete the task "${taskToDelete?.name}"? This action cannot be undone.`}
        confirmText="Delete Task"
        cancelText="Cancel"
        type="danger"
      />

      {/* Execution History Panel */}
      <ExecutionHistoryPanel
        isVisible={showExecutionHistoryPanel}
        onClose={() => setShowExecutionHistoryPanel(false)}
        executionHistory={allExecutionHistory}
        autonomousTasks={autonomousTasks}
        selectedTaskId={selectedTaskForHistory}
        onTaskSelect={setSelectedTaskForHistory}
        isLoading={loadingAllHistory}
      />
    </div>
  );
};

export default AutonomousTasks;
