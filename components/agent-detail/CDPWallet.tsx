import React from "react";
import { showToast } from "../../lib/utils/toast";

interface CDPWalletProps {
  agent: any;
}

const CDPWallet: React.FC<CDPWalletProps> = ({ agent }) => {
  if (!agent.wallet_provider && !agent.cdp_wallet_address) {
    return null;
  }

  const handleCopyAddress = () => {
    if (agent.cdp_wallet_address) {
      navigator.clipboard.writeText(agent.cdp_wallet_address);
      showToast.success("Wallet address copied to clipboard!");
    }
  };

  return (
    <div className="bg-[var(--color-bg-card)] rounded-lg border border-[var(--color-border-primary)] p-4 mb-4">
      <h4 className="text-sm font-semibold text-[var(--color-text-primary)] mb-3 flex items-center">
        <svg
          className="w-4 h-4 mr-2 text-[var(--color-neon-cyan)]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"
          />
        </svg>
        CDP Wallet
      </h4>
      <div className="space-y-2 text-sm">
        <div className="flex items-center justify-between">
          <span className="text-[var(--color-text-tertiary)]">Status:</span>
          <span className="text-[var(--color-neon-cyan)] font-medium">
            Enabled
          </span>
        </div>
        {agent.cdp_wallet_address && (
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-tertiary)]">Address:</span>
            <button
              onClick={handleCopyAddress}
              className="text-[var(--color-text-secondary)] hover:text-[var(--color-neon-cyan)] font-mono text-xs bg-[var(--color-bg-secondary)] px-2 py-1 rounded border border-[var(--color-border-secondary)] hover:border-[var(--color-neon-cyan-border)] transition-all duration-200 cursor-pointer"
              title="Click to copy wallet address"
            >
              {agent.cdp_wallet_address.slice(0, 6)}...
              {agent.cdp_wallet_address.slice(-4)}
            </button>
          </div>
        )}
        {(agent.network_id || agent.cdp_network_id) && (
          <div className="flex items-center justify-between">
            <span className="text-[var(--color-text-tertiary)]">Network:</span>
            <span className="text-[var(--color-text-secondary)] font-medium">
              {agent.network_id || agent.cdp_network_id}
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default CDPWallet;
