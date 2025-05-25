import { formatUnits } from 'viem';

/**
 * Format a raw balance string (bigint as string) to a human-readable number
 * @param balanceRaw - The raw balance as a string representation of bigint
 * @param decimals - Number of decimals (default 18 for EQUAL tokens)
 * @returns Formatted number as a float
 */
export function formatBalance(balanceRaw: string, decimals: number = 18): number {
  return parseFloat(formatUnits(BigInt(balanceRaw), decimals));
}

/**
 * Format a raw balance string to a human-readable string with proper number formatting
 * @param balanceRaw - The raw balance as a string representation of bigint
 * @param decimals - Number of decimals (default 18 for EQUAL tokens)
 * @param precision - Number of decimal places to show (default 2)
 * @returns Formatted string with thousands separators
 */
export function formatBalanceString(balanceRaw: string, decimals: number = 18, precision: number = 2): string {
  const formatted = formatBalance(balanceRaw, decimals);
  return formatted.toLocaleString('en-US', {
    minimumFractionDigits: precision,
    maximumFractionDigits: precision
  });
}

/**
 * Format a large number for display (e.g., 1000000 -> "1.00M")
 * @param num - The number to format
 * @param precision - Number of decimal places (default 2)
 * @returns Formatted string with K/M/B suffixes
 */
export function formatLargeNumber(num: number, precision: number = 2): string {
  if (num >= 1_000_000_000) {
    return (num / 1_000_000_000).toFixed(precision) + 'B';
  } else if (num >= 1_000_000) {
    return (num / 1_000_000).toFixed(precision) + 'M';
  } else if (num >= 1_000) {
    return (num / 1_000).toFixed(precision) + 'K';
  }
  return num.toFixed(precision);
}
