'use client';

import { useMemo } from 'react';
import { Card } from '@/design-system/components';
import { TrendingUp, DollarSign, Activity, Users, Radar } from 'lucide-react';
import { usePlatformMetrics } from '@/hooks/usePlatformMetrics';
import { useFactoryTokens } from '@/hooks/useFactoryTokens';
import { formatAddress } from '@/config/contracts-v2';
import { formatEther } from 'viem';
import PageHeader from '@/components/PageHeader';

function formatMaticString(value: string | null, precision = 4): string {
  if (value === null) return 'Unavailable';
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) return 'Unavailable';
  return `${parsed.toFixed(precision)} MATIC`;
}

function formatVolume(value: bigint | null, precision = 4): string {
  if (value === null) return 'Unavailable';
  try {
    const parsed = Number(formatEther(value));
    if (!Number.isFinite(parsed)) return 'Unavailable';
    return `${parsed.toFixed(precision)} MATIC`;
  } catch {
    return 'Unavailable';
  }
}

export default function AnalyticsPage() {
  const { metrics, isLoading: isMetricsLoading, error: metricsError } = usePlatformMetrics();
  const { tokens, isLoading: isTokensLoading, error: tokensError } = useFactoryTokens();

  const topByVolume = useMemo(
    () =>
      [...tokens]
        .sort((a, b) => {
          const aVolume = a.totalVolume ?? 0n;
          const bVolume = b.totalVolume ?? 0n;
          if (aVolume === bVolume) return 0;
          return aVolume > bVolume ? -1 : 1;
        })
        .slice(0, 5),
    [tokens]
  );

  return (
    <div className="page-shell">
      <div className="section-wrap">
        <PageHeader
          title="Analytics Dashboard"
          subtitle="Event-indexed platform intelligence with on-chain rollups."
          icon={Radar}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card variant="elevated" padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm mb-1">Total TVL</p>
                <p className="text-3xl font-bold text-slate-900">{formatMaticString(metrics.totalTvlMatic)}</p>
                <p className="text-neutral-500 text-sm mt-1">{isMetricsLoading ? 'Loading...' : 'On-chain'}</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary-400/40 bg-primary-500/12">
                <DollarSign className="w-6 h-6 text-primary-500" />
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm mb-1">Total Volume</p>
                <p className="text-3xl font-bold text-slate-900">{formatMaticString(metrics.totalVolumeMatic)}</p>
                <p className="text-neutral-500 text-sm mt-1">Indexed recent blocks</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-success-500/40 bg-success-500/12">
                <Activity className="w-6 h-6 text-success-500" />
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm mb-1">Active Traders</p>
                <p className="text-3xl font-bold text-slate-900">{metrics.activeTraders ?? 'Unavailable'}</p>
                <p className="text-neutral-500 text-sm mt-1">Unique traders in scan window</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-secondary-400/40 bg-secondary-500/12">
                <Users className="w-6 h-6 text-secondary-500" />
              </div>
            </div>
          </Card>

          <Card variant="elevated" padding="lg">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-neutral-400 text-sm mb-1">Tokens Created</p>
                <p className="text-3xl font-bold text-slate-900">{metrics.totalTokens}</p>
                <p className="text-neutral-500 text-sm mt-1">Factory total</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-warning-500/40 bg-warning-500/12">
                <TrendingUp className="w-6 h-6 text-warning-500" />
              </div>
            </div>
          </Card>
        </div>

        {(metricsError || tokensError) && (
          <Card variant="outlined" padding="md" className="mb-6 border-warning-500/40">
            <p className="text-warning-400 text-sm">
              Data partially unavailable:
              {metricsError ? ` ${metricsError}` : ''} {tokensError ? ` ${tokensError}` : ''}
            </p>
          </Card>
        )}

        <Card variant="elevated" padding="lg">
          <h2 className="text-xl font-bold text-slate-900 mb-6">Top Tokens by Volume</h2>
          {isTokensLoading ? (
            <div className="text-center py-12">
              <p className="text-neutral-400">Loading token analytics...</p>
            </div>
          ) : topByVolume.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-neutral-400 mb-2">No token analytics available yet.</p>
              <p className="text-neutral-500 text-sm">Create and trade tokens to populate rankings.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {topByVolume.map((token) => (
                <div key={token.address} className="rounded-xl border border-dark-border-primary bg-dark-bg-secondary p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-slate-900 font-semibold">{token.symbol} <span className="text-neutral-400">({token.name})</span></p>
                      <p className="text-neutral-500 text-xs font-mono">{formatAddress(token.address)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-slate-900 font-semibold">
                        {formatVolume(token.totalVolume)}
                      </p>
                      <p className="text-neutral-500 text-xs">Volume</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}

