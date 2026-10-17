import type { PRScenario, ViewId } from '@/types';
import { Panel, PanelHeader, Badge } from '@/components/ui';
import { CodeChangePanel } from '@/components/CodeChangePanel';
import { ImpactGraph } from '@/components/ImpactGraph';
import { ArrowRight } from 'lucide-react';

export function OverviewView({ scenario, onNavigate }: { scenario: PRScenario; onNavigate: (id: ViewId) => void }) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-100">Impact workspace</h2>
            <Badge tone="violet">Demo data</Badge>
          </div>
          <p className="mt-1 text-xs text-slate-500">Cross-layer reasoning preview for <span className="font-mono text-slate-300">PR #{scenario.number}</span> · {scenario.title}</p>
        </div>
        <div className="flex items-center gap-2 text-[11px] text-slate-500"><span className="h-2 w-2 rounded-full bg-amber-400" /> Analysis preview · tests not run</div>
      </div>

      <div className="grid gap-3 xl:grid-cols-[minmax(280px,0.92fr)_minmax(430px,1.55fr)_minmax(220px,0.72fr)]">
        <CodeChangePanel scenario={scenario} compact />
        <ImpactGraph nodes={scenario.graph.nodes} edges={scenario.graph.edges} showInspector={false} />
        <ImpactSummary scenario={scenario} onNavigate={onNavigate} />
      </div>

      <RepairStrip scenario={scenario} onNavigate={onNavigate} />

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <TestPreview scenario={scenario} onNavigate={onNavigate} />
        <ReceiptPreview scenario={scenario} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function ImpactSummary({ scenario, onNavigate }: { scenario: PRScenario; onNavigate: (id: ViewId) => void }) {
  const { impactSummary: summary, graph } = scenario;
  const impactedNodes = graph.nodes.filter((node) => node.status === 'impacted').length;
  return (
    <Panel>
      <PanelHeader title="Impact Summary" subtitle="Predicted blast radius" />
      <div className="grid grid-cols-3 divide-x divide-base-700/80 border-b border-base-700/80">
        <Metric value={summary.affectedJourneys.length} label="Journeys" tone="bad" />
        <Metric value={impactedNodes} label="Entities" tone="warn" />
        <Metric value={`${summary.mappedCoverage}%`} label="Coverage" tone="violet" />
      </div>
      <div className="p-3">
        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">Impacted paths</div>
        <div className="space-y-1.5">
          {summary.affectedJourneys.map((journey) => (
            <div key={journey} className="flex items-center justify-between border border-base-700/70 bg-base-800/50 px-2.5 py-2 text-xs">
              <span className="flex min-w-0 items-center gap-2 text-slate-200"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />{journey}</span>
              <span className="text-[10px] text-slate-500">predicted</span>
            </div>
          ))}
        </div>
        <div className="mt-3 border-t border-base-700/80 pt-3">
          <div className="flex items-center justify-between text-[11px]"><span className="text-slate-500">Uncovered components</span><span className="text-amber-300">{summary.uncoveredComponents.length}</span></div>
          <div className="mt-2 flex flex-wrap gap-1">{summary.uncoveredComponents.map((name) => <span key={name} className="font-mono text-[10px] text-amber-200/80">{name}</span>)}</div>
        </div>
        <button onClick={() => onNavigate('impact-analysis')} className="mt-3 flex w-full items-center justify-between border-t border-base-700/80 pt-3 text-[11px] text-accent-blue hover:text-slate-100">Open full graph <ArrowRight size={13} /></button>
      </div>
    </Panel>
  );
}

function Metric({ value, label, tone }: { value: number | string; label: string; tone: 'bad' | 'warn' | 'violet' }) {
  const color = { bad: 'text-red-300', warn: 'text-amber-300', violet: 'text-violet-300' }[tone];
  return <div className="px-2 py-3 text-center"><div className={`text-2xl font-semibold ${color}`}>{value}</div><div className="mt-1 text-[10px] text-slate-500">{label}</div></div>;
}

function RepairStrip({ scenario, onNavigate }: { scenario: PRScenario; onNavigate: (id: ViewId) => void }) {
  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-base-700/80 px-3 py-2.5"><div><h3 className="text-sm font-semibold text-slate-100">Competing repair options</h3><p className="mt-0.5 text-[11px] text-slate-500">Illustrative interventions · no patch has been executed</p></div><button onClick={() => onNavigate('simulation')} className="text-[11px] text-accent-blue hover:text-slate-100">Compare all <ArrowRight size={12} className="ml-1 inline" /></button></div>
      <div className="grid divide-y divide-base-700/80 md:grid-cols-3 md:divide-x md:divide-y-0">
        {scenario.repairOptions.map((option) => <button key={option.id} onClick={() => onNavigate('simulation')} className={`p-3 text-left hover:bg-base-800/60 ${option.recommended ? 'border-l-2 border-accent-blue bg-accent-blue/5' : ''}`}><div className="flex items-start justify-between gap-2"><span className="text-xs font-semibold text-slate-100">{option.label}</span>{option.recommended && <Badge tone="violet">Provisional</Badge>}</div><p className="mt-1 line-clamp-2 text-[11px] text-slate-400">{option.tagline}</p><div className="mt-3 flex gap-3 text-[10px] text-slate-500"><span>Effort <b className="font-medium text-slate-300">{option.effort}</b></span><span>Risk <b className="font-medium text-slate-300">{option.riskLevel}</b></span></div></button>)}
      </div>
    </Panel>
  );
}

function TestPreview({ scenario, onNavigate }: { scenario: PRScenario; onNavigate: (id: ViewId) => void }) {
  return <Panel><div className="flex items-center justify-between border-b border-base-700/80 px-3 py-2.5"><div><h3 className="text-sm font-semibold text-slate-100">Test verification</h3><p className="mt-0.5 text-[11px] text-slate-500">Selected from traced paths</p></div><Badge tone="warn">Not run</Badge></div><div className="divide-y divide-base-700/70">{scenario.tests.slice(0, 3).map((test) => <div key={test.id} className="flex items-center justify-between px-3 py-2.5"><span className="flex min-w-0 items-center gap-2 font-mono text-[11px] text-slate-300"><span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />{test.name}</span><span className="text-[10px] text-slate-500">Not run</span></div>)}</div><button onClick={() => onNavigate('test-results')} className="w-full border-t border-base-700/80 px-3 py-2.5 text-left text-[11px] text-accent-blue hover:bg-base-800/50">Open test verification <ArrowRight size={12} className="ml-1 inline" /></button></Panel>;
}

function ReceiptPreview({ scenario, onNavigate }: { scenario: PRScenario; onNavigate: (id: ViewId) => void }) {
  const recommended = scenario.repairOptions.find((option) => option.recommended) ?? scenario.repairOptions[0];
  return <Panel><div className="flex items-center justify-between border-b border-base-700/80 px-3 py-2.5"><div><h3 className="text-sm font-semibold text-slate-100">Decision receipt</h3><p className="mt-0.5 text-[11px] text-slate-500">Evidence state for reviewer handoff</p></div><Badge tone="warn">Unverified</Badge></div><div className="space-y-3 p-3"><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Provisional recommendation</span><span className="text-slate-200">{recommended.label}</span></div><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Observed test results</span><span className="text-amber-300">None</span></div><div className="flex items-center justify-between text-xs"><span className="text-slate-500">Remaining uncertainty</span><span className="text-amber-300">{scenario.risks.length} risks</span></div></div><button onClick={() => onNavigate('decision-receipt')} className="w-full border-t border-base-700/80 px-3 py-2.5 text-left text-[11px] text-accent-blue hover:bg-base-800/50">Open receipt <ArrowRight size={12} className="ml-1 inline" /></button></Panel>;
}
