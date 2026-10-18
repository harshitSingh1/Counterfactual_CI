
import re
from collections import Counter
from pathlib import PurePosixPath
from typing import Any


MAX_DIFF_LENGTH = 200_000
MAX_FILES = 100

# Lightweight patterns: these find likely declarations, not every possible symbol.
PYTHON_SYMBOL_PATTERN = re.compile(
    r"^\s*(?:async\s+)?(?:def|class)\s+([A-Za-z_]\w*)",
)

JS_SYMBOL_PATTERN = re.compile(
    r"^\s*(?:export\s+)?(?:default\s+)?"
    r"(?:async\s+)?(?:function|class)\s+([A-Za-z_$][\w$]*)"
    r"|^\s*(?:export\s+)?(?:const|let|var)\s+"
    r"([A-Za-z_$][\w$]*)\s*=",
)


def _safe_path(path: str) -> str:
    """Normalize a diff path and reject paths that escape the project."""
    path = path.strip().replace("\\", "/")

    if path.startswith(("a/", "b/")):
        path = path[2:]

    if (
        not path
        or path.startswith("/")
        or re.match(r"^[A-Za-z]:", path)
        or any(part == ".." for part in path.split("/"))
    ):
        return ""

    return str(PurePosixPath(path))


def _parse_diff_header(line: str) -> str:
    """Extract the destination path from a unified diff header."""
    match = re.match(r"^\+\+\+\s+(?:b/)?(.+?)(?:\t.*)?$", line)
    if not match:
        return ""

    path = match.group(1).strip()

    if path == "/dev/null":
        return ""

    return _safe_path(path)


def _symbol_from_line(line: str, extension: str) -> str | None:
    """Return a likely declaration name for supported source files."""
    if extension == ".py":
        match = PYTHON_SYMBOL_PATTERN.match(line)
        return match.group(1) if match else None

    if extension in {".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs"}:
        match = JS_SYMBOL_PATTERN.match(line)
        if match:
            return match.group(1) or match.group(2)

    return None


def analyze_git_diff(diff_text: str) -> dict[str, Any]:
    """
    Analyze a pasted unified Git diff without executing the changed code.

    The output is a heuristic summary, not a complete AST or dependency analysis.
    """
    if not isinstance(diff_text, str):
        raise ValueError("diff must be a string")

    if not diff_text.strip():
        raise ValueError("Paste a non-empty unified Git diff")

    if len(diff_text) > MAX_DIFF_LENGTH:
        raise ValueError(
            f"Diff is too large. Maximum allowed size is {MAX_DIFF_LENGTH} characters."
        )

    lines = diff_text.splitlines()
    files: dict[str, dict[str, Any]] = {}
    current_path = ""
    in_hunk = False

    for line in lines:
        if line.startswith("+++ "):
            current_path = _parse_diff_header(line)
            in_hunk = False

            if current_path and current_path not in files:
                if len(files) >= MAX_FILES:
                    raise ValueError(
                        f"Diff contains more than {MAX_FILES} files; "
                        "please analyze a smaller diff."
                    )

                files[current_path] = {
                    "path": current_path,
                    "status": "modified",
                    "additions": 0,
                    "deletions": 0,
                    "changed_symbols": [],
                    "_symbol_counts": Counter(),
                }

            continue

        if line.startswith("@@ "):
            in_hunk = True
            continue

        if not in_hunk or not current_path or current_path not in files:
            continue

        if line.startswith("+++ ") or line.startswith("--- "):
            continue

        if line.startswith("+") and not line.startswith("+++"):
            entry = files[current_path]
            entry["additions"] += 1
            symbol = _symbol_from_line(line[1:], PurePosixPath(current_path).suffix.lower())
            if symbol:
                entry["_symbol_counts"][symbol] += 1

        elif line.startswith("-") and not line.startswith("---"):
            files[current_path]["deletions"] += 1

    results = []

    for path, entry in files.items():
        symbol_counts = entry.pop("_symbol_counts")
        entry["changed_symbols"] = sorted(symbol_counts.keys())

        if path.endswith((".py", ".js", ".jsx", ".ts", ".tsx", ".mjs", ".cjs")):
            entry["analysis_note"] = (
                "Likely declarations are detected from added lines only. "
                "This does not prove runtime dependencies or complete symbol changes."
            )
        else:
            entry["analysis_note"] = (
                "File change counts are available, but symbol detection is unsupported "
                "for this file type."
            )

        results.append(entry)

    totals = {
        "files_changed": len(results),
        "additions": sum(item["additions"] for item in results),
        "deletions": sum(item["deletions"] for item in results),
    }

    extension_counts = Counter(
        PurePosixPath(item["path"]).suffix.lower() or "[no extension]"
        for item in results
    )

    return {
        "summary": totals,
        "file_types": dict(sorted(extension_counts.items())),
        "files": results,
        "limitations": [
            "This is a lightweight unified-diff parser, not a full language parser.",
            "Changed symbols are inferred from added declaration lines.",
            "It does not establish dependency relationships or recommend tests yet.",
            "No changed code is executed, and no files in your repository are modified.",
        ],
    }
