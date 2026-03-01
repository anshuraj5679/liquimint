'use client';

import { useEffect } from 'react';
import Link from 'next/link';

type ErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function Error({ error, reset }: ErrorProps) {
  useEffect(() => {
    console.error('App route error:', error);
  }, [error]);

  return (
    <div className="page-shell">
      <div className="section-wrap py-12">
        <div className="mx-auto max-w-2xl rounded-2xl border border-red-300/60 bg-red-50/70 p-8 text-center">
          <h1 className="text-2xl font-bold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600">
            A runtime error occurred while loading this page.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <button
              type="button"
              onClick={reset}
              className="rounded-lg border border-primary-400 bg-primary-500/15 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-500/25"
            >
              Try Again
            </button>
            <Link
              href="/"
              className="rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              Back Home
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
