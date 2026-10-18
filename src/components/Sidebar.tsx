import { LayoutDashboard, FileCode2, Network, FlaskConical, CheckCircle2, ReceiptText, Database } from 'lucide-react';
import type { ViewId } from '@/types';

const NAV: { id: ViewId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'overview', label: 'Overview', icon: LayoutDashboard },
  { id: 'code-changes', label: 'Code Changes', icon: FileCode2 },
  { id: 'impact-analysis', label: 'Impact Analysis', icon: Network },
  { id: 'simulation', label: 'Simulation', icon: FlaskConical },
  { id: 'test-results', label: 'Test Results', icon: CheckCircle2 },
  { id: 'decision-receipt', label: 'Decision Receipt', icon: ReceiptText },
];

export function Sidebar({ active, onSelect, open, onClose, isConnected }: { active: ViewId; onSelect: (id: ViewId) => void; open: boolean; onClose: () => void; isConnected: boolean }) {
  return (
    <>
      {open && <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />}
      
<aside className={`fixed inset-y-0 left-0 z-40 flex h-screen w-[188px] flex-col border-r border-base-700/80 bg-base-900 transition-transform lg:translate-x-0 ${open ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="border-b border-base-700/80 px-3 py-4 lg:hidden">
          <div className="text-sm font-semibold text-slate-100">Counterfactual CI</div>
          <div className="mt-1 text-[10px] text-slate-500">Impact reasoning workspace</div>
        </div>
        <nav className="flex-1 space-y-1 px-2 py-3">
          {NAV.map(({ id, label, icon: Icon }) => {
            const activeItem = id === active;
            return (
              <button key={id} onClick={() => { onSelect(id); onClose(); }} className={`group flex w-full items-center gap-3 border-l-2 px-3 py-2.5 text-left text-xs transition-colors ${activeItem ? 'border-accent-blue bg-accent-blue/10 text-slate-100' : 'border-transparent text-slate-400 hover:bg-base-800 hover:text-slate-200'}`}>
                <Icon size={16} className={activeItem ? 'text-accent-blue' : 'text-slate-500 group-hover:text-slate-300'} />
                <span>{label}</span>
              </button>
            );
          })}
        </nav>
        <div className="border-t border-base-700/80 p-3">
          <div className="flex items-center gap-2 text-xs text-slate-300"><Database size={14} className="text-violet-300" /> FalkorDB</div>
          <div className="mt-1 pl-5 text-[10px] leading-relaxed text-slate-500">
  {isConnected ? 'Live graph · connected' : 'Demo graph · not connected'}
</div>
        </div>
      </aside>
    </>
  );
}
