export type ViewId =
  | 'overview'
  | 'code-changes'
  | 'impact-analysis'
  | 'simulation'
  | 'test-results'
  | 'decision-receipt';

export type EdgeStatus = 'impacted' | 'unaffected' | 'untested';

export type NodeCategory =
  | 'function'
  | 'endpoint'
  | 'component'
  | 'test'
  | 'journey';

export interface GraphNode {
  id: string;
  label: string;
  category: NodeCategory;
  x: number;
  y: number;
  status: EdgeStatus;
  detail: string;
  file?: string;
}

export interface GraphEdge {
  from: string;
  to: string;
  status: EdgeStatus;
  label?: string;
}

export interface DiffLine {
  kind: 'context' | 'added' | 'removed';
  oldNo?: number;
  newNo?: number;
  text: string;
}

export interface ContractField {
  field: string;
  before: string;
  after: string;
  breaking: boolean;
}

export interface PRScenario {
  id: string;
  number: number;
  title: string;
  file: string;
  description: string;
  diff: DiffLine[];
  contract: ContractField[];
  impactSummary: ImpactSummary;
  graph: { nodes: GraphNode[]; edges: GraphEdge[] };
  repairOptions: RepairOption[];
  tests: TestCase[];
  risks: RiskItem[];
}

export interface ImpactSummary {
  affectedJourneys: string[];
  mappedCoverage: number | null;
  uncoveredComponents: string[];
}

export interface RepairOption {
  id: string;
  label: string;
  tagline: string;
  tradeoffs: { pros: string[]; cons: string[] };
  effort: 'Low' | 'Medium' | 'High';
  riskLevel: 'Low' | 'Medium' | 'High';
  recommended: boolean;
  predictedOutcome: string;
}

export type TestStatus = 'pass' | 'fail' | 'unverified';

export interface TestCase {
  id: string;
  name: string;
  status: TestStatus;
  duration: number; // ms, 0 when unverified
  coverage: number; // percent
  kind: string;
}

export interface RiskItem {
  id: string;
  description: string;
  severity: 'low' | 'medium' | 'high';
  mitigation: string;
}
