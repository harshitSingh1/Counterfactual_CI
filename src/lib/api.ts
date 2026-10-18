
import type { GraphNode, GraphEdge } from '@/types';

const API_BASE =
  import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000';

export interface BackendGraphNode {
  id: string;
  labels: string[];
  name: string;
  file?: string | null;
  layer: string;
}

export interface BackendGraphEdge {
  source: string;
  target: string;
  relationship: string;
}

export interface GraphResponse {
  graph: string;
  nodes: BackendGraphNode[];
  edges: BackendGraphEdge[];
  node_count: number;
  edge_count: number;
}

export interface ImpactAnalysis {
  pr: number;
  title: string;
  change: {
    symbol: string;
    file: string;
    from_contract: string;
    to_contract: string;
  };
  analysis_type: string;
  verified_by_tests: boolean;
  affected_node_count: number;
  affected_journey_count: number;
  affected_test_count: number;
  affected_nodes: Array<{
    id: string;
    labels: string[];
    name: string;
    file?: string | null;
    layer: string;
  }>;
  affected_journeys: Array<Record<string, unknown>>;
  affected_tests: Array<Record<string, unknown>>;
  note: string;
}

export async function fetchGraph(): Promise<GraphResponse> {
  const response = await fetch(`${API_BASE}/api/graph`);

  if (!response.ok) {
    throw new Error(`Graph request failed: HTTP ${response.status}`);
  }

  return response.json();
}

export async function fetchImpactAnalysis(
  pr = 101,
): Promise<ImpactAnalysis> {
  const response = await fetch(
    `${API_BASE}/api/analysis?pr=${encodeURIComponent(pr)}`,
  );

  if (!response.ok) {
    throw new Error(`Impact analysis failed: HTTP ${response.status}`);
  }

  return response.json();
}

function mapCategory(node: BackendGraphNode): GraphNode['category'] {
  const labels = node.labels.map((value) => value.toLowerCase());

  if (labels.includes('function')) return 'function';
  if (labels.includes('apiendpoint')) return 'endpoint';
  if (labels.includes('playwrightspec')) return 'test';
  if (labels.includes('userjourney')) return 'journey';
  if (labels.includes('uicomponent')) return 'component';

  switch (node.layer.toLowerCase()) {
    case 'backend':
      return 'function';
    case 'api':
      return 'endpoint';
    case 'test':
      return 'test';
    case 'journey':
      return 'journey';
    default:
      return 'component';
  }
}

export function mapBackendGraph(
  graph: GraphResponse,
  analysis?: ImpactAnalysis,
): { nodes: GraphNode[]; edges: GraphEdge[] } {
  const impactedIds = new Set(
    analysis?.affected_nodes.map((node) => node.id) ?? [],
  );

  const columns = 4;
  const xGap = 190;
  const yGap = 115;

  const nodes: GraphNode[] = graph.nodes.map((node, index) => {
    const isChangeSource =
      Boolean(analysis) &&
      node.id === analysis?.change.symbol.replace('()', '');

    return {
      id: node.id,
      label: node.name,
      category: mapCategory(node),
      x: 120 + (index % columns) * xGap,
      y: 100 + Math.floor(index / columns) * yGap,

      // The source symbol is separate from its downstream impact.
      // Keep existing status values so edge and node styling remain compatible.
      status: analysis
        ? impactedIds.has(node.id)
          ? 'impacted'
          : 'unaffected'
        : 'untested',

      detail: [
        isChangeSource ? 'Change source' : null,
        node.labels.join(', '),
        `${node.layer} layer`,
        node.file ?? null,
      ]
        .filter(Boolean)
        .join(' · '),

      ...(node.file ? { file: node.file } : {}),
    };
  });

  const nodeIds = new Set(nodes.map((node) => node.id));

  const edges: GraphEdge[] = graph.edges
    .filter(
      (edge) =>
        nodeIds.has(edge.source) && nodeIds.has(edge.target),
    )
    .map((edge) => ({
      from: edge.source,
      to: edge.target,
      label: edge.relationship,
      status:
        analysis &&
        impactedIds.has(edge.source) &&
        impactedIds.has(edge.target)
          ? 'impacted'
          : analysis
            ? 'unaffected'
            : 'untested',
    }));

  return { nodes, edges };
}


export interface CounterfactualAnalysis {
    pr: number;
    repair: string;
    repair_label: string;
    analysis_type: string;
    graph: string;
    graph_mutated: boolean;
    repair_applied: boolean;
    tests_executed: boolean;
    baseline: {
      affected_node_count: number;
      affected_journey_count: number;
      affected_test_count: number;
      affected_nodes: BackendGraphNode[];
      affected_journeys: BackendGraphNode[];
      affected_tests: BackendGraphNode[];
    };
    counterfactual: {
      hypothesis: string;
      compatibility_assessment: string;
      affected_node_count: number;
      affected_journey_count: number;
      affected_test_count: number;
      impact_reduction_calculated: boolean;
      reason: string;
    };
    evidence_gaps: string[];
  }
  
  export async function fetchCounterfactual(
    pr = 101,
    repair = 'adapter',
  ): Promise<CounterfactualAnalysis> {
    const params = new URLSearchParams({
      pr: String(pr),
      repair,
    });
  
    const response = await fetch(
      `${API_BASE}/api/counterfactual?${params.toString()}`,
    );
  
    if (!response.ok) {
      let message = `Counterfactual request failed: HTTP ${response.status}`;
  
      try {
        const body = await response.json();
        if (typeof body.detail === 'string') {
          message = body.detail;
        }
      } catch {
        // Keep the HTTP status message if the response isn't JSON.
      }
  
      throw new Error(message);
    }
  
    return response.json();
  }
export interface DiffAnalysisFile {
  path: string;
  status: string;
  additions: number;
  deletions: number;
  changed_symbols: string[];
  analysis_note: string;
}

export interface DiffAnalysisResult {
  status: string;
  analysis: {
    summary: {
      files_changed: number;
      additions: number;
      deletions: number;
    };
    file_types: Record<string, number>;
    files: DiffAnalysisFile[];
    limitations: string[];
  };
}

export async function analyzeGitDiff(
  diff: string,
): Promise<DiffAnalysisResult> {
  const response = await fetch(`${API_BASE}/api/analyze-diff`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ diff }),
  });

  if (!response.ok) {
    let message = `Diff analysis failed: HTTP ${response.status}`;

    try {
      const body = await response.json();
      if (typeof body.detail === 'string') {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = body.detail
          .map((item: { msg?: string }) => item.msg ?? 'Invalid request')
          .join('; ');
      }
    } catch {
      // Keep the HTTP status message if the response isn't JSON.
    }

    throw new Error(message);
  }

  return response.json();
}


export interface DiffImpactEvidencePath {
  changed_file: string;
  matched_source: string;
  nodes: Array<{
    id: string;
    name: string | null;
    file: string | null;
    labels: string[];
  }>;
  relationships: string[];
}

export interface DiffImpactResult {
  status: string;
  graph: string;
  diff_summary: {
    files_changed: number;
    additions: number;
    deletions: number;
  };
  matched_sources: Array<BackendGraphNode & {
    match_reason: string;
    changed_file: string;
  }>;
  unmatched_files: string[];
  impacted_nodes: BackendGraphNode[];
  recommended_tests: Array<{
    id: string;
    name: string | null;
    file: string | null;
    reason: string;
    evidence_relationships: string[];
    source_file: string;
  }>;
  evidence_paths: DiffImpactEvidencePath[];
  evidence_summary: {
    matched_source_count: number;
    impacted_node_count: number;
    recommended_test_count: number;
    unmatched_file_count: number;
  };
  limitations: string[];
}

export async function analyzeDiffImpact(
  diff: string,
): Promise<DiffImpactResult> {
  const response = await fetch(`${API_BASE}/api/analyze-diff-impact`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ diff }),
  });

  if (!response.ok) {
    let message = `Graph impact analysis failed: HTTP ${response.status}`;

    try {
      const body = await response.json();
      if (typeof body.detail === 'string') {
        message = body.detail;
      } else if (Array.isArray(body.detail)) {
        message = body.detail
          .map((item: { msg?: string }) => item.msg ?? 'Invalid request')
          .join('; ');
      }
    } catch {
      // Keep the HTTP status message if the response isn't JSON.
    }

    throw new Error(message);
  }

  return response.json();
}
