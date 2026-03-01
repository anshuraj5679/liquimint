'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAccount, useConnect, useDisconnect } from 'wagmi';
import { AnimatePresence, motion } from 'framer-motion';
import { BarChart3, CandlestickChart, Droplets, LogOut, Menu, Rocket, Wallet, X } from 'lucide-react';
import { Button } from '@/design-system/components';

const navItems = [
  { href: '/creator', label: 'Launch', icon: Rocket },
  { href: '/trade', label: 'Market', icon: CandlestickChart },
  { href: '/liquidity', label: 'Liquidity', icon: Droplets },
  { href: '/analytics', label: 'Analytics', icon: BarChart3 },
];

function shortAddress(address: string) {
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

export default function Navigation() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const { address, isConnected } = useAccount();
  const { connectAsync, connectors } = useConnect();
  const { disconnect } = useDisconnect();

  useEffect(() => {
    setMounted(true);
  }, []);

  const isActive = (href: string) => pathname?.startsWith(href);

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

  return (
    <nav className="sticky top-0 z-50 border-b border-dark-border-primary/70 bg-dark-bg-primary/65 backdrop-blur-2xl">
      <div className="section-wrap px-4 py-3 md:px-6">
        <div className="bevel-panel flex min-h-[74px] items-center justify-between px-4 py-3 md:px-5">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex h-10 w-10 items-center justify-center rounded-xl border border-primary-300/40 bg-primary-500/12 text-primary-700 shadow-glow-primary">
              <Droplets className="h-5 w-5" />
              <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full border border-dark-bg-primary bg-secondary-400" />
            </div>
            <div>
              <p className="text-lg font-bold tracking-tight text-slate-900">LiquiMint</p>
              <p className="text-[11px] uppercase tracking-[0.15em] text-neutral-400">Bonding Curve DEX</p>
            </div>
          </Link>

          <div className="hidden items-center gap-1 rounded-xl border border-dark-border-primary bg-dark-bg-secondary/70 p-1 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`inline-flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-semibold transition-all ${
                  isActive(item.href)
                    ? 'bg-primary-500/18 text-primary-700 shadow-[inset_0_0_0_1px_rgba(59,130,246,0.25)]'
                    : 'text-slate-600 hover:bg-dark-bg-hover/75 hover:text-slate-900'
                }`}
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </Link>
            ))}
          </div>

          <div className="hidden items-center gap-2 md:flex">
            {mounted && isConnected ? (
              <>
                <div className="rounded-lg border border-dark-border-primary bg-dark-bg-secondary/70 px-3 py-2">
                  <span className="font-mono text-sm text-slate-700">{shortAddress(address!)}</span>
                </div>
                <Button variant="secondary" size="md" leftIcon={<LogOut className="h-4 w-4" />} onClick={() => disconnect()}>
                  Disconnect
                </Button>
              </>
            ) : (
              <Button
                variant="primary"
                size="md"
                leftIcon={<Wallet className="h-4 w-4" />}
                isDisabled={!mounted}
                onClick={handleConnect}
              >
                Connect Wallet
              </Button>
            )}
          </div>

          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-xl border border-dark-border-primary bg-dark-bg-secondary/70 p-2 text-slate-700 transition hover:bg-dark-bg-hover md:hidden"
          >
            {menuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="mx-4 mb-3 rounded-2xl border border-dark-border-primary bg-dark-bg-secondary/94 p-3 md:hidden"
          >
            <div className="space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className={`flex items-center gap-3 rounded-xl px-4 py-3 text-sm font-semibold ${
                    isActive(item.href)
                      ? 'bg-primary-500/18 text-primary-700'
                      : 'text-slate-700 hover:bg-dark-bg-hover/80'
                  }`}
                >
                  <item.icon className="h-5 w-5" />
                  {item.label}
                </Link>
              ))}

              {mounted && isConnected ? (
                <div className="space-y-2 pt-1">
                  <div className="rounded-xl border border-dark-border-primary bg-dark-bg-elevated/70 px-4 py-3 font-mono text-sm text-slate-700">
                    {shortAddress(address!)}
                  </div>
                  <Button
                    variant="secondary"
                    fullWidth
                    leftIcon={<LogOut className="h-4 w-4" />}
                    onClick={() => {
                      disconnect();
                      setMenuOpen(false);
                    }}
                  >
                    Disconnect
                  </Button>
                </div>
              ) : (
                <Button
                  variant="primary"
                  fullWidth
                  leftIcon={<Wallet className="h-4 w-4" />}
                  isDisabled={!mounted}
                  onClick={handleConnect}
                >
                  Connect Wallet
                </Button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
}

