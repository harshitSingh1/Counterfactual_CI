import { useState, useRef, useEffect } from 'react';
import { GitBranch, GitPullRequest, Menu, Network, ChevronDown, Check, Circle } from 'lucide-react';
import { REPO, BRANCH, PRS } from '@/data/demoData';

export function Header({
  selectedPR,
  onSelectPR,
  onOpenSidebar,
}: {
  selectedPR: string;
  onSelectPR: (id: string) => void;
  onOpenSidebar: () => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = PRS.find((pr) => pr.id === selectedPR)!;

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex min-h-[72px] items-center gap-4 border-b border-base-700/80 bg-base-950 px-4 lg:px-5">
      <button onClick={onOpenSidebar} aria-label="Open navigation" className="rounded p-1.5 text-slate-400 hover:bg-base-800 hover:text-slate-100 lg:hidden">
        <Menu size={20} />
      </button>
      <div className="flex min-w-[220px] items-center gap-3">
        <div className="relative flex h-9 w-9 items-center justify-center rounded bg-violet-500/15 text-violet-300 ring-1 ring-inset ring-violet-400/30">
          <Network size={19} strokeWidth={2.4} />
        </div>
        <div className="leading-tight">
          <h1 className="text-[16px] font-semibold tracking-tight text-slate-100">Counterfactual CI</h1>
          <p className="mt-1 text-[11px] text-slate-500">Predict. Compare. Verify. Ship Confidently.</p>
        </div>
      </div>

      <div className="hidden h-8 w-px bg-base-700 lg:block" />
      <div className="hidden items-center gap-2 rounded border border-base-700 bg-base-850 px-3 py-2 xl:flex">
        <Circle size={10} className="fill-slate-300 text-slate-300" />
        <span className="font-mono text-xs text-slate-200">{REPO}</span>
        <span className="text-base-600">·</span>
        <span className="flex items-center gap-1 text-xs text-slate-400"><GitBranch size={13} /> {BRANCH}</span>
      </div>

      <div className="ml-auto flex min-w-0 items-center gap-2" ref={ref}>
        <div className="hidden items-center gap-1 overflow-x-auto md:flex">
          {PRS.map((pr) => {
            const active = pr.id === selectedPR;
            return (
              <button
                key={pr.id}
                onClick={() => onSelectPR(pr.id)}
                className={`min-w-[118px] border px-3 py-2 text-left transition-colors ${active ? 'border-accent-blue bg-accent-blue/10' : 'border-base-700 bg-base-850 hover:bg-base-800'}`}
              >
                <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-100"><GitPullRequest size={12} className={active ? 'text-accent-blue' : 'text-slate-500'} /> PR #{pr.number}</div>
                <div className="mt-1 truncate text-[10px] text-slate-400">{pr.title}</div>
              </button>
            );
          })}
        </div>
        <button onClick={() => setOpen((value) => !value)} className="flex items-center gap-2 border border-base-700 bg-base-850 px-3 py-2 text-xs text-slate-200 md:hidden">
          <GitPullRequest size={13} className="text-accent-blue" /> PR #{current.number} <ChevronDown size={13} className="text-slate-500" />
        </button>
        {open && (
          <div className="absolute right-4 top-14 w-64 border border-base-700 bg-base-850 shadow-xl shadow-black/30 md:hidden">
            {PRS.map((pr) => (
              <button key={pr.id} onClick={() => { onSelectPR(pr.id); setOpen(false); }} className="flex w-full items-center justify-between border-b border-base-700/70 px-3 py-3 text-left hover:bg-base-800">
                <span><span className="block text-xs font-semibold text-slate-100">PR #{pr.number}</span><span className="mt-1 block text-[11px] text-slate-400">{pr.title}</span></span>
                {pr.id === selectedPR && <Check size={14} className="text-accent-blue" />}
              </button>
            ))}
          </div>
        )}
      </div>
    </header>
  );
}
