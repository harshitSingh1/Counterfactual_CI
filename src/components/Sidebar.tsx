import {
  LayoutDashboard,
  FileCode2,
  Network,
  FlaskConical,
  CheckCircle2,
  ReceiptText,
  Database,
} from 'lucide-react';
import type { ViewId } from '@/types';

const NAV: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'code-changes', label: 'Code Changes', icon: FileCode2 },
  { id: 'impact-analysis', label: 'Impact Analysis', icon: Network },
  { id: 'simulation', label: 'Simulation', icon: FlaskConical },
  { id: 'test-results', label: 'Test Results', icon: CheckCircle2 },
  { id: 'decision-receipt', label: 'Decision Receipt', icon: ReceiptText },
];

export function Sidebar({
  active,
  onSelect,
  open,
  onClose,
}: {
  active: ViewId;
  onSelect: (id: ViewId) => void;
  open: boolean;
  onClose: () => void;
}) {
  return (
    <>
      {/* Mobile overlay */}
      {open && (
        <div
          className="fixed inset-0 z-30 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={onClose}
        />
      )}
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-60 flex-col border-r border-base-700/70 bg-base-900/95 transition-transform md:static md:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-2.5 px-4 py-4">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-violet-500 to-sky-500 text-white shadow-lg shadow-violet-500/20">
            <Network size={18} strokeWidth={2.25} />
          </div>
          <div className="leading-tight">
            <div className="text-sm font-semibold tracking-tight text-slate-100">
              Counterfactual CI
            </div>
            <div className="text-[10px] uppercase tracking-[0.18em] text-slate-500">
              Impact Analysis
            </div>
          </div>
        </div>

        <nav className="flex-1 space-y-0.5 px-2 py-2">
          {NAV.map(({ id, label, icon: Icon }) => {
            const isActive = active === id;
            return (
              <button
                key={id}
                onClick={() => {
                  onSelect(id);
                  onClose();
                }}
                className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors ${
                  isActive
                    ? 'bg-violet-500/10 text-violet-200 ring-1 ring-inset ring-violet-500/30'
                    : 'text-slate-400 hover:bg-base-800/60 hover:text-slate-200'
                }`}
              >
                <Icon
                  size={17}
                  strokeWidth={2}
                  className={isActive ? 'text-violet-300' : 'text-slate-500 group-hover:text-slate-300'}
                />
                <span className="font-medium">{label}</span>
              </button>
            );
          })}
        </nav>

        <div className="border-t border-base-700/70 px-4 py-4">
          <div className="flex items-center gap-2.5 rounded-lg bg-base-850/60 px-3 py-2.5 ring-1 ring-inset ring-base-700/60">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-500/10 text-emerald-400 ring-1 ring-inset ring-emerald-500/25">
              <Database size={15} />
            </div>
            <div className="leading-tight">
              <div className="text-xs font-semibold text-slate-200">FalkorDB</div>
              <div className="text-[10px] text-slate-500">Graph backend · not connected</div>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
