import React, { useState } from "react";
import { useSupabaseAuth } from "../hooks/useSupabaseAuth";
import { showToast } from "../lib/utils/toast";
import logger from "../lib/utils/logger";
import theme, { getButtonStyles } from "../lib/utils/theme";
import { usePrivy } from "@privy-io/react-auth";

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  title?: string;
  contextInfo?: {
    icon?: string;
    title?: string;
    description?: string;
  };
}

const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  title,
  contextInfo,
}) => {
  const [isSignUp, setIsSignUp] = useState<boolean>(false);
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const { signIn, signUp } = useSupabaseAuth();
  const { login } = usePrivy();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      logger.warn(
        "Auth form submitted with missing fields",
        {
          hasEmail: !!email,
          hasPassword: !!password,
        },
        "AuthModal.handleAuth"
      );
      showToast.error("Please fill in all fields");
      return;
    }

    setLoading(true);
    logger.info(
      "Auth attempt from modal",
      { email, isSignUp },
      "AuthModal.handleAuth"
    );

    try {
      if (isSignUp) {
        await signUp(email, password);
        logger.info(
          "Sign up successful in auth modal",
          { email },
          "AuthModal.handleAuth"
        );
        showToast.success(
          "Account created! Please check your email for verification."
        );
      } else {
        await signIn(email, password);
        logger.info(
          "Sign in successful in auth modal",
          { email },
          "AuthModal.handleAuth"
        );
        showToast.success("Signed in successfully!");
      }

      // Reset form
      setEmail("");
      setPassword("");

      // Call success callback if provided
      if (onSuccess) {
        onSuccess();
      }

      // Close modal
      onClose();
    } catch (error: any) {
      logger.error(
        "Authentication error in modal",
        {
          email,
          isSignUp,
          error: error.message,
        },
        "AuthModal.handleAuth"
      );
      showToast.error(error.message || "Authentication failed");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setEmail("");
    setPassword("");
    setLoading(false);
    onClose();
  };

  const loginWithPrivy = async () => {
    try {
      login();
    } catch (error) {
      console.error("Login failed:", error);
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`fixed inset-0 bg-[${theme.colors.background.modal}] backdrop-blur-sm flex items-center justify-center z-50 p-3 sm:p-4`}
      onClick={handleClose}
    >
      <div
        className={`bg-[${theme.colors.background.primary}] border border-[${theme.colors.primary.border}] rounded-xl p-4 sm:p-6 w-full max-w-sm mx-2 shadow-2xl`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center mb-4">
          <h2
            className={`text-lg sm:text-xl font-bold text-[${theme.colors.text.primary}]`}
          >
            {title || (isSignUp ? "Create Account" : "Welcome Back")}
          </h2>
          <button
            onClick={handleClose}
            disabled={loading}
            className={`text-[${theme.colors.text.tertiary}] hover:text-[${theme.colors.primary.main}] text-2xl transition-colors disabled:opacity-50`}
          >
            ×
          </button>
        </div>

        {/* Context Info */}
        {contextInfo && (
          <div
            className={`mb-4 p-3 bg-[${theme.colors.primary.light}] border border-[${theme.colors.primary.border}] rounded-lg`}
          >
            <div className="flex items-center space-x-3">
              {contextInfo.icon && (
                <span className="text-xl">{contextInfo.icon}</span>
              )}
              <div>
                <p
                  className={`text-sm font-medium text-[${theme.colors.text.primary}]`}
                >
                  {contextInfo.title}
                </p>
                {contextInfo.description && (
                  <p
                    className={`text-xs text-[${theme.colors.text.secondary}]`}
                  >
                    {contextInfo.description}
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Auth Form */}
        <form onSubmit={handleAuth} className="space-y-4">
          <div>
            <label
              className={`block text-sm font-medium text-[${theme.colors.text.primary}] mb-2`}
            >
              Email Address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={loading}
              className={`w-full p-3 bg-black border border-[${theme.colors.border.primary}] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[${theme.colors.primary.main}] focus:border-transparent transition-all disabled:opacity-50 placeholder-gray-400`}
              placeholder="Enter your email"
              required
            />
          </div>

          <div>
            <label
              className={`block text-sm font-medium text-[${theme.colors.text.primary}] mb-2`}
            >
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              className={`w-full p-3 bg-black border border-[${theme.colors.border.primary}] rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-[${theme.colors.primary.main}] focus:border-transparent transition-all disabled:opacity-50 placeholder-gray-400`}
              placeholder="Enter your password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`${getButtonStyles(
              "primary"
            )} w-full py-3 px-4 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed text-black`}
          >
            {loading
              ? "Please wait..."
              : isSignUp
              ? "Create Account"
              : "Sign In"}
          </button>
        </form>

        {/* Toggle Auth Mode */}
        <div className="mt-4 text-center">
          <button
            onClick={() => {
              logger.debug(
                "Auth mode toggled in modal",
                {
                  newMode: !isSignUp ? "signUp" : "signIn",
                },
                "AuthModal.toggleAuthMode"
              );
              setIsSignUp(!isSignUp);
            }}
            disabled={loading}
            className={`text-sm text-[${theme.colors.primary.main}] hover:text-[${theme.colors.primary.hover}] transition-colors disabled:opacity-50`}
          >
            {isSignUp
              ? "Already have an account? Sign in"
              : "Don't have an account? Sign up"}
          </button>
        </div>

        <button
          onClick={() => {
            loginWithPrivy();
          }}
          disabled={loading}
          className={`text-sm text-[${theme.colors.primary.main}] hover:text-[${theme.colors.primary.hover}] transition-colors disabled:opacity-50`}
        >
          Login with Privy
        </button>
      </div>
    </div>
  );
};

export default AuthModal;
