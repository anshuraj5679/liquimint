'use client';

import { use, useCallback, useEffect, useMemo, useState } from 'react';
import { Card, Button } from '@/design-system/components';
import { Shield, Users, MessageSquare, CandlestickChart } from 'lucide-react';
import { BondingCurveAnalytics } from '@/components/BondingCurveAnalytics';
import { useGetTokenInfo } from '@/hooks/useBondingCurveFactory';
import { useAccount, usePublicClient, useReadContract, useWriteContract } from 'wagmi';
import { BaseError, parseEther, formatEther, parseGwei } from 'viem';
import BondingCurveTokenABI from '@/config/abis/BondingCurveToken.json';
import PageHeader from '@/components/PageHeader';

const MIN_PRIORITY_FEE_WEI = parseGwei('25');
const MIN_MAX_FEE_WEI = parseGwei('60');

export default function TokenPage({ params }: any) {
  const unwrappedParams = use(params) as { address: string };
  const tokenAddress = unwrappedParams.address as `0x${string}`;
  const { address: userAddress } = useAccount();
  const publicClient = usePublicClient();
  const { tokenInfo } = useGetTokenInfo(tokenAddress);
  const tokenStats = tokenInfo as any;

  const [buyAmount, setBuyAmount] = useState('');
  const [sellAmount, setSellAmount] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [statusType, setStatusType] = useState<'info' | 'success' | 'error'>('info');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const { data: onChainName } = useReadContract({
    address: tokenAddress,
    abi: BondingCurveTokenABI,
    functionName: 'name',
  });

  const { data: onChainSymbol } = useReadContract({
    address: tokenAddress,
    abi: BondingCurveTokenABI,
    functionName: 'symbol',
  });

  const { data: balance } = useReadContract({
    address: tokenAddress,
    abi: BondingCurveTokenABI,
    functionName: 'balanceOf',
    args: [userAddress],
    query: {
      enabled: !!userAddress,
    },
  });

  const { data: currentPrice } = useReadContract({
    address: tokenAddress,
    abi: BondingCurveTokenABI,
    functionName: 'getCurrentPrice',
  });

  const { data: totalSupply } = useReadContract({
    address: tokenAddress,
    abi: BondingCurveTokenABI,
    functionName: 'totalSupply',
  });

  const { data: initialPrice } = useReadContract({
    address: tokenAddress,
    abi: BondingCurveTokenABI,
    functionName: 'initialPrice',
  });

  const { writeContractAsync: buyTokens, isPending: isBuying } = useWriteContract();
  const { writeContractAsync: sellTokens, isPending: isSelling } = useWriteContract();

  const getErrorMessage = useCallback((error: unknown) => {
    if (error instanceof BaseError) {
      return error.shortMessage || error.details || 'Transaction failed. Please try again.';
    }
    if (error instanceof Error) {
      return error.message;
    }
    return 'Something went wrong. Please try again.';
  }, []);

  const showStatus = useCallback((message: string | null, type: 'info' | 'success' | 'error' = 'info') => {
    setStatusMessage(message);
    if (message) {
      setStatusType(type);
    }
  }, []);

  const waitForReceipt = useCallback(
    async (hash: `0x${string}`) => {
      if (!publicClient) return;
      await publicClient.waitForTransactionReceipt({ hash });
    },
    [publicClient]
  );

  const getFeeOverrides = useCallback(async () => {
    let maxPriorityFeePerGas = MIN_PRIORITY_FEE_WEI;
    let maxFeePerGas = MIN_MAX_FEE_WEI;

    if (publicClient) {
      try {
        const estimated = await publicClient.estimateFeesPerGas({ type: 'eip1559' });
        if (estimated.maxPriorityFeePerGas && estimated.maxPriorityFeePerGas > maxPriorityFeePerGas) {
          maxPriorityFeePerGas = estimated.maxPriorityFeePerGas;
        }
        if (estimated.maxFeePerGas && estimated.maxFeePerGas > maxFeePerGas) {
          maxFeePerGas = estimated.maxFeePerGas;
        }
      } catch {
        // Keep floor values when fee estimation is unavailable.
      }
    }

    if (maxFeePerGas < maxPriorityFeePerGas) {
      maxFeePerGas = maxPriorityFeePerGas * 2n;
    }

    return {
      maxPriorityFeePerGas,
      maxFeePerGas,
    };
  }, [publicClient]);

  const handleBuy = useCallback(async () => {
    if (!buyAmount || !userAddress) return;
    try {
      showStatus(`Submitting buy for ${buyAmount} MATIC...`, 'info');
      const feeOverrides = await getFeeOverrides();
      const hash = await buyTokens({
        address: tokenAddress,
        abi: BondingCurveTokenABI,
        functionName: 'buy',
        value: parseEther(buyAmount),
        ...feeOverrides,
      });
      showStatus('Waiting for confirmation...', 'info');
      await waitForReceipt(hash);
      showStatus('Buy confirmed! Your balance will update shortly.', 'success');
      setBuyAmount('');
    } catch (error) {
      showStatus(getErrorMessage(error), 'error');
    }
  }, [buyAmount, userAddress, buyTokens, tokenAddress, waitForReceipt, showStatus, getErrorMessage, getFeeOverrides]);

  const handleSell = useCallback(async () => {
    if (!sellAmount || !userAddress) return;
    try {
      showStatus(`Submitting sell for ${sellAmount} tokens...`, 'info');
      const feeOverrides = await getFeeOverrides();
      const hash = await sellTokens({
        address: tokenAddress,
        abi: BondingCurveTokenABI,
        functionName: 'sell',
        args: [parseEther(sellAmount)],
        ...feeOverrides,
      });
      showStatus('Waiting for confirmation...', 'info');
      await waitForReceipt(hash);
      showStatus('Sell confirmed! Your balance will update shortly.', 'success');
      setSellAmount('');
    } catch (error) {
      showStatus(getErrorMessage(error), 'error');
    }
  }, [sellAmount, userAddress, sellTokens, tokenAddress, waitForReceipt, showStatus, getErrorMessage, getFeeOverrides]);

  const displayName = (tokenInfo as any)?.name || (onChainName as string) || 'Token';
  const displaySymbol = (tokenInfo as any)?.symbol || (onChainSymbol as string) || 'TOKEN';

  const curveType = useMemo(() => {
    if (tokenStats?.curveType === 0) return 'LINEAR';
    if (tokenStats?.curveType === 1) return 'EXPONENTIAL';
    if (tokenStats?.curveType === 2) return 'SIGMOID';
    return 'LINEAR';
  }, [tokenStats?.curveType]);

  const curveTypeLabel =
    tokenStats?.curveType === 0
      ? 'Linear'
      : tokenStats?.curveType === 1
        ? 'Exponential'
        : tokenStats?.curveType === 2
          ? 'Sigmoid'
          : 'Unavailable';

  const statusStyles: Record<'info' | 'success' | 'error', string> = {
    info: 'bg-dark-bg-secondary border-dark-border-primary text-neutral-300',
    success: 'bg-success-500/10 border-success-500 text-success-200',
    error: 'bg-red-500/10 border-red-500 text-red-200',
  };

  return (
    <div className="page-shell">
      <div className="section-wrap space-y-6">
        <PageHeader
          title={displayName}
          subtitle="Token-level market data, bonding-curve analytics, and execution controls."
          icon={CandlestickChart}
        />
        <Card variant="elevated" padding="lg">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary-500 to-secondary-500" />
              <div>
                <h1 className="text-3xl font-bold text-slate-900">{displayName}</h1>
                <p className="text-neutral-400">{displaySymbol}</p>
                <p className="text-xs text-neutral-500 font-mono mt-1">{tokenAddress}</p>
              </div>
            </div>
            {mounted && userAddress && balance !== undefined && (
              <div className="text-right">
                <p className="text-sm text-neutral-400">Your Balance</p>
                <p className="text-2xl font-bold text-slate-900">{Number(formatEther(balance as bigint)).toFixed(4)}</p>
              </div>
            )}
          </div>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <BondingCurveAnalytics
              tokenAddress={tokenAddress}
              curveType={curveType}
              currentPrice={currentPrice ? Number(formatEther(currentPrice as bigint)) : 0}
              currentSupply={totalSupply ? Number(formatEther(totalSupply as bigint)) : 0}
              initialPrice={
                initialPrice
                  ? Number(formatEther(initialPrice as bigint))
                  : currentPrice
                    ? Number(formatEther(currentPrice as bigint))
                    : 0.000001
              }
            />

            <Card variant="elevated" padding="lg">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Trade</h2>
              {statusMessage && (
                <div className={`mb-4 rounded-xl border p-3 text-xs ${statusStyles[statusType]}`}>{statusMessage}</div>
              )}
              {!mounted ? (
                <p className="text-neutral-400 text-center py-4">Loading...</p>
              ) : userAddress ? (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">Buy Amount (MATIC)</label>
                    <input
                      type="number"
                      value={buyAmount}
                      onChange={(e) => setBuyAmount(e.target.value)}
                      className="w-full rounded-xl border border-dark-border-primary bg-[linear-gradient(140deg,rgba(255,255,255,0.96),rgba(242,246,253,0.96))] px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400/55"
                      placeholder="0.0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm text-neutral-400 mb-2">Sell Amount (Tokens)</label>
                    <input
                      type="number"
                      value={sellAmount}
                      onChange={(e) => setSellAmount(e.target.value)}
                      className="w-full rounded-xl border border-dark-border-primary bg-[linear-gradient(140deg,rgba(255,255,255,0.96),rgba(242,246,253,0.96))] px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400/55"
                      placeholder="0.0"
                      step="0.01"
                    />
                  </div>
                  <div className="flex gap-2">
                    <Button variant="success" fullWidth onClick={handleBuy} disabled={isBuying || !buyAmount}>
                      {isBuying ? 'Buying...' : 'Buy Tokens'}
                    </Button>
                    <Button variant="danger" fullWidth onClick={handleSell} disabled={isSelling || !sellAmount}>
                      {isSelling ? 'Selling...' : 'Sell Tokens'}
                    </Button>
                  </div>
                </div>
              ) : (
                <p className="text-neutral-400 text-center py-4">Connect wallet to trade</p>
              )}
            </Card>

            <Card variant="elevated" padding="lg">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
                  <MessageSquare className="w-5 h-5" />
                  Community Feed
                </h2>
                <Button size="sm">Post Update</Button>
              </div>
              <div className="rounded-xl border border-dark-border-primary bg-dark-bg-secondary p-4">
                <p className="text-neutral-400 text-sm">No announcements yet.</p>
              </div>
            </Card>
          </div>

          <div className="space-y-6">
            <Card variant="elevated" padding="md">
              <h3 className="text-lg font-bold text-slate-900 mb-4">Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-neutral-400">Current Price</span>
                  <span className="text-slate-900 font-mono">
                    {currentPrice ? `${Number(formatEther(currentPrice as bigint)).toFixed(6)} MATIC` : 'Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Market Cap</span>
                  <span className="text-slate-900 font-mono">
                    {tokenStats?.marketCap ? `${Number(formatEther(tokenStats.marketCap)).toFixed(2)} MATIC` : 'Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">TVL</span>
                  <span className="text-slate-900 font-mono">
                    {tokenStats?.tvl ? `${Number(formatEther(tokenStats.tvl)).toFixed(2)} MATIC` : 'Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Total Volume</span>
                  <span className="text-slate-900 font-mono">
                    {tokenStats?.totalVolume ? `${Number(formatEther(tokenStats.totalVolume)).toFixed(2)} MATIC` : 'Unavailable'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-neutral-400">Curve Type</span>
                  <span className="text-slate-900 font-mono">{curveTypeLabel}</span>
                </div>
              </div>
            </Card>

            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-2 mb-4">
                <Shield className="w-5 h-5 text-primary-500" />
                <h3 className="text-lg font-bold text-slate-900">Risk Analysis</h3>
              </div>
              <div className="rounded-xl border border-dark-border-primary bg-dark-bg-secondary p-4">
                <p className="text-neutral-300 text-sm">Risk score unavailable.</p>
                <p className="text-neutral-500 text-xs mt-2">
                  No evidence-backed risk engine is connected for this token in this build.
                </p>
              </div>
            </Card>

            <Card variant="elevated" padding="md">
              <div className="flex items-center gap-2 mb-4">
                <Users className="w-5 h-5 text-primary-500" />
                <h3 className="text-lg font-bold text-slate-900">Top Holders</h3>
              </div>
              <div className="rounded-xl border border-dark-border-primary bg-dark-bg-secondary p-4">
                <p className="text-neutral-300 text-sm">Holder distribution unavailable.</p>
                <p className="text-neutral-500 text-xs mt-2">Indexed holder analytics are not connected in this build.</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
