import { useEffect, useState } from 'react';
import type { ViewId, GraphNode, GraphEdge } from '@/types';
import { SCENARIOS, PRS } from '@/data/demoData';
import { Sidebar } from '@/components/Sidebar';
import { Header } from '@/components/Header';
import { OverviewView } from '@/components/OverviewView';
import { CodeChangePanel } from '@/components/CodeChangePanel';
import { ImpactSummaryPanel } from '@/components/ImpactSummaryPanel';
import { ImpactGraph } from '@/components/ImpactGraph';
import { SimulationPanel } from '@/components/SimulationPanel';
import { TestResultsPanel } from '@/components/TestResultsPanel';
import { DecisionReceipt } from '@/components/DecisionReceipt';
import {
  fetchGraph,
  fetchImpactAnalysis,
  mapBackendGraph,
  type ImpactAnalysis,
} from '@/lib/api';


function App() {
  const [view, setView] = useState<ViewId>('overview');
  const [prId, setPrId] = useState<string>(PRS[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [liveNodes, setLiveNodes] = useState<GraphNode[] | null>(null);
  const [liveEdges, setLiveEdges] = useState<GraphEdge[] | null>(null);
  const [analysis, setAnalysis] = useState<ImpactAnalysis | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [loadingGraph, setLoadingGraph] = useState(false);

  const scenario = SCENARIOS[prId];
  const isPR101 = scenario?.number === 101;

  useEffect(() => {
    let cancelled = false;

    async function loadLiveGraph() {
      setLoadingGraph(true);
      setApiError(null);

      try {
        const [graph, impact] = await Promise.all([
          fetchGraph(),
          fetchImpactAnalysis(101),
        ]);

        if (cancelled) return;

        const mapped = mapBackendGraph(graph, impact);
        setLiveNodes(mapped.nodes);
        setLiveEdges(mapped.edges);
        setAnalysis(impact);
      } catch (error) {
        if (cancelled) return;
        setApiError(
          error instanceof Error
            ? error.message
            : 'Could not connect to the backend.',
        );
      } finally {
        if (!cancelled) setLoadingGraph(false);
      }
    }

    loadLiveGraph();
    return () => {
      cancelled = true;
    };
  }, []);

  const graphNodes =
    isPR101 && liveNodes ? liveNodes : scenario.graph.nodes;
  const graphEdges =
    isPR101 && liveEdges ? liveEdges : scenario.graph.edges;

    const impactSummary =
    isPR101 && analysis
      ? {
          affectedJourneys: analysis.affected_journeys.map((journey, index) => {
            const item = journey as Record<string, unknown>;
            return String(
              item.label ?? item.name ?? item.id ?? `Affected journey ${index + 1}`,
            );
          }),
          mappedCoverage: null,
          uncoveredComponents: [],
        }
      : scenario.impactSummary;

  return (
    <div className="flex min-h-screen bg-base-950">
      <Sidebar
  active={view}
  onSelect={setView}
  open={sidebarOpen}
  onClose={() => setSidebarOpen(false)}
  isConnected={Boolean(liveNodes) && !apiError}
/>

      <div className="flex min-w-0 flex-1 flex-col">
        <Header
          selectedPR={prId}
          onSelectPR={setPrId}
          onOpenSidebar={() => setSidebarOpen(true)}
        />

        <main className="flex-1 overflow-y-auto p-3 md:p-4">
          <div key={`${view}-${prId}`} className="animate-fade-in mx-auto max-w-[1500px]">
            {view === 'overview' && (
              <OverviewView
              scenario={scenario}
              onNavigate={setView}
              live={isPR101 && Boolean(analysis && liveNodes)}
              analysis={analysis}
              graphNodes={isPR101 && analysis ? graphNodes : undefined}
              graphEdges={isPR101 && analysis ? graphEdges : undefined}
            />
            )}

            {view === 'code-changes' && (
              <div className="space-y-4">
                <SectionTitle
                  title="Code Changes"
                  subtitle={`PR #${scenario.number} — ${scenario.title}`}
                />
                <CodeChangePanel scenario={scenario} />
              </div>
            )}

            {view === 'impact-analysis' && (
              <div className="space-y-4">
                <SectionTitle
                  title="Impact Analysis"
                  subtitle={
                    isPR101
                      ? 'Live FalkorDB dependency graph · graph-derived prediction'
                      : 'Demo dependency graph and coverage summary'
                  }
                  status={
                    isPR101
                      ? loadingGraph
                        ? 'Connecting to backend…'
                        : apiError
                          ? 'Backend unavailable'
                          : liveNodes
                            ? 'FalkorDB connected'
                            : 'Waiting for graph data'
                      : 'Demo scenario'
                  }
                />

                {apiError && isPR101 && (
                  <div className="rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-200">
                    Could not load live graph: {apiError}. Showing the existing demo graph instead.
                  </div>
                )}

                {isPR101 && analysis && (
                  <div className="rounded-lg border border-sky-500/30 bg-sky-500/10 p-3 text-sm text-sky-100">
                    <div className="font-semibold">Predicted impact for PR #101</div>
                    <p className="mt-1 text-xs leading-relaxed text-sky-100/80">
                      {analysis.affected_node_count} affected nodes · {analysis.affected_journey_count} affected journeys · {analysis.affected_test_count} affected tests.
                      {' '}This is a graph-derived prediction, not a test result. Automated tests have not been executed by this analysis.
                    </p>
                  </div>
                )}

                <ImpactSummaryPanel summary={impactSummary} />
                <ImpactGraph
                  nodes={graphNodes}
                  edges={graphEdges}
                  isLive={isPR101 && Boolean(liveNodes)}
                />
              </div>
            )}

            {view === 'simulation' && (
              <div className="space-y-4">
                <SectionTitle
                  title="Simulation"
                  subtitle="Counterfactual repair options with predicted outcomes"
                />
                <SimulationPanel
  options={scenario.repairOptions}
  live={isPR101 && Boolean(analysis && liveNodes)}
  analysis={analysis}
/>
              </div>
            )}

            {view === 'test-results' && (
              <div className="space-y-4">
                <SectionTitle
                  title="Test Results"
                  subtitle="Targeted tests selected from the impact trace"
                />
                <TestResultsPanel
  tests={
    isPR101 && analysis
      ? analysis.affected_tests.map((test) => ({
        id: String(test.id ?? test.name ?? 'unknown-test'),
          name: String(test.name ?? test.id),
          kind: 'Playwright',
          status: 'unverified' as const,
          duration: 0,
          coverage: 0,
        }))
      : scenario.tests
  }
  live={isPR101 && Boolean(analysis)}
/>
              </div>
            )}

            {view === 'decision-receipt' && (
              <div className="space-y-4">
                <SectionTitle
                  title="Decision Receipt"
                  subtitle="Auditable record separating predictions from observed results"
                />
                <DecisionReceipt
  scenario={scenario}
  live={isPR101 && Boolean(analysis && liveNodes)}
  analysis={analysis}
  graphNodes={isPR101 && analysis ? graphNodes : undefined}
  graphEdges={isPR101 && analysis ? graphEdges : undefined}
/>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionTitle({
  title,
  subtitle,
  status,
}: {
  title: string;
  subtitle: string;
  status?: string;
}) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div>
        <h2 className="text-lg font-semibold text-slate-100">{title}</h2>
        <p className="mt-0.5 text-xs text-slate-500">{subtitle}</p>
      </div>
      <span className="text-right text-[10px] text-slate-500">
        {status ?? 'Predictions are not test verification'}
      </span>
    </div>
  );
}

export default App;
