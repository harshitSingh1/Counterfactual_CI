import type { PRScenario } from '@/types';

export const REPO = 'target-commerce-app';
export const BRANCH = 'main';

export const PRS: { id: string; number: number; title: string }[] = [
  { id: 'pr-101', number: 101, title: 'Auth Token Refactor' },
  { id: 'pr-102', number: 102, title: 'Currency Precision Change' },
  { id: 'pr-103', number: 103, title: 'UI Badge Update' },
];

export const SCENARIOS: Record<string, PRScenario> = {
  'pr-101': {
    id: 'pr-101',
    number: 101,
    title: 'Auth Token Refactor',
    file: 'backend/auth.py',
    description:
      'Renames the JWT claim `user_id` to `sub` to align with the OpenID Connect standard. verify_token() now reads `sub` instead of `user_id`, breaking any consumer expecting the legacy claim name.',
    diff: [
      { kind: 'context', oldNo: 42, newNo: 42, text: 'def verify_token(token: str) -> dict:' },
      { kind: 'context', oldNo: 43, newNo: 43, text: '    payload = jwt.decode(token, SECRET, algorithms=["HS256"])' },
      { kind: 'removed', oldNo: 44, newNo: undefined, text: '    user_id = payload["user_id"]' },
      { kind: 'added', oldNo: undefined, newNo: 44, text: '    user_id = payload["sub"]  # OIDC standard claim' },
      { kind: 'context', oldNo: 45, newNo: 45, text: '    if not user_id:' },
      { kind: 'context', oldNo: 46, newNo: 46, text: '        raise AuthError("invalid subject")' },
      { kind: 'removed', oldNo: 47, newNo: undefined, text: '    return {"user_id": user_id, "roles": payload.get("roles", [])}' },
      { kind: 'added', oldNo: undefined, newNo: 47, text: '    return {"sub": user_id, "roles": payload.get("roles", [])}' },
    ],
    contract: [
      { field: 'verify_token() return key', before: 'user_id', after: 'sub', breaking: true },
      { field: 'GET /api/orders consumer', before: 'reads payload.user_id', after: 'reads payload.sub', breaking: true },
      { field: 'OrderCard component prop', before: 'userId', after: 'sub (mismatch)', breaking: true },
      { field: 'JWT algorithm', before: 'HS256', after: 'HS256', breaking: false },
      { field: 'Token expiry claim', before: 'exp', after: 'exp', breaking: false },
    ],
    impactSummary: {
      affectedJourneys: ['Checkout', 'Order History', 'Admin Audit'],
      mappedCoverage: 64,
      uncoveredComponents: ['OrderHistoryPage', 'AdminAuditPanel', 'CheckoutSummary'],
    },
    graph: {
      nodes: [
        { id: 'verify_token', label: 'verify_token()', category: 'function', x: 400, y: 120, status: 'impacted', detail: 'Source of the breaking change. JWT claim read renamed from user_id to sub.', file: 'backend/auth.py' },
        { id: 'api_orders', label: 'GET /api/orders', category: 'endpoint', x: 400, y: 280, status: 'impacted', detail: 'Auth middleware calls verify_token() and forwards the payload to the handler. Now returns `sub` instead of `user_id`.', file: 'backend/routes/orders.py' },
        { id: 'checkout_summary', label: 'CheckoutSummary', category: 'component', x: 180, y: 440, status: 'impacted', detail: 'Reads payload.user_id to label the active buyer. Will render undefined with the new payload shape.', file: 'frontend/Checkout/Summary.tsx' },
        { id: 'order_history', label: 'OrderHistoryPage', category: 'component', x: 400, y: 440, status: 'untested', detail: 'Filters orders by user_id from the token. No automated test currently exercises this path.', file: 'frontend/Orders/History.tsx' },
        { id: 'admin_audit', label: 'AdminAuditPanel', category: 'component', x: 620, y: 440, status: 'untested', detail: 'Audits actions per user_id. Untested and likely to break on the new claim name.', file: 'frontend/Admin/Audit.tsx' },
        { id: 'pw_checkout', label: 'Checkout.spec.ts', category: 'test', x: 180, y: 600, status: 'impacted', detail: 'Playwright journey covering the checkout flow. Currently asserts on the old user_id claim and will fail.', file: 'e2e/checkout.spec.ts' },
        { id: 'pw_history', label: 'OrderHistory.spec.ts', category: 'test', x: 400, y: 600, status: 'unaffected', detail: 'Playwright journey for order history. Does not assert on auth payload shape — predicted unaffected.', file: 'e2e/history.spec.ts' },
        { id: 'pw_admin', label: 'AdminAudit.spec.ts', category: 'test', x: 620, y: 600, status: 'untested', detail: 'No Playwright spec exists for the admin audit journey. Path is uncovered.', file: 'e2e/admin.spec.ts' },
        { id: 'j_checkout', label: 'Checkout', category: 'journey', x: 180, y: 740, status: 'impacted', detail: 'End-to-end user journey: buyer completes a purchase. Relies on authed /api/orders response.', file: 'journey/checkout.yaml' },
        { id: 'j_history', label: 'Order History', category: 'journey', x: 400, y: 740, status: 'impacted', detail: 'Buyer reviews past orders. Filters by the authenticated subject.', file: 'journey/history.yaml' },
        { id: 'j_admin', label: 'Admin Audit', category: 'journey', x: 620, y: 740, status: 'untested', detail: 'Admin reviews per-user action log. No test coverage exists for this journey.', file: 'journey/admin.yaml' },
      ],
      edges: [
        { from: 'verify_token', to: 'api_orders', status: 'impacted', label: 'calls' },
        { from: 'api_orders', to: 'checkout_summary', status: 'impacted', label: 'renders' },
        { from: 'api_orders', to: 'order_history', status: 'untested', label: 'renders' },
        { from: 'api_orders', to: 'admin_audit', status: 'untested', label: 'renders' },
        { from: 'checkout_summary', to: 'pw_checkout', status: 'impacted', label: 'covers' },
        { from: 'order_history', to: 'pw_history', status: 'unaffected', label: 'covers' },
        { from: 'admin_audit', to: 'pw_admin', status: 'untested', label: 'missing' },
        { from: 'pw_checkout', to: 'j_checkout', status: 'impacted', label: 'verifies' },
        { from: 'pw_history', to: 'j_history', status: 'impacted', label: 'verifies' },
        { from: 'pw_admin', to: 'j_admin', status: 'untested', label: 'missing' },
      ],
    },
    repairOptions: [
      {
        id: 'adapter',
        label: 'Backward-Compatible Adapter',
        tagline: 'Keep emitting both user_id and sub from verify_token()',
        tradeoffs: {
          pros: ['No frontend changes required', 'Rolls out instantly', 'Preserves existing consumers'],
          cons: ['Carries legacy debt forward', 'Two sources of truth for identity', 'Adapter must eventually be removed'],
        },
        effort: 'Low',
        riskLevel: 'Low',
        recommended: true,
        predictedOutcome: 'Predicted to unblock all three journeys with zero frontend edits. Prediction only — not yet verified by running tests.',
      },
      {
        id: 'update-frontend',
        label: 'Update Frontend Consumers',
        tagline: 'Migrate all components and tests to read sub',
        tradeoffs: {
          pros: ['Aligns the whole stack with OIDC', 'Removes legacy claim permanently', 'Cleaner long-term contract'],
          cons: ['Touches 3 components + 2 specs', 'Requires coordinated deploy', 'Higher blast radius if a consumer is missed'],
        },
        effort: 'Medium',
        riskLevel: 'Medium',
        recommended: false,
        predictedOutcome: 'Predicted to resolve the contract mismatch permanently, but the untested OrderHistoryPage and AdminAuditPanel paths add migration risk until tests run.',
      },
      {
        id: 'feature-flag',
        label: 'Feature Flag / Route Isolation',
        tagline: 'Ship the new claim behind a flag, isolate affected routes',
        tradeoffs: {
          pros: ['Instant rollback', 'Gradual rollout per route', 'Safe for untested paths'],
          cons: ['Adds flag complexity', 'Two code paths to maintain', 'Requires flag lifecycle governance'],
        },
        effort: 'High',
        riskLevel: 'Low',
        recommended: false,
        predictedOutcome: 'Predicted to be the safest rollout path, especially given the untested admin journey. Overkill if the adapter is acceptable.',
      },
    ],
    tests: [
      { id: 't1', name: 'test_verify_token_returns_sub', status: 'unverified', duration: 0, coverage: 88, kind: 'Unit' },
      { id: 't2', name: 'test_orders_endpoint_auth', status: 'unverified', duration: 0, coverage: 72, kind: 'Integration' },
      { id: 't3', name: 'Checkout.spec.ts — full purchase flow', status: 'unverified', duration: 0, coverage: 64, kind: 'Playwright' },
      { id: 't4', name: 'OrderHistory.spec.ts — list past orders', status: 'unverified', duration: 0, coverage: 41, kind: 'Playwright' },
      { id: 't5', name: 'AdminAudit.spec.ts — audit log review', status: 'unverified', duration: 0, coverage: 0, kind: 'Playwright' },
      { id: 't6', name: 'test_contract_shape_matches_oidc', status: 'unverified', duration: 0, coverage: 100, kind: 'Contract' },
    ],
    risks: [
      { id: 'r1', description: 'AdminAuditPanel has no test coverage and reads the renamed claim.', severity: 'high', mitigation: 'Add AdminAudit.spec.ts before rollout, or gate the admin route behind the feature flag.' },
      { id: 'r2', description: 'OrderHistoryPage filters by user_id and is untested.', severity: 'medium', mitigation: 'Cover with a Playwright spec or confirm the adapter preserves user_id.' },
      { id: 'r3', description: 'Graph predictions are based on static trace data, not executed tests.', severity: 'medium', mitigation: 'Connect the test runner and re-evaluate before approving the PR.' },
    ],
  },
  'pr-102': {
    id: 'pr-102',
    number: 102,
    title: 'Currency Precision Change',
    file: 'backend/pricing.py',
    description:
      'Switches monetary storage from float to integer cents to eliminate rounding drift. Any consumer that formats floats directly will break.',
    diff: [
      { kind: 'context', oldNo: 18, newNo: 18, text: 'def format_price(cents: int) -> str:' },
      { kind: 'removed', oldNo: 19, newNo: undefined, text: '    return f"${value:.2f}"' },
      { kind: 'added', oldNo: undefined, newNo: 19, text: '    return f"${cents / 100:.2f}"' },
      { kind: 'context', oldNo: 20, newNo: 20, text: '' },
      { kind: 'removed', oldNo: 21, newNo: undefined, text: 'def total(items: list[float]) -> float:' },
      { kind: 'added', oldNo: undefined, newNo: 21, text: 'def total(items: list[int]) -> int:' },
    ],
    contract: [
      { field: 'GET /api/cart total type', before: 'float dollars', after: 'int cents', breaking: true },
      { field: 'PriceTag component input', before: 'float', after: 'int (mismatch)', breaking: true },
      { field: 'Tax rounding', before: '0.01 drift', after: 'exact cents', breaking: false },
    ],
    impactSummary: {
      affectedJourneys: ['Checkout'],
      mappedCoverage: 71,
      uncoveredComponents: ['PriceTag'],
    },
    graph: {
      nodes: [
        { id: 'total', label: 'total()', category: 'function', x: 400, y: 120, status: 'impacted', detail: 'Return type changed from float dollars to int cents.', file: 'backend/pricing.py' },
        { id: 'api_cart', label: 'GET /api/cart', category: 'endpoint', x: 400, y: 280, status: 'impacted', detail: 'Serializes total() directly. Consumers now receive cents.', file: 'backend/routes/cart.py' },
        { id: 'price_tag', label: 'PriceTag', category: 'component', x: 400, y: 440, status: 'impacted', detail: 'Formats value as float dollars. Will show 100x the intended price.', file: 'frontend/Cart/PriceTag.tsx' },
        { id: 'pw_cart', label: 'Cart.spec.ts', category: 'test', x: 400, y: 600, status: 'impacted', detail: 'Asserts on dollar-formatted totals. Will fail on cents.', file: 'e2e/cart.spec.ts' },
        { id: 'j_checkout', label: 'Checkout', category: 'journey', x: 400, y: 740, status: 'impacted', detail: 'Buyer sees a corrupted cart total.', file: 'journey/checkout.yaml' },
      ],
      edges: [
        { from: 'total', to: 'api_cart', status: 'impacted', label: 'calls' },
        { from: 'api_cart', to: 'price_tag', status: 'impacted', label: 'renders' },
        { from: 'price_tag', to: 'pw_cart', status: 'impacted', label: 'covers' },
        { from: 'pw_cart', to: 'j_checkout', status: 'impacted', label: 'verifies' },
      ],
    },
    repairOptions: [
      {
        id: 'adapter',
        label: 'Backward-Compatible Adapter',
        tagline: 'Serialize cents to float dollars at the API boundary',
        tradeoffs: {
          pros: ['Frontend untouched', 'Single boundary change'],
          cons: ['Reintroduces float drift', 'Temporary shim'],
        },
        effort: 'Low',
        riskLevel: 'Medium',
        recommended: false,
        predictedOutcome: 'Predicted to keep the frontend working but sacrifices the precision the PR was meant to deliver.',
      },
      {
        id: 'update-frontend',
        label: 'Update Frontend Consumers',
        tagline: 'Migrate PriceTag and tests to format cents',
        tradeoffs: {
          pros: ['Keeps precision wins', 'Single source of truth'],
          cons: ['Touches PriceTag + Cart.spec', 'Requires deploy coordination'],
        },
        effort: 'Medium',
        riskLevel: 'Low',
        recommended: true,
        predictedOutcome: 'Predicted to be the clean fix. PriceTag is covered by a test, so risk is lower — but still a prediction until tests run.',
      },
      {
        id: 'feature-flag',
        label: 'Feature Flag / Route Isolation',
        tagline: 'Ship cents behind a flag on the cart route only',
        tradeoffs: {
          pros: ['Safe rollback', 'Isolates blast radius'],
          cons: ['Flag overhead for a small change'],
        },
        effort: 'High',
        riskLevel: 'Low',
        recommended: false,
        predictedOutcome: 'Predicted safe but disproportionately complex for the scope.',
      },
    ],
    tests: [
      { id: 't1', name: 'test_total_returns_cents', status: 'unverified', duration: 0, coverage: 90, kind: 'Unit' },
      { id: 't2', name: 'test_cart_endpoint_serialization', status: 'unverified', duration: 0, coverage: 80, kind: 'Integration' },
      { id: 't3', name: 'Cart.spec.ts — cart totals', status: 'unverified', duration: 0, coverage: 75, kind: 'Playwright' },
    ],
    risks: [
      { id: 'r1', description: 'PriceTag formats cents as dollars, showing 100x prices.', severity: 'high', mitigation: 'Migrate PriceTag formatting and run Cart.spec.ts.' },
      { id: 'r2', description: 'Currency predictions rely on trace data, not executed tests.', severity: 'medium', mitigation: 'Connect the test runner before approving.' },
    ],
  },
  'pr-103': {
    id: 'pr-103',
    number: 103,
    title: 'UI Badge Update',
    file: 'frontend/Cart/Badge.tsx',
    description:
      'Cosmetic change to the cart badge color and label. No backend or contract surface is touched, so impact should be minimal.',
    diff: [
      { kind: 'context', oldNo: 5, newNo: 5, text: 'export function CartBadge({ count }: { count: number }) {' },
      { kind: 'removed', oldNo: 6, newNo: undefined, text: '  return <span className="bg-gray-200">{count}</span>' },
      { kind: 'added', oldNo: undefined, newNo: 6, text: '  return <span className="bg-violet-500 text-white">{count}</span>' },
    ],
    contract: [
      { field: 'Badge prop contract', before: 'count: number', after: 'count: number', breaking: false },
      { field: 'Backend surface', before: 'unchanged', after: 'unchanged', breaking: false },
    ],
    impactSummary: {
      affectedJourneys: [],
      mappedCoverage: 95,
      uncoveredComponents: [],
    },
    graph: {
      nodes: [
        { id: 'badge', label: 'CartBadge', category: 'component', x: 400, y: 200, status: 'unaffected', detail: 'Purely visual change. No data contract altered.', file: 'frontend/Cart/Badge.tsx' },
        { id: 'pw_cart', label: 'Cart.spec.ts', category: 'test', x: 400, y: 420, status: 'unaffected', detail: 'Badge visibility is asserted, not color. Predicted unaffected.', file: 'e2e/cart.spec.ts' },
        { id: 'j_checkout', label: 'Checkout', category: 'journey', x: 400, y: 640, status: 'unaffected', detail: 'No behavioral change to the checkout journey.', file: 'journey/checkout.yaml' },
      ],
      edges: [
        { from: 'badge', to: 'pw_cart', status: 'unaffected', label: 'covers' },
        { from: 'pw_cart', to: 'j_checkout', status: 'unaffected', label: 'verifies' },
      ],
    },
    repairOptions: [
      {
        id: 'adapter',
        label: 'Backward-Compatible Adapter',
        tagline: 'Not applicable — no contract broken',
        tradeoffs: { pros: ['N/A'], cons: ['Unnecessary for a visual change'] },
        effort: 'Low',
        riskLevel: 'Low',
        recommended: false,
        predictedOutcome: 'No adapter needed. The change is non-breaking.',
      },
      {
        id: 'update-frontend',
        label: 'Update Frontend Consumers',
        tagline: 'Already the only change made',
        tradeoffs: { pros: ['Self-contained'], cons: ['None significant'] },
        effort: 'Low',
        riskLevel: 'Low',
        recommended: true,
        predictedOutcome: 'Predicted safe to merge. Still a prediction until tests confirm no visual regression.',
      },
      {
        id: 'feature-flag',
        label: 'Feature Flag / Route Isolation',
        tagline: 'Overkill for a badge color',
        tradeoffs: { pros: ['Rollback path'], cons: ['Unwarranted complexity'] },
        effort: 'High',
        riskLevel: 'Low',
        recommended: false,
        predictedOutcome: 'Not warranted for a cosmetic change.',
      },
    ],
    tests: [
      { id: 't1', name: 'Cart.spec.ts — badge visibility', status: 'unverified', duration: 0, coverage: 95, kind: 'Playwright' },
    ],
    risks: [
      { id: 'r1', description: 'Visual regression is possible but low severity.', severity: 'low', mitigation: 'Run the cart spec to confirm the badge still renders.' },
    ],
  },
};
