import React, { useState, useEffect } from "react";
import { SettingsProps, StatusMessage } from "../types";

const Settings: React.FC<SettingsProps> = ({ baseUrl, onBaseUrlChange }) => {
  const [url, setUrl] = useState<string>(baseUrl);
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [status, setStatus] = useState<StatusMessage | null>(null);

  useEffect(() => {
    setUrl(baseUrl);
  }, [baseUrl]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validate URL
    try {
      // Add protocol if missing
      let validUrl = url;
      if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
        validUrl = `http://${validUrl}`;
      }

      // Check if it's a valid URL
      new URL(validUrl);

      // Remove trailing slash if present
      if (validUrl.endsWith("/")) {
        validUrl = validUrl.slice(0, -1);
      }

      onBaseUrlChange(validUrl);
      setStatus({ type: "success", message: "Settings saved successfully" });

      // Auto-close after success
      setTimeout(() => {
        setIsOpen(false);
        setStatus(null);
      }, 1500);
    } catch (error) {
      setStatus({ type: "error", message: "Invalid URL format" });
    }
  };

  const handleReset = () => {
    setUrl("http://127.0.0.1:8000");
    onBaseUrlChange("http://127.0.0.1:8000");
    setStatus({ type: "success", message: "Reset to default URL" });
  };

  const togglePanel = () => {
    setIsOpen(!isOpen);
    setStatus(null);
  };

  return (
    <div className="relative">
      {/* Settings button */}
      <button
        onClick={togglePanel}
        className="p-1.5 rounded-full bg-[#21262d] hover:bg-[#30363d] focus:outline-none focus:ring-1 focus:ring-[#58a6ff]"
        aria-label="Settings"
      >
        <svg
          className="h-5 w-5 text-[#c9d1d9]"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
          />
        </svg>
      </button>

      {/* Settings panel */}
      {isOpen && (
        <div className="absolute right-0 mt-3 w-80 bg-[#161b22] rounded-lg border border-[#30363d] shadow-xl z-10">
          <div className="p-3 border-b border-[#30363d]">
            <h3 className="text-base font-medium text-[#c9d1d9]">Settings</h3>
          </div>

          <form onSubmit={handleSubmit} className="p-3">
            <div className="mb-3">
              <label
                htmlFor="baseUrl"
                className="block text-sm font-medium text-[#c9d1d9] mb-2"
              >
                IntentKit Server URL
              </label>
              <input
                type="text"
                id="baseUrl"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://127.0.0.1:8000"
                className="w-full p-2.5 bg-[#0d1117] border border-[#30363d] rounded-md text-[#c9d1d9] focus:outline-none focus:ring-1 focus:ring-[#58a6ff] focus:border-[#58a6ff] text-sm"
              />
              <p className="mt-2 text-xs text-[#8b949e]">
                The base URL of your IntentKit server
              </p>
            </div>

            {status && (
              <div
                className={`mb-3 p-2 rounded border text-sm ${
                  status.type === "success"
                    ? "bg-[#132e21] text-[#56d364] border-[#238636]"
                    : "bg-[#3b1a1a] text-[#f85149] border-[#f85149]"
                }`}
              >
                {status.message}
              </div>
            )}

            <div className="flex justify-between">
              <button
                type="button"
                onClick={handleReset}
                className="text-sm bg-[#21262d] text-[#c9d1d9] px-3 py-1.5 rounded border border-[#30363d] hover:bg-[#30363d]"
              >
                Reset
              </button>
              <div className="flex space-x-2">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="text-sm bg-[#21262d] text-[#c9d1d9] px-3 py-1.5 rounded border border-[#30363d] hover:bg-[#30363d]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="text-sm bg-[#238636] text-white px-3 py-1.5 rounded border border-[#238636] hover:bg-[#2ea043]"
                >
                  Save
                </button>
              </div>
            </div>
          </form>

          <div className="p-3 bg-[#0d1117] border-t border-[#30363d] rounded-b-lg">
            <p className="text-xs text-[#8b949e]">
              Current:{" "}
              <span className="font-mono text-[#c9d1d9]">{baseUrl}</span>
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
