'use client';

import { useEffect } from 'react';

type GlobalErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function GlobalError({ error, reset }: GlobalErrorProps) {
  useEffect(() => {
    console.error('Global app error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#f7f9fc] text-slate-900">
        <main className="mx-auto flex min-h-screen max-w-3xl items-center justify-center p-6">
          <section className="w-full rounded-2xl border border-red-300/60 bg-red-50/80 p-8 text-center">
            <h1 className="text-2xl font-bold">Application Error</h1>
            <p className="mt-2 text-sm text-slate-600">
              The app hit an unexpected error. Reload or try again.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-6 rounded-lg border border-primary-400 bg-primary-500/15 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-500/25"
            >
              Try Again
            </button>
          </section>
        </main>
      </body>
    </html>
  );
}
