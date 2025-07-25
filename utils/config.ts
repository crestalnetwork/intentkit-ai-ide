import { QueryClient } from '@tanstack/react-query'
import { AxiosError } from 'axios'
import { http } from 'wagmi'

import { DEFAULT_CHAIN } from '@/utils/chains'
import { PrivyClientConfig } from '@privy-io/react-auth'
import { toSolanaWalletConnectors } from '@privy-io/react-auth/solana'
import { createConfig } from '@privy-io/wagmi'

const solanaConnectors = toSolanaWalletConnectors({
  // By default, shouldAutoConnect is enabled
  shouldAutoConnect: false
})

// export const config = getDefaultConfig({
//   appName: 'crestal',
//   projectId: '8c14fb3edd18769c74b1590efff93387',
//   chains: [bscTestnet, polygonAmoy, berachainTestnet],
//   wallets: [
//     {
//       groupName: 'Popular',
//       wallets: [okxWallet, metaMaskWallet, coinbaseWallet, walletConnectWallet]
//     }
//   ],
//   ssr: true
// })

export const wagmiConfig = createConfig({
  chains: [DEFAULT_CHAIN],
  transports: {
    [DEFAULT_CHAIN.id]: http()
  },
  ssr: true
})

export const privyConfig: PrivyClientConfig = {
  embeddedWallets: {
    ethereum: {
      createOnLogin: 'off'
    },
    solana: {
      createOnLogin: 'off'
    },
    requireUserPasswordOnCreate: true,
    showWalletUIs: true
  },
  appearance: {
    showWalletLoginFirst: true,
    theme: 'dark',
    accentColor: '#D9FE55',
    walletList: [
      'metamask',
      'okx_wallet',
      'coinbase_wallet',
      'rainbow',
      'wallet_connect',
      'phantom',
      'detected_ethereum_wallets'
    ],
    walletChainType: 'ethereum-and-solana'
  },
  externalWallets: {
    solana: {
      connectors: solanaConnectors
    }
  },
  fundingMethodConfig: {
    moonpay: {
      paymentMethod: 'credit_debit_card',
      uiConfig: { accentColor: '#696FFD', theme: 'light' }
    }
  },
  defaultChain: DEFAULT_CHAIN,
  supportedChains: [DEFAULT_CHAIN]
}

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: (failureCount, error) => {
        if (error instanceof AxiosError) {
          const status = error.response?.status
          if (status !== undefined) {
            if (status >= 400 && status < 500) return false // No retry for 4xx
          }

          return failureCount < 3
        }
        return failureCount < 3
      }
    }
  }
})
