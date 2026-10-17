
import type { PRScenario } from '@/types';
import { Panel, PanelHeader, Badge } from '@/components/ui';
import { FileCode2, AlertTriangle, ArrowRight } from 'lucide-react';

export function CodeChangePanel({
  scenario,
  compact = false,
}: {
  scenario: PRScenario;
  compact?: boolean;
}) {
  const isAuthRefactor = scenario.number === 101;
  const breakingCount = scenario.contract.filter((c) => c.breaking).length;

  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title={`Code Change · PR #${scenario.number}`}
          subtitle={scenario.file}
          icon={<FileCode2 size={16} />}
          right={<Badge tone="neutral">Illustrative example</Badge>}
        />
        <div className="px-3 py-3">
          <p className="text-xs leading-relaxed text-slate-300">
            {scenario.description}
          </p>

          {isAuthRefactor && (
            <div className="mt-3 rounded-lg border border-violet-500/20 bg-violet-500/5 p-3">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-violet-300">
                Analysis metadata
              </div>
              <div className="mt-2 grid gap-2 sm:grid-cols-3">
                <div>
                  <div className="text-[10px] text-slate-500">Changed symbol</div>
                  <div className="mt-1 font-mono text-xs text-slate-200">
                    verify_token()
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Previous contract</div>
                  <div className="mt-1 font-mono text-xs text-slate-200">
                    user_id
                  </div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Proposed contract</div>
                  <div className="mt-1 font-mono text-xs text-slate-200">
                    sub
                  </div>
                </div>
              </div>
              <p className="mt-2 text-[11px] leading-relaxed text-slate-400">
                These values describe the configured analysis scenario. The
                backend has not fetched or verified an actual repository diff.
              </p>
            </div>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-2 text-[11px] text-slate-500">
            <span className="font-mono text-slate-300">{scenario.file}</span>
            <span>·</span>
            <span>Illustrative sample · not fetched from repository</span>
          </div>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-base-700/70 px-3 py-2.5">
          <div>
            <h3 className="text-sm font-semibold text-slate-100">Example Diff</h3>
            <p className="mt-1 text-[11px] text-amber-300">
              Illustrative only · not an actual repository diff
            </p>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-slate-500">
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-red-500/70" /> removed
            </span>
            <span className="flex items-center gap-1">
              <span className="h-2 w-2 rounded-sm bg-emerald-500/70" /> added
            </span>
          </div>
        </div>
        <div className="overflow-x-auto font-mono text-xs">
          <table className="w-full border-collapse">
            <tbody>
              {scenario.diff.map((line, i) => {
                const bg =
                  line.kind === 'added'
                    ? 'bg-emerald-500/8'
                    : line.kind === 'removed'
                      ? 'bg-red-500/8'
                      : '';
                const text =
                  line.kind === 'added'
                    ? 'text-emerald-300'
                    : line.kind === 'removed'
                      ? 'text-red-300'
                      : 'text-slate-300';
                const marker =
                  line.kind === 'added'
                    ? '+'
                    : line.kind === 'removed'
                      ? '-'
                      : ' ';

                return (
                  <tr key={i} className={`${bg} hover:brightness-125`}>
                    <td className="w-9 select-none border-r border-base-700/40 px-1.5 text-right text-slate-600">
                      {line.oldNo ?? ''}
                    </td>
                    <td className="w-9 select-none border-r border-base-700/40 px-1.5 text-right text-slate-600">
                      {line.newNo ?? ''}
                    </td>
                    <td className={`w-5 select-none pl-3 ${text}`}>{marker}</td>
                    <td className={`whitespace-pre px-2 py-0.5 ${text}`}>
                      {line.text}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {compact && (
        <Panel>
          <div className="border-b border-base-700/80 px-3 py-2.5">
            <h3 className="text-sm font-semibold text-slate-100">
              Example Contract Comparison
            </h3>
            <p className="mt-1 text-[11px] text-amber-300">
              Scenario data · verdicts have not been independently verified
            </p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-base-700/80">
            <div className="bg-red-500/5 p-3">
              <div className="text-[10px] font-medium uppercase tracking-wider text-red-300">
                Before
              </div>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">
                {scenario.contract
                  .slice(0, 3)
                  .map((item) => `${item.field}: ${item.before}`)
                  .join('\n')}
              </pre>
            </div>
            <div className="bg-emerald-500/5 p-3">
              <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-300">
                After
              </div>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">
                {scenario.contract
                  .slice(0, 3)
                  .map((item) => `${item.field}: ${item.after}`)
                  .join('\n')}
              </pre>
            </div>
          </div>
        </Panel>
      )}

      {!compact && (
        <Panel>
          <div className="border-b border-base-700/70 px-3 py-2.5">
            <h3 className="text-sm font-semibold text-slate-100">
              Example Contract Comparison
            </h3>
            <p className="mt-1 text-xs text-slate-400">
              Scenario examples across API and component consumers. These
              verdicts are not verified against repository source or test runs.
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              <Badge tone="neutral">Illustrative data</Badge>
              <span className="text-[11px] text-slate-500">
                {breakingCount} of {scenario.contract.length} scenario entries
                are marked breaking; this is not a live finding.
              </span>
            </div>
          </div>
          <div className="divide-y divide-base-700/50">
            {scenario.contract.map((c, i) => (
              <div
                key={i}
                className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center ${
                  c.breaking ? 'bg-red-500/5' : ''
                }`}
              >
                <div className="flex w-full items-center gap-2 sm:w-64">
                  {c.breaking ? (
                    <AlertTriangle size={14} className="shrink-0 text-amber-400" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-500/50" />
                  )}
                  <span className="font-mono text-xs text-slate-300">
                    {c.field}
                  </span>
                </div>
                <div className="flex flex-1 items-center gap-2 font-mono text-xs">
                  <span className="text-slate-400">{c.before}</span>
                  <ArrowRight size={12} className="shrink-0 text-slate-600" />
                  <span className="text-slate-200">{c.after}</span>
                </div>
                <div className="sm:w-36 sm:text-right">
                  <Badge tone="neutral">
                    {c.breaking
                      ? 'Breaking · illustrative'
                      : 'Safe · illustrative'}
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </Panel>
      )}

      <Panel>
        <div className="flex items-start gap-2 p-3">
          <AlertTriangle size={14} className="mt-0.5 shrink-0 text-amber-400" />
          <p className="text-xs leading-relaxed text-slate-400">
            Dependency impact is analyzed separately using the connected
            FalkorDB graph. A predicted dependency does not by itself prove a
            contract violation, a test failure, or a safe repair. Automated
            tests have not been executed.
          </p>
        </div>
      </Panel>
    </div>
  );
}
