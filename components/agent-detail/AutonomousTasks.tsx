import React, { useState } from "react";
import { showToast } from "../../lib/utils/toast";
import apiClient from "../../lib/utils/apiClient";
import AutonomousTaskModal from "../AutonomousTaskModal";
import ConfirmationModal from "../ConfirmationModal";

interface AutonomousTasksProps {
  agent: any;
}

const AutonomousTasks: React.FC<AutonomousTasksProps> = ({ agent }) => {
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<any>(null);
  const [taskModalMode, setTaskModalMode] = useState<"add" | "edit">("add");
  const [autonomousTab, setAutonomousTab] = useState<"overview" | "history">(
    "overview"
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<any>(null);

  // Autonomous task handlers
  const handleAddTask = () => {
    setTaskModalMode("add");
    setEditingTask(null);
    setShowTaskModal(true);
  };

  const handleEditTask = (task: any) => {
    setTaskModalMode("edit");
    setEditingTask(task);
    setShowTaskModal(true);
  };

  const handleToggleTask = async (task: any) => {
    try {
      const updatedAgent = {
        ...agent,
        autonomous:
          agent.autonomous?.map((t) =>
            t.id === task.id ? { ...t, enabled: !t.enabled } : t
          ) || [],
      };

      await apiClient.updateAgent(agent.id!, updatedAgent);
      showToast.success(
        `Task ${task.enabled ? "disabled" : "enabled"} successfully!`
      );

      // Refresh the agent data
      if (
        typeof window !== "undefined" &&
        (window as any).refreshSelectedAgent
      ) {
        (window as any).refreshSelectedAgent();
      }
    } catch (error: any) {
      console.error("Error toggling task:", error);
      showToast.error("Failed to toggle task. Please try again.");
    }
  };

  const handleDeleteTask = (task: any) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const updatedAgent = {
        ...agent,
        autonomous:
          agent.autonomous?.filter((t) => t.id !== taskToDelete.id) || [],
      };

      await apiClient.updateAgent(agent.id!, updatedAgent);
      showToast.success("Task deleted successfully!");

      // Refresh the agent data
      if (
        typeof window !== "undefined" &&
        (window as any).refreshSelectedAgent
      ) {
        (window as any).refreshSelectedAgent();
      }
    } catch (error: any) {
      console.error("Error deleting task:", error);
      showToast.error("Failed to delete task. Please try again.");
    } finally {
      setTaskToDelete(null);
    }
  };

  const handleTaskSave = async (taskData: any) => {
    try {
      let updatedTasks;

      if (taskModalMode === "add") {
        // Generate a simple ID for new tasks
        const newTask = {
          ...taskData,
          id: taskData.id || `task-${Date.now()}`,
          enabled: taskData.enabled !== undefined ? taskData.enabled : true,
        };
        updatedTasks = [...(agent.autonomous || []), newTask];
      } else {
        // Update existing task
        updatedTasks =
          agent.autonomous?.map((t) =>
            t.id === editingTask.id ? { ...t, ...taskData } : t
          ) || [];
      }

      const updatedAgent = {
        ...agent,
        autonomous: updatedTasks,
      };

      await apiClient.updateAgent(agent.id!, updatedAgent);
      showToast.success(
        `Task ${taskModalMode === "add" ? "created" : "updated"} successfully!`
      );

      setShowTaskModal(false);
      setEditingTask(null);

      // Refresh the agent data
      if (
        typeof window !== "undefined" &&
        (window as any).refreshSelectedAgent
      ) {
        (window as any).refreshSelectedAgent();
      }
    } catch (error: any) {
      console.error("Error saving task:", error);
      showToast.error(
        `Failed to ${
          taskModalMode === "add" ? "create" : "update"
        } task. Please try again.`
      );
    }
  };

  return (
    <>
      <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)] mb-4">
        {/* Header with Stats */}
        <div className="p-4 border-b border-[var(--color-border-primary)]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-3">
              <h4 className="text-sm font-semibold text-[var(--color-text-primary)] flex items-center">
                <svg
                  className="w-4 h-4 mr-2 text-[var(--color-neon-purple)]"
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
                Autonomous Tasks
              </h4>
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[var(--color-neon-purple-subtle)] text-[var(--color-neon-purple)] border border-[var(--color-neon-purple-border)]">
                  {agent.autonomous ? agent.autonomous.length : 0} Total
                </span>
                <span className="inline-flex items-center px-2 py-1 rounded text-xs font-medium bg-[var(--color-neon-lime-subtle)] text-[var(--color-neon-lime)] border border-[var(--color-neon-lime-border)]">
                  {agent.autonomous
                    ? agent.autonomous.filter((t) => t.enabled).length
                    : 0}{" "}
                  Active
                </span>
              </div>
            </div>

            <button
              onClick={handleAddTask}
              className="inline-flex items-center space-x-1 text-xs py-2 px-3 bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] border border-[var(--color-neon-lime-border)] rounded hover:bg-[var(--color-neon-lime-bright)] neon-glow-lime transition-all duration-200 font-medium"
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
                  d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                />
              </svg>
              <span>Add Task</span>
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex space-x-1 bg-[var(--color-bg-secondary)] p-1 rounded-lg">
            <button
              onClick={() => setAutonomousTab("overview")}
              className={`flex-1 text-xs py-2 px-3 rounded transition-all duration-200 font-medium ${
                autonomousTab === "overview"
                  ? "bg-[var(--color-neon-purple)] text-[var(--color-text-on-primary)] neon-glow-purple"
                  : "text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-tertiary)]"
              }`}
            >
              Overview
            </button>
            <button
              disabled
              className="flex-1 text-xs py-2 px-3 rounded transition-all duration-200 font-medium text-[var(--color-text-muted)] bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] cursor-not-allowed opacity-60"
              title="Coming Soon"
            >
              Execution History (Coming Soon)
            </button>
          </div>
        </div>

        {/* Tab Content */}
        <div className="p-4">
          {/* Tasks Overview - Always shown since history tab is disabled */}
          {agent.autonomous && agent.autonomous.length > 0 ? (
            <div className="grid gap-4">
              {agent.autonomous.map((task) => (
                <div
                  key={task.id}
                  className={`relative bg-[var(--color-bg-secondary)] rounded-lg border transition-all duration-200 ${
                    task.enabled
                      ? "border-[var(--color-neon-lime-border)] shadow-sm"
                      : "border-[var(--color-border-secondary)]"
                  }`}
                >
                  {/* Status Indicator */}
                  <div
                    className={`absolute top-3 right-3 w-3 h-3 rounded-full ${
                      task.enabled
                        ? "bg-[var(--color-neon-lime)] animate-pulse"
                        : "bg-[var(--color-text-muted)]"
                    }`}
                  />

                  <div className="p-4">
                    {/* Task Header */}
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1 min-w-0 pr-6">
                        <div className="flex items-center space-x-2 mb-2">
                          <h5 className="text-base font-semibold text-[var(--color-text-primary)] truncate">
                            {task.name || task.id}
                          </h5>
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              task.enabled
                                ? "bg-[var(--color-neon-lime-subtle)] text-[var(--color-neon-lime)] border border-[var(--color-neon-lime-border)]"
                                : "bg-[var(--color-text-muted)] text-[var(--color-bg-primary)] border border-[var(--color-border-secondary)]"
                            }`}
                          >
                            {task.enabled ? "Running" : "Stopped"}
                          </span>
                        </div>
                        {task.description && (
                          <p className="text-sm text-[var(--color-text-secondary)] mb-3 leading-relaxed">
                            {task.description}
                          </p>
                        )}

                        {/* Schedule Info */}
                        <div className="flex items-center space-x-4 text-sm">
                          <div className="flex items-center space-x-2 text-[var(--color-text-tertiary)]">
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
                            <span className="font-medium">
                              {task.minutes
                                ? `Every ${task.minutes} minute${
                                    task.minutes !== 1 ? "s" : ""
                                  }`
                                : task.cron
                                ? `Cron: ${task.cron}`
                                : "No schedule"}
                            </span>
                          </div>
                          <div className="flex items-center space-x-2 text-[var(--color-text-tertiary)]">
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
                                d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"
                              />
                            </svg>
                            <span className="font-mono text-xs">{task.id}</span>
                          </div>
                        </div>
                      </div>

                      {/* Action Buttons */}
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleEditTask(task)}
                          className="p-2 text-[var(--color-neon-cyan)] hover:text-[var(--color-neon-cyan-bright)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-neon-cyan-subtle)] border border-[var(--color-border-tertiary)] hover:border-[var(--color-neon-cyan-border)] rounded-lg transition-all duration-200"
                          title="Edit task"
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
                          onClick={() => handleToggleTask(task)}
                          className={`p-2 border rounded-lg transition-all duration-200 ${
                            task.enabled
                              ? "text-[var(--color-neon-pink)] hover:text-[var(--color-neon-pink-bright)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-neon-pink-subtle)] border-[var(--color-border-tertiary)] hover:border-[var(--color-neon-pink-border)]"
                              : "text-[var(--color-neon-lime)] hover:text-[var(--color-neon-lime-bright)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-neon-lime-subtle)] border-[var(--color-border-tertiary)] hover:border-[var(--color-neon-lime-border)]"
                          }`}
                          title={task.enabled ? "Stop task" : "Start task"}
                        >
                          {task.enabled ? (
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
                                d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 10h6v4H9z"
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
                                d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h8m-9 4h10a2 2 0 002-2V7a2 2 0 00-2-2H6a2 2 0 00-2 2v9a2 2 0 002 2z"
                              />
                            </svg>
                          )}
                        </button>
                        <button
                          onClick={() => handleDeleteTask(task)}
                          className="p-2 text-[var(--color-neon-pink)] hover:text-[var(--color-neon-pink-bright)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-neon-pink-subtle)] border border-[var(--color-border-tertiary)] hover:border-[var(--color-neon-pink-border)] rounded-lg transition-all duration-200"
                          title="Delete task"
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

                    {/* Task Prompt */}
                    <div>
                      <h6 className="text-xs font-semibold text-[var(--color-text-tertiary)] mb-2 uppercase tracking-wide">
                        Execution Prompt
                      </h6>
                      <div className="bg-[var(--color-bg-tertiary)] border border-[var(--color-border-tertiary)] rounded-lg p-3">
                        <p className="text-sm text-[var(--color-text-secondary)] font-mono leading-relaxed">
                          {task.prompt || "No prompt defined"}
                        </p>
                      </div>
                    </div>

                    {/* Next Execution (Mock data for now) */}
                    {task.enabled && (
                      <div className="mt-3 pt-3 border-t border-[var(--color-border-tertiary)]">
                        <div className="flex items-center justify-between text-xs">
                          <span className="text-[var(--color-text-tertiary)]">
                            Next execution:
                          </span>
                          <span className="text-[var(--color-neon-cyan)] font-mono">
                            {/* This would be calculated based on schedule */}
                            {task.minutes
                              ? `~${task.minutes} min`
                              : "Per schedule"}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-16 h-16 bg-[var(--color-bg-tertiary)] border-2 border-dashed border-[var(--color-border-primary)] rounded-xl flex items-center justify-center">
                  <svg
                    className="w-8 h-8 text-[var(--color-text-tertiary)]"
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
                </div>
                <div>
                  <p className="text-base font-medium text-[var(--color-text-secondary)] mb-2">
                    No autonomous tasks configured
                  </p>
                  <p className="text-sm text-[var(--color-text-tertiary)] max-w-md">
                    Create scheduled tasks to automate your agent's behavior and
                    run operations in the background
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Autonomous Task Modal */}
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
        onConfirm={confirmDeleteTask}
        title="Delete Task"
        message={`Are you sure you want to delete the task "${
          taskToDelete?.name || taskToDelete?.id
        }"?`}
        confirmText="Delete"
        cancelText="Cancel"
        type="danger"
      />
    </>
  );
};

export default AutonomousTasks;
