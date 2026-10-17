import { useState } from 'react';
import type { ViewId } from '@/types';
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

function App() {
  const [view, setView] = useState<ViewId>('overview');
  const [prId, setPrId] = useState<string>(PRS[0].id);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const scenario = SCENARIOS[prId];

  return (
    <div className="flex min-h-screen bg-base-950">
      <Sidebar
        active={view}
        onSelect={setView}
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
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
              <OverviewView scenario={scenario} onNavigate={setView} />
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
                  subtitle="FalkorDB-traced dependency graph and coverage summary"
                />
                <ImpactSummaryPanel summary={scenario.impactSummary} />
                <ImpactGraph nodes={scenario.graph.nodes} edges={scenario.graph.edges} />
              </div>
            )}

            {view === 'simulation' && (
              <div className="space-y-4">
                <SectionTitle
                  title="Simulation"
                  subtitle="Counterfactual repair options with predicted outcomes"
                />
                <SimulationPanel options={scenario.repairOptions} />
              </div>
            )}

            {view === 'test-results' && (
              <div className="space-y-4">
                <SectionTitle
                  title="Test Results"
                  subtitle="Targeted tests selected from the impact trace"
                />
                <TestResultsPanel tests={scenario.tests} />
              </div>
            )}

            {view === 'decision-receipt' && (
              <div className="space-y-4">
                <SectionTitle
                  title="Decision Receipt"
                  subtitle="Auditable record separating predictions from observed results"
                />
                <DecisionReceipt scenario={scenario} />
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}

function SectionTitle({ title, subtitle }: { title: string; subtitle: string }) {
  return (
    <div className="flex items-end justify-between gap-3">
      <div><h2 className="text-lg font-semibold text-slate-100">{title}</h2><p className="mt-0.5 text-xs text-slate-500">{subtitle}</p></div>
      <span className="text-[10px] text-slate-600">Demo data · no backend connected</span>
    </div>
  );
}

export default App;
