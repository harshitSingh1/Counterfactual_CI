import type { ReactNode } from 'react';

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`rounded-xl border border-base-700/80 bg-base-850/70 backdrop-blur-sm ${className}`}
    >
      {children}
    </div>
  );
}

export function PanelHeader({
  title,
  subtitle,
  icon,
  right,
}: {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  right?: ReactNode;
}) {
  return (
    <div className="flex items-start justify-between gap-3 border-b border-base-700/70 px-4 py-3">
      <div className="flex items-start gap-2.5">
        {icon && <div className="mt-0.5 text-accent-blue">{icon}</div>}
        <div>
          <h3 className="text-sm font-semibold tracking-tight text-slate-100">{title}</h3>
          {subtitle && <p className="mt-0.5 text-xs text-slate-400">{subtitle}</p>}
        </div>
      </div>
      {right}
    </div>
  );
}

export function Badge({
  children,
  tone = 'neutral',
  className = '',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'ok' | 'bad' | 'warn' | 'violet' | 'blue';
  className?: string;
}) {
  const tones: Record<string, string> = {
    neutral: 'bg-base-700/60 text-slate-300 border-base-600/60',
    ok: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30',
    bad: 'bg-red-500/10 text-red-400 border-red-500/30',
    warn: 'bg-amber-500/10 text-amber-400 border-amber-500/30',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
    blue: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  };
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-md border px-2 py-0.5 text-[11px] font-medium ${tones[tone]} ${className}`}
    >
      {children}
    </span>
  );
}

export function StatusDot({ tone }: { tone: 'ok' | 'bad' | 'warn' | 'neutral' }) {
  const colors = {
    ok: 'bg-emerald-400',
    bad: 'bg-red-400',
    warn: 'bg-amber-400',
    neutral: 'bg-slate-500',
  };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[tone]}`} />;
}
