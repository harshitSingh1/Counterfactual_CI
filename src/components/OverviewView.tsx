
import type { PRScenario, ViewId, GraphNode, GraphEdge } from '@/types';
import type { ImpactAnalysis } from '@/lib/api';
import { Panel, PanelHeader, Badge } from '@/components/ui';
import { CodeChangePanel } from '@/components/CodeChangePanel';
import { ImpactGraph } from '@/components/ImpactGraph';
import { ArrowRight } from 'lucide-react';

type OverviewProps = {
  scenario: PRScenario;
  onNavigate: (id: ViewId) => void;
  live?: boolean;
  analysis?: ImpactAnalysis | null;
  graphNodes?: GraphNode[];
  graphEdges?: GraphEdge[];
};

export function OverviewView({
  scenario,
  onNavigate,
  live = false,
  analysis = null,
  graphNodes,
  graphEdges,
}: OverviewProps) {
  const useLiveData = live && Boolean(analysis && graphNodes && graphEdges);

  const displayNodes = useLiveData ? graphNodes! : scenario.graph.nodes;
  const displayEdges = useLiveData ? graphEdges! : scenario.graph.edges;

  const affectedTests = useLiveData
    ? analysis!.affected_tests.map((test) => ({
        id: String(test.id ?? test.name ?? 'unknown-test'),
        name: String(test.name ?? test.id ?? 'Unknown test'),
      }))
    : scenario.tests.slice(0, 3);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-lg font-semibold tracking-tight text-slate-100">
              Impact workspace
            </h2>
            <Badge tone={useLiveData ? 'ok' : 'violet'}>
              {useLiveData ? 'Live analysis' : 'Demo data'}
            </Badge>
          </div>

          <p className="mt-1 text-xs text-slate-500">
            {useLiveData
              ? 'Graph-derived impact prediction for'
              : 'Cross-layer reasoning preview for'}{' '}
            <span className="font-mono text-slate-300">
              PR #{scenario.number}
            </span>{' '}
            · {scenario.title}
          </p>
        </div>

        <div className="flex items-center gap-2 text-[11px] text-slate-500">
          <span
            className={`h-2 w-2 rounded-full ${
              useLiveData ? 'bg-emerald-400' : 'bg-amber-400'
            }`}
          />
          {useLiveData
            ? 'Prediction · tests not run'
            : 'Analysis preview · tests not run'}
        </div>
      </div>

      {useLiveData && (
        <Panel className="border-emerald-500/20 bg-emerald-500/5">
          <div className="flex flex-wrap items-center justify-between gap-3 p-3">
            <div>
              <div className="text-xs font-semibold text-emerald-200">
                FalkorDB connected
              </div>
              <p className="mt-1 text-[11px] text-emerald-100/70">
                Live dependency graph · graph-derived prediction · automated
                tests have not been executed
              </p>
            </div>

            <button
              onClick={() => onNavigate('impact-analysis')}
              className="flex items-center gap-1 text-xs text-accent-blue hover:text-slate-100"
            >
              View analysis <ArrowRight size={13} />
            </button>
          </div>
        </Panel>
      )}

      <div className="grid gap-3 xl:grid-cols-[minmax(280px,0.92fr)_minmax(430px,1.55fr)_minmax(220px,0.72fr)]">
        <CodeChangePanel scenario={scenario} compact />

        <ImpactGraph
          nodes={displayNodes}
          edges={displayEdges}
          showInspector={false}
          isLive={useLiveData}
        />

        <ImpactSummary
          scenario={scenario}
          onNavigate={onNavigate}
          live={useLiveData}
          analysis={analysis}
        />
      </div>

      <RepairStrip scenario={scenario} onNavigate={onNavigate} />

      <div className="grid gap-3 lg:grid-cols-[1fr_1fr]">
        <TestPreview
          scenario={scenario}
          onNavigate={onNavigate}
          live={useLiveData}
          tests={affectedTests}
        />

        <ReceiptPreview scenario={scenario} onNavigate={onNavigate} />
      </div>
    </div>
  );
}

function ImpactSummary({
  scenario,
  onNavigate,
  live = false,
  analysis,
}: {
  scenario: PRScenario;
  onNavigate: (id: ViewId) => void;
  live?: boolean;
  analysis?: ImpactAnalysis | null;
}) {
  const summary = scenario.impactSummary;

  const journeys = live && analysis
    ? analysis.affected_journeys.map((journey) =>
        String(journey.name ?? journey.id ?? 'Unknown journey'),
      )
    : summary.affectedJourneys;

  const entityCount =
    live && analysis
      ? analysis.affected_node_count
      : scenario.graph.nodes.filter((node) => node.status === 'impacted').length;

  const coverage = live
    ? 'Not measured'
    : summary.mappedCoverage == null
      ? 'Not measured'
      : `${summary.mappedCoverage}%`;

  return (
    <Panel>
      <PanelHeader
        title="Impact Summary"
        subtitle={live ? 'Predicted blast radius · live analysis' : 'Predicted blast radius'}
      />

      <div className="grid grid-cols-3 divide-x divide-base-700/80 border-b border-base-700/80">
        <Metric value={journeys.length} label="Journeys" tone="bad" />
        <Metric value={entityCount} label="Entities" tone="warn" />
        <Metric value={coverage} label="Coverage" tone="violet" />
      </div>

      <div className="p-3">
        {live && (
          <p className="mb-3 text-[10px] leading-relaxed text-slate-500">
            Predicted impact is derived from FalkorDB relationships. Coverage
            has not been measured, and these predictions are not test results.
          </p>
        )}

        <div className="mb-2 text-[10px] font-medium uppercase tracking-wider text-slate-500">
          Impacted paths
        </div>

        <div className="space-y-1.5">
          {journeys.map((journey) => (
            <div
              key={journey}
              className="flex items-center justify-between gap-2 border border-base-700/70 bg-base-800/50 px-2.5 py-2 text-xs"
            >
              <span className="flex min-w-0 items-center gap-2 text-slate-200">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-red-400" />
                {journey}
              </span>
              <span className="shrink-0 text-[10px] text-slate-500">
                predicted
              </span>
            </div>
          ))}
        </div>

        <div className="mt-3 border-t border-base-700/80 pt-3">
          <div className="flex items-center justify-between gap-2 text-[11px]">
            <span className="text-slate-500">Uncovered components</span>
            <span className="text-amber-300">
              {live ? 'Not measured' : summary.uncoveredComponents.length}
            </span>
          </div>

          {live ? (
            <p className="mt-2 text-[10px] leading-relaxed text-slate-500">
              Component coverage has not been assessed by an executed test
              suite.
            </p>
          ) : (
            <div className="mt-2 flex flex-wrap gap-1">
              {summary.uncoveredComponents.map((name) => (
                <span
                  key={name}
                  className="font-mono text-[10px] text-amber-200/80"
                >
                  {name}
                </span>
              ))}
            </div>
          )}
        </div>

        <button
          onClick={() => onNavigate('impact-analysis')}
          className="mt-3 flex w-full items-center justify-between border-t border-base-700/80 pt-3 text-[11px] text-accent-blue hover:text-slate-100"
        >
          Open full graph <ArrowRight size={13} />
        </button>
      </div>
    </Panel>
  );
}

function Metric({
  value,
  label,
  tone,
}: {
  value: number | string;
  label: string;
  tone: 'bad' | 'warn' | 'violet';
}) {
  const color = {
    bad: 'text-red-300',
    warn: 'text-amber-300',
    violet: 'text-violet-300',
  }[tone];

  return (
    <div className="min-w-0 px-2 py-3 text-center">
      <div className={`break-words text-lg font-semibold ${color}`}>
        {value}
      </div>
      <div className="mt-1 text-[10px] text-slate-500">{label}</div>
    </div>
  );
}

function RepairStrip({
  scenario,
  onNavigate,
}: {
  scenario: PRScenario;
  onNavigate: (id: ViewId) => void;
}) {
  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-base-700/80 px-3 py-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            Competing repair options
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
  Illustrative options · not validated against the live graph or executed tests
</p>
        </div>

        <button
          onClick={() => onNavigate('simulation')}
          className="text-[11px] text-accent-blue hover:text-slate-100"
        >
          Compare all <ArrowRight size={12} className="ml-1 inline" />
        </button>
      </div>

      <div className="grid divide-y divide-base-700/80 md:grid-cols-3 md:divide-x md:divide-y-0">
        {scenario.repairOptions.map((option) => (
          <button
            key={option.id}
            onClick={() => onNavigate('simulation')}
            className={`p-3 text-left hover:bg-base-800/60 ${
              option.recommended
                ? 'border-l-2 border-accent-blue bg-accent-blue/5'
                : ''
            }`}
          >
            <div className="flex items-start justify-between gap-2">
              <span className="text-xs font-semibold text-slate-100">
                {option.label}
              </span>
              {option.recommended && (
  <Badge tone="neutral">Demo preference · unverified</Badge>
)}
            </div>

            <p className="mt-1 line-clamp-2 text-[11px] text-slate-400">
              {option.tagline}
            </p>

            <div className="mt-3 flex gap-3 text-[10px] text-slate-500">
              <span>
                Effort{' '}
                <b className="font-medium text-slate-300">{option.effort}</b>
              </span>
              <span>
                Risk{' '}
                <b className="font-medium text-slate-300">
                  {option.riskLevel}
                </b>
              </span>
            </div>
          </button>
        ))}
      </div>
    </Panel>
  );
}

function TestPreview({
  scenario,
  onNavigate,
  live = false,
  tests,
}: {
  scenario: PRScenario;
  onNavigate: (id: ViewId) => void;
  live?: boolean;
  tests: Array<{ id: string; name: string }>;
}) {
  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-base-700/80 px-3 py-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            Test verification
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            {live
              ? 'Tests selected from the live impact analysis'
              : 'Selected from traced paths'}
          </p>
        </div>
        <Badge tone="warn">Not run</Badge>
      </div>

      <div className="divide-y divide-base-700/70">
        {tests.slice(0, 3).map((test) => (
          <div
            key={test.id}
            className="flex items-center justify-between gap-2 px-3 py-2.5"
          >
            <span className="flex min-w-0 items-center gap-2 font-mono text-[11px] text-slate-300">
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-400" />
              <span className="break-all">{test.name}</span>
            </span>
            <span className="shrink-0 text-[10px] text-slate-500">
              Not run
            </span>
          </div>
        ))}
      </div>

      <button
        onClick={() => onNavigate('test-results')}
        className="w-full border-t border-base-700/80 px-3 py-2.5 text-left text-[11px] text-accent-blue hover:bg-base-800/50"
      >
        Open test verification <ArrowRight size={12} className="ml-1 inline" />
      </button>
    </Panel>
  );
}

function ReceiptPreview({
  scenario,
  onNavigate,
}: {
  scenario: PRScenario;
  onNavigate: (id: ViewId) => void;
}) {
  const recommended =
  scenario.repairOptions.find((option) => option.recommended) ??
  scenario.repairOptions[0];

  return (
    <Panel>
      <div className="flex items-center justify-between border-b border-base-700/80 px-3 py-2.5">
        <div>
          <h3 className="text-sm font-semibold text-slate-100">
            Decision receipt
          </h3>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Evidence state for reviewer handoff
          </p>
        </div>
        <Badge tone="warn">Unverified</Badge>
      </div>

      <div className="space-y-3 p-3">
      <div className="space-y-1 text-xs">
  <div className="flex items-center justify-between gap-3">
    <span className="text-slate-500">Illustrative repair option</span>
    <span className="text-right text-slate-200">
      {recommended?.label ?? 'No option available'}
    </span>
  </div>
  <p className="text-[10px] leading-relaxed text-slate-500">
    Demo preference only. No repair has been generated, applied, or validated.
  </p>
</div>

        <div className="flex items-center justify-between text-xs">
          <span className="text-slate-500">Observed test results</span>
          <span className="text-amber-300">None</span>
        </div>

        <div className="space-y-1 text-xs">
  <div className="flex items-center justify-between gap-3">
    <span className="text-slate-500">Unverified scenario risks</span>
    <span className="text-amber-300">
      {scenario.risks.length} illustrative
    </span>
  </div>
  <p className="text-[10px] leading-relaxed text-slate-500">
    These risks come from scenario data, not independently verified live findings.
  </p>
</div>
      </div>

      <button
        onClick={() => onNavigate('decision-receipt')}
        className="w-full border-t border-base-700/80 px-3 py-2.5 text-left text-[11px] text-accent-blue hover:bg-base-800/50"
      >
        Open receipt <ArrowRight size={12} className="ml-1 inline" />
      </button>
    </Panel>
  );
}
