import React from "react";
// import { showToast } from "../../lib/utils/toast";
// import apiClient, {
//   AutonomousTask,
//   AutonomousTaskCreate,
//   Agent,
// } from "../../lib/utils/apiClient";
// import AutonomousTaskModal from "../AutonomousTaskModal";
// import ConfirmationModal from "../ConfirmationModal";

interface AutonomousTasksProps {
  agent: any; // Temporarily changed from Agent to any
}

const AutonomousTasks: React.FC<AutonomousTasksProps> = ({ agent }) => {
  // All autonomous task functionality is commented out
  /*
  const [showTaskModal, setShowTaskModal] = useState<boolean>(false);
  const [editingTask, setEditingTask] = useState<AutonomousTask | null>(null);
  const [taskModalMode, setTaskModalMode] = useState<"add" | "edit">("add");
  const [autonomousTab, setAutonomousTab] = useState<"overview" | "history">(
    "overview"
  );
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
  const [taskToDelete, setTaskToDelete] = useState<AutonomousTask | null>(null);

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
        `Task ${task.enabled ?? false ? "disabled" : "enabled"} successfully!`
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

  const handleDeleteTask = (task: AutonomousTask) => {
    setTaskToDelete(task);
    setShowDeleteConfirm(true);
  };

  const confirmDeleteTask = async () => {
    if (!taskToDelete) return;

    try {
      const updatedAgent = {
        ...agent,
        autonomous:
          agent.autonomous?.filter(
            (t: AutonomousTask) => t.id !== taskToDelete?.id
          ) || [],
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

  const handleTaskSave = async (taskData: AutonomousTaskCreate) => {
    try {
      let updatedTasks;

      if (taskModalMode === "add") {
        // Generate a simple ID for new tasks
        const newTask = {
          ...taskData,
          id: `task-${Date.now()}`,
          enabled: taskData.enabled !== undefined ? taskData.enabled : true,
        };
        updatedTasks = [...(agent.autonomous || []), newTask];
      } else {
        // Update existing task
        if (!editingTask) {
          throw new Error("No task selected for editing");
        }
        updatedTasks =
          agent.autonomous?.map((t: AutonomousTask) =>
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
  */

  return (
    <>
      <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)] mb-4">
        {/* Header */}
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
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
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
                  Autonomous Tasks Feature Under Development
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)] max-w-md">
                  This feature is currently being developed and will be
                  available soon.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* All modals and functionality commented out */}
      {/*
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
      */}
    </>
  );
};

export default AutonomousTasks;
