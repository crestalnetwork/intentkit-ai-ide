import { EmailWithMetadata, FarcasterWithMetadata, GoogleOAuthWithMetadata, LinkedAccountType, LinkedAccountWithMetadata, TwitterOAuthWithMetadata, WalletWithMetadata, DiscordOAuthWithMetadata, GithubOAuthWithMetadata, TelegramWithMetadata } from "@privy-io/react-auth";

export const delay = (ms: number) =>
  new Promise((resolve) => setTimeout(resolve, ms));


export const getPrivyAccountInfo = (
  accounts: LinkedAccountWithMetadata[] | undefined,
) => {
  if (!accounts?.length) {
    return ''
  }

  // Define the priority order based on the original switch statement
  const accountTypes: LinkedAccountType[] = [
    'email',
    'wallet',
    'google_oauth',
    'twitter_oauth',
    'github_oauth',
    'farcaster',
    'telegram',
    'discord_oauth'
  ]

  // Find the first matching account based on priority order
  for (const type of accountTypes) {
    let account

    if (type === 'wallet') {
      // For wallet, try to find Solana wallet first, then any wallet
      account = accounts?.find((account) => account.type === type && (account as WalletWithMetadata).chainType === 'solana') ||
                accounts?.find((account) => account.type === type)
    } else {
      account = accounts?.find((account) => account.type === type)
    }

    if (account) {
      switch (type) {
        case 'email':
          return (account as EmailWithMetadata).address
        case 'wallet':
          return (account as WalletWithMetadata).address
        case 'google_oauth':
          return (account as GoogleOAuthWithMetadata).email
        case 'twitter_oauth':
          return (account as TwitterOAuthWithMetadata).username
        case 'github_oauth':
          return (account as GithubOAuthWithMetadata).username
        case 'farcaster':
          return (account as FarcasterWithMetadata).username
        case 'telegram':
          return (account as TelegramWithMetadata).username ?? (account as TelegramWithMetadata).firstName
        case 'discord_oauth':
          return (account as DiscordOAuthWithMetadata).username ?? (account as DiscordOAuthWithMetadata).email
      }
    }
  }

  // If no account found, return empty string
  return ''
}