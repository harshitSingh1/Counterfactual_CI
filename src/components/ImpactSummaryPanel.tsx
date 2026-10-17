import type { ImpactSummary } from '@/types';
import { Panel, PanelHeader, Badge } from '@/components/ui';
import { Route, ShieldCheck, AlertOctagon } from 'lucide-react';

export function ImpactSummaryPanel({ summary }: { summary: ImpactSummary }) {
  return (
    <div className="grid gap-4 md:grid-cols-3">
      <Panel>
        <PanelHeader
          title="Affected Journeys"
          icon={<Route size={16} />}
          right={
            <Badge tone={summary.affectedJourneys.length ? 'bad' : 'ok'}>
              {summary.affectedJourneys.length}
            </Badge>
          }
        />
        <div className="space-y-1.5 p-3">
          {summary.affectedJourneys.length === 0 ? (
            <p className="py-3 text-center text-xs text-slate-500">No journeys impacted.</p>
          ) : (
            summary.affectedJourneys.map((j) => (
              <div
                key={j}
                className="flex items-center gap-2 rounded-lg bg-base-800/50 px-3 py-2 text-sm text-slate-200"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-red-400" />
                {j}
              </div>
            ))
          )}
        </div>
      </Panel>

      <Panel>
        <PanelHeader title="Mapped Test Coverage" icon={<ShieldCheck size={16} />} />
        <div className="p-4">
          <div className="flex items-end gap-2">
            <span className="text-3xl font-semibold text-slate-100">{summary.mappedCoverage}%</span>
            <span className="mb-1 text-xs text-slate-500">of traced paths</span>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-base-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-violet-500 to-sky-400"
              style={{ width: `${summary.mappedCoverage}%` }}
            />
          </div>
          <p className="mt-2 text-xs text-slate-500">
            Static trace coverage only — not a substitute for executed tests.
          </p>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Uncovered Components"
          icon={<AlertOctagon size={16} />}
          right={
            <Badge tone={summary.uncoveredComponents.length ? 'warn' : 'ok'}>
              {summary.uncoveredComponents.length}
            </Badge>
          }
        />
        <div className="space-y-1.5 p-3">
          {summary.uncoveredComponents.length === 0 ? (
            <p className="py-3 text-center text-xs text-slate-500">All components covered.</p>
          ) : (
            summary.uncoveredComponents.map((c) => (
              <div
                key={c}
                className="flex items-center gap-2 rounded-lg bg-amber-500/5 px-3 py-2 font-mono text-xs text-amber-200 ring-1 ring-inset ring-amber-500/20"
              >
                <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                {c}
              </div>
            ))
          )}
        </div>
      </Panel>
    </div>
  );
}
