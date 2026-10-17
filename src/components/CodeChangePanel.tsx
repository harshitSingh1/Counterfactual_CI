import type { PRScenario } from '@/types';
import { Panel, PanelHeader, Badge } from '@/components/ui';
import { FileCode2, AlertTriangle, ArrowRight } from 'lucide-react';

export function CodeChangePanel({ scenario }: { scenario: PRScenario }) {
  const breakingCount = scenario.contract.filter((c) => c.breaking).length;
  return (
    <div className="space-y-4">
      <Panel>
        <PanelHeader
          title={`PR #${scenario.number} — ${scenario.title}`}
          subtitle={scenario.file}
          icon={<FileCode2 size={16} />}
          right={
            breakingCount > 0 ? (
              <Badge tone="bad">
                <AlertTriangle size={11} /> {breakingCount} breaking
              </Badge>
            ) : (
              <Badge tone="ok">No breaking changes</Badge>
            )
          }
        />
        <div className="px-4 py-3">
          <p className="text-sm leading-relaxed text-slate-300">{scenario.description}</p>
        </div>
      </Panel>

      <Panel className="overflow-hidden">
        <div className="flex items-center justify-between border-b border-base-700/70 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-slate-100">Diff</h3>
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
                  line.kind === 'added' ? '+' : line.kind === 'removed' ? '-' : ' ';
                return (
                  <tr key={i} className={`${bg} hover:brightness-125`}>
                    <td className="w-10 select-none border-r border-base-700/40 px-2 text-right text-slate-600">
                      {line.oldNo ?? ''}
                    </td>
                    <td className="w-10 select-none border-r border-base-700/40 px-2 text-right text-slate-600">
                      {line.newNo ?? ''}
                    </td>
                    <td className={`w-5 select-none pl-3 ${text}`}>{marker}</td>
                    <td className={`whitespace-pre px-3 py-0.5 ${text}`}>{line.text}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      <Panel>
        <div className="border-b border-base-700/70 px-4 py-2.5">
          <h3 className="text-sm font-semibold text-slate-100">Contract Comparison</h3>
          <p className="mt-0.5 text-xs text-slate-400">
            Before vs after across API and component consumers
          </p>
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
                  <AlertTriangle size={14} className="shrink-0 text-red-400" />
                ) : (
                  <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-emerald-500/50" />
                )}
                <span className="font-mono text-xs text-slate-300">{c.field}</span>
              </div>
              <div className="flex flex-1 items-center gap-2 font-mono text-xs">
                <span className="text-slate-400 line-through decoration-red-500/40">{c.before}</span>
                <ArrowRight size={12} className="shrink-0 text-slate-600" />
                <span className={c.breaking ? 'text-red-300' : 'text-emerald-300'}>{c.after}</span>
              </div>
              <div className="sm:w-24 sm:text-right">
                {c.breaking ? <Badge tone="bad">breaking</Badge> : <Badge tone="ok">safe</Badge>}
              </div>
            </div>
          ))}
        </div>
      </Panel>
    </div>
  );
}
