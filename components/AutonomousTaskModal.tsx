import React, { useState, useEffect } from "react";
import { AutonomousTask, AutonomousTaskCreate } from "../lib/utils/apiClient";

interface AutonomousTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: AutonomousTaskCreate) => void;
  mode: "add" | "edit";
  existingTask?: AutonomousTask | null;
}

const AutonomousTaskModal: React.FC<AutonomousTaskModalProps> = ({
  isOpen,
  onClose,
  onSave,
  mode,
  existingTask,
}) => {
  const [formData, setFormData] = useState<AutonomousTaskCreate>({
    name: "",
    description: "",
    prompt: "",
    enabled: true,
  });
  const [scheduleType, setScheduleType] = useState<"minutes" | "cron">(
    "minutes"
  );
  const [isValid, setIsValid] = useState(false);

  // Reset form when modal opens/closes or when editing different task
  useEffect(() => {
    if (isOpen) {
      if (mode === "edit" && existingTask) {
        setFormData({
          name: existingTask.name || "",
          description: existingTask.description || "",
          prompt: existingTask.prompt || "",
          minutes: existingTask.minutes,
          cron: existingTask.cron,
          enabled: existingTask.enabled,
        });
        setScheduleType(existingTask.minutes ? "minutes" : "cron");
      } else {
        setFormData({
          name: "",
          description: "",
          prompt: "",
          minutes: 5,
          enabled: true,
        });
        setScheduleType("minutes");
      }
    }
  }, [isOpen, mode, existingTask]);

  // Validate form
  useEffect(() => {
    const hasName = formData.name.trim().length > 0;
    const hasPrompt = formData.prompt.trim().length > 0;
    const hasValidSchedule =
      scheduleType === "minutes"
        ? formData.minutes && formData.minutes >= 5
        : formData.cron && formData.cron.trim().length > 0;

    setIsValid(hasName && hasPrompt && hasValidSchedule);
  }, [formData, scheduleType]);

  const handleInputChange = (field: keyof AutonomousTaskCreate, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleScheduleTypeChange = (type: "minutes" | "cron") => {
    setScheduleType(type);
    if (type === "minutes") {
      setFormData((prev) => ({
        ...prev,
        cron: undefined,
        minutes: prev.minutes || 5,
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        minutes: undefined,
        cron: prev.cron || "0 * * * *",
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;

    const taskData = {
      ...formData,
      ...(scheduleType === "minutes"
        ? { minutes: formData.minutes, cron: undefined }
        : { cron: formData.cron, minutes: undefined }),
    };

    onSave(taskData);
  };

  const handleCancel = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-primary)] w-full max-w-2xl max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border-primary)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)] flex items-center">
            <svg
              className="w-5 h-5 mr-2 text-[var(--color-neon-purple)]"
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
            {mode === "add" ? "Add Autonomous Task" : "Edit Autonomous Task"}
          </h2>
          <button
            onClick={handleCancel}
            className="p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] rounded transition-all duration-200"
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

        {/* Content */}
        <div className="p-4 overflow-y-auto max-h-[calc(90vh-120px)]">
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Task Name */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Task Name{" "}
                <span className="text-[var(--color-neon-pink)]">*</span>
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => handleInputChange("name", e.target.value)}
                placeholder="Enter a descriptive name for this task"
                className="w-full text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-input)] p-3 rounded border border-[var(--color-border-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-purple-glow)] focus:border-[var(--color-neon-purple-border)] transition-all"
                maxLength={50}
                required
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Max 50 characters
              </p>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Description
              </label>
              <textarea
                value={formData.description || ""}
                onChange={(e) =>
                  handleInputChange("description", e.target.value)
                }
                placeholder="Optional description of what this task does"
                className="w-full text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-input)] p-3 rounded border border-[var(--color-border-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-purple-glow)] focus:border-[var(--color-neon-purple-border)] transition-all resize-none"
                rows={2}
                maxLength={200}
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                Max 200 characters (optional)
              </p>
            </div>

            {/* Schedule Type */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-3">
                Schedule Type{" "}
                <span className="text-[var(--color-neon-pink)]">*</span>
              </label>
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => handleScheduleTypeChange("minutes")}
                  className={`p-3 rounded border text-sm font-medium transition-all duration-200 ${
                    scheduleType === "minutes"
                      ? "bg-[var(--color-neon-purple-subtle)] text-[var(--color-neon-purple)] border-[var(--color-neon-purple-border)]"
                      : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)]"
                  }`}
                >
                  <div className="flex items-center space-x-2">
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
                    <span>Simple Interval</span>
                  </div>
                  <p className="text-xs mt-1 opacity-75">Every X minutes</p>
                </button>
                <button
                  type="button"
                  onClick={() => handleScheduleTypeChange("cron")}
                  className={`p-3 rounded border text-sm font-medium transition-all duration-200 ${
                    scheduleType === "cron"
                      ? "bg-[var(--color-neon-purple-subtle)] text-[var(--color-neon-purple)] border-[var(--color-neon-purple-border)]"
                      : "bg-[var(--color-bg-secondary)] text-[var(--color-text-secondary)] border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)]"
                  }`}
                >
                  <div className="flex items-center space-x-2">
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
                        d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <span>Cron Expression</span>
                  </div>
                  <p className="text-xs mt-1 opacity-75">Advanced scheduling</p>
                </button>
              </div>
            </div>

            {/* Schedule Configuration */}
            {scheduleType === "minutes" ? (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Interval (Minutes){" "}
                  <span className="text-[var(--color-neon-pink)]">*</span>
                </label>
                <div className="flex items-center space-x-3">
                  <input
                    type="number"
                    min="5"
                    value={formData.minutes || 5}
                    onChange={(e) =>
                      handleInputChange(
                        "minutes",
                        parseInt(e.target.value) || 5
                      )
                    }
                    className="flex-1 text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-input)] p-3 rounded border border-[var(--color-border-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-purple-glow)] focus:border-[var(--color-neon-purple-border)] transition-all"
                    required
                  />
                  <span className="text-sm text-[var(--color-text-tertiary)]">
                    minutes
                  </span>
                </div>
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  Minimum interval is 5 minutes
                </p>
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                  Cron Expression{" "}
                  <span className="text-[var(--color-neon-pink)]">*</span>
                </label>
                <input
                  type="text"
                  value={formData.cron || ""}
                  onChange={(e) => handleInputChange("cron", e.target.value)}
                  placeholder="0 * * * * (every hour)"
                  className="w-full text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-input)] p-3 rounded border border-[var(--color-border-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-purple-glow)] focus:border-[var(--color-neon-purple-border)] transition-all font-mono"
                  required
                />
                <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                  Format: minute hour day month weekday (e.g., "0 */2 * * *" for
                  every 2 hours)
                </p>
              </div>
            )}

            {/* Task Prompt */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Task Prompt{" "}
                <span className="text-[var(--color-neon-pink)]">*</span>
              </label>
              <textarea
                value={formData.prompt}
                onChange={(e) => handleInputChange("prompt", e.target.value)}
                placeholder="Enter the prompt that will be executed when this task runs..."
                className="w-full text-sm text-[var(--color-text-primary)] bg-[var(--color-bg-input)] p-3 rounded border border-[var(--color-border-secondary)] focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-purple-glow)] focus:border-[var(--color-neon-purple-border)] transition-all resize-none"
                rows={4}
                maxLength={20000}
                required
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1">
                This prompt will be executed by the agent on the specified
                schedule (max 20,000 characters)
              </p>
            </div>

            {/* Enabled Toggle */}
            <div className="flex items-center space-x-3">
              <input
                type="checkbox"
                id="task-enabled"
                checked={formData.enabled || false}
                onChange={(e) => handleInputChange("enabled", e.target.checked)}
                className="w-4 h-4 text-[var(--color-neon-purple)] bg-[var(--color-bg-input)] border-[var(--color-border-secondary)] rounded focus:ring-[var(--color-neon-purple-glow)] focus:ring-2"
              />
              <label
                htmlFor="task-enabled"
                className="text-sm font-medium text-[var(--color-text-primary)]"
              >
                Enable task immediately
              </label>
            </div>
          </form>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-[var(--color-border-primary)] flex items-center justify-end space-x-3">
          <button
            type="button"
            onClick={handleCancel}
            className="px-4 py-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-tertiary)] hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border-secondary)] rounded transition-all duration-200"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className={`px-4 py-2 text-sm font-medium rounded border transition-all duration-200 ${
              isValid
                ? "bg-[var(--color-neon-purple)] text-[var(--color-text-on-primary)] border-[var(--color-neon-purple-border)] hover:bg-[var(--color-neon-purple-bright)] neon-glow-purple"
                : "bg-[var(--color-text-muted)] text-[var(--color-bg-primary)] border-[var(--color-border-secondary)] cursor-not-allowed"
            }`}
          >
            {mode === "add" ? "Create Task" : "Update Task"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AutonomousTaskModal;
