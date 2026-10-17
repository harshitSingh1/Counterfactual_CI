
import { useEffect, useState } from 'react';
import type { RepairOption } from '@/types';
import {
  fetchCounterfactual,
  type CounterfactualAnalysis,
} from '@/lib/api';
import { Panel, PanelHeader, Badge } from '@/components/ui';
import {
  FlaskConical,
  Check,
  X,
  Star,
  GitMerge,
  Wrench,
  Users,
  Flag,
  AlertTriangle,
  LoaderCircle,
} from 'lucide-react';

const ICONS: Record<string, typeof Wrench> = {
  adapter: GitMerge,
  'update-frontend': Users,
  'feature-flag': Flag,
};

const EFFORT_TONE = { Low: 'ok', Medium: 'warn', High: 'bad' } as const;
const RISK_TONE = { Low: 'ok', Medium: 'warn', High: 'bad' } as const;

interface ContractModel {
  status: string;
  assumed_target_contract: string;
  resolved_recorded_mismatch_count: number;
  resolved_recorded_mismatches: Array<{
    id: string;
    name: string;
    labels: string[];
    file?: string | null;
    expects?: string | null;
  }>;
  remaining_recorded_mismatch_count: number;
  remaining_recorded_mismatches: Array<{
    id: string;
    name: string;
    labels: string[];
    file?: string | null;
    expects?: string | null;
  }>;
  note: string;
}

type ExtendedCounterfactual = CounterfactualAnalysis & {
  baseline: CounterfactualAnalysis['baseline'] & {
    recorded_contract_node_count?: number;
    recorded_contract_mismatch_count?: number;
  };
  counterfactual: CounterfactualAnalysis['counterfactual'] & {
    contract_model?: ContractModel;
  };
};

interface SimulationPanelProps {
  options: RepairOption[];
  live?: boolean;
}

export function SimulationPanel({
  options,
  live = false,
}: SimulationPanelProps) {
  const [selected, setSelected] = useState<string | null>(
    options.find((option) => option.recommended)?.id ?? options[0]?.id ?? null,
  );
  const [counterfactual, setCounterfactual] =
    useState<CounterfactualAnalysis | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = options.find((option) => option.id === selected) ?? options[0];

  useEffect(() => {
    if (!live || !selected) {
      setCounterfactual(null);
      setLoading(false);
      setError(null);
      return;
    }

    let cancelled = false;

    async function loadCounterfactual() {
      setLoading(true);
      setError(null);
      setCounterfactual(null);

      try {
        const result = await fetchCounterfactual(101, selected!);

        if (!cancelled) {
          setCounterfactual(result);
        }
      } catch (err) {
        if (!cancelled) {
          setError(
            err instanceof Error
              ? err.message
              : 'Could not load the counterfactual assessment.',
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void loadCounterfactual();

    return () => {
      cancelled = true;
    };
  }, [live, selected]);

  const liveAssessment =
    live && counterfactual?.repair === selected
      ? (counterfactual as ExtendedCounterfactual)
      : null;

  const contractModel = liveAssessment?.counterfactual.contract_model;

  return (
    <div className="space-y-4">
      <Panel className="border-amber-500/20 bg-amber-500/5">
        <div className="flex items-start gap-3 p-4">
          <FlaskConical size={18} className="mt-0.5 shrink-0 text-amber-400" />
          <div>
            <h3 className="text-sm font-semibold text-amber-200">
              Counterfactual Simulation
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
              Compare possible repair strategies and their trade-offs. A
              counterfactual is a hypothesis, not a verified result. This panel
              does not apply repairs or execute automated tests.
            </p>
          </div>
        </div>
      </Panel>

      {live && (
        <Panel className="border-violet-500/20 bg-violet-500/5">
          <div className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone="ok">Live FalkorDB context</Badge>
              <Badge tone="warn">Hypothesis · unverified</Badge>
            </div>

            <h3 className="text-sm font-semibold text-slate-100">
              Counterfactual assessment
            </h3>

            {loading && (
              <div className="flex items-center gap-2 text-sm text-slate-300">
                <LoaderCircle size={15} className="animate-spin" />
                Loading assessment for the selected repair…
              </div>
            )}

            {error && (
              <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
                <p className="text-sm text-red-300">
                  Could not load the counterfactual assessment.
                </p>
                <p className="mt-1 text-xs text-slate-400">{error}</p>
              </div>
            )}

            {liveAssessment && (
              <>
                <p className="text-sm font-medium text-slate-100">
                  {liveAssessment.repair_label}
                </p>

                <p className="text-sm leading-relaxed text-slate-300">
                  {liveAssessment.counterfactual.hypothesis}
                </p>

                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-base-700/70 bg-base-900/50 p-3">
                    <p className="text-xl font-semibold text-slate-100">
                      {liveAssessment.baseline.affected_node_count}
                    </p>
                    <p className="text-xs text-slate-400">Baseline nodes</p>
                  </div>
                  <div className="rounded-lg border border-base-700/70 bg-base-900/50 p-3">
                    <p className="text-xl font-semibold text-slate-100">
                      {liveAssessment.baseline.affected_journey_count}
                    </p>
                    <p className="text-xs text-slate-400">Journeys</p>
                  </div>
                  <div className="rounded-lg border border-base-700/70 bg-base-900/50 p-3">
                    <p className="text-xl font-semibold text-slate-100">
                      {liveAssessment.baseline.affected_test_count}
                    </p>
                    <p className="text-xs text-slate-400">Tests selected</p>
                  </div>
                </div>

                <div className="rounded-lg border border-base-700/70 bg-base-900/50 p-3">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    Compatibility assessment
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">
                    {liveAssessment.counterfactual.compatibility_assessment}
                  </p>
                </div>

                {contractModel ? (
                  <div className="rounded-lg border border-violet-500/25 bg-violet-500/5 p-3">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-xs font-semibold uppercase tracking-wider text-violet-200">
                        Contract compatibility model
                      </p>
                      <Badge tone="warn">Assumption-based</Badge>
                    </div>

                    <p className="mt-1 text-xs leading-relaxed text-slate-400">
                      Compares recorded consumer expectations against the
                      selected repair hypothesis. These counts do not measure
                      passed tests or fixed user journeys.
                    </p>

                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <div className="rounded-lg border border-base-700/70 bg-base-900/50 p-3">
                        <p className="text-xl font-semibold text-slate-100">
                          {liveAssessment.baseline.recorded_contract_mismatch_count ?? '—'}
                        </p>
                        <p className="text-xs text-slate-400">
                          Recorded mismatches
                        </p>
                      </div>

                      <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/5 p-3">
                        <p className="text-xl font-semibold text-emerald-300">
                          {contractModel.resolved_recorded_mismatch_count}
                        </p>
                        <p className="text-xs text-slate-400">
                          Modeled resolved
                        </p>
                      </div>

                      <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                        <p className="text-xl font-semibold text-amber-300">
                          {contractModel.remaining_recorded_mismatch_count}
                        </p>
                        <p className="text-xs text-slate-400">
                          Modeled remaining
                        </p>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-400">
                      Assumed contract:{' '}
                      <span className="font-medium text-slate-200">
                        {contractModel.assumed_target_contract}
                      </span>
                    </p>

                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      {contractModel.note}
                    </p>

                    {contractModel.resolved_recorded_mismatches.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-emerald-300">
                          Recorded expectations addressed by this model
                        </p>
                        <ul className="mt-2 space-y-2">
                          {contractModel.resolved_recorded_mismatches.map(
                            (node) => (
                              <li
                                key={node.id}
                                className="flex items-start gap-2 text-xs text-slate-300"
                              >
                                <Check
                                  size={13}
                                  className="mt-0.5 shrink-0 text-emerald-400"
                                />
                                <span>
                                  <span className="font-medium">{node.name}</span>
                                  {node.file && (
                                    <span className="block text-slate-500">
                                      {node.file}
                                    </span>
                                  )}
                                </span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}

                    {contractModel.remaining_recorded_mismatches.length > 0 && (
                      <div className="mt-3">
                        <p className="text-xs font-semibold text-amber-300">
                          Remaining recorded expectations
                        </p>
                        <ul className="mt-2 space-y-2">
                          {contractModel.remaining_recorded_mismatches.map(
                            (node) => (
                              <li
                                key={node.id}
                                className="flex items-start gap-2 text-xs text-slate-300"
                              >
                                <AlertTriangle
                                  size={13}
                                  className="mt-0.5 shrink-0 text-amber-400"
                                />
                                <span>
                                  <span className="font-medium">{node.name}</span>
                                  {node.file && (
                                    <span className="block text-slate-500">
                                      {node.file}
                                    </span>
                                  )}
                                </span>
                              </li>
                            ),
                          )}
                        </ul>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                    <p className="text-xs text-amber-200">
                      The backend response does not include contract-model
                      details. Restart or update the backend if needed.
                    </p>
                  </div>
                )}

                <div className="rounded-lg border border-amber-500/20 bg-amber-500/5 p-3">
                  <p className="text-xs font-semibold text-amber-200">
                    Dependency impact reduction: not calculated
                  </p>
                  <p className="mt-1 text-xs leading-relaxed text-amber-200/70">
                    {liveAssessment.counterfactual.reason}
                  </p>
                </div>

                <div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-200">
                    Evidence gaps
                  </p>
                  <ul className="mt-2 space-y-2">
                    {liveAssessment.evidence_gaps.map((gap, index) => (
                      <li
                        key={`${selected}-${index}`}
                        className="flex items-start gap-2 text-xs leading-relaxed text-slate-400"
                      >
                        <AlertTriangle
                          size={13}
                          className="mt-0.5 shrink-0 text-amber-400"
                        />
                        {gap}
                      </li>
                    ))}
                  </ul>
                </div>
              </>
            )}
          </div>
        </Panel>
      )}

      <div className="grid gap-4 lg:grid-cols-3">
        {options.map((option) => {
          const Icon = ICONS[option.id] ?? Wrench;
          const isActive = option.id === selected;

          return (
            <button
              key={option.id}
              onClick={() => setSelected(option.id)}
              className={`group relative overflow-hidden rounded-xl border p-4 text-left transition-all ${
                isActive
                  ? 'border-violet-500/50 bg-violet-500/5 glow-violet'
                  : 'border-base-700/70 bg-base-850/60 hover:border-base-600 hover:bg-base-800'
              }`}
            >
              {option.recommended && (
                <div className="absolute right-3 top-3">
                  <Badge tone="violet">
                    <Star size={10} /> Recommended
                  </Badge>
                </div>
              )}

              <div
                className={`flex h-9 w-9 items-center justify-center rounded-lg ${
                  isActive
                    ? 'bg-violet-500/15 text-violet-300'
                    : 'bg-base-800 text-slate-400'
                }`}
              >
                <Icon size={17} />
              </div>

              <h4 className="mt-3 text-sm font-semibold text-slate-100">
                {option.label}
              </h4>
              <p className="mt-1 text-xs text-slate-400">{option.tagline}</p>

              <div className="mt-3 flex flex-wrap gap-2">
                <Badge tone={EFFORT_TONE[option.effort]}>
                  Effort: {option.effort}
                </Badge>
                <Badge tone={RISK_TONE[option.riskLevel]}>
                  Risk: {option.riskLevel}
                </Badge>
              </div>
            </button>
          );
        })}
      </div>

      {active && (
        <Panel className="animate-fade-in">
          <PanelHeader
            title={active.label}
            subtitle={active.tagline}
            icon={<Wrench size={16} />}
            right={
              active.recommended ? (
                <Badge tone="violet">
                  <Star size={10} /> Recommended
                </Badge>
              ) : undefined
            }
          />

          <div className="grid gap-px bg-base-700/40 md:grid-cols-2">
            <div className="bg-base-850/60 p-4">
              <div className="flex items-center gap-2 text-emerald-400">
                <Check size={15} />
                <h4 className="text-xs font-semibold uppercase tracking-wider">
                  Advantages
                </h4>
              </div>

              <ul className="mt-3 space-y-2">
                {active.tradeoffs.pros.map((pro, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-emerald-400" />
                    {pro}
                  </li>
                ))}
              </ul>
            </div>

            <div className="bg-base-850/60 p-4">
              <div className="flex items-center gap-2 text-red-400">
                <X size={15} />
                <h4 className="text-xs font-semibold uppercase tracking-wider">
                  Trade-offs
                </h4>
              </div>

              <ul className="mt-3 space-y-2">
                {active.tradeoffs.cons.map((con, index) => (
                  <li
                    key={index}
                    className="flex items-start gap-2 text-sm text-slate-300"
                  >
                    <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-red-400" />
                    {con}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="border-t border-base-700/70 bg-amber-500/5 p-4">
            <div className="flex items-start gap-2.5">
              <AlertTriangle
                size={15}
                className="mt-0.5 shrink-0 text-amber-400"
              />
              <div>
                <h4 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
                  Hypothesized Outcome
                </h4>
                <p className="mt-1.5 text-sm leading-relaxed text-slate-300">
                  {active.predictedOutcome}
                </p>
                <p className="mt-2 text-xs text-amber-200/60">
                  {live
                    ? 'The selected repair assessment comes from the backend hypothesis endpoint. It has not been implemented, the graph has not been recalculated, and tests have not been executed.'
                    : 'This outcome comes from the selected demo scenario and has not been verified by executing the proposed repair and tests.'}
                </p>
              </div>
            </div>
          </div>
        </Panel>
      )}
    </div>
  );
}
