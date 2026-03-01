'use client';

import { useMemo, useState } from 'react';
import { Card, Button } from '@/design-system/components';
import { Search, TrendingUp, ExternalLink, RefreshCcw, CandlestickChart } from 'lucide-react';
import Link from 'next/link';
import { formatEther } from 'viem';
import { formatAddress } from '@/config/contracts-v2';
import { useFactoryTokens } from '@/hooks/useFactoryTokens';
import { usePlatformMetrics } from '@/hooks/usePlatformMetrics';
import PageHeader from '@/components/PageHeader';

function formatMatic(value: bigint | null): string {
  if (value === null) return 'Unavailable';
  return `${Number(formatEther(value)).toFixed(6)} MATIC`;
}

export default function TradePage() {
  const [searchQuery, setSearchQuery] = useState('');
  const { tokens, isLoading, error, refresh } = useFactoryTokens();
  const { metrics } = usePlatformMetrics();

  const filteredTokens = useMemo(
    () =>
      tokens.filter((token) =>
        [token.name, token.symbol, token.address]
          .join(' ')
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ),
    [tokens, searchQuery]
  );

  return (
    <div className="page-shell">
      <div className="section-wrap">
        <PageHeader
          title="Trade Tokens"
          subtitle="Explore live markets and execute trades against on-chain bonding-curve pools."
          icon={CandlestickChart}
          rightSlot={
            <Button variant="secondary" leftIcon={<RefreshCcw className="w-4 h-4" />} onClick={() => refresh()}>
              Refresh
            </Button>
          }
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card variant="elevated" padding="lg">
            <p className="text-neutral-400 text-sm mb-1">Total Tokens</p>
            <p className="text-3xl font-bold text-slate-900">{metrics.totalTokens || tokens.length}</p>
          </Card>
          <Card variant="elevated" padding="lg">
            <p className="text-neutral-400 text-sm mb-1">Indexed Volume</p>
            <p className="text-3xl font-bold text-slate-900">
              {metrics.totalVolumeMatic !== null ? `${Number(metrics.totalVolumeMatic).toFixed(4)} MATIC` : 'Unavailable'}
            </p>
            <p className="text-neutral-500 text-xs mt-1">Recent scan window</p>
          </Card>
          <Card variant="elevated" padding="lg">
            <p className="text-neutral-400 text-sm mb-1">Active Traders</p>
            <p className="text-3xl font-bold text-slate-900">{metrics.activeTraders ?? 'Unavailable'}</p>
          </Card>
        </div>

        <Card variant="elevated" padding="lg" className="mb-8">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-neutral-500" />
            <input
              type="text"
              placeholder="Search by token name, symbol, or address..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-xl border border-dark-border-primary bg-[linear-gradient(140deg,rgba(255,255,255,0.96),rgba(242,246,253,0.96))] py-4 pl-12 pr-4 text-slate-900 placeholder-neutral-500 focus:outline-none focus:ring-2 focus:ring-primary-400/55"
            />
          </div>
        </Card>

        {error && (
          <Card variant="outlined" padding="md" className="mb-6 border-warning-500/40">
            <p className="text-warning-400 text-sm">Token data unavailable: {error}</p>
          </Card>
        )}

        {isLoading ? (
          <Card variant="elevated" padding="lg">
            <div className="text-center py-10">
              <p className="text-neutral-400">Loading token data from chain...</p>
            </div>
          </Card>
        ) : filteredTokens.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTokens.map((token) => (
              <Card key={token.address} variant="elevated" padding="lg" className="hover:border-primary-300/60">
                <div className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-xl font-bold text-slate-900">{token.symbol}</h3>
                      <p className="text-sm text-neutral-400">{token.name}</p>
                    </div>
                    <span className="px-3 py-1 rounded-full bg-success-500/10 text-success-400 text-xs">
                      {token.graduated ? 'Graduated' : 'Active'}
                    </span>
                  </div>

                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Price</span>
                      <span className="text-slate-900 font-medium">{formatMatic(token.currentPrice)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">TVL</span>
                      <span className="text-slate-900 font-medium">{formatMatic(token.tvl)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-neutral-400">Volume</span>
                      <span className="text-slate-900 font-medium">{formatMatic(token.totalVolume)}</span>
                    </div>
                  </div>

                  <div className="soft-divider border-t pt-2">
                    <p className="text-xs text-neutral-500 mb-2">Contract</p>
                    <div className="flex items-center gap-2">
                      <code className="text-xs text-neutral-400 font-mono">{formatAddress(token.address)}</code>
                      <a
                        href={`https://amoy.polygonscan.com/address/${token.address}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary-400 hover:text-primary-300"
                      >
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    </div>
                  </div>

                  <div className="flex gap-2 pt-2">
                    <Link href={`/token/${token.address}`} className="flex-1">
                      <Button variant="primary" size="sm" fullWidth>
                        Trade
                      </Button>
                    </Link>
                    <Link href={`/token/${token.address}`} className="flex-1">
                      <Button variant="secondary" size="sm" fullWidth>
                        View
                      </Button>
                    </Link>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <Card variant="elevated" padding="lg">
            <div className="text-center py-16">
              <TrendingUp className="w-20 h-20 text-neutral-500 mx-auto mb-6" />
              <h2 className="text-2xl font-bold text-slate-900 mb-2">
                {searchQuery ? 'No Tokens Found' : 'No Tokens Available'}
              </h2>
              <p className="text-neutral-400 mb-2">
                {searchQuery ? 'Try a different search term' : 'No on-chain tokens were returned by the factory.'}
              </p>
              <p className="text-neutral-500 text-sm mb-8">
                If this is unexpected, refresh and verify the configured factory address.
              </p>
              <Link href="/creator">
                <Button variant="primary" size="lg">
                  Launch Token
                </Button>
              </Link>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}

