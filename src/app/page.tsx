'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Manrope, Space_Grotesk } from 'next/font/google';
import { motion, useInView } from 'framer-motion';
import {
  ArrowDown,
  ArrowRight,
  BarChart3,
  CandlestickChart,
  ChevronRight,
  CircleCheckBig,
  Coins,
  Droplets,
  Lock,
  Rocket,
  Shield,
  ShieldCheck,
  Sparkles,
  Trophy,
  Wallet,
} from 'lucide-react';
import { useAccount, useConnect } from 'wagmi';
import { Button } from '@/design-system/components';
import { usePlatformMetrics } from '@/hooks/usePlatformMetrics';
import { contractConfig, curveTypeInfo, CurveType, networkConfig } from '@/config/contracts-v2';

const landingDisplay = Space_Grotesk({
  subsets: ['latin'],
  variable: '--font-landing-display',
  weight: ['600', '700'],
});

const landingBody = Manrope({
  subsets: ['latin'],
  variable: '--font-landing-body',
  weight: ['400', '500', '600'],
});

function useCountUp(target: number, duration = 2000, startOnView = false, isInView = true) {
  const [count, setCount] = useState(0);
  const hasRun = useRef(false);

  useEffect(() => {
    if (startOnView && !isInView) return;
    if (hasRun.current) return;
    hasRun.current = true;

    const start = performance.now();
    const step = (now: number) => {
      const elapsed = now - start;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(target * eased));
      if (progress < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [target, duration, startOnView, isInView]);

  return count;
}

function StorySection({
  id,
  children,
  className = '',
}: {
  id: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`story-section ${className}`}>
      <div className="story-section-inner">{children}</div>
    </section>
  );
}

function Reveal({
  children,
  delay = 0,
  direction = 'up',
  className = '',
}: {
  children: React.ReactNode;
  delay?: number;
  direction?: 'up' | 'left' | 'right';
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.3 });
  const initial =
    direction === 'left'
      ? { opacity: 0, x: -60 }
      : direction === 'right'
        ? { opacity: 0, x: 60 }
        : { opacity: 0, y: 50 };

  return (
    <motion.div
      ref={ref}
      initial={initial}
      animate={isInView ? { opacity: 1, x: 0, y: 0 } : initial}
      transition={{ duration: 0.7, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function CurveSVG({ type }: { type: 'linear' | 'exponential' | 'sigmoid' }) {
  const paths = {
    linear: 'M 10 130 L 190 20',
    exponential: 'M 10 135 Q 80 130 120 90 T 190 10',
    sigmoid: 'M 10 135 C 50 135 70 120 100 75 S 150 10 190 10',
  };

  const colors = {
    linear: '#14b8a6',
    exponential: '#f97316',
    sigmoid: '#a78bfa',
  };

  return (
    <svg viewBox="0 0 200 145" className="h-full w-full" preserveAspectRatio="none">
      {[30, 60, 90, 120].map((y) => (
        <line key={y} x1="0" y1={y} x2="200" y2={y} stroke="rgba(42,58,84,0.3)" strokeWidth="0.5" />
      ))}
      {[50, 100, 150].map((x) => (
        <line key={x} x1={x} y1="0" x2={x} y2="145" stroke="rgba(42,58,84,0.3)" strokeWidth="0.5" />
      ))}
      <motion.path
        d={paths[type]}
        fill="none"
        stroke={colors[type]}
        strokeWidth="3"
        strokeLinecap="round"
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.8, ease: 'easeInOut' }}
      />
    </svg>
  );
}

export default function Home() {
  const { isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { metrics } = usePlatformMetrics();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const handleConnect = async () => {
    const connector = connectors.find((c) => c.id === 'metaMask' || c.id === 'injected') ?? connectors[0];
    if (!connector) {
      console.error('No wallet connector is available.');
      return;
    }

    try {
      await connectAsync({ connector });
    } catch (error) {
      // Prevent unhandled connector errors from crashing the UI.
      console.error('Wallet connection failed:', error);
    }
  };

  const statsRef = useRef(null);
  const statsInView = useInView(statsRef, { once: true, amount: 0.4 });

  const totalVolumeMetric = metrics.totalVolumeMatic === null ? null : Math.max(0, Math.round(Number(metrics.totalVolumeMatic)));
  const totalTvlMetric = metrics.totalTvlMatic === null ? null : Math.max(0, Math.round(Number(metrics.totalTvlMatic)));
  const activeTradersMetric = metrics.activeTraders ?? null;

  const tokenCount = useCountUp(metrics.totalTokens, 1800, true, statsInView);
  const tradeVolume = useCountUp(totalVolumeMetric ?? 0, 2200, true, statsInView);
  const totalTvl = useCountUp(totalTvlMetric ?? 0, 1600, true, statsInView);
  const activeTraders = useCountUp(activeTradersMetric ?? 0, 2000, true, statsInView);

  const statCards = [
    { value: tokenCount, label: 'Tokens Created', suffix: '', unavailable: false },
    { value: tradeVolume, label: 'Total Volume', suffix: ' MATIC', unavailable: totalVolumeMetric === null },
    { value: totalTvl, label: 'Total TVL', suffix: ' MATIC', unavailable: totalTvlMetric === null },
    { value: activeTraders, label: 'Active Traders', suffix: '+', unavailable: activeTradersMetric === null },
  ];

  const howItWorks = [
    {
      step: '01',
      title: 'Create Your Token',
      desc: `Deploy a bonding curve token in seconds for just ${contractConfig.bondingCurve.minCreationFee} MATIC. Choose from linear, exponential, or sigmoid curves.`,
      icon: Rocket,
      color: 'primary',
    },
    {
      step: '02',
      title: 'Trade Instantly',
      desc: 'Buy and sell tokens directly through the bonding curve. No liquidity pool needed - the smart contract is the market maker.',
      icon: CandlestickChart,
      color: 'secondary',
    },
    {
      step: '03',
      title: 'Graduate to DEX',
      desc: `When your token hits ${contractConfig.bondingCurve.graduationThreshold} MATIC TVL, it automatically graduates to a full DEX pair with locked liquidity.`,
      icon: Trophy,
      color: 'success',
    },
  ];

  const curveTypes = [
    { key: CurveType.LINEAR, svg: 'linear' as const, accent: 'from-primary-400 to-teal-300' },
    { key: CurveType.EXPONENTIAL, svg: 'exponential' as const, accent: 'from-secondary-400 to-amber-300' },
    { key: CurveType.SIGMOID, svg: 'sigmoid' as const, accent: 'from-violet-400 to-purple-300' },
  ];

  const ecosystemFeatures = [
    {
      title: 'Creator Studio',
      desc: 'Configure token parameters, royalties, metadata, and launch on-chain in one flow.',
      icon: Rocket,
      href: '/creator',
      span: 'md:col-span-2',
      accent: 'border-primary-400/30',
    },
    {
      title: 'Trade Desk',
      desc: 'Explore deployed tokens, evaluate real-time metrics, and enter live trades.',
      icon: CandlestickChart,
      href: '/trade',
      span: '',
      accent: 'border-secondary-400/30',
    },
    {
      title: 'Liquidity Ops',
      desc: 'Lock and manage LP positions with transparent on-chain controls.',
      icon: Droplets,
      href: '/liquidity',
      span: '',
      accent: 'border-success-500/30',
    },
    {
      title: 'Analytics Hub',
      desc: 'Monitor platform-wide data, track top movers, and analyze bonding curves.',
      icon: BarChart3,
      href: '/analytics',
      span: '',
      accent: 'border-blue-400/30',
    },
  ];

  return (
    <div className={`relative landing-page ${landingDisplay.variable} ${landingBody.variable}`}>
      <StorySection id="hero" className="min-h-[88vh] md:py-28">
        <div className="pointer-events-none absolute -left-32 top-1/4 h-[500px] w-[500px] rounded-full bg-primary-500/15 blur-[120px]" />
        <div className="pointer-events-none absolute -right-32 bottom-1/4 h-[400px] w-[400px] rounded-full bg-secondary-500/12 blur-[100px]" />
        <div className="pointer-events-none absolute left-1/2 top-1/3 h-[300px] w-[300px] -translate-x-1/2 rounded-full bg-violet-500/8 blur-[80px]" />

        <div className="relative z-10 mx-auto max-w-5xl text-center">
          <Reveal>
            <span className="brand-chip mb-6 inline-flex">
              <Sparkles className="h-4 w-4" />
              LiquiMint - AI-Powered Bonding Curve DEX
            </span>
          </Reveal>

          <Reveal delay={0.1}>
            <h1 className="mx-auto max-w-4xl text-5xl font-bold leading-[1.08] text-slate-900 md:text-7xl lg:text-8xl">
              The Future of <span className="gradient-text">Token Launches</span> Starts Here
            </h1>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mx-auto mt-6 max-w-2xl text-lg text-neutral-300 md:text-xl">
              Create bonding curve tokens in seconds. No upfront liquidity needed. Fair pricing powered by math.
              Auto-graduation to a full DEX pair.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {mounted && isConnected ? (
                <>
                  <Link href="/creator">
                    <Button size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>
                      Launch Token
                    </Button>
                  </Link>
                  <Link href="/trade">
                    <Button size="xl" variant="secondary">
                      Open Market
                    </Button>
                  </Link>
                </>
              ) : (
                <Button
                  size="xl"
                  leftIcon={<Wallet className="h-5 w-5" />}
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                  onClick={handleConnect}
                  isDisabled={!mounted}
                >
                  Connect Wallet to Start
                </Button>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.5}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-8 gap-y-3 rounded-2xl border border-dark-border-primary bg-dark-bg-secondary/45 px-6 py-4 text-sm text-neutral-300 backdrop-blur-xl">
              <span className="flex items-center gap-2">
                <ShieldCheck className="h-4 w-4 text-success-400" /> On-chain contracts
              </span>
              <span className="flex items-center gap-2">
                <Lock className="h-4 w-4 text-primary-400" /> LP lock controller integrated
              </span>
              <span className="flex items-center gap-2">
                <Coins className="h-4 w-4 text-secondary-400" /> Just {contractConfig.bondingCurve.minCreationFee} MATIC
              </span>
            </div>
          </Reveal>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2">
          <div className="scroll-indicator flex flex-col items-center gap-2 text-neutral-500">
            <span className="text-xs uppercase tracking-widest">Scroll to explore</span>
            <ArrowDown className="h-5 w-5" />
          </div>
        </div>
      </StorySection>

      <StorySection id="stats" className="border-t border-dark-border-primary/30">
        <div ref={statsRef}>
          <Reveal>
            <p className="mb-2 text-center text-sm font-semibold uppercase tracking-[0.2em] text-primary-300">
              Platform Metrics
            </p>
            <h2 className="mb-12 text-center text-4xl font-bold text-slate-900 md:text-5xl">
              Built for <span className="gradient-text">Real Activity</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-2 gap-6 md:grid-cols-4 md:gap-10">
            {statCards.map((stat, i) => (
              <Reveal key={stat.label} delay={i * 0.1}>
                <div className="text-center">
                  <p className="stat-value">
                    {stat.unavailable ? (
                      <span className="text-2xl md:text-4xl">Unavailable</span>
                    ) : (
                      <>
                        {stat.value}
                        <span className="text-3xl text-primary-300 md:text-5xl">{stat.suffix}</span>
                      </>
                    )}
                  </p>
                  <p className="stat-label">{stat.label}</p>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={0.5}>
            <div className="mt-12 flex items-center justify-center">
              <div className="inline-flex items-center gap-3 rounded-full border border-dark-border-primary bg-dark-bg-secondary/60 px-5 py-2.5 text-sm text-neutral-300 backdrop-blur-lg">
                <span className="glow-dot" />
                Live on <strong className="text-slate-900">{networkConfig.name}</strong>
              </div>
            </div>
          </Reveal>
        </div>
      </StorySection>

      <StorySection id="how-it-works" className="border-t border-dark-border-primary/30">
        <Reveal>
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-[0.2em] text-secondary-300">
            How It Works
          </p>
          <h2 className="mb-14 text-center text-4xl font-bold text-slate-900 md:text-5xl">
            Three Steps to <span className="gradient-text">Launch</span>
          </h2>
        </Reveal>

        <div className="relative grid gap-10 md:grid-cols-3 md:gap-6">
          <div className="pointer-events-none absolute left-0 right-0 top-16 hidden h-px bg-gradient-to-r from-transparent via-primary-500/40 to-transparent md:block" />

          {howItWorks.map((item, i) => {
            const Icon = item.icon;
            const colorMap: Record<string, string> = {
              primary: 'border-primary-400/40 bg-primary-500/12 text-primary-700',
              secondary: 'border-secondary-400/40 bg-secondary-500/12 text-secondary-200',
              success: 'border-success-500/40 bg-success-500/12 text-success-300',
            };
            return (
              <Reveal key={item.step} delay={i * 0.15}>
                <div className="relative flex flex-col items-center text-center">
                  <div className={`relative z-10 mb-6 flex h-14 w-14 items-center justify-center rounded-2xl border ${colorMap[item.color]}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="mb-1 font-mono text-xs text-neutral-500">{item.step}</span>
                  <h3 className="mb-3 text-xl font-bold text-slate-900">{item.title}</h3>
                  <p className="max-w-xs text-sm text-neutral-400">{item.desc}</p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </StorySection>

      <StorySection id="curves" className="border-t border-dark-border-primary/30">
        <Reveal>
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-[0.2em] text-violet-300">
            Bonding Curve Technology
          </p>
          <h2 className="mb-6 text-center text-4xl font-bold text-slate-900 md:text-5xl">
            Price Discovery <span className="gradient-text">by Design</span>
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-neutral-400">
            Choose the mathematical curve that fits your token economy. Each curve type determines how price scales
            with supply - no order books, no market manipulation.
          </p>
        </Reveal>

        <div className="grid gap-6 md:grid-cols-3">
          {curveTypes.map((ct, i) => {
            const info = curveTypeInfo[ct.key];
            return (
              <Reveal key={ct.key} delay={i * 0.12}>
                <div className="bento-card flex flex-col">
                  <div className="curve-illustration mb-5">
                    <CurveSVG type={ct.svg} />
                    <span className="absolute bottom-1 right-2 text-[10px] uppercase tracking-widest text-neutral-600">Supply -&gt;</span>
                    <span className="absolute left-2 top-1 text-[10px] uppercase tracking-widest text-neutral-600">Price -&gt;</span>
                  </div>
                  <h3 className={`bg-gradient-to-r ${ct.accent} bg-clip-text text-xl font-bold text-transparent`}>{info.name}</h3>
                  <p className="mt-2 text-sm text-neutral-400">{info.description}</p>
                  <div className="mt-4 rounded-lg border border-dark-border-primary bg-dark-bg-primary/50 px-3 py-2">
                    <code className="font-mono text-xs text-neutral-300">{info.formula}</code>
                  </div>
                  <p className="mt-3 text-xs text-neutral-500">
                    <span className="text-primary-300">Best for:</span> {info.bestFor}
                  </p>
                </div>
              </Reveal>
            );
          })}
        </div>
      </StorySection>

      <StorySection id="security" className="border-t border-dark-border-primary/30">
        <div className="grid items-center gap-12 md:grid-cols-2">
          <Reveal direction="left">
            <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-success-300">Security First</p>
            <h2 className="mb-6 text-4xl font-bold text-slate-900 md:text-5xl">
              Your Assets Are <span className="gradient-text">Protected</span>
            </h2>
            <p className="mb-8 text-neutral-400">
              LiquiMint prioritizes transparent, inspectable safety controls. LP lock primitives are integrated in the
              graduation path, contract addresses are public, and the interface avoids fabricating risk signals when
              scanner/indexed feeds are unavailable.
            </p>
            <div className="space-y-4">
              {[
                {
                  icon: Lock,
                  title: 'Auto LP Lock',
                  desc: `Liquidity locked for ${contractConfig.liquidityLock.minDuration}-${contractConfig.liquidityLock.maxDuration} days upon DEX graduation`,
                },
                {
                  icon: Shield,
                  title: 'Explicit Risk States',
                  desc: 'When risk-scanner feeds are missing, UI shows unavailable status instead of synthetic scores',
                },
                {
                  icon: CircleCheckBig,
                  title: 'Explorer Visibility',
                  desc: 'Token and factory addresses are linked directly to Polygon Amoy explorer',
                },
              ].map((item, i) => (
                <div key={i} className="flex gap-4">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-success-500/30 bg-success-500/10 text-success-400">
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-slate-900">{item.title}</h4>
                    <p className="text-sm text-neutral-400">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </Reveal>

          <Reveal direction="right">
            <div className="relative rounded-3xl border border-dark-border-primary bg-dark-bg-secondary/40 p-8 backdrop-blur-lg">
              <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-success-500/10 blur-3xl" />
              <div className="relative z-10 space-y-6">
                <div className="flex items-center justify-between rounded-xl border border-dark-border-primary bg-dark-bg-primary/60 px-5 py-4">
                  <span className="text-sm text-neutral-300">Contract Status</span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-success-400">
                    <span className="glow-dot" /> Deployed on Amoy
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-dark-border-primary bg-dark-bg-primary/60 px-5 py-4">
                  <span className="text-sm text-neutral-300">LP Lock Status</span>
                  <span className="flex items-center gap-2 text-sm font-semibold text-success-400">
                    <Lock className="h-4 w-4" /> Supported by contracts
                  </span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-dark-border-primary bg-dark-bg-primary/60 px-5 py-4">
                  <span className="text-sm text-neutral-300">Rug Risk Score</span>
                  <span className="text-sm font-semibold text-neutral-300">Unavailable</span>
                </div>
                <div className="flex items-center justify-between rounded-xl border border-dark-border-primary bg-dark-bg-primary/60 px-5 py-4">
                  <span className="text-sm text-neutral-300">Network</span>
                  <span className="text-sm font-semibold text-primary-300">{networkConfig.name}</span>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </StorySection>

      <StorySection id="ecosystem" className="border-t border-dark-border-primary/30">
        <Reveal>
          <p className="mb-2 text-center text-sm font-semibold uppercase tracking-[0.2em] text-amber-300">Ecosystem</p>
          <h2 className="mb-6 text-center text-4xl font-bold text-slate-900 md:text-5xl">
            Everything You Need, <span className="gradient-text">One Platform</span>
          </h2>
          <p className="mx-auto mb-12 max-w-2xl text-center text-neutral-400">
            Launch tokens, trade on bonding curves, manage liquidity, and monitor analytics from a single interface.
          </p>
        </Reveal>

        <div className="grid gap-4 md:grid-cols-3">
          {ecosystemFeatures.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <Reveal key={feature.title} delay={i * 0.08} className={feature.span}>
                <Link href={feature.href} className="block h-full">
                  <div className={`bento-card group flex h-full flex-col ${feature.accent}`}>
                    <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl border border-dark-border-primary bg-dark-bg-primary/50 text-neutral-300 transition-colors group-hover:text-primary-300">
                      <Icon className="h-6 w-6" />
                    </div>
                    <h3 className="mb-2 text-lg font-bold text-slate-900">{feature.title}</h3>
                    <p className="text-sm text-neutral-400">{feature.desc}</p>
                    <div className="mt-auto pt-4">
                      <span className="inline-flex items-center gap-1 text-xs font-semibold uppercase tracking-widest text-primary-300 opacity-0 transition-opacity group-hover:opacity-100">
                        Explore <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                </Link>
              </Reveal>
            );
          })}
        </div>
      </StorySection>

      <StorySection id="cta" className="border-t border-dark-border-primary/30">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(20,184,166,0.08),transparent_60%)]" />
        <div className="relative z-10 text-center">
          <Reveal>
            <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-3xl border border-primary-400/30 bg-primary-500/10 text-primary-300">
              <Sparkles className="h-10 w-10" />
            </div>
          </Reveal>

          <Reveal delay={0.1}>
            <h2 className="mx-auto max-w-3xl text-4xl font-bold text-slate-900 md:text-6xl">
              Ready to Launch Your <span className="gradient-text">Next Token</span>?
            </h2>
          </Reveal>

          <Reveal delay={0.2}>
            <p className="mx-auto mt-5 max-w-xl text-lg text-neutral-400">
              Join the next generation of DeFi. Create, trade, and earn - all on {networkConfig.name}.
            </p>
          </Reveal>

          <Reveal delay={0.3}>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              {mounted && isConnected ? (
                <>
                  <Link href="/creator">
                    <Button size="xl" rightIcon={<ArrowRight className="h-5 w-5" />}>
                      Launch Token Now
                    </Button>
                  </Link>
                  <Link href="/analytics">
                    <Button size="xl" variant="secondary" leftIcon={<BarChart3 className="h-5 w-5" />}>
                      View Analytics
                    </Button>
                  </Link>
                </>
              ) : (
                <Button
                  size="xl"
                  leftIcon={<Wallet className="h-5 w-5" />}
                  rightIcon={<ArrowRight className="h-5 w-5" />}
                  onClick={handleConnect}
                  isDisabled={!mounted}
                >
                  Connect Wallet to Get Started
                </Button>
              )}
            </div>
          </Reveal>

          <Reveal delay={0.45}>
            <div className="mt-12 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-neutral-500">
              <span>Powered by Polygon</span>
              <span>|</span>
              <span>Chain ID {networkConfig.chainId}</span>
              <span>|</span>
              <a
                href={networkConfig.blockExplorer}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-400 transition-colors hover:text-primary-300"
              >
                View on Explorer -&gt;
              </a>
            </div>
          </Reveal>
        </div>
      </StorySection>
    </div>
  );
}

