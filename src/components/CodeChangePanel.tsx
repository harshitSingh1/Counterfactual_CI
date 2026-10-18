
import { useState } from 'react';
import type { PRScenario } from '@/types';
import { Panel, PanelHeader, Badge } from '@/components/ui';
import { FileCode2, AlertTriangle, ArrowRight, Loader2, Search, CheckCircle2 } from 'lucide-react';
import {
  analyzeGitDiff,
  analyzeDiffImpact,
  type DiffAnalysisResult,
  type DiffImpactResult,
} from '@/lib/api';

export function CodeChangePanel({
  scenario,
  compact = false,
}: {
  scenario: PRScenario;
  compact?: boolean;
}) {
  const isAuthRefactor = scenario.number === 101;
  const breakingCount = scenario.contract.filter((c) => c.breaking).length;

  const [diffInput, setDiffInput] = useState('');
  const [result, setResult] = useState<DiffAnalysisResult | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [impactResult, setImpactResult] = useState<DiffImpactResult | null>(null);
const [impactError, setImpactError] = useState('');
const [impactLoading, setImpactLoading] = useState(false);

  async function handleAnalyzeDiff() {
    setError('');
    setResult(null);

    if (!diffInput.trim()) {
      setError('Paste a unified Git diff before running analysis.');
      return;
    }

    setLoading(true);
    try {
      const response = await analyzeGitDiff(diffInput);
      setResult(response);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Could not analyze this diff. Check that the backend is running.',
      );
    } finally {
      setLoading(false);
    }
  }

  async function handleTraceImpact() {
    setImpactError('');
    setImpactResult(null);
    if (!diffInput.trim()) {
      setImpactError('Paste a unified Git diff before tracing graph impact.');
      return;
    }
    setImpactLoading(true);
    try {
      const response = await analyzeDiffImpact(diffInput);
      setImpactResult(response);
    } catch (err) {
      setImpactError(
        err instanceof Error
          ? err.message
          : 'Could not trace graph impact. Check the backend and FalkorDB connection.',
      );
    } finally {
      setImpactLoading(false);
    }
  }

  const sampleDiff = `diff --git a/app.py b/app.py
--- a/app.py
+++ b/app.py
@@ -1,2 +1,3 @@
-def old_function():
-    return False
+def new_function():
+    return True
+`;

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
                  <div className="mt-1 font-mono text-xs text-slate-200">verify_token()</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Previous contract</div>
                  <div className="mt-1 font-mono text-xs text-slate-200">user_id</div>
                </div>
                <div>
                  <div className="text-[10px] text-slate-500">Proposed contract</div>
                  <div className="mt-1 font-mono text-xs text-slate-200">sub</div>
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

      <Panel>
        <div className="border-b border-base-700/70 px-3 py-3">
          <div className="flex items-center gap-2">
            <Search size={15} className="text-violet-300" />
            <h3 className="text-sm font-semibold text-slate-100">Analyze a Real Git Diff</h3>
          </div>
          <p className="mt-1 text-xs leading-relaxed text-slate-400">
            Paste a unified diff from Git to inspect changed files, line counts,
            and likely declarations. This analysis is static and does not run
            your code or tests.
          </p>
        </div>

        <div className="space-y-3 p-3">
          <textarea
            value={diffInput}
            onChange={(event) => setDiffInput(event.target.value)}
            placeholder={'Paste output from git diff here...\n\nExample:\n+++ b/src/example.ts\n@@ -1 +1 @@\n-oldValue\n+newValue'}
            spellCheck={false}
            className="min-h-44 w-full resize-y rounded-lg border border-base-700 bg-base-900/70 p-3 font-mono text-xs leading-relaxed text-slate-200 outline-none placeholder:text-slate-600 focus:border-violet-500/60"
            aria-label="Paste unified Git diff"
          />

          <div className="flex flex-wrap items-center justify-between gap-2">
            <span className="text-[11px] text-slate-500">
              {diffInput.length.toLocaleString()} / 200,000 characters
            </span>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() => {
                  setDiffInput(sampleDiff);
                  setResult(null);
                  setError('');
                }}
                className="rounded-lg border border-base-700 px-3 py-2 text-xs text-slate-300 transition hover:bg-base-800"
              >
                Load sample
              </button>
              <button
                type="button"
                onClick={handleAnalyzeDiff}
                disabled={loading || !diffInput.trim() || diffInput.length > 200_000}
                className="inline-flex items-center gap-2 rounded-lg bg-violet-600 px-3 py-2 text-xs font-semibold text-white transition hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {loading ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
                {loading ? 'Analyzing…' : 'Analyze diff'}
              </button>
<button
  type="button"
  onClick={handleTraceImpact}
  disabled={impactLoading || !diffInput.trim() || diffInput.length > 200_000}
  className="inline-flex items-center gap-2 rounded-lg border border-violet-500/40 bg-violet-500/10 px-3 py-2 text-xs font-semibold text-violet-200 transition hover:bg-violet-500/20 disabled:cursor-not-allowed disabled:opacity-50"
>
  {impactLoading ? (
    <Loader2 size={14} className="animate-spin" />
  ) : (
    <Search size={14} />
  )}
  {impactLoading ? 'Tracing graph…' : 'Trace Impact Through FalkorDB'}
</button>

            </div>
          </div>

          {error && (
            <div role="alert" className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300">
              {error}
            </div>
          )}

          {result && (
            <div className="space-y-3 border-t border-base-700/70 pt-3">
              <div className="flex items-center gap-2 text-sm font-semibold text-emerald-300">
                <CheckCircle2 size={16} />
                Diff parsed successfully
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[
                  { label: 'Files changed', value: result.analysis.summary.files_changed },
                  { label: 'Additions', value: result.analysis.summary.additions },
                  { label: 'Deletions', value: result.analysis.summary.deletions },
                ].map((item) => (
                  <div key={item.label} className="rounded-lg border border-base-700/70 bg-base-900/40 p-3">
                    <div className="text-[10px] text-slate-500">{item.label}</div>
                    <div className="mt-1 text-xl font-semibold tabular-nums text-slate-100">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-200">Changed files</h4>
                {result.analysis.files.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No safe file paths were found in this diff.
                  </p>
                ) : (
                  result.analysis.files.map((file) => (
                    <div key={file.path} className="rounded-lg border border-base-700/70 p-3">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="break-all font-mono text-xs text-slate-200">{file.path}</span>
                        <span className="text-[11px]">
                          <span className="text-emerald-300">+{file.additions}</span>
                          {' / '}
                          <span className="text-red-300">−{file.deletions}</span>
                        </span>
                      </div>

                      {file.changed_symbols.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {file.changed_symbols.map((symbol) => (
                            <Badge key={symbol} tone="neutral">{symbol}</Badge>
                          ))}
                        </div>
                      ) : (
                        <p className="mt-2 text-[11px] text-slate-500">
                          No likely declaration detected in added lines.
                        </p>
                      )}

                      <p className="mt-2 text-[11px] leading-relaxed text-slate-500">
                        {file.analysis_note}
                      </p>
                    </div>
                  ))
                )}
              </div>

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <h4 className="text-xs font-semibold text-amber-300">Analysis limitations</h4>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-slate-400">
                  {result.analysis.limitations.map((limitation) => (
                    <li key={limitation}>{limitation}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}
          {impactError && (
            <div
              role="alert"
              className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-xs text-red-300"
            >
              {impactError}
            </div>
          )}

          {impactResult && (
            <div className="space-y-3 border-t border-base-700/70 pt-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-violet-200">
                  <CheckCircle2 size={16} />
                  FalkorDB impact trace completed
                </div>
                <Badge tone="neutral">{impactResult.graph}</Badge>
              </div>

              <p className="text-[11px] leading-relaxed text-slate-400">
                These are potential impacts inferred from recorded graph
                relationships, not confirmed failures.
              </p>

              <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
                {[
                  {
                    label: 'Matched sources',
                    value: impactResult.evidence_summary.matched_source_count,
                  },
                  {
                    label: 'Impacted nodes',
                    value: impactResult.evidence_summary.impacted_node_count,
                  },
                  {
                    label: 'Suggested tests',
                    value: impactResult.evidence_summary.recommended_test_count,
                  },
                  {
                    label: 'Unmatched files',
                    value: impactResult.evidence_summary.unmatched_file_count,
                  },
                ].map((item) => (
                  <div
                    key={item.label}
                    className="rounded-lg border border-base-700/70 bg-base-900/40 p-3"
                  >
                    <div className="text-[10px] text-slate-500">
                      {item.label}
                    </div>
                    <div className="mt-1 text-xl font-semibold tabular-nums text-slate-100">
                      {item.value}
                    </div>
                  </div>
                ))}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-200">
                  Matched graph sources
                </h4>
                {impactResult.matched_sources.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No changed files or symbols matched a recorded graph node.
                    This does not prove there are no dependencies.
                  </p>
                ) : (
                  impactResult.matched_sources.map((source, index) => (
                    <div
                      key={`${source.id}-${source.changed_file}-${index}`}
                      className="rounded-lg border border-base-700/70 p-3"
                    >
                      <div className="font-mono text-xs text-slate-200">
                        {source.name || source.id}
                      </div>
                      <div className="mt-1 break-all text-[11px] text-slate-400">
                        {source.changed_file}
                      </div>
                      <div className="mt-1 text-[11px] text-violet-300">
                        Match: {source.match_reason}
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-200">
                  Potentially impacted nodes
                </h4>
                {impactResult.impacted_nodes.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No downstream nodes were found through recorded outgoing
                    relationships.
                  </p>
                ) : (
                  impactResult.impacted_nodes.map((node) => (
                    <div
                      key={node.id}
                      className="rounded-lg border border-base-700/70 p-3"
                    >
                      <div className="font-mono text-xs text-slate-200">
                        {node.name || node.id}
                      </div>
                      <div className="mt-1 text-[11px] text-slate-400">
                        {(node.labels || []).join(', ')} · {node.layer}
                      </div>
                      {node.file && (
                        <div className="mt-1 break-all text-[11px] text-slate-500">
                          {node.file}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <h4 className="text-xs font-semibold text-slate-200">
                  Recommended tests
                </h4>
                {impactResult.recommended_tests.length === 0 ? (
                  <p className="text-xs text-slate-400">
                    No test nodes were reachable from the matched sources in
                    the current graph.
                  </p>
                ) : (
                  impactResult.recommended_tests.map((test) => (
                    <div
                      key={test.id}
                      className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3"
                    >
                      <div className="font-mono text-xs text-emerald-200">
                        {test.name || test.id}
                      </div>
                      {test.file && (
                        <div className="mt-1 break-all text-[11px] text-slate-400">
                          {test.file}
                        </div>
                      )}
                      <div className="mt-2 text-[11px] leading-relaxed text-slate-400">
                        Evidence relationships:{' '}
                        <span className="font-mono text-slate-300">
                          {test.evidence_relationships.join(' → ')}
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-slate-500">
                        {test.reason} Tests have not been executed.
                      </p>
                    </div>
                  ))
                )}
              </div>

              {impactResult.evidence_paths.length > 0 && (
                <details className="rounded-lg border border-base-700/70 p-3">
                  <summary className="cursor-pointer text-xs font-semibold text-slate-200">
                    Inspect graph evidence paths (
                    {impactResult.evidence_paths.length})
                  </summary>
                  <div className="mt-3 space-y-2">
                    {impactResult.evidence_paths.map((path, index) => (
                      <div
                        key={`${path.matched_source}-${index}`}
                        className="rounded-lg bg-base-900/60 p-3"
                      >
                        <div className="break-all text-[11px] text-slate-400">
                          Changed file: {path.changed_file}
                        </div>
                        <div className="mt-2 flex flex-wrap items-center gap-1">
                          {path.nodes.map((node, nodeIndex) => (
                            <span key={`${node.id}-${nodeIndex}`} className="contents">
                              {nodeIndex > 0 && (
                                <ArrowRight
                                  size={12}
                                  className="shrink-0 text-violet-300"
                                />
                              )}
                              <span className="rounded border border-base-700 px-2 py-1 font-mono text-[10px] text-slate-300">
                                {node.name || node.id}
                              </span>
                            </span>
                          ))}
                        </div>
                        <div className="mt-2 font-mono text-[10px] text-violet-300">
                          {path.relationships.join(' → ')}
                        </div>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {impactResult.unmatched_files.length > 0 && (
                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <h4 className="text-xs font-semibold text-amber-300">
                    Files not matched in the graph
                  </h4>
                  <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] text-slate-400">
                    {impactResult.unmatched_files.map((file) => (
                      <li key={file} className="break-all font-mono">
                        {file}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                <h4 className="text-xs font-semibold text-amber-300">
                  Evidence limitations
                </h4>
                <ul className="mt-2 list-disc space-y-1 pl-4 text-[11px] leading-relaxed text-slate-400">
                  {impactResult.limitations.map((limitation) => (
                    <li key={limitation}>{limitation}</li>
                  ))}
                </ul>
              </div>
            </div>
          )}

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
                    <td className={`whitespace-pre px-2 py-0.5 ${text}`}>{line.text}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Panel>

      {compact ? (
        <Panel>
          <div className="border-b border-base-700/80 px-3 py-2.5">
            <h3 className="text-sm font-semibold text-slate-100">Example Contract Comparison</h3>
            <p className="mt-1 text-[11px] text-amber-300">
              Scenario data · verdicts have not been independently verified
            </p>
          </div>
          <div className="grid grid-cols-2 divide-x divide-base-700/80">
            <div className="bg-red-500/5 p-3">
              <div className="text-[10px] font-medium uppercase tracking-wider text-red-300">Before</div>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">
                {scenario.contract.slice(0, 3).map((item) => `${item.field}: ${item.before}`).join('\n')}
              </pre>
            </div>
            <div className="bg-emerald-500/5 p-3">
              <div className="text-[10px] font-medium uppercase tracking-wider text-emerald-300">After</div>
              <pre className="mt-2 whitespace-pre-wrap font-mono text-[11px] leading-relaxed text-slate-300">
                {scenario.contract.slice(0, 3).map((item) => `${item.field}: ${item.after}`).join('\n')}
              </pre>
            </div>
          </div>
        </Panel>
      ) : (
        <Panel>
          <div className="border-b border-base-700/70 px-3 py-2.5">
            <h3 className="text-sm font-semibold text-slate-100">Example Contract Comparison</h3>
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
                className={`flex flex-col gap-2 px-4 py-3 sm:flex-row sm:items-center ${c.breaking ? 'bg-red-500/5' : ''}`}
              >
                <div className="flex w-full items-center gap-2 sm:w-64">
                  {c.breaking ? (
                    <AlertTriangle size={14} className="shrink-0 text-amber-400" />
                  ) : (
                    <span className="h-3.5 w-3.5 shrink-0 rounded-full border border-slate-500/50" />
                  )}
                  <span className="font-mono text-xs text-slate-300">{c.field}</span>
                </div>
                <div className="flex flex-1 items-center gap-2 font-mono text-xs">
                  <span className="text-slate-400">{c.before}</span>
                  <ArrowRight size={12} className="shrink-0 text-slate-600" />
                  <span className="text-slate-200">{c.after}</span>
                </div>
                <div className="sm:w-36 sm:text-right">
                  <Badge tone="neutral">
                    {c.breaking ? 'Breaking · illustrative' : 'Safe · illustrative'}
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
            tests have not been executed by this diff analyzer.
          </p>
        </div>
      </Panel>
    </div>
  );
}
