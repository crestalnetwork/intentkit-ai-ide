import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { toast } from 'react-toastify'
import { useRouter } from 'next/router'
import { useAccount as useWagmiAccount, useDisconnect } from 'wagmi'

import { CHAIN_ID_TO_INFO, DEFAULT_CHAIN, NET } from '@/utils/chains'
import {
  useConnectWallet as usePrivyConnectWallet,
  useFundWallet,
  usePrivy,
  useSolanaWallets,
  useWallets,
  WalletWithMetadata
} from '@privy-io/react-auth'
import { useSetActiveWallet } from '@privy-io/wagmi'
import { isSameAddress, shortenAddress } from '@/utils/address'
import { Address } from 'viem'

export enum LinkedAddressStatus {
  DISCONNECTED = 'disconnected',
  WRONG_ADDRESS = 'wrong_address',
  CORRECT = 'correct'
}

export default function useWallet() {
  const { isConnected: wagmiConnected, address, chainId, status, chain } = useWagmiAccount()

  const { user, ready } = usePrivy()
  const router = useRouter()
  const [isReady, setIsReady] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  const targetChain = useMemo(() => {
    return DEFAULT_CHAIN
  }, [])

  const { connectWallet } = usePrivyConnectWallet()
  const { wallets: evmWallets } = useWallets()
  const { wallets: solanaWallets } = useSolanaWallets()
  const { setActiveWallet } = useSetActiveWallet()
  const { connectors, disconnect } = useDisconnect()

  // const { setCurrentChain } = useStore()
  const { fundWallet } = useFundWallet()

  // a display address is the address that user linked to both backend and Privy, it will not change whenever connected wallet's address changed
  const displayAddress = useMemo(() => {
    // an external wallet account is the most piority wallet we use
    const walletAccount = user?.linkedAccounts.find(
      (account) =>
        account.type === 'wallet' &&
        (account.chainType === 'ethereum' || account.chainType === 'solana') &&
        account.walletClientType !== 'privy'
    )

    if (walletAccount) {
      return (walletAccount as WalletWithMetadata).address as Address
    }

    // if a user has no external wallet, he should have a embed wallet
    const embedAccount = user?.linkedAccounts.find(
      (account) => account.type === 'wallet' && account.walletClientType === 'privy'
    )

    if (embedAccount) {
      return (embedAccount as WalletWithMetadata).address as Address
    }

    // use this value as a fallback solution
    return user?.wallet?.address as Address
  }, [user])

  useEffect(() => {
    if (
      evmWallets.length > 1 &&
      solanaWallets.length > 0 &&
      evmWallets.some((w) => solanaWallets.find((s) => s.walletClientType === w.walletClientType))
    ) {
      const currentWallet = evmWallets.find((w) => isSameAddress(w.address as Address, displayAddress))
      if (currentWallet) {
        setActiveWallet(currentWallet)
      }
    }
  }, [evmWallets, displayAddress, solanaWallets])

  // check linked address status, connected wallet could change, then we check if this is the correct address
  const linkedAddressStatsu = useMemo(() => {
    if (!address) {
      return LinkedAddressStatus.DISCONNECTED
    }
    if (address?.toLowerCase() !== displayAddress?.toLowerCase()) {
      return LinkedAddressStatus.WRONG_ADDRESS
    }
    return LinkedAddressStatus.CORRECT
  }, [displayAddress, address])

  const targetChainId = useMemo(() => {
    return Object.values(CHAIN_ID_TO_INFO).filter((c) => !c.onlyDisplay && !c.isTestnet)?.[0]?.chain?.id
  }, [])

  const currentChain = useMemo(() => {
    if (chain?.id) {
      return {
        ...chain,
        id: +chain.id,
        net: chain?.testnet ? NET.TEST : NET.MAIN
      }
    }

    if (!targetChainId) {
      return null
    }

    const targetChain = CHAIN_ID_TO_INFO?.[targetChainId]

    if (!targetChain) {
      return null
    }

    return {
      ...targetChain.chain,
      id: targetChainId,
      net: targetChain?.chain?.testnet ? NET.TEST : NET.MAIN
    }
  }, [chain, targetChainId])

  const isConnected = useMemo(() => {
    return Boolean(wagmiConnected)
  }, [wagmiConnected])

  const isUnsupported = !chain?.id || !Object.keys(CHAIN_ID_TO_INFO).map(Number).includes(chain.id)

  const isWrongAddress = linkedAddressStatsu === LinkedAddressStatus.WRONG_ADDRESS

  const connectWalletWithoutLogin = useCallback(
    async (redirectUrl?: string) => {
      if (user?.wallet?.walletClientType === 'privy' && evmWallets.length) {
        const currentWallet =
          evmWallets.find((w) => isSameAddress(w.address as Address, displayAddress)) ?? evmWallets[0]
        setActiveWallet(currentWallet)
        return
      }

      connectWallet({ suggestedAddress: user?.wallet?.address, walletChainType: 'ethereum-only' })
      redirectUrl && router.push(redirectUrl)
    },
    [user?.wallet, evmWallets, connectWallet, router, setActiveWallet, displayAddress]
  )

  // useEffect(() => {
  //   if (isConnected && chainId && chainId !== currentChain?.id) {
  //     setCurrentChain({
  //       id: chainId,
  //       net: CHAIN_ID_TO_INFO[chainId]?.chain?.testnet ? NET.TEST : NET.MAIN
  //     })
  //   }
  // }, [chainId, currentChain?.id, isConnected, setCurrentChain])

  const resetLoadingStatusRef = useRef<NodeJS.Timeout | null>(null)
  useEffect(() => {
    if (!ready) {
      return
    }
    resetLoadingStatusRef.current = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    return () => {
      if (resetLoadingStatusRef.current) {
        clearTimeout(resetLoadingStatusRef.current)
      }
    }
  }, [ready])

  useEffect(() => {
    // Lifecycle of status:
    // disconnected -> connecting -> connected
    // disconnected -> reconnecting -> connected
    // disconnected -> reconnecting -> disconnected
    // connected

    // So we need to check if isReady by start change from disconnected
    if (status !== 'disconnected') {
      setIsReady(true)
    }
    if (isReady && (status === 'disconnected' || status === 'connected')) {
      clearTimeout(resetLoadingStatusRef.current as NodeJS.Timeout)
      resetLoadingStatusRef.current = null
      setIsLoading(false)
    }
  }, [isReady, status])

  const walletLoading = useMemo(() => {
    return isLoading || !ready
  }, [isLoading, ready])

  const showFundWallet = useCallback(() => {
    if (!displayAddress) return
    fundWallet(displayAddress, { chain: chain, amount: '0.1' })
  }, [fundWallet, displayAddress, chain])

  const checkWalletStatus = useCallback(() => {
    if (!isConnected) {
      connectWalletWithoutLogin()
      return false
    }

    if (isUnsupported) {
      toast.error('Please connect to the correct network', { position: 'top-right', autoClose: 10000 })
      return false
    }
    if (isWrongAddress) {
      toast.error(`Please switch to the correct wallet: ${shortenAddress(displayAddress)}`, {
        position: 'top-right',
        autoClose: 10000
      })
      return false
    }

    return true
  }, [isConnected, isUnsupported, isWrongAddress, connectWalletWithoutLogin, displayAddress])

  const handleDisconnectAllSolanaWallets = () => {
    solanaWallets.map((w) => w.disconnect())
  }

  const handleDisconnectAllEvmWallets = useCallback(async () => {
    const MAX_ATTEMPTS = 10
    let attempts = 0

    const disconnectRecursively = async () => {
      if (attempts >= MAX_ATTEMPTS || connectors.length === 0) {
        attempts = 10
        return
      }

      if (connectors.length > 0) {
        try {
          attempts++
          disconnect()
          setTimeout(disconnectRecursively, 100)
        } catch (error) {
          console.error('Error disconnecting wallets:', error)
        }
      }
    }

    await disconnectRecursively()
  }, [connectors, disconnect])

  // if (isLoading) return { isLoading }

  /**
   * chain: wagmi chain, should be connected while has value
   * currentChain: chain info from logined user (still have value while wallet not connected)
   * connectWalletWithoutLogin: connect wallet without start login flow
   * address: wagmi connected wallet address
   * displayAddress: address from logined user (still have value while wallet not connected)
   */
  return {
    isLoading,
    walletLoading,
    isConnected,
    chainId,
    targetChainId,
    address,
    displayAddress,
    chain,
    isUnsupported,
    status,
    connectWalletWithoutLogin,
    currentChain,
    showFundWallet,
    isWrongAddress,
    linkedAddressStatsu,
    checkWalletStatus,
    targetChain,
    handleDisconnectAllSolanaWallets,
    handleDisconnectAllEvmWallets
  }
}
