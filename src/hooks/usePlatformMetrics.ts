import { useCallback, useEffect, useState } from 'react';

interface PlatformMetrics {
  totalTokens: number;
  totalVolumeMatic: string | null;
  totalTvlMatic: string | null;
  activeTraders: number | null;
}

export function usePlatformMetrics() {
  const [metrics, setMetrics] = useState<PlatformMetrics>({
    totalTokens: 0,
    totalVolumeMatic: null,
    totalTvlMatic: null,
    activeTraders: null,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/metrics/platform', {
        method: 'GET',
        cache: 'no-store',
      });
      if (!response.ok) {
        throw new Error(`Metrics API failed (${response.status})`);
      }

      const data = await response.json();
      setMetrics({
        totalTokens: Number(data.totalTokens || 0),
        totalVolumeMatic: data.totalVolumeMatic ?? null,
        totalTvlMatic: data.totalTvlMatic ?? null,
        activeTraders: data.activeTraders ?? null,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load platform metrics');
      setMetrics({
        totalTokens: 0,
        totalVolumeMatic: null,
        totalTvlMatic: null,
        activeTraders: null,
      });
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return {
    metrics,
    isLoading,
    error,
    refresh,
  };
}
