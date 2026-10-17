import unittest
from unittest.mock import patch

from fastapi import HTTPException

from main import analyze_change, analyze_counterfactual


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


if __name__ == "__main__":
    unittest.main()
