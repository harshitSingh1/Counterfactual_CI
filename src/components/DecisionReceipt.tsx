import { useState } from 'react';
import type { PRScenario } from '@/types';
import { Panel, PanelHeader, Badge } from '@/components/ui';
import {
  ReceiptText,
  GitCompare,
  Network,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
} from 'lucide-react';
import { ImpactGraph } from './ImpactGraph';
import { ImpactSummaryPanel } from './ImpactSummaryPanel';

type Tab = 'comparison' | 'graph-prediction' | 'test-results' | 'unverified-risks';

const TABS: { id: Tab; label: string; icon: typeof GitCompare }[] = [
  { id: 'comparison', label: 'Comparison', icon: GitCompare },
  { id: 'graph-prediction', label: 'Graph Prediction', icon: Network },
  { id: 'test-results', label: 'Test Results', icon: CheckCircle2 },
  { id: 'unverified-risks', label: 'Unverified Risks', icon: AlertTriangle },
];

export function DecisionReceipt({ scenario }: { scenario: PRScenario }) {
  const [tab, setTab] = useState<Tab>('comparison');

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title={`Decision Receipt — PR #${scenario.number}`}
          subtitle="An auditable summary separating predictions from observed results"
          icon={<ReceiptText size={16} />}
          right={<Badge tone="warn">Pending verification</Badge>}
        />
        <div className="flex flex-wrap gap-1 border-b border-base-700/70 px-2">
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = tab === id;
            return (
              <button
                key={id}
                onClick={() => setTab(id)}
                className={`flex items-center gap-2 border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
                  isActive
                    ? 'border-violet-500 text-violet-300'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                <Icon size={15} />
                {label}
              </button>
            );
          })}
        </div>

        <div className="p-4">
          {tab === 'comparison' && <ComparisonTab scenario={scenario} />}
          {tab === 'graph-prediction' && <GraphPredictionTab scenario={scenario} />}
          {tab === 'test-results' && <TestResultsTab scenario={scenario} />}
          {tab === 'unverified-risks' && <UnverifiedRisksTab scenario={scenario} />}
        </div>
      </Panel>
    </div>
  );
}

function ComparisonTab({ scenario }: { scenario: PRScenario }) {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-base-700/60 bg-base-800/40 p-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Changed file</div>
          <div className="mt-1 font-mono text-sm text-slate-200">{scenario.file}</div>
        </div>
        <div className="rounded-lg border border-base-700/60 bg-base-800/40 p-3">
          <div className="text-[11px] uppercase tracking-wider text-slate-500">Breaking contracts</div>
          <div className="mt-1 text-sm text-slate-200">
            {scenario.contract.filter((c) => c.breaking).length} of {scenario.contract.length}
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-lg border border-base-700/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-base-800/50 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2 font-medium">Field</th>
              <th className="px-3 py-2 font-medium">Before</th>
              <th className="px-3 py-2 font-medium">After</th>
              <th className="px-3 py-2 font-medium">Verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-700/40">
            {scenario.contract.map((c, i) => (
              <tr key={i}>
                <td className="px-3 py-2 font-mono text-xs text-slate-300">{c.field}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-400">{c.before}</td>
                <td className="px-3 py-2 font-mono text-xs text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <ArrowRight size={11} className="text-slate-600" />
                    {c.after}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {c.breaking ? <Badge tone="bad">breaking</Badge> : <Badge tone="ok">safe</Badge>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GraphPredictionTab({ scenario }: { scenario: PRScenario }) {
  return (
    <div className="animate-fade-in space-y-4">
      <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
        <div className="flex items-center gap-2 text-amber-300">
          <AlertTriangle size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Prediction only — not observed
          </span>
        </div>
        <p className="mt-1.5 text-xs text-amber-200/70">
          The graph below is a local demo trace. It represents predicted
          impact, not outcomes from executed tests.
        </p>
      </div>
      <ImpactSummaryPanel summary={scenario.impactSummary} />
      <ImpactGraph nodes={scenario.graph.nodes} edges={scenario.graph.edges} />
    </div>
  );
}

function TestResultsTab({ scenario }: { scenario: PRScenario }) {
  const allUnverified = scenario.tests.every((t) => t.status === 'unverified');
  return (
    <div className="animate-fade-in space-y-3">
      <div className="rounded-lg border border-base-700/60 bg-base-800/40 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-slate-400" />
          <h4 className="text-sm font-semibold text-slate-200">Observed Test Results</h4>
        </div>
        {allUnverified ? (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
            <AlertTriangle size={14} className="shrink-0" />
            No tests have been executed yet. All {scenario.tests.length} tests remain not run
            because the backend runner is not connected.
          </div>
        ) : (
          <p className="mt-2 text-sm text-slate-400">Observed results will appear here once tests run.</p>
        )}
      </div>

      <div className="space-y-1.5">
        {scenario.tests.map((t) => (
          <div
            key={t.id}
            className="flex items-center justify-between rounded-lg border border-base-700/50 bg-base-850/40 px-3 py-2.5"
          >
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              <span className="font-mono text-xs text-slate-300">{t.name}</span>
            </div>
            <div className="flex items-center gap-3">
              <Badge tone="neutral">{t.kind}</Badge>
              <Badge tone="warn">Not run</Badge>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function UnverifiedRisksTab({ scenario }: { scenario: PRScenario }) {
  const severityTone = { low: 'ok', medium: 'warn', high: 'bad' } as const;
  return (
    <div className="animate-fade-in space-y-3">
      <div className="rounded-lg border border-red-500/25 bg-red-500/5 p-3">
        <div className="flex items-center gap-2 text-red-300">
          <AlertTriangle size={14} />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Risks that remain unverified
          </span>
        </div>
        <p className="mt-1.5 text-xs text-red-200/70">
          These risks are inferred from trace analysis. They must be confirmed by running the
          targeted test suite before this PR is approved.
        </p>
      </div>

      <div className="space-y-2">
        {scenario.risks.map((r) => (
          <div
            key={r.id}
            className="rounded-lg border border-base-700/60 bg-base-850/50 p-4"
          >
            <div className="flex items-start justify-between gap-3">
              <p className="text-sm text-slate-200">{r.description}</p>
              <Badge tone={severityTone[r.severity]} className="capitalize">
                {r.severity}
              </Badge>
            </div>
            <div className="mt-3 flex items-start gap-2 rounded-md bg-base-800/50 px-3 py-2">
              <ArrowRight size={13} className="mt-0.5 shrink-0 text-emerald-400" />
              <p className="text-xs text-slate-400">
                <span className="font-medium text-emerald-300">Mitigation: </span>
                {r.mitigation}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
