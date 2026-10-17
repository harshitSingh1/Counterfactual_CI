import { useState } from 'react';
import type { TestCase } from '@/types';
import { Panel, PanelHeader, Badge } from '@/components/ui';
import {
  Play,
  FlaskConical,
  ShieldQuestion,
  CircleSlash,
  ServerCog,
  CheckCircle2,
  XCircle,
  Clock,
} from 'lucide-react';

const STATUS_META: Record<
  TestCase['status'],
  { label: string; tone: 'ok' | 'bad' | 'warn'; Icon: typeof CheckCircle2 }
> = {
  pass: { label: 'Passed', tone: 'ok', Icon: CheckCircle2 },
  fail: { label: 'Failed', tone: 'bad', Icon: XCircle },
  unverified: { label: 'Unverified', tone: 'warn', Icon: CircleSlash },
};

export function TestResultsPanel({ tests }: { tests: TestCase[] }) {
  const [running, setRunning] = useState(false);
  const [showNotice, setShowNotice] = useState(false);

  const runTests = () => {
    setRunning(true);
    setShowNotice(false);
    setTimeout(() => {
      setRunning(false);
      setShowNotice(true);
    }, 1400);
  };

  return (
    <div className="space-y-4">
      <Panel className="border-sky-500/20 bg-sky-500/5">
        <div className="flex items-start gap-3 p-4">
          <ServerCog size={18} className="mt-0.5 shrink-0 text-sky-400" />
          <div>
            <h3 className="text-sm font-semibold text-sky-200">Backend test runner not connected</h3>
            <p className="mt-1 text-xs leading-relaxed text-sky-200/70">
              Test statuses shown below are placeholder state. Running targeted tests will not
              execute any real backend or browser suite yet. Connect the test runner to record
              observed results.
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Targeted Test Suite"
          subtitle={`${tests.length} tests selected from the impact trace`}
          icon={<FlaskConical size={16} />}
          right={
            <button
              onClick={runTests}
              disabled={running}
              className={`flex items-center gap-2 rounded-lg px-3 py-1.5 text-sm font-medium transition-all ${
                running
                  ? 'cursor-wait bg-base-700 text-slate-400'
                  : 'bg-violet-500/90 text-white hover:bg-violet-500 glow-violet'
              }`}
            >
              <Play size={14} className={running ? 'animate-pulse' : ''} />
              {running ? 'Dispatching...' : 'Run Targeted Tests'}
            </button>
          }
        />

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-base-700/70 text-left text-[11px] uppercase tracking-wider text-slate-500">
                <th className="px-4 py-2.5 font-medium">Test</th>
                <th className="px-4 py-2.5 font-medium">Kind</th>
                <th className="px-4 py-2.5 font-medium">Status</th>
                <th className="px-4 py-2.5 font-medium">Duration</th>
                <th className="px-4 py-2.5 font-medium">Coverage</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-base-700/40">
              {tests.map((t) => {
                const meta = STATUS_META[t.status];
                return (
                  <tr key={t.id} className="hover:bg-base-800/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <meta.Icon
                          size={15}
                          className={
                            t.status === 'pass'
                              ? 'text-emerald-400'
                              : t.status === 'fail'
                              ? 'text-red-400'
                              : 'text-amber-400'
                          }
                        />
                        <span className="font-mono text-xs text-slate-200">{t.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone="neutral">{t.kind}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge tone={meta.tone}>{meta.label}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      {t.duration > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={12} /> {t.duration}ms
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-16 overflow-hidden rounded-full bg-base-800">
                          <div
                            className={`h-full rounded-full ${
                              t.coverage >= 70
                                ? 'bg-emerald-500'
                                : t.coverage >= 40
                                ? 'bg-amber-500'
                                : 'bg-red-500'
                            }`}
                            style={{ width: `${t.coverage}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-400">{t.coverage}%</span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {showNotice && (
        <Panel className="animate-fade-in border-amber-500/30 bg-amber-500/5">
          <div className="flex items-start gap-3 p-4">
            <ShieldQuestion size={18} className="mt-0.5 shrink-0 text-amber-400" />
            <div>
              <h4 className="text-sm font-semibold text-amber-200">Backend not connected</h4>
              <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
                The test dispatch was simulated. No real tests were executed, and no pass/fail
                results were recorded. Connect the backend test runner to turn these placeholder
                rows into observed outcomes.
              </p>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
