import { getChainInfoByNetworkId } from "@/utils/chains";
import { Address, isAddress as isEVMAddress, zeroAddress } from "viem";

export function shortenAddress(
  address?: Address | string,
  lastNum = 5
): string {
  if (!address) return "";
  return `${address.substring(0, 5)}...${address.substring(
    address.length - lastNum
  )}`;
}

export function isSameAddress(address1: Address, address2: Address): boolean {
  try {
    return address1.toLowerCase() === address2.toLowerCase();
  } catch (error) {
    return false;
  }
}

const isSolanaAddress = (address: string): boolean => {
  return /^[1-9A-HJ-NP-Za-km-z]{43,44}$/.test(address);
};

export function isAddress(address: string): boolean {
  return isEVMAddress(address) || isSolanaAddress(address);
}

export function isZeroAddress(address: string): boolean {
  return address === zeroAddress;
}

export function getExplorerUrl(
  ecosystem?: string,
  chainId?: string | number,
  addressType?: "address" | "tx",
  address?: string
): string {
  if (!ecosystem || !chainId || !addressType || !address) return "";

  const isSolana = ecosystem === "solana";
  const isTest = isSolana && +chainId !== 101;
  const baseUrl = getChainInfoByNetworkId(ecosystem, chainId)?.explorerUrl;
  let _addressType: string = addressType;

  if (isSolana && addressType === "address") {
    _addressType = "account";
  }

  if (isSolana) {
    return `${baseUrl}/${_addressType}/${address}${
      isTest ? "?cluster=testnet" : ""
    }`;
  }

  return `${baseUrl}/${_addressType}/${address}`;
}

export function getDexScreenerUrl(
  ecosystem?: string,
  chainId?: number,
  tokenPairId?: string
): string {
  if (!ecosystem || !chainId || !tokenPairId) return "";

  const chainInfo = getChainInfoByNetworkId(ecosystem, chainId);

  if (!chainInfo) return "";

  const network = chainInfo?.name.toLowerCase();

  return `https://dexscreener.com/${network}/${tokenPairId}`;
}

export function getEip155ChainId(chainId: string) {
  try {
    return +chainId.replace("eip155:", "");
  } catch (error) {
    return -1;
  }
}
