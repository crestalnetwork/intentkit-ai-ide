import { useCallback } from "react";
import { toast } from "react-toastify";
import { useSwitchChain as useWagmiSwitchChain } from "wagmi";

import { CHAIN_ID_TO_INFO, NET } from "@/utils/chains";
import { useAuth } from "@/context/AuthProvider";

export function useSwitchChain() {
  const { switchChain: wagmiSwitchChain } = useWagmiSwitchChain();
  const { setCurrentChain } = useAuth();

  const switchChain = useCallback(
    (chainId: number) =>
      wagmiSwitchChain(
        { chainId },
        {
          onSuccess() {
            setCurrentChain({
              id: chainId,
              net: CHAIN_ID_TO_INFO[chainId]?.chain?.testnet
                ? NET.TEST
                : NET.MAIN,
            });
          },
          onError(err) {
            const message = err.message.includes(
              `'wallet_switchEthereumChain' already pending`
            )
              ? "Please confirm network change in the wallet extension"
              : err.message;
            toast.error(message);
          },
        }
      ),
    [setCurrentChain, wagmiSwitchChain]
  );

  return { switchChain };
}
