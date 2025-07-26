import { Address, Chain as ViemChain, defineChain, numberToHex } from 'viem'
import { base, baseSepolia } from 'viem/chains'

export interface ChainInfo {
  chain: ViemChain
  net: {
    [key in NET]?: number
  }
  iconUrl: string
  contractAddress: Address
  faucetUrl?: string
  onlyDisplay?: boolean
  isTestnet?: boolean
}

export enum NET {
  MAIN = 'Mainnet',
  TEST = 'Testnet'
}

export interface Chain {
  id?: number
  net?: NET
}

export const berachainTestnet = defineChain({
  id: 80084,
  name: 'Berachain bArtio',
  nativeCurrency: {
    decimals: 18,
    name: 'BERA Token',
    symbol: 'BERA'
  },
  rpcUrls: {
    default: { http: ['https://bartio.rpc.berachain.com'] }
  },
  blockExplorers: {
    default: {
      name: 'Berachain',
      url: 'https://bartio.beratrail.io'
    }
  },
  testnet: true
})

export const CHAIN_ID_TO_INFO: { [id: number]: ChainInfo } = {
  [baseSepolia.id]: {
    chain: baseSepolia,
    net: {
      [NET.TEST]: baseSepolia.id
      // [NET.MAIN]: bsc.id
    },
    iconUrl: '/images/png/project-icon-base.png',
    contractAddress: process.env.NEXT_PUBLIC_CRESTAL_BASE_CONTRACT as Address,
    faucetUrl: 'https://docs.base.org/docs/tools/network-faucets/',
    onlyDisplay: true,
    isTestnet: true
  },
  [base.id]: {
    chain: base,
    net: {
      [NET.MAIN]: base.id
    },
    iconUrl: '/images/png/project-icon-base.png',
    contractAddress: process.env.NEXT_PUBLIC_CRESTAL_BASE_CONTRACT as Address,
    isTestnet: false
  }
}

export const AddChainParameters: Record<number, unknown> = {
  [baseSepolia.id]: {
    chainId: numberToHex(baseSepolia.id),
    chainName: baseSepolia.name,
    nativeCurrency: baseSepolia.nativeCurrency,
    rpcUrls: baseSepolia.rpcUrls.default.http,
    blockExplorerUrls: [baseSepolia.blockExplorers.default.url]
  },
  [base.id]: {
    chainId: numberToHex(base.id),
    chainName: base.name,
    nativeCurrency: base.nativeCurrency,
    rpcUrls: base.rpcUrls.default.http,
    blockExplorerUrls: [base.blockExplorers.default.url]
  }
}

export const CHAIN_INFO_BY_NAME: Record<string, { explorerUrl: string; icon: React.ReactNode; name: string }> = {
  'evm-8453': {
    explorerUrl: 'https://basescan.org',
    icon: <img src='/images/png/base_chain.png' alt='Base' className='w-full h-full shrink-0' />,
    name: 'Base'
  },
  'evm-84532': {
    explorerUrl: 'https://sepolia.basescan.org',
    icon: <img src='/images/png/base_chain.png' alt='Base' className='w-full h-full shrink-0' />,
    name: 'Base'
  },
  'solana-101': {
    explorerUrl: 'https://solscan.io',
    icon: <img src='/images/png/solana_chain.png' alt='Solana' className='w-full h-full shrink-0' />,
    name: 'Solana'
  },
  'solana-103': {
    explorerUrl: 'https://solscan.io',
    icon: <img src='/images/png/solana_chain.png' alt='Solana' className='w-full h-full shrink-0' />,
    name: 'Solana'
  }
}

export function getChainInfoByNetworkId(ecosystem?: string, chainId?: string | number) {
  if (!ecosystem || !chainId) {
    return null
  }
  return CHAIN_INFO_BY_NAME[`${ecosystem}-${chainId}`]
}

export const DEFAULT_CHAIN = base
