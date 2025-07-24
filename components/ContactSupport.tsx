import React from "react";
import { showToast } from "../lib/utils/toast";
import { SOCIAL_LINKS } from "@/lib/utils/config";

interface ContactSupportProps {
  message?: string;
  reason?: "error" | "credits" | "general";
  className?: string;
  showIcon?: boolean;
}

const ContactSupport: React.FC<ContactSupportProps> = ({
  message = "Need help?",
  reason = "general",
  className = "",
  showIcon = true,
}) => {
  const getSubject = () => {
    switch (reason) {
      case "error":
        return "System Error - IntentKit.ai";
      case "credits":
        return "Credits Issue - IntentKit.ai";
      default:
        return "Support Request - IntentKit.ai";
    }
  };

  const getDefaultMessage = () => {
    switch (reason) {
      case "error":
        return "Experiencing a system error";
      case "credits":
        return "Out of credits or billing issue";
      default:
        return "Contact Support";
    }
  };

  const handleContactClick = async () => {
    const email = SOCIAL_LINKS.EMAIL;

    try {
      await navigator.clipboard.writeText(email);
      showToast.success(`Copied ${email} to clipboard`);
    } catch (error) {
      // Fallback for browsers that don't support clipboard API
      const textArea = document.createElement("textarea");
      textArea.value = email;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand("copy");
      document.body.removeChild(textArea);
      showToast.success(`Copied ${email} to clipboard`);
    }
  };

  return (
    <button
      onClick={handleContactClick}
      className={`
        inline-flex items-center gap-2 px-3 py-2 text-sm font-medium
        text-[var(--color-text-primary)] bg-[var(--color-bg-secondary)]
        border border-[var(--color-border-primary)] rounded-lg
        hover:bg-[var(--color-neon-cyan-subtle)] hover:border-[var(--color-neon-cyan)]
        hover:text-white transition-all duration-200 cursor-pointer
        ${className}
      `}
    >
      {showIcon && (
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
            d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
          />
        </svg>
      )}
      {message || getDefaultMessage()}
    </button>
  );
};

export default ContactSupport;
