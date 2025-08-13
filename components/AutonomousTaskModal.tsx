import React from "react";
// import { AutonomousTask, AutonomousTaskCreate } from "../lib/utils/apiClient";

interface AutonomousTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (taskData: any) => void; // Temporarily changed to any
  mode: "add" | "edit";
  existingTask?: any; // Temporarily changed to any
}

const AutonomousTaskModal: React.FC<AutonomousTaskModalProps> = ({
  isOpen,
  onClose,
}) => {
  // All modal functionality is commented out
  /*
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
  */

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-primary)] w-full max-w-md">
        {/* Header */}
        <div className="p-4 border-b border-[var(--color-border-primary)] flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
            Feature Under Development
          </h2>
          <button
            onClick={onClose}
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
        <div className="p-6 text-center">
          <p className="text-[var(--color-text-secondary)] mb-4">
            This feature is currently under development and will be available
            soon.
          </p>
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium bg-[var(--color-neon-purple)] text-[var(--color-text-on-primary)] border border-[var(--color-neon-purple-border)] rounded hover:bg-[var(--color-neon-purple-bright)] transition-all duration-200"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );

  /* ORIGINAL MODAL CONTENT - COMMENTED OUT FOR NOW
  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border-primary)] w-full max-w-2xl max-h-[90vh] overflow-hidden">
        ... full original modal content ...
      </div>
    </div>
  );
  */
};

export default AutonomousTaskModal;
