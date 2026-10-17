import type { PRScenario, ViewId } from '@/types';
import { Panel, PanelHeader, Badge } from '@/components/ui';
import {
  GitPullRequest,
  Route,
  ShieldCheck,
  AlertOctagon,
  ArrowRight,
  Activity,
  FlaskConical,
  CheckCircle2,
  ReceiptText,
} from 'lucide-react';

const QUICK_LINKS: { id: ViewId; label: string; icon: typeof Activity; desc: string }[] = [
  { id: 'code-changes', label: 'Code Changes', icon: GitPullRequest, desc: 'Review the diff and contract comparison' },
  { id: 'impact-analysis', label: 'Impact Analysis', icon: Activity, desc: 'Explore the traced dependency graph' },
  { id: 'simulation', label: 'Simulation', icon: FlaskConical, desc: 'Compare counterfactual repair options' },
  { id: 'test-results', label: 'Test Results', icon: CheckCircle2, desc: 'Run targeted tests once backend is live' },
  { id: 'decision-receipt', label: 'Decision Receipt', icon: ReceiptText, desc: 'Audit predictions vs observed results' },
];

export function OverviewView({
  scenario,
  onNavigate,
}: {
  scenario: PRScenario;
  onNavigate: (id: ViewId) => void;
}) {
  const breaking = scenario.contract.filter((c) => c.breaking).length;
  const affected = scenario.impactSummary.affectedJourneys.length;
  const uncovered = scenario.impactSummary.uncoveredComponents.length;

  const stats = [
    { label: 'Breaking contracts', value: breaking, tone: breaking ? 'bad' : 'ok', icon: GitPullRequest },
    { label: 'Affected journeys', value: affected, tone: affected ? 'bad' : 'ok', icon: Route },
    { label: 'Trace coverage', value: `${scenario.impactSummary.mappedCoverage}%`, tone: 'violet', icon: ShieldCheck },
    { label: 'Uncovered components', value: uncovered, tone: uncovered ? 'warn' : 'ok', icon: AlertOctagon },
  ] as const;

  return (
    <div className="space-y-5">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">Overview</h2>
        <p className="mt-0.5 text-sm text-slate-400">
          Current analysis for PR #{scenario.number} — {scenario.title}
        </p>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => {
          const Icon = s.icon;
          return (
            <Panel key={s.label} className="p-4">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-400">{s.label}</span>
                <Icon size={15} className="text-slate-500" />
              </div>
              <div className="mt-2 flex items-end gap-2">
                <span className="text-2xl font-semibold text-slate-100">{s.value}</span>
                <Badge tone={s.tone} className="mb-1">
                  {s.tone === 'ok' ? 'stable' : s.tone === 'bad' ? 'risk' : 'watch'}
                </Badge>
              </div>
            </Panel>
          );
        })}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Panel className="lg:col-span-2">
          <PanelHeader
            title="Change Summary"
            subtitle={scenario.file}
            icon={<GitPullRequest size={16} />}
          />
          <div className="p-4">
            <p className="text-sm leading-relaxed text-slate-300">{scenario.description}</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {scenario.contract.map((c, i) =>
                c.breaking ? (
                  <Badge key={i} tone="bad" className="font-mono">
                    {c.field}
                  </Badge>
                ) : null,
              )}
              {breaking === 0 && <Badge tone="ok">No breaking contracts detected</Badge>}
            </div>
          </div>
        </Panel>

        <Panel className="flex flex-col">
          <PanelHeader title="Recommended Next Step" icon={<FlaskConical size={16} />} />
          <div className="flex flex-1 flex-col p-4">
            <p className="text-sm text-slate-300">
              Review the counterfactual repair options, then connect the test runner to verify the
              predicted outcome before approving.
            </p>
            <button
              onClick={() => onNavigate('simulation')}
              className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-violet-500/90 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 glow-violet"
            >
              Open Simulation <ArrowRight size={15} />
            </button>
          </div>
        </Panel>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {QUICK_LINKS.map(({ id, label, icon: Icon, desc }) => (
          <button
            key={id}
            onClick={() => onNavigate(id)}
            className="group flex items-center gap-3 rounded-xl border border-base-700/70 bg-base-850/60 p-3.5 text-left transition-all hover:border-violet-500/40 hover:bg-base-800"
          >
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-base-800 text-slate-400 transition-colors group-hover:bg-violet-500/15 group-hover:text-violet-300">
              <Icon size={17} />
            </div>
            <div className="flex-1">
              <div className="text-sm font-medium text-slate-200">{label}</div>
              <div className="text-xs text-slate-500">{desc}</div>
            </div>
            <ArrowRight size={15} className="text-slate-600 transition-transform group-hover:translate-x-0.5 group-hover:text-violet-400" />
          </button>
        ))}
      </div>
    </div>
  );
}
