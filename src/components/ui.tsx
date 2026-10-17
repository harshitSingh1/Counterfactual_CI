import type { ReactNode } from 'react';

export function Panel({
  children,
  className = '',
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`border border-base-700/90 bg-base-850 ${className}`}>
      {children}
    </section>
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
    <div className="flex items-start justify-between gap-3 border-b border-base-700/80 px-3 py-2.5">
      <div className="flex min-w-0 items-start gap-2">
        {icon && <div className="mt-0.5 shrink-0 text-accent-blue">{icon}</div>}
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold tracking-tight text-slate-100">{title}</h3>
          {subtitle && <p className="mt-0.5 truncate text-[11px] text-slate-400">{subtitle}</p>}
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
    neutral: 'bg-base-800 text-slate-300 border-base-700',
    ok: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
    bad: 'bg-red-500/10 text-red-300 border-red-500/30',
    warn: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
    violet: 'bg-violet-500/10 text-violet-300 border-violet-500/30',
    blue: 'bg-sky-500/10 text-sky-300 border-sky-500/30',
  };
  return (
    <span className={`inline-flex items-center gap-1 rounded border px-1.5 py-0.5 text-[10px] font-medium ${tones[tone]} ${className}`}>
      {children}
    </span>
  );
}

export function StatusDot({ tone }: { tone: 'ok' | 'bad' | 'warn' | 'neutral' }) {
  const colors = { ok: 'bg-emerald-400', bad: 'bg-red-400', warn: 'bg-amber-400', neutral: 'bg-slate-500' };
  return <span className={`inline-block h-2 w-2 rounded-full ${colors[tone]}`} />;
}
