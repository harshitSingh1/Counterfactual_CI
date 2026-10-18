import os
from falkordb import FalkorDB

db = FalkorDB(
    host=os.getenv("FALKORDB_HOST", "localhost"),
    port=int(os.getenv("FALKORDB_PORT", "6379")),
    username=os.getenv("FALKORDB_USERNAME") or None,
    password=os.getenv("FALKORDB_PASSWORD") or None,
    ssl=os.getenv("FALKORDB_TLS", "false").lower() in {"1", "true", "yes"},
    socket_connect_timeout=10,
    socket_timeout=10,
)
graph = db.select_graph(os.getenv("FALKORDB_GRAPH", "counterfactual_ci"))

# Reset and recreate the demo graph.
graph.query("MATCH (n) DETACH DELETE n")

# Create 11 nodes.
graph.query("""
CREATE
  (f:Function {
    id: 'verify_token',
    name: 'verify_token()',
    file: 'backend/auth.py',
    contract: 'user_id',
    changed_contract: 'sub',
    layer: 'backend'
  }),
  (a:APIEndpoint {
    id: 'orders_api',
    name: 'GET /api/orders',
    file: 'backend/orders.py',
    expects: 'user_id',
    layer: 'api'
  }),
  (a2:APIEndpoint {
    id: 'admin_audit_api',
    name: 'GET /api/admin/audit',
    file: 'backend/admin.py',
    expects: 'user_id',
    layer: 'api'
  }),
  (u:UIComponent {
    id: 'orders_page',
    name: 'OrdersPage',
    file: 'src/pages/OrdersPage.tsx',
    expects: 'user_id',
    layer: 'frontend'
  }),
  (t:PlaywrightSpec {
    id: 'orders_test',
    name: 'orders.spec.ts',
    file: 'tests/orders.spec.ts',
    layer: 'test'
  }),
  (j:UserJourney {
    id: 'order_history',
    name: 'View order history',
    risk: 'high',
    layer: 'journey'
  }),
  (u2:UIComponent {
    id: 'admin_page',
    name: 'AdminAuditPage',
    file: 'src/pages/AdminAuditPage.tsx',
    expects: 'user_id',
    layer: 'frontend'
  }),
  (t2:PlaywrightSpec {
    id: 'admin_test',
    name: 'admin-audit.spec.ts',
    file: 'tests/admin-audit.spec.ts',
    layer: 'test'
  }),
  (j2:UserJourney {
    id: 'admin_audit',
    name: 'Review admin audit log',
    risk: 'medium',
    layer: 'journey'
  }),
  (safe:Function {
    id: 'format_badge',
    name: 'format_badge()',
    file: 'src/utils/badge.ts',
    layer: 'frontend'
  }),
  (safe_test:PlaywrightSpec {
    id: 'badge_test',
    name: 'badge.spec.ts',
    file: 'tests/badge.spec.ts',
    layer: 'test'
  })
""")

# Order-history dependency path.
graph.query("""
MATCH (f:Function {id: 'verify_token'}),
      (a:APIEndpoint {id: 'orders_api'}),
      (u:UIComponent {id: 'orders_page'}),
      (t:PlaywrightSpec {id: 'orders_test'}),
      (j:UserJourney {id: 'order_history'})
CREATE (f)-[:SERVES]->(a),
       (a)-[:RENDERS]->(u),
       (u)-[:COVERED_BY]->(t),
       (t)-[:VALIDATES]->(j)
""")

# Admin-audit dependency path.
graph.query("""
MATCH (f:Function {id: 'verify_token'}),
      (a:APIEndpoint {id: 'admin_audit_api'}),
      (u:UIComponent {id: 'admin_page'}),
      (t:PlaywrightSpec {id: 'admin_test'}),
      (j:UserJourney {id: 'admin_audit'})
CREATE (f)-[:SERVES]->(a),
       (a)-[:RENDERS]->(u),
       (u)-[:COVERED_BY]->(t),
       (t)-[:VALIDATES]->(j)
""")

# Independent badge utility and test.
graph.query("""
MATCH (f:Function {id: 'format_badge'}),
      (t:PlaywrightSpec {id: 'badge_test'})
CREATE (f)-[:COVERED_BY]->(t)
""")

# Verify the graph.
nodes = graph.query("""
MATCH (n)
RETURN labels(n) AS labels, n.id AS id, n.name AS name
ORDER BY id
""")

edges = graph.query("""
MATCH (a)-[r]->(b)
RETURN a.id AS source, type(r) AS relationship, b.id AS target
ORDER BY source, target
""")

print(f"Created {len(nodes.result_set)} nodes")
for row in nodes.result_set:
    print(f"  {row[0]} | {row[1]} | {row[2]}")

print(f"\nCreated {len(edges.result_set)} relationships")
for row in edges.result_set:
    print(f"  {row[0]} -[{row[1]}]-> {row[2]}")

print("\nGraph seeded successfully.")
