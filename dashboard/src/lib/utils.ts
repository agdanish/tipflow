import type { ChainId } from '../types';

/** Shorten an address for display */
export function shortenAddress(address: string, chars = 6): string {
  if (address.length <= chars * 2 + 2) return address;
  return `${address.slice(0, chars + 2)}...${address.slice(-chars)}`;
}

/** Format a timestamp to a relative time string */
export function timeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Get chain display name */
export function chainName(chainId: ChainId): string {
  const names: Partial<Record<ChainId, string>> = {
    'ethereum-sepolia': 'Ethereum Sepolia',
    'ton-testnet': 'TON Testnet',
    'tron-nile': 'Tron Nile',
  };
  return names[chainId] ?? chainId;
}

/** Get chain color */
export function chainColor(chainId: ChainId): string {
  if (chainId.startsWith('ethereum')) return '#627eea';
  if (chainId.startsWith('ton')) return '#0098ea';
  if (chainId.startsWith('tron')) return '#eb0029';
  return '#22c55e';
}

/** Get chain icon label */
export function chainIcon(chainId: ChainId): string {
  if (chainId.startsWith('ethereum')) return 'ETH';
  if (chainId.startsWith('ton')) return 'TON';
  if (chainId.startsWith('tron')) return 'TRX';
  return '?';
}

/** Copy text to clipboard */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}

/** Format number with commas */
export function formatNumber(num: number | string, decimals = 4): string {
  const n = typeof num === 'string' ? parseFloat(num) : num;
  if (isNaN(n)) return '0';
  return n.toLocaleString('en-US', {
    minimumFractionDigits: 0,
    maximumFractionDigits: decimals,
  });
}
