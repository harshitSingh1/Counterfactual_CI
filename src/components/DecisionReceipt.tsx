
import { useState } from 'react';
import type { PRScenario, GraphNode, GraphEdge } from '@/types';
import type { ImpactAnalysis } from '@/lib/api';
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

type DecisionReceiptProps = {
  scenario: PRScenario;
  live?: boolean;
  analysis?: ImpactAnalysis | null;
  graphNodes?: GraphNode[];
  graphEdges?: GraphEdge[];
};

type ReceiptTest = {
  id: string;
  name: string;
};

export function DecisionReceipt({
  scenario,
  live = false,
  analysis = null,
  graphNodes,
  graphEdges,
}: DecisionReceiptProps) {
  const [tab, setTab] = useState<Tab>('comparison');

  const useLiveData = Boolean(
    live && analysis && graphNodes && graphEdges,
  );

  const liveTests: ReceiptTest[] = useLiveData
    ? analysis!.affected_tests.map((test) => ({
        id: String(test.id ?? test.name ?? 'unknown-test'),
        name: String(test.name ?? test.id ?? 'Unknown test'),
      }))
    : [];

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title={`Decision Receipt — PR #${scenario.number}`}
          subtitle="An auditable summary separating predictions from observed results"
          icon={<ReceiptText size={16} />}
          right={
            <Badge tone="warn">
              {useLiveData ? 'Prediction · Unverified' : 'Pending verification'}
            </Badge>
          }
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
          {tab === 'comparison' && (
            <ComparisonTab scenario={scenario} live={useLiveData} analysis={analysis} />
          )}

          {tab === 'graph-prediction' && (
            <GraphPredictionTab
              scenario={scenario}
              live={useLiveData}
              analysis={analysis}
              graphNodes={graphNodes}
              graphEdges={graphEdges}
            />
          )}

          {tab === 'test-results' && (
            <TestResultsTab
              scenario={scenario}
              live={useLiveData}
              tests={liveTests}
            />
          )}

          {tab === 'unverified-risks' && (
            <UnverifiedRisksTab scenario={scenario} live={useLiveData} />
          )}
        </div>
      </Panel>
    </div>
  );
}

function ComparisonTab({
  scenario,
  live,
  analysis,
}: {
  scenario: PRScenario;
  live: boolean;
  analysis?: ImpactAnalysis | null;
}) {
  return (
    <div className="animate-fade-in space-y-4">
      {live && analysis ? (
        <>
          <div className="rounded-lg border border-amber-500/25 bg-amber-500/5 p-3">
            <div className="flex items-center gap-2 text-amber-300">
              <AlertTriangle size={14} />
              <span className="text-xs font-semibold uppercase tracking-wider">
                Illustrative contract comparison
              </span>
            </div>
            <p className="mt-1.5 text-xs text-amber-200/70">
              The contract examples below come from the demo scenario, not a
              source-code diff fetched from the repository. The live graph
              predicts downstream impact, but does not independently verify
              these before-and-after values.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <MetricCard label="Analyzed change" value={analysis.change.symbol} />
            <MetricCard label="Changed file (analysis metadata)" value={analysis.change.file} />
            <MetricCard label="Previous contract (analysis metadata)" value={analysis.change.from_contract} />
            <MetricCard label="Proposed contract (analysis metadata)" value={analysis.change.to_contract} />
          </div>
        </>
      ) : (
        <div className="rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
          <div className="flex items-center gap-2 text-violet-300">
            <GitCompare size={14} />
            <span className="text-xs font-semibold uppercase tracking-wider">
              Demo scenario
            </span>
          </div>
          <p className="mt-1.5 text-xs text-slate-400">
            This comparison uses the scenario's configured examples. It is not
            a verified source-code diff.
          </p>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        <MetricCard label="Scenario file" value={scenario.file} />
        <MetricCard
          label="Breaking contracts in scenario"
          value={`${scenario.contract.filter((contract) => contract.breaking).length} of ${scenario.contract.length}`}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-base-700/60">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-base-800/50 text-left text-[11px] uppercase tracking-wider text-slate-500">
              <th className="px-3 py-2 font-medium">Field</th>
              <th className="px-3 py-2 font-medium">Before</th>
              <th className="px-3 py-2 font-medium">After</th>
              <th className="px-3 py-2 font-medium">Scenario verdict</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-base-700/40">
            {scenario.contract.map((contract, index) => (
              <tr key={`${contract.field}-${index}`}>
                <td className="px-3 py-2 font-mono text-xs text-slate-300">
                  {contract.field}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-400">
                  {contract.before}
                </td>
                <td className="px-3 py-2 font-mono text-xs text-slate-200">
                  <span className="flex items-center gap-1.5">
                    <ArrowRight size={11} className="text-slate-600" />
                    {contract.after}
                  </span>
                </td>
                <td className="px-3 py-2">
                  {contract.breaking ? (
                    <Badge tone="bad">Breaking · illustrative</Badge>
                  ) : (
                    <Badge tone="ok">Safe · illustrative</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function GraphPredictionTab({
  scenario,
  live,
  analysis,
  graphNodes,
  graphEdges,
}: {
  scenario: PRScenario;
  live: boolean;
  analysis?: ImpactAnalysis | null;
  graphNodes?: GraphNode[];
  graphEdges?: GraphEdge[];
}) {
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
          {live
            ? 'This impact trace comes from the connected FalkorDB dependency graph. It predicts affected entities and tests; it does not prove that the change causes a failure.'
            : 'This graph is a demo scenario trace. It represents predicted impact, not outcomes from executed tests.'}
        </p>
      </div>

      {live && analysis && graphNodes && graphEdges ? (
        <>
          <div className="grid gap-3 sm:grid-cols-3">
            <MetricCard
              label="Affected entities"
              value={String(analysis.affected_node_count)}
            />
            <MetricCard
              label="Affected journeys"
              value={String(analysis.affected_journey_count)}
            />
            <MetricCard
              label="Affected tests"
              value={String(analysis.affected_test_count)}
            />
          </div>

          <div className="rounded-lg border border-base-700/60 bg-base-800/30 p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Predicted affected journeys
            </div>
            {analysis.affected_journeys.length > 0 ? (
              <ul className="mt-2 space-y-1.5">
                {analysis.affected_journeys.map((journey, index) => (
                  <li
                    key={String(journey.id ?? journey.name ?? index)}
                    className="flex items-start gap-2 text-sm text-slate-200"
                  >
                    <Network size={14} className="mt-0.5 shrink-0 text-violet-300" />
                    {String(journey.name ?? journey.id ?? 'Unnamed journey')}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm text-slate-400">
                No affected journeys were returned by the current graph query.
              </p>
            )}
          </div>

          <div className="rounded-lg border border-base-700/60 bg-base-800/30 p-3">
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
              Test coverage
            </div>
            <p className="mt-1.5 text-sm text-slate-200">Not measured</p>
            <p className="mt-1 text-xs text-slate-500">
              The graph identifies related tests but does not execute them or
              calculate code coverage.
            </p>
          </div>

          <ImpactGraph
            nodes={graphNodes}
            edges={graphEdges}
            isLive
          />
        </>
      ) : (
        <>
          <ImpactSummaryPanel summary={scenario.impactSummary} />
          <ImpactGraph nodes={scenario.graph.nodes} edges={scenario.graph.edges} />
        </>
      )}
    </div>
  );
}

function TestResultsTab({
  scenario,
  live,
  tests,
}: {
  scenario: PRScenario;
  live: boolean;
  tests: ReceiptTest[];
}) {
  const testRows = live
    ? tests
    : scenario.tests.map((test) => ({ id: test.id, name: test.name }));

  return (
    <div className="animate-fade-in space-y-3">
      <div className="rounded-lg border border-base-700/60 bg-base-800/40 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 size={15} className="text-slate-400" />
          <h4 className="text-sm font-semibold text-slate-200">
            Observed Test Results
          </h4>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-lg bg-amber-500/10 px-3 py-2.5 text-sm text-amber-200">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span>
            {live
              ? `The live graph selected ${testRows.length} related test${testRows.length === 1 ? '' : 's'}. No tests have been executed, so pass/fail results and coverage are unavailable.`
              : 'These are demo scenario test entries. Their statuses should not be interpreted as results from a live test run.'}
          </span>
        </div>
      </div>

      <div className="space-y-1.5">
        {testRows.length > 0 ? (
          testRows.map((test) => (
            <div
              key={test.id}
              className="flex items-center justify-between gap-3 rounded-lg border border-base-700/50 bg-base-850/40 px-3 py-2.5"
            >
              <div className="flex min-w-0 items-center gap-2">
                <span className="h-2 w-2 shrink-0 rounded-full bg-amber-400" />
                <span className="break-all font-mono text-xs text-slate-300">
                  {test.name}
                </span>
              </div>
              <div className="flex shrink-0 items-center gap-2">
                <Badge tone="neutral">{live ? 'Playwright' : 'Scenario'}</Badge>
                <Badge tone="warn">Not run</Badge>
              </div>
            </div>
          ))
        ) : (
          <p className="rounded-lg border border-base-700/50 p-3 text-sm text-slate-400">
            No related tests were returned for this prediction.
          </p>
        )}
      </div>
    </div>
  );
}

function UnverifiedRisksTab({
  scenario,
  live,
}: {
  scenario: PRScenario;
  live: boolean;
}) {

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
          {live
            ? 'The risks listed below are illustrative scenario guidance, not findings independently derived from the live graph or verified against the repository source. Use the graph prediction to guide validation, then run the relevant tests.'
            : 'These risks are supplied by the demo scenario. Confirm them against the actual change and targeted tests before approving a PR.'}
        </p>
      </div>

      <div className="space-y-2">
  {live ? (
    <>
      <div className="rounded-lg border border-base-700/60 bg-base-850/50 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-slate-200">
            Related Playwright tests have been identified but not executed.
          </p>
          <Badge tone="neutral">Unverified</Badge>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Run the selected tests to determine whether the proposed change causes
          regressions. No pass/fail result is available yet.
        </p>
      </div>

      <div className="rounded-lg border border-base-700/60 bg-base-850/50 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-slate-200">
            Code coverage has not been measured.
          </p>
          <Badge tone="neutral">Not measured</Badge>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          The dependency graph identifies related entities and tests; it does
          not establish test coverage or prove that the change is safe.
        </p>
      </div>

      <div className="rounded-lg border border-base-700/60 bg-base-850/50 p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="text-sm text-slate-200">
            The predicted impact has not been validated against test outcomes.
          </p>
          <Badge tone="neutral">Prediction only</Badge>
        </div>
        <p className="mt-2 text-xs text-slate-400">
          Re-evaluate the prediction after running the relevant tests. These
          limitations are known; additional source-level risks may still exist.
        </p>
      </div>
    </>
  ) : scenario.risks.length > 0 ? (
    scenario.risks.map((risk) => (
      <div
        key={risk.id}
        className="rounded-lg border border-base-700/60 bg-base-850/50 p-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 space-y-1.5">
            <p className="text-sm text-slate-200">{risk.description}</p>
            <Badge tone="neutral">Demo scenario</Badge>
          </div>
          <Badge tone="neutral">{risk.severity} · illustrative</Badge>
        </div>

        <div className="mt-3 flex items-start gap-2 rounded-md bg-base-800/50 px-3 py-2">
          <ArrowRight
            size={13}
            className="mt-0.5 shrink-0 text-emerald-400"
          />
          <p className="text-xs text-slate-400">
            <span className="font-medium text-emerald-300">
              Suggested mitigation:{' '}
            </span>
            {risk.mitigation}
          </p>
        </div>
      </div>
    ))
  ) : (
    <p className="rounded-lg border border-base-700/50 p-3 text-sm text-slate-400">
      No scenario risks have been listed. This does not mean the change is
      risk-free.
    </p>
  )}
</div>
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-base-700/60 bg-base-800/40 p-3">
      <div className="text-[11px] uppercase tracking-wider text-slate-500">
        {label}
      </div>
      <div className="mt-1 break-words font-mono text-sm text-slate-200">
        {value}
      </div>
    </div>
  );
}
