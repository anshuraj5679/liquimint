'use client';

import { LucideIcon } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  icon: LucideIcon;
  rightSlot?: React.ReactNode;
}

export default function PageHeader({ title, subtitle, icon: Icon, rightSlot }: PageHeaderProps) {
  return (
    <div className="mb-8 flex flex-col gap-4 md:mb-10 md:flex-row md:items-start md:justify-between">
      <div className="flex items-start gap-4">
        <div className="relative flex h-12 w-12 items-center justify-center rounded-2xl border border-primary-400/35 bg-primary-500/12 text-primary-700 shadow-glow-primary">
          <span className="glow-dot absolute -right-1 -top-1" />
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <span className="brand-chip mb-2">LiquiMint Console</span>
          <h1 className="text-3xl font-bold text-slate-900 md:text-4xl">{title}</h1>
          <p className="mt-1 max-w-2xl text-sm text-slate-600 md:text-base">{subtitle}</p>
        </div>
      </div>
      {rightSlot ? <div className="self-start md:self-auto">{rightSlot}</div> : null}
    </div>
  );
}

