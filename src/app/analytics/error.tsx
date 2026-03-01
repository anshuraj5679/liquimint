'use client';

type AnalyticsErrorProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

export default function AnalyticsError({ error, reset }: AnalyticsErrorProps) {
  return (
    <div className="page-shell">
      <div className="section-wrap py-10">
        <div className="mx-auto max-w-2xl rounded-2xl border border-warning-500/60 bg-warning-500/10 p-6">
          <h2 className="text-xl font-bold text-slate-900">Analytics Page Error</h2>
          <p className="mt-2 text-sm text-slate-600">
            Analytics failed to render. This can happen when RPC/indexed data is temporarily unavailable.
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
            Retry Analytics
          </button>
        </div>
      </div>
    </div>
  );
}
