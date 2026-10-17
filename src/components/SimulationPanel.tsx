import { useState } from 'react';
import type { RepairOption } from '@/types';
import { Panel, PanelHeader, Badge } from '@/components/ui';
import {
  FlaskConical,
  Check,
  X,
  Star,
  GitMerge,
  Wrench,
  Users,
  Flag,
  AlertTriangle,
} from 'lucide-react';

const ICONS: Record<string, typeof Wrench> = {
  adapter: GitMerge,
  'update-frontend': Users,
  'feature-flag': Flag,
};

const EFFORT_TONE = { Low: 'ok', Medium: 'warn', High: 'bad' } as const;
const RISK_TONE = { Low: 'ok', Medium: 'warn', High: 'bad' } as const;

export function SimulationPanel({ options }: { options: RepairOption[] }) {
  const [selected, setSelected] = useState<string | null>(
    options.find((o) => o.recommended)?.id ?? options[0]?.id ?? null,
  );
  const active = options.find((o) => o.id === selected) ?? options[0];

  return (
    <div className="space-y-4">
      <Panel className="border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3 p-4">
          <FlaskConical size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-amber-200">Counterfactual Simulation</h3>
            <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
              Each option models the predicted outcome of applying a repair. Outcomes are{' '}
              <strong>predictions</strong> derived from static trace data — they are not verified
              until the test runner is connected and targeted tests are run.
            </p>
          </div>
        </div>
      </Panel>

      <div className="grid gap-4 lg:grid-cols-3">
        {options.map((opt) => {
          const Icon = ICONS[opt.id] ?? Wrench;
          const isActive = opt.id === selected;
          return (
            <button
              key={opt.id}
              onClick={() => setSelected(opt.id)}
              className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
                isActive
                  ? 'border-violet-500/50 bg-violet-500/5 glow-violet'
                  : 'border-base-700/70 bg-base-850/60 hover:border-base-600 hover:bg-base-800'
              }`}
            >
              {opt.recommended && (
                <div className="absolute right-3 top-3">
                  <Badge tone="violet">
                    <Star size={10} /> Recommended
                  </Badge>
                </div>
              )}
              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  isActive ? 'bg-violet-500/15 text-violet-300' : 'bg-base-800 text-slate-400'
                }`}
              >
                <Icon size={17} />
              </div>
              <h4 className="mt-3 text-sm font-semibold text-slate-100">{opt.label}</h4>
              <p className="mt-1 text-xs text-slate-400">{opt.tagline}</p>
              <div className="mt-3 flex gap-2">
                <Badge tone={EFFORT_TONE[opt.effort]}>Effort: {opt.effort}</Badge>
                <Badge tone={RISK_TONE[opt.riskLevel]}>Risk: {opt.riskLevel}</Badge>
              </div>
            </button>
          );
        })}
      </div>

      {active && (
        <Panel className="animate-fade-in">
          <PanelHeader
            title={active.label}
            subtitle={active.tagline}
            icon={<Wrench size={16} />}
            right={
              active.recommended ? (
                <Badge tone="violet">
                  <Star size={10} /> Recommended
                </Badge>
              ) : undefined
            }
          />
          <div className="grid gap-px bg-base-700/40 md:grid-cols-2">
            <div className="bg-base-850/60 p-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check size={15} />
                <h4 className="text-xs font-semibold uppercase tracking-wider">Advantages</h4>
              </div>
              <ul className="mt-3 space-y-2">
                {active.tradeoffs.pros.map((p, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                    {p}
                  </li>
                ))}
              </ul>
            </div>
            <div className="bg-base-850/60 p-4">
              <div className="flex items-center gap-2 text-red-400">
                <X size={15} />
                <h4 className="text-xs font-semibold uppercase tracking-wider">Trade-offs</h4>
              </div>
              <ul className="mt-3 space-y-2">
                {active.tradeoffs.cons.map((c, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm text-slate-300">
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                    {c}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="border-t border-base-700/70 bg-amber-500/5 p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle size={15} className="mt-0.5 shrink-0 text-amber-400" />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Predicted Outcome
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                  {active.predictedOutcome}
                </p>
                <p className="mt-2 text-xs text-amber-200/60">
                  This is a prediction from trace analysis, not an observed result.
                </p>
              </div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
