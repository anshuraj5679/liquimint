import { useCallback, useEffect, useState } from 'react';
import { formatEther } from 'viem';

export interface FactoryTokenView {
  address: string;
  name: string;
  symbol: string;
  curveType: number | null;
  currentPrice: bigint | null;
  tvl: bigint | null;
  totalVolume: bigint | null;
  marketCap: bigint | null;
  graduated: boolean;
}

function parseBigint(value: unknown): bigint | null {
  if (value === null || value === undefined || value === '') return null;
  try {
    return BigInt(String(value));
  } catch {
    return null;
  }
}

export function useFactoryTokens() {
  const [tokens, setTokens] = useState<FactoryTokenView[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/metrics/tokens', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Tokens API failed (${response.status})`);
      }

      const data = await response.json();
      const next = Array.isArray(data.tokens)
        ? data.tokens.map((token: Record<string, unknown>) => ({
            address: String(token.address || ''),
            name: String(token.name || 'Unknown'),
            symbol: String(token.symbol || 'UNKNOWN'),
            curveType: token.curveType === null || token.curveType === undefined ? null : Number(token.curveType),
            currentPrice: parseBigint(token.currentPrice),
            tvl: parseBigint(token.tvl),
            totalVolume: parseBigint(token.totalVolume),
            marketCap: parseBigint(token.marketCap),
            graduated: Boolean(token.graduated),
          }))
        : [];

      setTokens(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch token list');
      setTokens([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const totalVolumeMatic = tokens.reduce((sum, token) => sum + (token.totalVolume || 0n), 0n);

  return {
    tokens,
    isLoading,
    error,
    refresh,
    totalVolumeMatic: formatEther(totalVolumeMatic),
  };
}
