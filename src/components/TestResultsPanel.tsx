
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
  unverified: { label: 'Not run', tone: 'warn', Icon: CircleSlash },
};

export function TestResultsPanel({
  tests,
  live = false,
}: {
  tests: TestCase[];
  live?: boolean;
}) {
  const [showNotice, setShowNotice] = useState(false);

  const runTests = () => {
    setShowNotice(true);
  };

  return (
    <div className="space-y-4">
      <Panel className="border-sky-500/20 bg-sky-500/5">
        <div className="flex items-start gap-3 p-4">
          <ServerCog size={18} className="mt-0.5 shrink-0 text-sky-400" />
          <div>
            <h3 className="text-sm font-semibold text-sky-200">
              Backend test runner not connected
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-sky-200/70">
              {live
                ? 'These tests were selected by the live dependency graph. They have not been executed, and no pass/fail results or coverage measurements are available.'
                : 'Test statuses shown below are demo data. Running targeted tests will not execute a real backend or browser suite yet.'}
            </p>
          </div>
        </div>
      </Panel>

      <Panel>
        <PanelHeader
          title="Targeted Test Suite"
          subtitle={`${tests.length} ${live ? 'tests selected from the live impact analysis' : 'tests in this demo scenario'}`}
          icon={<FlaskConical size={16} />}
          right={
            <button
              onClick={runTests}
              className="flex items-center gap-2 border border-accent-blue/60 bg-accent-blue/10 px-3 py-1.5 text-sm font-medium text-blue-200 transition-colors hover:bg-accent-blue/20"
            >
              <Play size={14} />
              Run Targeted Tests
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
              {tests.map((test) => {
                const meta = STATUS_META[test.status];
                const Icon = meta.Icon;

                return (
                  <tr key={test.id} className="hover:bg-base-800/40">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <Icon
                          size={15}
                          className={
                            live
                              ? 'text-amber-400'
                              : test.status === 'pass'
                                ? 'text-emerald-400'
                                : test.status === 'fail'
                                  ? 'text-red-400'
                                  : 'text-amber-400'
                          }
                        />
                        <span className="font-mono text-xs text-slate-200">
                          {test.name}
                        </span>
                      </div>
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone="neutral">{test.kind}</Badge>
                    </td>

                    <td className="px-4 py-3">
                      <Badge tone={live ? 'warn' : meta.tone}>
                        {live ? 'Selected · Not run' : meta.label}
                      </Badge>
                    </td>

                    <td className="px-4 py-3">
                      {live ? (
                        <span className="text-xs text-slate-500">Not available</span>
                      ) : test.duration > 0 ? (
                        <span className="flex items-center gap-1 text-xs text-slate-400">
                          <Clock size={12} /> {test.duration}ms
                        </span>
                      ) : (
                        <span className="text-xs text-slate-600">—</span>
                      )}
                    </td>

                    <td className="px-4 py-3">
                      {live ? (
                        <span className="text-xs text-slate-500">Not measured</span>
                      ) : (
                        <div className="flex items-center gap-2">
                          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-base-800">
                            <div
                              className={`h-full rounded-full ${
                                test.coverage >= 70
                                  ? 'bg-emerald-500'
                                  : test.coverage >= 40
                                    ? 'bg-amber-500'
                                    : 'bg-red-500'
                              }`}
                              style={{ width: `${test.coverage}%` }}
                            />
                          </div>
                          <span className="text-xs text-slate-400">
                            {test.coverage}%
                          </span>
                        </div>
                      )}
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
              <h4 className="text-sm font-semibold text-amber-200">
                Test execution unavailable
              </h4>
              <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
                This action does not run real tests. No execution results have
                been recorded. Connect a test runner to report observed outcomes.
              </p>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
