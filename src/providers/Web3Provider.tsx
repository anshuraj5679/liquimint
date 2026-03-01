'use client';

import { useEffect } from 'react';
import { WagmiProvider, createConfig, http } from 'wagmi';
import { polygonAmoy } from 'wagmi/chains';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { injected } from 'wagmi/connectors';

const config = createConfig({
  chains: [polygonAmoy],
  multiInjectedProviderDiscovery: false,
  connectors: [
    injected({
      target: 'metaMask',
      shimDisconnect: false,
      unstable_shimAsyncInject: 2_000,
    }),
  ],
  transports: {
    [polygonAmoy.id]: http('https://rpc-amoy.polygon.technology/'),
  },
});

const queryClient = new QueryClient();

export function Web3Provider({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    const isMetaMaskConnectError = (value: unknown): boolean => {
      const message =
        typeof value === 'string'
          ? value
          : (value as any)?.message || (value as any)?.reason?.message || '';
      return /Failed to connect to MetaMask/i.test(message);
    };

    const handleUnhandledRejection = (event: PromiseRejectionEvent) => {
      if (isMetaMaskConnectError(event.reason)) {
        // Prevent dev overlay for known extension-side provider noise.
        event.preventDefault();
        console.warn('Suppressed MetaMask connection runtime error:', event.reason);
      }
    };

    const handleError = (event: ErrorEvent) => {
      if (isMetaMaskConnectError(event.error ?? event.message)) {
        event.preventDefault();
        console.warn('Suppressed MetaMask window error:', event.error ?? event.message);
      }
    };

    window.addEventListener('unhandledrejection', handleUnhandledRejection);
    window.addEventListener('error', handleError);

    return () => {
      window.removeEventListener('unhandledrejection', handleUnhandledRejection);
      window.removeEventListener('error', handleError);
    };
  }, []);

  return (
    <WagmiProvider config={config} reconnectOnMount>
      <QueryClientProvider client={queryClient}>
        {children}
      </QueryClientProvider>
    </WagmiProvider>
  );
}
