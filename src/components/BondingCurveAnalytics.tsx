'use client';

import { useState } from 'react';
import { Card } from '@/design-system/components';
import { TrendingUp, DollarSign, Activity, AlertTriangle } from 'lucide-react';

interface BondingCurveAnalyticsProps {
  tokenAddress: string;
  curveType: 'LINEAR' | 'EXPONENTIAL' | 'SIGMOID';
  currentPrice: number;
  currentSupply: number;
  initialPrice: number;
}

export function BondingCurveAnalytics({
  tokenAddress,
  curveType,
  currentPrice,
  currentSupply,
  initialPrice,
}: BondingCurveAnalyticsProps) {
  const [buyAmount, setBuyAmount] = useState('1');
  const [sellAmount, setSellAmount] = useState('100');

  // Simplified impact model for quick UX guidance.
  const calculatePriceImpact = (amount: number) => {
    const impact = (amount / currentSupply) * 100;
    return Math.min(impact, 100);
  };

  const buyImpact = calculatePriceImpact(parseFloat(buyAmount) || 0);
  const sellImpact = calculatePriceImpact(parseFloat(sellAmount) || 0);

  const projections = [
    { supply: currentSupply * 1.1, label: '+10% Supply' },
    { supply: currentSupply * 1.25, label: '+25% Supply' },
    { supply: currentSupply * 1.5, label: '+50% Supply' },
    { supply: currentSupply * 2, label: '+100% Supply' },
  ].map((proj) => ({
    ...proj,
    price: calculateProjectedPrice(proj.supply, curveType, initialPrice),
    change: ((calculateProjectedPrice(proj.supply, curveType, initialPrice) - currentPrice) / currentPrice) * 100,
  }));

  return (
    <div className="space-y-6">
      <Card variant="elevated" padding="lg">
        <div className="rounded-lg border border-warning-500 bg-warning-500/10 p-4">
          <p className="text-sm font-semibold text-warning-500">Estimated analytics</p>
          <p className="mt-1 text-xs text-warning-400">
            These outputs use simplified client-side math and are not exact on-chain execution quotes.
          </p>
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
          <Activity className="h-5 w-5 text-primary-500" />
          Estimated Price Impact
        </h3>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <label className="block text-sm text-neutral-400">Buy Amount (MATIC)</label>
            <input
              type="number"
              value={buyAmount}
              onChange={(e) => setBuyAmount(e.target.value)}
              className="w-full rounded-lg border border-dark-border-primary bg-dark-bg-secondary px-4 py-3 text-slate-900"
              placeholder="1.0"
              step="0.1"
            />
            <div className="rounded-lg border border-success-500 bg-success-500/10 p-4">
              <p className="mb-1 text-sm text-neutral-400">Price Impact</p>
              <p className={`text-2xl font-bold ${buyImpact > 5 ? 'text-warning-500' : 'text-success-500'}`}>
                +{buyImpact.toFixed(2)}%
              </p>
              <p className="mt-1 text-xs text-neutral-500">{buyImpact > 5 ? 'High impact' : 'Low impact'}</p>
            </div>
          </div>

          <div className="space-y-3">
            <label className="block text-sm text-neutral-400">Sell Amount (Tokens)</label>
            <input
              type="number"
              value={sellAmount}
              onChange={(e) => setSellAmount(e.target.value)}
              className="w-full rounded-lg border border-dark-border-primary bg-dark-bg-secondary px-4 py-3 text-slate-900"
              placeholder="100"
              step="10"
            />
            <div className="rounded-lg border border-error-500 bg-error-500/10 p-4">
              <p className="mb-1 text-sm text-neutral-400">Price Impact</p>
              <p className={`text-2xl font-bold ${sellImpact > 5 ? 'text-error-500' : 'text-warning-500'}`}>
                -{sellImpact.toFixed(2)}%
              </p>
              <p className="mt-1 text-xs text-neutral-500">{sellImpact > 5 ? 'High impact' : 'Low impact'}</p>
            </div>
          </div>
        </div>

        {buyImpact > 10 && (
          <div className="mt-4 flex items-start gap-2 rounded-lg border border-warning-500 bg-warning-500/10 p-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-warning-500" />
            <div>
              <p className="text-sm font-medium text-warning-500">High Price Impact Warning</p>
              <p className="mt-1 text-xs text-warning-400">
                Consider splitting your trade into smaller amounts to reduce slippage.
              </p>
            </div>
          </div>
        )}
      </Card>

      <Card variant="elevated" padding="lg">
        <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
          <TrendingUp className="h-5 w-5 text-primary-500" />
          Estimated Price Projections
        </h3>

        <div className="space-y-3">
          {projections.map((proj, i) => (
            <div key={i} className="rounded-lg bg-dark-bg-secondary p-4">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-sm text-neutral-400">{proj.label}</span>
                <span className={`text-sm font-medium ${proj.change > 0 ? 'text-success-500' : 'text-error-500'}`}>
                  {proj.change > 0 ? '+' : ''}
                  {proj.change.toFixed(2)}%
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="font-bold text-slate-900">{proj.price.toFixed(6)} MATIC</span>
                <span className="text-xs text-neutral-500">{proj.supply.toLocaleString('en-US')} supply</span>
              </div>
            </div>
          ))}
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <h3 className="mb-4 flex items-center gap-2 text-xl font-bold text-slate-900">
          <DollarSign className="h-5 w-5 text-primary-500" />
          Estimated ROI
        </h3>

        <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
          <div className="rounded-lg bg-dark-bg-secondary p-4">
            <p className="mb-1 text-sm text-neutral-400">Entry Price</p>
            <p className="text-xl font-bold text-slate-900">{initialPrice.toFixed(6)}</p>
            <p className="mt-1 text-xs text-neutral-500">Initial</p>
          </div>

          <div className="rounded-lg bg-dark-bg-secondary p-4">
            <p className="mb-1 text-sm text-neutral-400">Current Price</p>
            <p className="text-xl font-bold text-slate-900">{currentPrice.toFixed(6)}</p>
            <p className="mt-1 text-xs text-success-500">+{(((currentPrice - initialPrice) / initialPrice) * 100).toFixed(2)}%</p>
          </div>

          <div className="rounded-lg bg-dark-bg-secondary p-4">
            <p className="mb-1 text-sm text-neutral-400">If 2x Supply</p>
            <p className="text-xl font-bold text-slate-900">
              {calculateProjectedPrice(currentSupply * 2, curveType, initialPrice).toFixed(6)}
            </p>
            <p className="mt-1 text-xs text-primary-500">Projected</p>
          </div>
        </div>
      </Card>

      <Card variant="elevated" padding="lg">
        <h3 className="mb-4 text-xl font-bold text-slate-900">Curve Type Comparison</h3>

        <div className="space-y-4">
          <div
            className={`rounded-lg border-2 p-4 ${
              curveType === 'LINEAR' ? 'border-primary-500 bg-primary-500/10' : 'border-dark-border-primary bg-dark-bg-secondary'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Linear Curve</h4>
              {curveType === 'LINEAR' && <span className="rounded bg-primary-500 px-2 py-1 text-xs text-slate-900">Active</span>}
            </div>
            <p className="mb-2 text-sm text-neutral-400">Steady, predictable price growth</p>
            <p className="text-xs text-neutral-500">Best for: Stable projects, long-term holds</p>
          </div>

          <div
            className={`rounded-lg border-2 p-4 ${
              curveType === 'EXPONENTIAL'
                ? 'border-primary-500 bg-primary-500/10'
                : 'border-dark-border-primary bg-dark-bg-secondary'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Exponential Curve</h4>
              {curveType === 'EXPONENTIAL' && (
                <span className="rounded bg-primary-500 px-2 py-1 text-xs text-slate-900">Active</span>
              )}
            </div>
            <p className="mb-2 text-sm text-neutral-400">Rapid price appreciation with supply</p>
            <p className="text-xs text-neutral-500">Best for: High-growth projects, early adopters</p>
          </div>

          <div
            className={`rounded-lg border-2 p-4 ${
              curveType === 'SIGMOID' ? 'border-primary-500 bg-primary-500/10' : 'border-dark-border-primary bg-dark-bg-secondary'
            }`}
          >
            <div className="mb-2 flex items-center justify-between">
              <h4 className="font-bold text-slate-900">Sigmoid Curve</h4>
              {curveType === 'SIGMOID' && <span className="rounded bg-primary-500 px-2 py-1 text-xs text-slate-900">Active</span>}
            </div>
            <p className="mb-2 text-sm text-neutral-400">S-curve with controlled ceiling</p>
            <p className="text-xs text-neutral-500">Best for: Balanced growth, price stability</p>
          </div>
        </div>
      </Card>
    </div>
  );
}

function calculateProjectedPrice(supply: number, curveType: string, initialPrice: number): number {
  switch (curveType) {
    case 'LINEAR':
      return initialPrice + (supply * 0.000001);
    case 'EXPONENTIAL':
      return initialPrice * Math.pow(1.001, supply);
    case 'SIGMOID': {
      const midpoint = 1000000;
      return (initialPrice * 2) / (1 + Math.exp(-0.000001 * (supply - midpoint)));
    }
    default:
      return initialPrice;
  }
}

export default BondingCurveAnalytics;
