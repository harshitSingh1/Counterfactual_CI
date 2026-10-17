
import os

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from falkordb import FalkorDB

app = FastAPI(
    title="Counterfactual CI API",
    description="Graph-powered code change impact analysis",
    version="0.3.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

FALKORDB_HOST = os.getenv("FALKORDB_HOST", "localhost")
FALKORDB_PORT = int(os.getenv("FALKORDB_PORT", "6379"))
GRAPH_NAME = os.getenv("FALKORDB_GRAPH", "counterfactual_ci")


def get_graph():
    db = FalkorDB(host=FALKORDB_HOST, port=FALKORDB_PORT)
    return db.select_graph(GRAPH_NAME)


def run_query(query: str):
    try:
        return get_graph().query(query)
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"FalkorDB query failed: {exc}",
        ) from exc


def get_downstream_nodes():
    result = run_query("""
        MATCH (f:Function {id: 'verify_token'})
              -[:SERVES|RENDERS|COVERED_BY|VALIDATES*1..4]->(impact)
        RETURN DISTINCT labels(impact) AS labels,
               impact.id AS id,
               impact.name AS name,
               impact.file AS file,
               impact.layer AS layer,
               impact.expects AS expects
        ORDER BY id
    """)

    return [
        {
            "labels": row[0],
            "id": row[1],
            "name": row[2],
            "file": row[3],
            "layer": row[4],
            "expects": row[5],
        }
        for row in result.result_set
    ]


@app.get("/")
def root():
    return {
        "name": "Counterfactual CI",
        "status": "running",
        "docs": "/docs",
    }


@app.get("/api/health")
def health():
    try:
        result = get_graph().query("RETURN 1 AS connected")
        return {
            "api": "ok",
            "falkordb": "connected" if result.result_set else "reachable",
            "graph": GRAPH_NAME,
        }
    except Exception as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Cannot connect to FalkorDB: {exc}",
        ) from exc


@app.get("/api/graph")
def get_graph_data():
    nodes_result = run_query("""
        MATCH (n)
        RETURN labels(n) AS labels,
               n.id AS id,
               n.name AS name,
               n.file AS file,
               n.layer AS layer
        ORDER BY id
    """)

    edges_result = run_query("""
        MATCH (a)-[r]->(b)
        RETURN a.id AS source,
               type(r) AS relationship,
               b.id AS target
        ORDER BY source, target
    """)

    nodes = [
        {
            "labels": row[0],
            "id": row[1],
            "name": row[2],
            "file": row[3],
            "layer": row[4],
        }
        for row in nodes_result.result_set
    ]

    edges = [
        {
            "source": row[0],
            "relationship": row[1],
            "target": row[2],
        }
        for row in edges_result.result_set
    ]

    return {
        "graph": GRAPH_NAME,
        "node_count": len(nodes),
        "edge_count": len(edges),
        "nodes": nodes,
        "edges": edges,
    }


@app.get("/api/analysis")
def analyze_change(pr: int = 101):
    if pr != 101:
        raise HTTPException(
            status_code=404,
            detail="Demo analysis is available for PR 101 only.",
        )

    impacts = get_downstream_nodes()

    affected_journeys = [
        item for item in impacts
        if "UserJourney" in item["labels"]
    ]
    affected_tests = [
        item for item in impacts
        if "PlaywrightSpec" in item["labels"]
    ]

    return {
        "pr": pr,
        "title": "Auth Token Payload Refactor",
        "change": {
            "symbol": "verify_token()",
            "file": "backend/auth.py",
            "from_contract": "user_id",
            "to_contract": "sub",
        },
        "analysis_type": "graph-derived prediction",
        "verified_by_tests": False,
        "affected_node_count": len(impacts),
        "affected_journey_count": len(affected_journeys),
        "affected_test_count": len(affected_tests),
        "affected_nodes": impacts,
        "affected_journeys": affected_journeys,
        "affected_tests": affected_tests,
        "note": (
            "This is a prediction based on the seeded dependency graph. "
            "No source-code patch or Playwright test has been executed yet."
        ),
    }


@app.get("/api/counterfactual")
def analyze_counterfactual(
    pr: int = 101,
    repair: str = "adapter",
):
    if pr != 101:
        raise HTTPException(
            status_code=404,
            detail="Counterfactual analysis is available for PR 101 only.",
        )

    repair_descriptions = {
        "adapter": {
            "label": "Backward-Compatible Adapter",
            "hypothesis": (
                "Preserve both user_id and sub in the token payload. "
                "This may allow legacy and migrated consumers to coexist."
            ),
            "compatibility_claim": (
                "Under the assumption that the adapter emits both claims, "
                "nodes explicitly expecting user_id would retain their "
                "recorded contract. Actual runtime compatibility is unverified."
            ),
            "modeled_contract": "preserve-user_id",
        },
        "update-frontend": {
            "label": "Update Consumers",
            "hypothesis": (
                "Migrate consumers from user_id to sub and coordinate "
                "the transition with affected tests."
            ),
            "compatibility_claim": (
                "Under the assumption that every recorded consumer is "
                "successfully migrated to sub, its contract expectation "
                "would match the proposed token contract."
            ),
            "modeled_contract": "migrate-to-sub",
        },
        "feature-flag": {
            "label": "Feature Flag / Route Isolation",
            "hypothesis": (
                "Introduce a controlled rollout so the new contract can "
                "be enabled and rolled back gradually."
            ),
            "compatibility_claim": (
                "A feature flag may limit rollout exposure, but it does not "
                "by itself reconcile a user_id expectation with a sub-only "
                "payload. Runtime risk cannot be calculated from this graph."
            ),
            "modeled_contract": "unchanged",
        },
    }

    if repair not in repair_descriptions:
        raise HTTPException(
            status_code=400,
            detail=(
                "Unknown repair. Choose adapter, update-frontend, "
                "or feature-flag."
            ),
        )

    baseline_nodes = get_downstream_nodes()

    journey_nodes = [
        node for node in baseline_nodes
        if "UserJourney" in node["labels"]
    ]
    test_nodes = [
        node for node in baseline_nodes
        if "PlaywrightSpec" in node["labels"]
    ]

    # Only evaluate expectations explicitly recorded in the graph.
    contract_nodes = [
        node for node in baseline_nodes
        if node.get("expects") is not None
    ]

    baseline_mismatches = [
        node for node in contract_nodes
        if node["expects"] != "sub"
    ]

    repair_info = repair_descriptions[repair]

    if repair_info["modeled_contract"] == "preserve-user_id":
        resolved_nodes = [
            node for node in baseline_mismatches
            if node["expects"] == "user_id"
        ]
        remaining_mismatches = [
            node for node in baseline_mismatches
            if node not in resolved_nodes
        ]
        model_status = "modeled_under_adapter_assumption"
        model_note = (
            "The adapter is assumed to emit both user_id and sub. "
            "This compares recorded expectations only; it does not prove "
            "that every consumer or test works."
        )

    elif repair_info["modeled_contract"] == "migrate-to-sub":
        resolved_nodes = list(baseline_mismatches)
        remaining_mismatches = []
        model_status = "modeled_under_migration_assumption"
        model_note = (
            "All recorded mismatched expectations are assumed to be "
            "updated to sub. No files have been changed, and the graph "
            "still contains the original expectations."
        )

    else:
        resolved_nodes = []
        remaining_mismatches = list(baseline_mismatches)
        model_status = "not_resolved_by_flag_alone"
        model_note = (
            "A rollout flag does not change the recorded token contract. "
            "No runtime exposure or risk reduction is calculated."
        )

    def compact_node(node):
        return {
            "id": node["id"],
            "name": node["name"],
            "labels": node["labels"],
            "file": node["file"],
            "expects": node.get("expects"),
        }

    return {
        "pr": pr,
        "title": "Auth Token Payload Refactor",
        "repair": repair,
        "repair_label": repair_info["label"],
        "analysis_type": "read-only modeled counterfactual",
        "graph": GRAPH_NAME,
        "graph_mutated": False,
        "repair_applied": False,
        "tests_executed": False,
        "baseline": {
            "affected_node_count": len(baseline_nodes),
            "affected_journey_count": len(journey_nodes),
            "affected_test_count": len(test_nodes),
            "affected_nodes": baseline_nodes,
            "affected_journeys": journey_nodes,
            "affected_tests": test_nodes,
            "recorded_contract_node_count": len(contract_nodes),
            "recorded_contract_mismatch_count": len(baseline_mismatches),
            "recorded_contract_mismatches": [
                compact_node(node) for node in baseline_mismatches
            ],
        },
        "counterfactual": {
            "hypothesis": repair_info["hypothesis"],
            "compatibility_assessment": repair_info["compatibility_claim"],
            "affected_node_count": len(baseline_nodes),
            "affected_journey_count": len(journey_nodes),
            "affected_test_count": len(test_nodes),
            "impact_reduction_calculated": False,
            "contract_model": {
                "status": model_status,
                "assumed_target_contract": (
                    "user_id and sub"
                    if repair == "adapter"
                    else "sub"
                ),
                "resolved_recorded_mismatch_count": len(resolved_nodes),
                "resolved_recorded_mismatches": [
                    compact_node(node) for node in resolved_nodes
                ],
                "remaining_recorded_mismatch_count": len(
                    remaining_mismatches
                ),
                "remaining_recorded_mismatches": [
                    compact_node(node) for node in remaining_mismatches
                ],
                "note": model_note,
            },
            "reason": (
                "Dependency reachability remains unchanged in this model. "
                "The contract comparison uses recorded expects properties "
                "and explicit repair assumptions; it does not recalculate "
                "journey failures or test outcomes."
            ),
        },
        "model_assumptions": [
            "The proposed repair has not been implemented.",
            "The graph's expects property represents a consumer contract expectation.",
            "The adapter is assumed to preserve user_id and add or retain sub.",
            "The migration scenario assumes all recorded mismatched expectations are updated.",
            "A feature flag alone does not change the expected token claim.",
        ],
        "evidence_gaps": [
            "The graph does not record which token claims each consumer reads at runtime.",
            "The repair has not been implemented.",
            "Automated tests have not been executed.",
            "The graph has not been mutated or recalculated for a real repair.",
            "The model cannot prove that any user journey is fixed.",
        ],
    }
