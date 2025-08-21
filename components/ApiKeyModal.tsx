import React, { useState } from "react";

interface ApiKeyField {
  key: string;
  title: string;
  description?: string;
  required?: boolean;
}

interface ApiKeyModalProps {
  isVisible: boolean;
  skillName: string;
  skillTitle?: string;
  apiKeyUrl?: { text: string; url: string } | null;
  onClose: () => void;
  onSubmit: (apiKey: string | Record<string, string>) => void;
  isLoading?: boolean;
  apiKeyFields?: ApiKeyField[];
}

const ApiKeyModal: React.FC<ApiKeyModalProps> = ({
  isVisible,
  skillName,
  skillTitle,
  apiKeyUrl,
  onClose,
  onSubmit,
  isLoading = false,
  apiKeyFields,
}) => {
  const [apiKeyInput, setApiKeyInput] = useState("");
  const [multipleApiKeys, setMultipleApiKeys] = useState<
    Record<string, string>
  >({});

  const isMultipleFields = apiKeyFields && apiKeyFields.length > 0;

  const handleSubmit = () => {
    if (isMultipleFields) {
      // Validate all required fields are filled
      const missingFields = apiKeyFields.filter(
        (field) =>
          field.required !== false && !multipleApiKeys[field.key]?.trim()
      );
      if (missingFields.length > 0) return;

      onSubmit(multipleApiKeys);
    } else {
      if (!apiKeyInput.trim()) return;
      onSubmit(apiKeyInput.trim());
    }
  };

  const handleClose = () => {
    setApiKeyInput("");
    setMultipleApiKeys({});
    onClose();
  };

  if (!isVisible) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50"
      onClick={handleClose}
    >
      <div
        className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)] p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
            API Key Required
          </h3>
          <button
            onClick={handleClose}
            className="text-[var(--color-text-tertiary)] hover:text-[var(--color-neon-pink)] transition-colors"
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

        <div className="space-y-4">
          <div className="bg-[var(--color-neon-orange-subtle)] border border-[var(--color-neon-orange-border)] rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <svg
                className="w-5 h-5 text-[var(--color-neon-orange)] flex-shrink-0 mt-0.5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 12H9l-1 1-1 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1v-2a1 1 0 011-1h2l4.586-4.586A6 6 0 0121 9z"
                />
              </svg>
              <div>
                <p className="text-sm text-[var(--color-text-primary)] font-medium mb-2">
                  This skill requires your own API key from{" "}
                  {skillTitle || skillName}.
                </p>
                <p className="text-xs text-[var(--color-text-secondary)]">
                  You need to obtain this key from the service provider to use
                  this skill.
                </p>
                {apiKeyUrl && (
                  <a
                    href={apiKeyUrl.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center space-x-1 mt-2 text-xs px-3 py-1.5 bg-[var(--color-neon-cyan)] text-black rounded-lg hover:bg-[var(--color-neon-cyan-bright)] transition-all duration-200 font-medium"
                  >
                    <span>{apiKeyUrl.text}</span>
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
                        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                      />
                    </svg>
                  </a>
                )}
              </div>
            </div>
          </div>

          {isMultipleFields ? (
            <div className="space-y-4">
              {apiKeyFields.map((field, index) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                    {field.title}
                    {field.required !== false && (
                      <span className="text-[var(--color-neon-pink)] ml-1">
                        *
                      </span>
                    )}
                  </label>
                  {field.description && (
                    <p className="text-xs text-[var(--color-text-tertiary)] mb-2">
                      {field.description}
                    </p>
                  )}
                  <input
                    type="password"
                    value={multipleApiKeys[field.key] || ""}
                    onChange={(e) =>
                      setMultipleApiKeys((prev) => ({
                        ...prev,
                        [field.key]: e.target.value,
                      }))
                    }
                    placeholder={`Enter your ${field.title.toLowerCase()}...`}
                    className="w-full px-3 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] focus:border-[var(--color-neon-lime-border)] placeholder:text-[var(--color-text-muted)] transition-all"
                    autoFocus={index === 0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        const allFieldsFilled = apiKeyFields.every(
                          (f) =>
                            f.required === false ||
                            multipleApiKeys[f.key]?.trim()
                        );
                        if (allFieldsFilled) {
                          handleSubmit();
                        }
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-primary)] mb-2">
                Enter your API key:
              </label>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                placeholder="Paste your API key here..."
                className="w-full px-3 py-2 bg-[var(--color-bg-input)] border border-[var(--color-border-primary)] rounded text-[var(--color-text-primary)] text-sm focus:outline-none focus:ring-2 focus:ring-[var(--color-neon-lime-glow)] focus:border-[var(--color-neon-lime-border)] placeholder:text-[var(--color-text-muted)] transition-all"
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter" && apiKeyInput.trim()) {
                    handleSubmit();
                  }
                }}
              />
            </div>
          )}

          <div className="flex space-x-3">
            <button
              onClick={handleClose}
              className="flex-1 px-4 py-2 text-sm text-[var(--color-text-secondary)] bg-[var(--color-bg-secondary)] border border-[var(--color-border-primary)] rounded hover:bg-[var(--color-bg-tertiary)] transition-all duration-200"
            >
              Cancel
            </button>
            <button
              onClick={handleSubmit}
              disabled={
                isLoading ||
                (isMultipleFields
                  ? apiKeyFields.some(
                      (field) =>
                        field.required !== false &&
                        !multipleApiKeys[field.key]?.trim()
                    )
                  : !apiKeyInput.trim())
              }
              className="flex-1 px-4 py-2 text-sm bg-[var(--color-neon-lime)] text-[var(--color-text-on-primary)] rounded hover:bg-[var(--color-neon-lime-bright)] transition-all duration-200 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <svg
                    className="animate-spin w-4 h-4"
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
                  <span>Adding...</span>
                </>
              ) : (
                <span>Add Skill</span>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ApiKeyModal;
