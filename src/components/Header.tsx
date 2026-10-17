import { useState, useRef, useEffect } from 'react';
import { GitBranch, ChevronDown, GitPullRequest, Check, Menu, Network } from 'lucide-react';
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
  const current = PRS.find((p) => p.id === selectedPR)!;

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-base-700/70 bg-base-950/80 px-4 py-3 backdrop-blur-md md:px-6">
      <button
        onClick={onOpenSidebar}
        className="rounded-lg p-1.5 text-slate-400 hover:bg-base-800 hover:text-slate-200 md:hidden"
      >
        <Menu size={20} />
      </button>

      <div className="flex items-center gap-2 md:hidden">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 text-white">
          <Network size={16} />
        </div>
      </div>

      <div className="hidden items-center gap-2 md:flex">
        <h1 className="text-base font-semibold tracking-tight text-slate-100">
          Counterfactual CI
        </h1>
        <span className="rounded bg-violet-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-violet-300 ring-1 ring-inset ring-violet-500/30">
          Beta
        </span>
      </div>

      <div className="mx-2 hidden h-5 w-px bg-base-700 md:block" />

      {/* Repo + branch */}
      <div className="hidden items-center gap-2 rounded-lg border border-base-700/70 bg-base-850/60 px-3 py-1.5 lg:flex">
        <span className="font-mono text-xs text-slate-300">{REPO}</span>
        <span className="flex items-center gap-1 text-xs text-slate-500">
          <GitBranch size={13} /> {BRANCH}
        </span>
      </div>

      {/* PR selector */}
      <div className="relative ml-auto" ref={ref}>
        <button
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-2 rounded-lg border border-base-700/70 bg-base-850/60 px-3 py-1.5 text-sm text-slate-200 transition-colors hover:border-violet-500/40 hover:bg-base-800"
        >
          <GitPullRequest size={15} className="text-violet-400" />
          <span className="font-medium">PR #{current.number}</span>
          <span className="hidden text-slate-400 sm:inline">— {current.title}</span>
          <ChevronDown size={15} className={`text-slate-500 transition-transform ${open ? 'rotate-180' : ''}`} />
        </button>

        {open && (
          <div className="absolute right-0 mt-2 w-72 overflow-hidden rounded-xl border border-base-700 bg-base-850 shadow-2xl shadow-black/50">
            <div className="px-3 py-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
              Sample changes
            </div>
            {PRS.map((pr) => {
              const isActive = pr.id === selectedPR;
              return (
                <button
                  key={pr.id}
                  onClick={() => {
                    onSelectPR(pr.id);
                    setOpen(false);
                  }}
                  className={`flex w-full items-center justify-between px-3 py-2.5 text-left transition-colors ${
                    isActive ? 'bg-violet-500/10' : 'hover:bg-base-800'
                  }`}
                >
                  <div>
                    <div className="flex items-center gap-2 text-sm font-medium text-slate-200">
                      <GitPullRequest size={14} className="text-violet-400" />
                      PR #{pr.number}
                    </div>
                    <div className="ml-6 text-xs text-slate-400">{pr.title}</div>
                  </div>
                  {isActive && <Check size={16} className="text-violet-400" />}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </header>
  );
}
