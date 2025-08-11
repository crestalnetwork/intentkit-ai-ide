import React, { useState, useEffect } from "react";
import { showToast } from "../lib/utils/toast";
import { NATION_API_URL } from "../lib/utils/config";

interface BaseUrlSettingsProps {
  currentBaseUrl: string;
  onBaseUrlChange: (newUrl: string) => void;
  onClose: () => void;
}

const BaseUrlSettings: React.FC<BaseUrlSettingsProps> = ({
  currentBaseUrl,
  onBaseUrlChange,
  onClose,
}) => {
  const [url, setUrl] = useState<string>(currentBaseUrl);
  const [isValidating, setIsValidating] = useState<boolean>(false);

  useEffect(() => {
    setUrl(currentBaseUrl);
  }, [currentBaseUrl]);

  const validateUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch {
      return false;
    }
  };

  const handleSave = async () => {
    const trimmedUrl = url.trim();

    if (!trimmedUrl) {
      showToast.error("Base URL cannot be empty");
      return;
    }

    if (!validateUrl(trimmedUrl)) {
      showToast.error("Please enter a valid URL");
      return;
    }

    setIsValidating(true);

    try {
      // Test the new URL by making a health check
      const response = await fetch(`${trimmedUrl}/health`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });

      if (response.ok) {
        onBaseUrlChange(trimmedUrl);
        showToast.success("Base URL updated successfully");
        onClose();
      } else {
        showToast.error("Failed to connect to the API server");
      }
    } catch (error) {
      console.error("Base URL validation error:", error);
      showToast.error(
        "Unable to connect to the API server. Please check the URL."
      );
    } finally {
      setIsValidating(false);
    }
  };

  const handleReset = () => {
    setUrl(NATION_API_URL);
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-4">
      <div className="bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-[var(--color-border-primary)]">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            API Base URL Settings
          </h3>
          <button
            onClick={onClose}
            className="text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
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
        <div className="p-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
              Base URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://sandbox.service.crestal.dev"
              className="w-full px-3 py-2 bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-tertiary)] focus:outline-none focus:border-[var(--color-neon-cyan)] focus:ring-1 focus:ring-[var(--color-neon-cyan)]"
              disabled={isValidating}
            />
            <p className="text-xs text-[var(--color-text-secondary)] mt-1">
              Enter the base URL for the IntentKit API server
            </p>
          </div>

          {/* Quick Actions */}
          <div className="flex justify-start">
            <button
              onClick={handleReset}
              disabled={isValidating}
              className="px-2 py-1 text-xs bg-[var(--color-bg-tertiary)] border border-[var(--color-border-secondary)] text-[var(--color-text-secondary)] rounded hover:bg-[var(--color-bg-quaternary)] hover:border-[var(--color-border-primary)] transition-colors disabled:opacity-50"
            >
              Use Default
            </button>
          </div>

          {/* Current Status */}
          <div className="text-xs text-[var(--color-text-tertiary)]">
            <strong>Current:</strong> {currentBaseUrl || "Not set"}
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end gap-2 p-4 border-t border-[var(--color-border-primary)]">
          <button
            onClick={onClose}
            disabled={isValidating}
            className="px-4 py-2 text-sm text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={isValidating || !url.trim() || url === currentBaseUrl}
            className="px-4 py-2 text-sm bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] rounded-lg hover:bg-[var(--color-neon-lime-bright)] transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            {isValidating && (
              <svg
                className="w-4 h-4 animate-spin"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
            )}
            {isValidating ? "Validating..." : "Save & Test"}
          </button>
        </div>
      </div>
    </div>
  );
};

export default BaseUrlSettings;
