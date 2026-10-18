# Counterfactual CI

**Predict. Compare. Verify. Ship Confidently.**

Counterfactual CI is a graph-powered code change impact analysis prototype built with **FalkorDB, FastAPI, React, and TypeScript**. It helps developers reason about what a code change might affect by connecting functions, API endpoints, frontend components, automated tests, and user journeys in a dependency graph.

Instead of inspecting changed files in isolation, Counterfactual CI matches a Git diff to recorded graph entities, traces their outgoing relationships, and recommends potentially relevant tests with inspectable evidence paths.


## The problem

A seemingly small code change can affect multiple application layers. Changing an authentication function, for example, may affect API endpoints, frontend pages, tests, and user journeys.

A conventional diff shows what changed, but does not necessarily reveal these downstream dependencies.

Counterfactual CI explores how a connected graph can provide context for understanding potential impact before shipping a change.

## Features

- **Real Git diff analysis:** Summarizes changed files, additions, deletions, and detected declarations.
- **Graph-based impact tracing:** Matches changed files and detected symbols to FalkorDB nodes and follows recorded directed relationships.
- **Evidence-backed test recommendations:** Surfaces recorded Playwright test nodes reachable from matched code entities.
- **Interactive impact workspace:** Presents graph relationships, potentially affected entities, and predicted user journeys.
- **Counterfactual repair comparison:** Provides illustrative repair scenarios for comparing possible approaches.
- **Decision receipt:** Summarizes the evidence state and makes unverified assumptions visible.
- **Explicit uncertainty:** Distinguishes potential impact from confirmed failures and recommended tests from executed tests.

## How it works

1. **Submit a diff:** Paste a unified Git diff into the Code Changes workspace.
2. **Analyze the change:** The backend parses the diff and detects selected declarations using lightweight static analysis.
3. **Match graph entities:** Changed files and detected symbols are matched against nodes recorded in FalkorDB.
4. **Trace dependencies:** A bounded traversal follows outgoing graph relationships to identify potentially impacted entities.
5. **Recommend tests:** Reachable Playwright test nodes are returned with their evidence relationships.
6. **Review the evidence:** Inspect impacted nodes, evidence paths, limitations, and illustrative repair scenarios.

```text
Unified Git diff
       |
       v
Static diff analysis
       |
       v
Match files and symbols to graph nodes
       |
       v
Traverse recorded FalkorDB relationships
       |
       +----> Potentially impacted APIs and UI
       |
       +----> Recommended tests and evidence paths
       |
       v
Review predictions and limitations
```

## Architecture

| Component | Technology | Responsibility |
|---|---|---|
| Frontend | React, TypeScript, Vite | Interactive analysis workspace |
| Backend | Python, FastAPI | Diff analysis, graph access, impact traversal, and API responses |
| Graph database | FalkorDB | Stores application entities and directed dependency relationships |
| Backend tests | Python `unittest` | Tests diff parsing, graph impact behavior, and configured counterfactual scenarios |

## Graph data model

The prototype represents application context with node types such as:

- `Function` — a code-level function, such as `verify_token()`.
- `APIEndpoint` — an API route.
- `UIComponent` — a frontend component.
- `PlaywrightSpec` — a recorded automated test.
- `UserJourney` — a user-facing workflow.

Recorded relationships include:

| Relationship | Meaning |
|---|---|
| `SERVES` | A function serves an API endpoint |
| `RENDERS` | An API endpoint is associated with a UI component |
| `COVERED_BY` | A function or component is associated with a test |
| `VALIDATES` | A test is associated with a user journey |

Impact tracing follows outgoing relationships recorded in the graph. Consequently, results depend on the completeness and accuracy of the graph.

### Example Cypher traversal

This illustrative Cypher query shows the general idea of tracing downstream dependencies from a changed function:

```cypher
MATCH path =
  (source:Function {id: 'verify_token'})
  -[:SERVES|RENDERS|COVERED_BY|VALIDATES*1..4]->
  (impacted)
RETURN path;
```

The implemented `/api/analyze-diff-impact` endpoint performs bounded traversal in the backend over graph data retrieved from FalkorDB. The query above illustrates the graph model; it is not a claim that the application executes this exact query for every diff.

## Getting started

### Prerequisites

- Git
- Node.js and npm
- Python with `venv` support
- Docker
- FalkorDB

### 1. Clone the repository

```bash
git clone https://github.com/harshitSingh1/Counterfactual_CI.git
cd Counterfactual_CI
```

### 2. Start FalkorDB

If the project's FalkorDB container does not already exist, start one:

```bash
docker run -d --name counterfactual-falkordb -p 6379:6379 -p 3000:3000 falkordb/falkordb:latest
```

If the container already exists, start it with:

```bash
docker start counterfactual-falkordb
```

The backend defaults to the following configuration:

| Environment variable | Default |
|---|---|
| `FALKORDB_HOST` | `localhost` |
| `FALKORDB_PORT` | `6379` |
| `FALKORDB_GRAPH` | `counterfactual_ci` |

These defaults can be overridden with environment variables.

**Graph data:** The application expects the graph to contain the nodes and relationships required for its analysis. Inspect `backend/seed_graph.py` to understand the supplied graph setup and how to initialize it. Starting a fresh FalkorDB container does not, by itself, guarantee that the graph has been populated.

### Initialize the demo graph

After starting FalkorDB, open a PowerShell terminal from the repository root and run:

```powershell
.\backend\.venv\Scripts\python.exe .\backend\seed_graph.py
```

If you have not created the virtual environment or installed the dependencies yet, complete the backend setup first, then run the seeding command.

The script creates the demo graph with 11 nodes and 9 relationships, including authentication, API endpoints, UI components, Playwright tests, and user journeys.

**Warning:** The seed script deletes existing nodes in the `counterfactual_ci` graph before recreating the demo data. Do not run it against a graph containing data you need to preserve.

### 3. Set up the Python backend

From the repository root, run these commands in PowerShell:

```powershell
cd backend
python -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt
```

Start the API server:

```powershell
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

Keep this terminal running.

### 4. Start the frontend

Open another terminal at the repository root:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite, typically `http://localhost:5173/`.

### 5. Check the backend

Health endpoint:

`http://127.0.0.1:8000/api/health`

API documentation:

`http://127.0.0.1:8000/docs`

The health endpoint should report that the API is operational and FalkorDB is connected.

## API endpoints

| Method and endpoint | Purpose |
|---|---|
| `GET /` | Backend status and API documentation path |
| `GET /api/health` | API and FalkorDB health |
| `GET /api/graph` | Retrieves graph data for visualization |
| `GET /api/analysis?pr=101` | Returns configured graph-derived analysis for a pull request scenario |
| `GET /api/counterfactual?pr=101&repair=...` | Evaluates a configured illustrative repair scenario |
| `POST /api/analyze-diff` | Analyzes a supplied unified Git diff |
| `POST /api/analyze-diff-impact` | Matches a diff to graph nodes and returns potential impacts, recommended tests, and evidence paths |

The diff-analysis POST endpoints accept a JSON object with a `diff` string containing unified Git diff text. The current request model requires a non-empty diff and limits its size to 200,000 characters.

Example request body:

```json
{
  "diff": "diff --git a/backend/auth.py b/backend/auth.py\n..."
}
```

The ellipsis is a placeholder; use a real unified diff when making a request.

## Running tests

From the repository root, with the backend virtual environment activated:

```powershell
python -m unittest discover -s backend -p "test_*.py" -v
```

Build the frontend:

```powershell
npm run build
```

During development, the backend test suite reported **14 passing tests**, and the frontend production build succeeded. Run both commands against the final commit to verify the submitted version.

## Limitations

Counterfactual CI is a prototype for graph-based change-impact reasoning, not a complete CI replacement.

- Diff parsing uses lightweight static analysis, not a full language parser.
- Impact analysis is limited to nodes and directed relationships recorded in FalkorDB.
- A matched or reachable graph node indicates potential impact, not a confirmed defect.
- Recommended tests are selected from recorded graph relationships; the diff-impact endpoint does not execute them.
- Test coverage is not measured unless an actual test suite is run and its results are collected.
- Repair comparisons, contract scenarios, and associated risks are illustrative unless independently verified.
- The configured graph should not be mistaken for a dependency graph automatically extracted from every repository.

Use the analysis to guide code review and test selection, not as proof that a change is safe to ship.

## Hackathon track

**Graph Hacks: Context for AI Agents — Track 01: Agents That Act on Connected Data**

The project explores how connected application context can help an AI-assisted development workflow reason about code changes and downstream dependencies.

## AI assistance disclosure

AI tools assisted with aspects of ideation, implementation, debugging, and documentation. The resulting implementation should be evaluated against the repository and its tests; AI-generated suggestions are not treated as independent verification.

## Future improvements

- Automatically ingest repository code and test metadata to build and refresh the dependency graph.
- Improve symbol matching with language-aware parsing.
- Execute recommended tests in an isolated CI environment and attach real results to the decision receipt.
- Validate repair options against actual diffs and test outcomes.
- Measure graph coverage and identify missing or stale relationships.
- Integrate with pull-request workflows for continuous impact analysis.

---

**Counterfactual CI — Predict. Compare. Verify. Ship Confidently.**
