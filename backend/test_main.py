import unittest
from unittest.mock import patch

from fastapi import HTTPException

from main import (
    DiffAnalysisRequest,
    analyze_change,
    analyze_counterfactual,
    analyze_diff_impact_endpoint,
)


def sample_nodes():
    return [
        {
            "id": "orders_api",
            "name": "GET /api/orders",
            "labels": ["APIEndpoint"],
            "file": "backend/orders.py",
            "layer": "api",
            "expects": "user_id",
        },
        {
            "id": "admin_api",
            "name": "GET /api/admin/audit",
            "labels": ["APIEndpoint"],
            "file": "backend/admin.py",
            "layer": "api",
            "expects": "user_id",
        },
        {
            "id": "orders_page",
            "name": "OrdersPage",
            "labels": ["UIComponent"],
            "file": "src/pages/OrdersPage.tsx",
            "layer": "frontend",
            "expects": "user_id",
        },
        {
            "id": "admin_page",
            "name": "AdminAuditPage",
            "labels": ["UIComponent"],
            "file": "src/pages/AdminAuditPage.tsx",
            "layer": "frontend",
            "expects": "user_id",
        },
        {
            "id": "orders_journey",
            "name": "View order history",
            "labels": ["UserJourney"],
            "file": None,
            "layer": None,
            "expects": None,
        },
        {
            "id": "orders_test",
            "name": "orders.spec.ts",
            "labels": ["PlaywrightSpec"],
            "file": "tests/orders.spec.ts",
            "layer": "test",
            "expects": None,
        },
    ]


class CounterfactualTests(unittest.TestCase):
    @patch("main.get_downstream_nodes", side_effect=sample_nodes)
    def test_adapter_models_four_resolved_mismatches(self, _mock):
        result = analyze_counterfactual(pr=101, repair="adapter")
        model = result["counterfactual"]["contract_model"]

        self.assertEqual(result["baseline"]["recorded_contract_mismatch_count"], 4)
        self.assertEqual(model["resolved_recorded_mismatch_count"], 4)
        self.assertEqual(model["remaining_recorded_mismatch_count"], 0)
        self.assertFalse(result["graph_mutated"])
        self.assertFalse(result["repair_applied"])
        self.assertFalse(result["tests_executed"])

    @patch("main.get_downstream_nodes", side_effect=sample_nodes)
    def test_migration_models_four_resolved_mismatches(self, _mock):
        result = analyze_counterfactual(pr=101, repair="update-frontend")
        model = result["counterfactual"]["contract_model"]

        self.assertEqual(model["resolved_recorded_mismatch_count"], 4)
        self.assertEqual(model["remaining_recorded_mismatch_count"], 0)
        self.assertEqual(model["assumed_target_contract"], "sub")

    @patch("main.get_downstream_nodes", side_effect=sample_nodes)
    def test_feature_flag_alone_resolves_no_mismatches(self, _mock):
        result = analyze_counterfactual(pr=101, repair="feature-flag")
        model = result["counterfactual"]["contract_model"]

        self.assertEqual(model["resolved_recorded_mismatch_count"], 0)
        self.assertEqual(model["remaining_recorded_mismatch_count"], 4)

    def test_unknown_repair_returns_bad_request(self):
        with self.assertRaises(HTTPException) as error:
            analyze_counterfactual(pr=101, repair="unknown")

        self.assertEqual(error.exception.status_code, 400)

    def test_unsupported_pr_returns_not_found(self):
        with self.assertRaises(HTTPException) as error:
            analyze_counterfactual(pr=102, repair="adapter")

        self.assertEqual(error.exception.status_code, 404)

    @patch("main.get_downstream_nodes", side_effect=sample_nodes)
    def test_analysis_counts_journeys_and_tests(self, _mock):
        result = analyze_change(pr=101)

        self.assertEqual(result["affected_node_count"], 6)
        self.assertEqual(result["affected_journey_count"], 1)
        self.assertEqual(result["affected_test_count"], 1)
        self.assertFalse(result["verified_by_tests"])


class DiffImpactTests(unittest.TestCase):
    def setUp(self):
        self.graph_data = {
            "graph": "counterfactual_ci",
            "node_count": 4,
            "edge_count": 3,
            "nodes": [
                {
                    "id": "verify_token",
                    "name": "verify_token()",
                    "labels": ["Function"],
                    "file": "backend/auth.py",
                    "layer": "backend",
                },
                {
                    "id": "orders_api",
                    "name": "GET /api/orders",
                    "labels": ["APIEndpoint"],
                    "file": "backend/orders.py",
                    "layer": "api",
                },
                {
                    "id": "orders_page",
                    "name": "OrdersPage",
                    "labels": ["UIComponent"],
                    "file": "src/pages/OrdersPage.tsx",
                    "layer": "frontend",
                },
                {
                    "id": "orders_test",
                    "name": "orders.spec.ts",
                    "labels": ["PlaywrightSpec"],
                    "file": "tests/orders.spec.ts",
                    "layer": "test",
                },
            ],
            "edges": [
                {
                    "source": "verify_token",
                    "relationship": "SERVES",
                    "target": "orders_api",
                },
                {
                    "source": "orders_api",
                    "relationship": "RENDERS",
                    "target": "orders_page",
                },
                {
                    "source": "orders_page",
                    "relationship": "COVERED_BY",
                    "target": "orders_test",
                },
            ],
        }

    @patch("main.get_graph_data")
    def test_diff_impact_follows_real_graph_relationships(self, mock_graph):
        mock_graph.return_value = self.graph_data
        diff = (
            "diff --git a/backend/auth.py b/backend/auth.py\n"
            "--- a/backend/auth.py\n"
            "+++ b/backend/auth.py\n"
            "@@ -1,0 +1,2 @@\n"
            "+def verify_token(token):\n"
            "+    return token is not None\n"
        )

        result = analyze_diff_impact_endpoint(
            DiffAnalysisRequest(diff=diff)
        )

        self.assertEqual(result["status"], "analyzed")
        self.assertEqual(
            result["matched_sources"][0]["id"],
            "verify_token",
        )
        self.assertEqual(
            {item["id"] for item in result["recommended_tests"]},
            {"orders_test"},
        )
        self.assertTrue(
            any(
                path["relationships"]
                == ["SERVES", "RENDERS", "COVERED_BY"]
                for path in result["evidence_paths"]
            )
        )
        self.assertEqual(result["unmatched_files"], [])
        self.assertIn(
            "Recommended tests have not been executed by this endpoint.",
            result["limitations"],
        )

    @patch("main.get_graph_data")
    def test_unmatched_file_does_not_invent_impact(self, mock_graph):
        mock_graph.return_value = self.graph_data
        diff = (
            "diff --git a/docs/unknown.md b/docs/unknown.md\n"
            "--- a/docs/unknown.md\n"
            "+++ b/docs/unknown.md\n"
            "@@ -1,0 +1,1 @@\n"
            "+A documentation update.\n"
        )

        result = analyze_diff_impact_endpoint(
            DiffAnalysisRequest(diff=diff)
        )

        self.assertEqual(result["unmatched_files"], ["docs/unknown.md"])
        self.assertEqual(result["matched_sources"], [])
        self.assertEqual(result["impacted_nodes"], [])
        self.assertEqual(result["recommended_tests"], [])
        self.assertEqual(result["evidence_paths"], [])

    def test_empty_diff_returns_bad_request(self):
        with self.assertRaises(HTTPException) as error:
            analyze_diff_impact_endpoint(
                DiffAnalysisRequest(diff="   ")
            )

        self.assertEqual(error.exception.status_code, 400)


if __name__ == "__main__":
    unittest.main()
