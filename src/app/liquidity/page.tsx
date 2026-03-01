'use client';

import { useEffect, useMemo, useState } from 'react';
import { Card, Button, Input } from '@/design-system/components';
import { Lock, TrendingUp, Award, AlertCircle } from 'lucide-react';
import { useAccount, usePublicClient } from 'wagmi';
import { formatEther } from 'viem';
import { useLockLiquidity, useGetUserLocks, useGetUserRewards, useClaimRewards } from '@/hooks/useLiquidityController';
import PageHeader from '@/components/PageHeader';

export default function LiquidityManagement() {
  const { address } = useAccount();
  const publicClient = usePublicClient();
  const [mounted, setMounted] = useState(false);
  const walletAddress = mounted ? address : undefined;
  const [activeTab, setActiveTab] = useState<'overview' | 'lock' | 'rewards'>('overview');
  
  // Lock form state
  const [tokenAddress, setTokenAddress] = useState('');
  const [lpTokenAddress, setLpTokenAddress] = useState('');
  const [lockAmount, setLockAmount] = useState('');
  const [lockDuration, setLockDuration] = useState('30');
  const [claimLockId, setClaimLockId] = useState('');
  const [status, setStatus] = useState<{ message: string; type: 'info' | 'success' | 'error' }>({ message: '', type: 'info' });
  
  // Hooks
  const { lockLiquidity, isLoading: isLocking } = useLockLiquidity();
  const { claimRewards, isLoading: isClaimingRewards } = useClaimRewards();
  const { lockIds, isLoading: isLoadingLocks } = useGetUserLocks(walletAddress || '');
  const { rewards: userRewards } = useGetUserRewards(walletAddress || '');

  const totalLocks = lockIds?.length || 0;
  const rewardsDisplay = useMemo(() => {
    if (userRewards === undefined) return 'Unavailable';
    return `${Number(formatEther(userRewards)).toFixed(6)} MATIC`;
  }, [userRewards]);

  useEffect(() => {
    setMounted(true);
  }, []);
  
  // IL Calculator state
  const [initialTokenAPrice, setInitialTokenAPrice] = useState('');
  const [initialTokenBPrice, setInitialTokenBPrice] = useState('');
  const [initialLPValue, setInitialLPValue] = useState('');
  const [currentTokenAPrice, setCurrentTokenAPrice] = useState('');
  const [currentTokenBPrice, setCurrentTokenBPrice] = useState('');
  const [ilResult, setIlResult] = useState<{ percentage: number; usdValue: number } | null>(null);
  
  // Calculate Impermanent Loss
  const calculateIL = () => {
    const initA = parseFloat(initialTokenAPrice);
    const initB = parseFloat(initialTokenBPrice);
    const currA = parseFloat(currentTokenAPrice);
    const currB = parseFloat(currentTokenBPrice);
    const initValue = parseFloat(initialLPValue);
    
    if (!initA || !initB || !currA || !currB || !initValue) {
      setStatus({ message: 'Fill all IL calculator fields before calculating.', type: 'error' });
      return;
    }
    
    // Calculate price ratio change
    const priceRatio = (currA / currB) / (initA / initB);
    
    // IL formula: 2 * sqrt(priceRatio) / (1 + priceRatio) - 1
    const ilMultiplier = (2 * Math.sqrt(priceRatio)) / (1 + priceRatio) - 1;
    const ilPercentage = ilMultiplier * 100;
    
    // Calculate USD value of IL
    const currentValue = initValue * (1 + ilMultiplier);
    const ilUsdValue = currentValue - initValue;
    
    setIlResult({
      percentage: ilPercentage,
      usdValue: ilUsdValue
    });
  };
  
  // Lock LP Tokens
  const handleLockLP = async () => {
    if (!walletAddress) {
      setStatus({ message: 'Please connect your wallet', type: 'error' });
      return;
    }
    
    if (!tokenAddress || !lpTokenAddress || !lockAmount) {
      setStatus({ message: 'Please fill in all fields', type: 'error' });
      return;
    }
    
    try {
      setStatus({ message: 'Locking LP tokens...', type: 'info' });
      const hash = await lockLiquidity(tokenAddress, lpTokenAddress, lockAmount, Number(lockDuration));
      if (publicClient) {
        setStatus({ message: 'Transaction submitted. Waiting for confirmation...', type: 'info' });
        await publicClient.waitForTransactionReceipt({ hash });
      }
      setStatus({ message: 'LP tokens locked successfully!', type: 'success' });
    } catch (error: unknown) {
      console.error('Lock error:', error);
      const message = error instanceof Error ? error.message : 'Failed to lock liquidity';
      setStatus({ message: `Error: ${message}`, type: 'error' });
    }
  };

  const handleClaimRewards = async () => {
    if (!walletAddress) {
      setStatus({ message: 'Please connect your wallet', type: 'error' });
      return;
    }
    if (!claimLockId) {
      setStatus({ message: 'Enter a lock ID to claim rewards', type: 'error' });
      return;
    }

    try {
      setStatus({ message: `Claiming rewards for lock #${claimLockId}...`, type: 'info' });
      const hash = await claimRewards(BigInt(claimLockId));
      if (publicClient) {
        setStatus({ message: 'Claim submitted. Waiting for confirmation...', type: 'info' });
        await publicClient.waitForTransactionReceipt({ hash });
      }
      setStatus({ message: 'Rewards claimed successfully!', type: 'success' });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Failed to claim rewards';
      setStatus({ message: `Error: ${message}`, type: 'error' });
    }
  };

  return (
    <div className="page-shell">
      <div className="section-wrap">
        <PageHeader
          title="Liquidity Management"
          subtitle="Manage LP locks, reward tiers, and impermanent-loss risk from a single panel."
          icon={Lock}
        />

        {/* Tabs */}
        <div className="bevel-panel mb-8 flex flex-wrap gap-2 p-2">
          {[
            { id: 'overview', label: 'Overview', icon: TrendingUp },
            { id: 'lock', label: 'Lock LP', icon: Lock },
            { id: 'rewards', label: 'Rewards', icon: Award },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as 'overview' | 'lock' | 'rewards')}
              className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-all ${
                activeTab === tab.id
                  ? 'border border-primary-300/45 bg-primary-500/20 text-primary-700 shadow-[inset_0_0_0_1px_rgba(45,212,191,0.22)]'
                  : 'text-neutral-300 hover:bg-dark-bg-hover/70'
              }`}
            >
              <tab.icon className="w-5 h-5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <Card variant="elevated" padding="lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-400 text-sm">Liquidity Value</span>
                  <TrendingUp className="w-5 h-5 text-primary-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">Unavailable</p>
                <p className="text-neutral-500 text-sm mt-1">No USD oracle wired in this build</p>
              </Card>

              <Card variant="elevated" padding="lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-400 text-sm">Locked Positions</span>
                  <Lock className="w-5 h-5 text-warning-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{walletAddress ? totalLocks : 'Unavailable'}</p>
                <p className="text-neutral-500 text-sm mt-1">From LiquidityController.getUserLocks</p>
              </Card>

              <Card variant="elevated" padding="lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-400 text-sm">Rewards Earned</span>
                  <Award className="w-5 h-5 text-success-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">{walletAddress ? rewardsDisplay : 'Unavailable'}</p>
                <p className="text-neutral-500 text-sm mt-1">From LiquidityController.getUserRewards</p>
              </Card>

              <Card variant="elevated" padding="lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-neutral-400 text-sm">IL Tool</span>
                  <AlertCircle className="w-5 h-5 text-secondary-500" />
                </div>
                <p className="text-3xl font-bold text-slate-900">Calculator</p>
                <p className="text-neutral-500 text-sm mt-1">Client-side estimation only</p>
              </Card>
            </div>

            {/* Active Positions */}
            <Card variant="elevated" padding="lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Your LP Positions</h2>
              {walletAddress ? (
                isLoadingLocks ? (
                  <div className="text-center py-12">
                    <p className="text-neutral-400">Loading lock IDs from chain...</p>
                  </div>
                ) : totalLocks === 0 ? (
                  <div className="text-center py-12">
                    <Lock className="w-16 h-16 text-neutral-500 mx-auto mb-4" />
                    <p className="text-neutral-400 mb-2">No LP positions yet</p>
                    <p className="text-neutral-500 text-sm mb-6">
                      Provide liquidity and lock LP tokens to create your first position
                    </p>
                    <Button variant="primary" onClick={() => setActiveTab('lock')}>
                      Lock LP Tokens
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {lockIds?.map((lockId) => (
                      <div key={lockId.toString()} className="rounded-xl border border-dark-border-primary bg-dark-bg-secondary p-4">
                        <div className="flex items-center justify-between">
                          <span className="text-neutral-400 text-sm">Lock ID</span>
                          <span className="text-slate-900 font-mono text-sm">#{lockId.toString()}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )
              ) : (
                <div className="text-center py-12">
                  <p className="text-neutral-400">Connect wallet to view your positions</p>
                </div>
              )}
            </Card>

            {/* Impermanent Loss Calculator */}
            <Card variant="elevated" padding="lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Impermanent Loss Calculator</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <Input 
                    label="Initial Token A Price" 
                    placeholder="0.00" 
                    type="number"
                    value={initialTokenAPrice}
                    onChange={(e) => setInitialTokenAPrice(e.target.value)}
                  />
                  <Input 
                    label="Initial Token B Price" 
                    placeholder="0.00" 
                    type="number"
                    value={initialTokenBPrice}
                    onChange={(e) => setInitialTokenBPrice(e.target.value)}
                  />
                  <Input 
                    label="Initial LP Value ($)" 
                    placeholder="0.00" 
                    type="number"
                    value={initialLPValue}
                    onChange={(e) => setInitialLPValue(e.target.value)}
                  />
                </div>
                <div className="space-y-4">
                  <Input 
                    label="Current Token A Price" 
                    placeholder="0.00" 
                    type="number"
                    value={currentTokenAPrice}
                    onChange={(e) => setCurrentTokenAPrice(e.target.value)}
                  />
                  <Input 
                    label="Current Token B Price" 
                    placeholder="0.00" 
                    type="number"
                    value={currentTokenBPrice}
                    onChange={(e) => setCurrentTokenBPrice(e.target.value)}
                  />
                  <div className="rounded-xl border border-dark-border-primary bg-dark-bg-secondary p-4">
                    <p className="text-neutral-400 text-sm mb-1">Impermanent Loss</p>
                    <p className={`text-2xl font-bold ${ilResult && ilResult.percentage < 0 ? 'text-error-500' : 'text-success-500'}`}>
                      {ilResult ? `${ilResult.percentage.toFixed(2)}%` : '-0.00%'}
                    </p>
                    <p className="text-neutral-500 text-xs mt-1">
                      ${ilResult ? Math.abs(ilResult.usdValue).toFixed(2) : '0.00'} USD
                    </p>
                  </div>
                </div>
              </div>
              <Button variant="primary" fullWidth className="mt-6" onClick={calculateIL}>
                Calculate IL
              </Button>
            </Card>
          </div>
        )}

        {/* Lock LP Tab */}
        {activeTab === 'lock' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card variant="elevated" padding="lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">Lock LP Tokens</h2>
              <div className="space-y-4">
                <Input 
                  label="Token Address" 
                  placeholder="0x..."
                  value={tokenAddress}
                  onChange={(e) => setTokenAddress(e.target.value)}
                />
                <Input 
                  label="LP Token Address" 
                  placeholder="0x..."
                  value={lpTokenAddress}
                  onChange={(e) => setLpTokenAddress(e.target.value)}
                />
                <Input 
                  label="Amount to Lock" 
                  placeholder="0.0" 
                  type="number"
                  value={lockAmount}
                  onChange={(e) => setLockAmount(e.target.value)}
                />
                
                <div>
                  <label className="block text-sm text-neutral-400 mb-2">Lock Duration</label>
                  <select 
                    className="w-full rounded-xl border border-dark-border-primary bg-[linear-gradient(140deg,rgba(255,255,255,0.96),rgba(242,246,253,0.96))] px-4 py-3 text-slate-900 focus:outline-none focus:ring-2 focus:ring-primary-400/55"
                    value={lockDuration}
                    onChange={(e) => setLockDuration(e.target.value)}
                  >
                    <option value="30">30 days (+5% bonus)</option>
                    <option value="90">90 days (+20% bonus)</option>
                    <option value="180">180 days (+20% bonus)</option>
                    <option value="365">1 year (+60% bonus)</option>
                    <option value="730">2 years (+60% bonus)</option>
                    <option value="1095">3 years (+60% bonus)</option>
                  </select>
                </div>

                <div className="rounded-xl border border-primary-500 bg-primary-500/10 p-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="w-5 h-5 text-primary-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-primary-500 font-medium text-sm mb-1">Lock Benefits</p>
                      <ul className="text-primary-400 text-xs space-y-1">
                        <li>- Build trust with your community</li>
                        <li>- Earn bonus rewards for longer locks</li>
                        <li>- Enforce unlock windows on-chain</li>
                        <li>- Keep lock records queryable by wallet</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {!walletAddress && (
                  <div className="rounded-xl border border-warning-500 bg-warning-500/10 p-4">
                    <p className="text-warning-500 text-sm text-center">Please connect your wallet to lock liquidity</p>
                  </div>
                )}

                {status.message && (
                  <div className={`rounded-xl border p-4 ${
                    status.type === 'error' ? 'bg-error-500/10 border-error-500' :
                    status.type === 'success' ? 'bg-success-500/10 border-success-500' :
                    'bg-primary-500/10 border-primary-500'
                  }`}>
                    <p className={`text-sm text-center ${
                      status.type === 'error' ? 'text-error-500' :
                      status.type === 'success' ? 'text-success-500' :
                      'text-primary-500'
                    }`}>{status.message}</p>
                  </div>
                )}

                <Button 
                  variant="primary" 
                  size="lg" 
                  fullWidth
                  onClick={handleLockLP}
                  disabled={!walletAddress || isLocking}
                >
                  {isLocking ? 'Locking...' : 'Lock LP Tokens'}
                </Button>
              </div>
            </Card>

            <div className="space-y-6">
              <Card variant="elevated" padding="lg">
                <h3 className="text-xl font-bold text-slate-900 mb-4">Lock Summary</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Lock Amount</span>
                    <span className="text-slate-900 font-bold">{lockAmount || '0'} LP</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Lock Duration</span>
                    <span className="text-slate-900 font-bold">{lockDuration} days</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Unlock Date</span>
                    <span className="text-slate-900 font-bold">
                      {lockDuration ? new Date(Date.now() + Number(lockDuration) * 24 * 60 * 60 * 1000).toLocaleDateString() : '-'}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Bonus Rewards</span>
                    <span className="text-success-500 font-bold">
                      +{Number(lockDuration) >= 365 ? '60' : Number(lockDuration) >= 90 ? '20' : Number(lockDuration) >= 30 ? '5' : '0'}%
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-neutral-400">Lock Owner</span>
                    <span className="text-primary-500 font-bold">{walletAddress ? 'Connected wallet' : 'Unavailable'}</span>
                  </div>
                </div>
              </Card>

              <Card variant="glass" padding="lg">
                <h3 className="text-lg font-bold text-slate-900 mb-2">Pro Tips</h3>
                <ul className="space-y-2 text-sm text-neutral-400">
                  <li>- Longer locks earn higher bonus rewards</li>
                  <li>- Verify token and LP addresses before submitting</li>
                  <li>- You can extend lock duration anytime</li>
                  <li>- Claims depend on owner-funded reward pool</li>
                  <li>- Emergency unlock available (with penalty)</li>
                </ul>
              </Card>
            </div>
          </div>
        )}

        {/* Rewards Tab */}
        {activeTab === 'rewards' && (
          <div className="space-y-6">
            <Card variant="elevated" padding="lg">
              <h2 className="text-2xl font-bold text-slate-900 mb-6">LP Rewards Program</h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <div className="rounded-xl border border-primary-500/30 bg-gradient-to-br from-primary-500/20 to-secondary-500/20 p-6">
                  <Award className="w-8 h-8 text-primary-500 mb-3" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Bronze Tier</h3>
                  <p className="text-neutral-400 text-sm mb-4">Lock 30-89 days</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-900">- +5% bonus rewards</p>
                    <p className="text-slate-900">- Standard NFT</p>
                    <p className="text-slate-900">- Basic analytics</p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-warning-500/20 to-primary-500/20 rounded-xl border border-warning-500/30">
                  <Award className="w-8 h-8 text-warning-500 mb-3" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Silver Tier</h3>
                  <p className="text-neutral-400 text-sm mb-4">Lock 90-364 days</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-900">- +20% bonus rewards</p>
                    <p className="text-slate-900">- Premium NFT</p>
                    <p className="text-slate-900">- Advanced analytics</p>
                    <p className="text-slate-900">- Priority support</p>
                  </div>
                </div>

                <div className="p-6 bg-gradient-to-br from-success-500/20 to-warning-500/20 rounded-xl border border-success-500/30">
                  <Award className="w-8 h-8 text-success-500 mb-3" />
                  <h3 className="text-xl font-bold text-slate-900 mb-2">Gold Tier</h3>
                  <p className="text-neutral-400 text-sm mb-4">Lock 365+ days</p>
                  <div className="space-y-2 text-sm">
                    <p className="text-slate-900">- +60% bonus rewards</p>
                    <p className="text-slate-900">- Legendary NFT</p>
                    <p className="text-slate-900">- Full analytics suite</p>
                    <p className="text-slate-900">- VIP support</p>
                    <p className="text-slate-900">- Governance rights</p>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border border-dark-border-primary bg-dark-bg-secondary p-6">
                <h3 className="text-lg font-bold text-slate-900 mb-4">Claimable Rewards</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-3xl font-bold text-slate-900 mb-1">{walletAddress ? rewardsDisplay : 'Unavailable'}</p>
                      <p className="text-neutral-400 text-sm">On-chain: LiquidityController.getUserRewards</p>
                    </div>
                  </div>
                  <Input
                    label="Lock ID to Claim"
                    placeholder="0"
                    type="number"
                    value={claimLockId}
                    onChange={(e) => setClaimLockId(e.target.value)}
                  />
                  {status.message && (
                    <div
                      className={`rounded-xl border p-4 ${
                        status.type === 'error'
                          ? 'bg-error-500/10 border-error-500'
                          : status.type === 'success'
                            ? 'bg-success-500/10 border-success-500'
                            : 'bg-primary-500/10 border-primary-500'
                      }`}
                    >
                      <p
                        className={`text-sm text-center ${
                          status.type === 'error'
                            ? 'text-error-500'
                            : status.type === 'success'
                              ? 'text-success-500'
                              : 'text-primary-500'
                        }`}
                      >
                        {status.message}
                      </p>
                    </div>
                  )}
                  <Button
                    variant="success"
                    size="lg"
                    onClick={handleClaimRewards}
                    disabled={!walletAddress || !claimLockId || isClaimingRewards}
                  >
                    {isClaimingRewards ? 'Claiming...' : 'Claim Rewards'}
                  </Button>
                  <p className="text-xs text-neutral-500">
                    Claims require the controller reward pool to be funded by the contract owner.
                  </p>
                </div>
              </div>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}

