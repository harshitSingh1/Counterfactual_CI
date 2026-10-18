
import unittest

from diff_analyzer import analyze_git_diff


SAMPLE_DIFF = """diff --git a/app.py b/app.py
index 1111111..2222222 100644
--- a/app.py
+++ b/app.py
@@ -1,4 +1,7 @@
-def old_function():
-    return False
+def new_function():
+    return True
+
+class PaymentService:
+    pass
"""


class DiffAnalyzerTests(unittest.TestCase):
    def test_counts_changed_files_and_lines(self):
        result = analyze_git_diff(SAMPLE_DIFF)

        self.assertEqual(result["summary"]["files_changed"], 1)
        self.assertEqual(result["summary"]["additions"], 5)
        self.assertEqual(result["summary"]["deletions"], 2)

    def test_detects_added_python_symbols(self):
        result = analyze_git_diff(SAMPLE_DIFF)

        self.assertEqual(
            result["files"][0]["changed_symbols"],
            ["PaymentService", "new_function"],
        )

    def test_empty_diff_is_rejected(self):
        with self.assertRaises(ValueError):
            analyze_git_diff("   ")

    def test_oversized_diff_is_rejected(self):
        with self.assertRaises(ValueError):
            analyze_git_diff("x" * 200_001)

    def test_path_traversal_is_not_reported_as_a_file(self):
        diff = """diff --git a/../../secret.py b/../../secret.py
--- a/../../secret.py
+++ b/../../secret.py
@@ -1 +1 @@
-old()
+new()
"""
        result = analyze_git_diff(diff)

        self.assertEqual(result["summary"]["files_changed"], 0)


if __name__ == "__main__":
    unittest.main(verbosity=2)
