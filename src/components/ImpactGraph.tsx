import { useState, useRef, useMemo } from 'react';
import type { GraphNode, GraphEdge, EdgeStatus, NodeCategory } from '@/types';
import { Panel, Badge } from '@/components/ui';
import {
  FunctionSquare,
  Radio,
  Component,
  FlaskConical,
  Route,
  Info,
} from 'lucide-react';

const STATUS_COLORS: Record<EdgeStatus, string> = {
  impacted: '#ef4444',
  unaffected: '#22c55e',
  untested: '#f59e0b',
};

const CATEGORY_META: Record<
  NodeCategory,
  { color: string; ring: string; Icon: typeof FunctionSquare }
> = {
  function: { color: '#8b5cf6', ring: 'ring-violet-500/40', Icon: FunctionSquare },
  endpoint: { color: '#38bdf8', ring: 'ring-sky-500/40', Icon: Radio },
  component: { color: '#e2e8f0', ring: 'ring-slate-400/40', Icon: Component },
  test: { color: '#22c55e', ring: 'ring-emerald-500/40', Icon: FlaskConical },
  journey: { color: '#f59e0b', ring: 'ring-amber-500/40', Icon: Route },
};

export function ImpactGraph({
  nodes,
  edges,
  showInspector = true,
}: {
  nodes: GraphNode[];
  edges: GraphEdge[];
  showInspector?: boolean;
}) {
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);

  const nodeMap = useMemo(() => {
    const m = new Map<string, GraphNode>();
    nodes.forEach((n) => m.set(n.id, n));
    return m;
  }, [nodes]);

  const selected = selectedId ? nodeMap.get(selectedId) ?? null : null;
  const focusedId = hoverId ?? selectedId;
  const connectedIds = useMemo(() => {
    if (!focusedId) return null;
    const s = new Set<string>([focusedId]);
    edges.forEach((e) => {
      if (e.from === focusedId) s.add(e.to);
      if (e.to === focusedId) s.add(e.from);
    });
    return s;
  }, [focusedId, edges]);

  const bounds = useMemo(() => {
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    return {
      minX: Math.min(...xs) - 80,
      minY: Math.min(...ys) - 60,
      maxX: Math.max(...xs) + 80,
      maxY: Math.max(...ys) + 60,
    };
  }, [nodes]);

  const width = bounds.maxX - bounds.minX;
  const height = bounds.maxY - bounds.minY;

  return (
    <Panel className="overflow-hidden">
      <div className="flex items-center justify-between border-b border-base-700/70 px-3 py-2.5">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-100">Dependency Trace Graph</h3>
            <span className="border border-violet-400/30 bg-violet-500/10 px-1.5 py-0.5 text-[10px] text-violet-300">Demo graph</span>
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">Static relationship preview · {nodes.length} nodes · {edges.length} edges</p>
        </div>
        <div className="flex items-center gap-2">
          {selectedId && <button onClick={() => setSelectedId(null)} className="text-[10px] text-slate-500 hover:text-slate-200">Reset</button>}
          <Legend />
        </div>
      </div>

      <div className={showInspector ? 'grid gap-0 lg:grid-cols-[1fr_280px]' : ''}>
        <div className="relative overflow-x-auto bg-base-950/40">
          <svg
            ref={svgRef}
            viewBox={`${bounds.minX} ${bounds.minY} ${width} ${height}`}
            className="block h-[460px] w-full min-w-[640px]"
          >
            {/* Edges */}
            {edges.map((edge, i) => {
              const a = nodeMap.get(edge.from)!;
              const b = nodeMap.get(edge.to)!;
              const dim = connectedIds && !connectedIds.has(edge.from) && !connectedIds.has(edge.to);
              const color = STATUS_COLORS[edge.status];
              return (
                <g key={i} opacity={dim ? 0.18 : 1}>
                  <line
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    stroke={color}
                    strokeWidth={edge.status === 'impacted' ? 2.2 : 1.6}
                    className={edge.status === 'impacted' ? 'edge-impacted' : ''}
                    strokeOpacity={0.7}
                  />
                  {edge.label && (
                    <text
                      x={(a.x + b.x) / 2}
                      y={(a.y + b.y) / 2 - 4}
                      textAnchor="middle"
                      className="font-mono"
                      fontSize={10}
                      fill={color}
                      opacity={0.85}
                    >
                      {edge.label}
                    </text>
                  )}
                </g>
              );
            })}

            {/* Nodes */}
            {nodes.map((node) => {
              const meta = CATEGORY_META[node.category];
              const isSelected = node.id === selectedId;
              const isDim = connectedIds ? !connectedIds.has(node.id) : false;
              return (
                <g
                  key={node.id}
                  transform={`translate(${node.x}, ${node.y})`}
                  className="cursor-pointer"
                  opacity={isDim ? 0.35 : 1}
                  onMouseEnter={() => setHoverId(node.id)}
                  onMouseLeave={() => setHoverId(null)}
                  onClick={() => setSelectedId(node.id)}
                >
                  {isSelected && (
                    <circle r={30} fill="none" stroke={meta.color} strokeWidth={1.5} opacity={0.5}>
                      <animate attributeName="r" values="26;32;26" dur="2s" repeatCount="indefinite" />
                    </circle>
                  )}
                  <circle
                    r={20}
                    fill="#0b1222"
                    stroke={meta.color}
                    strokeWidth={isSelected ? 2.5 : 1.6}
                  />
                  <foreignObject x={-9} y={-9} width={18} height={18}>
                    <div style={{ color: meta.color, display: 'flex', justifyContent: 'center' }}>
                      <meta.Icon size={16} strokeWidth={2.2} />
                    </div>
                  </foreignObject>
                  <text
                    y={34}
                    textAnchor="middle"
                    fontSize={11}
                    fontWeight={500}
                    fill="#cbd5e1"
                    className="font-mono"
                  >
                    {node.label}
                  </text>
                  <text
                    y={48}
                    textAnchor="middle"
                    fontSize={9}
                    fill={STATUS_COLORS[node.status]}
                    opacity={0.8}
                  >
                    {node.status}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {showInspector && (
          <div className="border-t border-base-700/70 p-4 lg:border-l lg:border-t-0">
            {selected ? (
              <NodeDetail node={selected} />
            ) : (
              <div className="flex h-full flex-col items-center justify-center py-8 text-center">
                <Info size={22} className="text-slate-600" />
                <p className="mt-3 text-sm text-slate-400">Select a node to inspect its details.</p>
                <p className="mt-1 text-xs text-slate-600">Hovering highlights connected traces.</p>
              </div>
            )}
          </div>
        )}
      </div>
    </Panel>
  );
}

function Legend() {
  const items: { label: string; color: string }[] = [
    { label: 'Impacted', color: STATUS_COLORS.impacted },
    { label: 'Unaffected', color: STATUS_COLORS.unaffected },
    { label: 'Untested', color: STATUS_COLORS.untested },
  ];
  return (
    <div className="flex flex-wrap items-center gap-3">
      {items.map((it) => (
        <div key={it.label} className="flex items-center gap-1.5">
          <span className="h-2.5 w-4 rounded-full" style={{ backgroundColor: it.color }} />
          <span className="text-[11px] text-slate-400">{it.label}</span>
        </div>
      ))}
    </div>
  );
}

function NodeDetail({ node }: { node: GraphNode }) {
  const meta = CATEGORY_META[node.category];
  const Icon = meta.Icon;
  const statusTone =
    node.status === 'impacted' ? 'bad' : node.status === 'unaffected' ? 'ok' : 'warn';
  return (
    <div className="animate-fade-in">
      <div className="flex items-center gap-2">
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-800"
          style={{ color: meta.color, boxShadow: `0 0 0 1px ${meta.color}55` }}
        >
          <Icon size={16} />
        </div>
        <div>
          <div className="text-sm font-semibold text-slate-100">{node.label}</div>
          <div className="text-[10px] uppercase tracking-wider text-slate-500">
            {node.category}
          </div>
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-1.5">
        <Badge tone={statusTone}>{node.status}</Badge>
        {node.file && (
          <Badge tone="neutral" className="font-mono">
            {node.file}
          </Badge>
        )}
      </div>

      <p className="mt-3 text-sm leading-relaxed text-slate-300">{node.detail}</p>
    </div>
  );
}
