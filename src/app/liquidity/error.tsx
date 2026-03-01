'use client';

type LiquidityErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function LiquidityError({ error, reset }: LiquidityErrorProps) {
  return (
    <div className="page-shell">
      <div className="section-wrap py-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-warning-500/60 bg-warning-500/10 p-6">
          <h2 className="text-xl font-bold text-slate-900">Liquidity Page Error</h2>
          <p className="mt-2 text-sm text-slate-600">
            The liquidity module failed to render. Try again and reconnect your wallet if needed.
          </p>
          <details className="mt-3 rounded-lg border border-slate-200 bg-white p-3 text-xs text-slate-600">
            <summary className="cursor-pointer font-medium text-slate-700">Technical details</summary>
            <pre className="mt-2 whitespace-pre-wrap break-all">{error.message}</pre>
          </details>
          <button
            type="button"
            onClick={reset}
            className="mt-4 rounded-lg border border-primary-400 bg-primary-500/15 px-4 py-2 text-sm font-medium text-primary-700 hover:bg-primary-500/25"
          >
            Retry Liquidity Page
          </button>
        </div>
      </div>
    </div>
  );
}
