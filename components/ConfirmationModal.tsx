import React from "react";

interface ConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: "danger" | "warning" | "info";
}

const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "danger",
}) => {
  if (!isOpen) return null;

  const getTypeStyles = () => {
    switch (type) {
      case "danger":
        return {
          icon: (
            <svg
              className="w-6 h-6 text-[var(--color-neon-pink)]"
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
          ),
          confirmButton:
            "bg-[var(--color-neon-pink)] text-[var(--color-text-on-primary)] border-[var(--color-neon-pink-border)] hover:bg-[var(--color-neon-pink-bright)] neon-glow-pink",
        };
      case "warning":
        return {
          icon: (
            <svg
              className="w-6 h-6 text-[var(--color-neon-orange)]"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4.5c-.77-.833-2.694-.833-3.464 0L3.35 16.5c-.77.833.192 2.5 1.732 2.5z"
              />
            </svg>
          ),
          confirmButton:
            "bg-[var(--color-neon-orange)] text-[var(--color-text-on-primary)] border-[var(--color-neon-orange-border)] hover:bg-[var(--color-neon-orange-bright)]",
        };
      default:
        return {
          icon: (
            <svg
              className="w-6 h-6 text-[var(--color-neon-cyan)]"
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
          ),
          confirmButton:
            "bg-[var(--color-neon-cyan)] text-[var(--color-text-on-primary)] border-[var(--color-neon-cyan-border)] hover:bg-[var(--color-neon-cyan-bright)] neon-glow-cyan",
        };
    }
  };

  const typeStyles = getTypeStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)] p-6 max-w-md w-full mx-4 shadow-xl">
        {/* Header */}
        <div className="flex items-center space-x-3 mb-4">
          {typeStyles.icon}
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            {title}
          </h3>
        </div>

        {/* Content */}
        <p className="text-sm text-[var(--color-text-secondary)] mb-6 leading-relaxed">
          {message}
        </p>

        {/* Actions */}
        <div className="flex items-center justify-end space-x-3">
          <button
            onClick={onClose}
            className="text-xs py-2 px-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] hover:border-[var(--color-border-primary)] rounded transition-all duration-200"
          >
            {cancelText}
          </button>
          <button
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`text-xs py-2 px-4 rounded border transition-all duration-200 font-medium ${typeStyles.confirmButton}`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;
