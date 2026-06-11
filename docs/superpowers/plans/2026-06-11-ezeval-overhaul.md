# EzEval 2026 Overhaul Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuild ezeval.app from scratch as a multi-tenant SaaS quoting tool for window cleaning businesses per SPEC_2026.md, replacing the 2021 static HTML tool.

**Architecture:** Single SvelteKit app on Vercel: a prerendered marketing landing page at `/`, an authenticated app under `/app`. Neon Postgres via Drizzle ORM. Better Auth for sessions. Stripe Checkout/webhooks for the $5/mo subscription. All tenant data scoped by `businessId`; price visibility enforced server-side.

**Tech Stack:** SvelteKit 2 (Svelte 5) + TypeScript, Tailwind CSS v4, Drizzle ORM + Neon Postgres, Better Auth, Stripe, Leaflet + OpenStreetMap (free), Vitest, `@sveltejs/adapter-vercel`.

---

## Resolved [OPEN] Decisions

| #   | Spec question                      | Decision                                                                                                                                                                                                                                                                                                                                                            | Rationale                                                                                                                                                                                                                                                                                                                                  |
| --- | ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | Astro vs SvelteKit                 | **SvelteKit**                                                                                                                                                                                                                                                                                                                                                       | The product is overwhelmingly an interactive authenticated app; the landing page is one prerendered route (`export const prerender = true`), which SvelteKit handles natively. One framework, one deploy target, first-class Vercel adapter.                                                                                               |
| 2   | Mapping provider                   | **Leaflet + OpenStreetMap tiles + Nominatim geocoding** — all free                                                                                                                                                                                                                                                                                                  | Spec prefers free. Route _optimization_ is computed in-app (nearest-neighbor + 2-opt over haversine distances), so no paid Directions API is required. Nominatim geocodes customer addresses at save time (low volume, 1 req/s limit is fine). Mapbox can be swapped in later behind the same interface if street-level routing is wanted. |
| 3   | Auth                               | **Better Auth** (email + password) with Drizzle adapter                                                                                                                                                                                                                                                                                                             | Modern, actively maintained, native SvelteKit + Drizzle support, session cookies handled for us. Owner signup creates a business; estimators/technicians join via admin-generated invite links (token carries role + business).                                                                                                            |
| 4   | Subscription gating                | Webhook-driven `subscriptionStatus` on the business. `active`/`trialing` → full access; `past_due` → full access + warning banner (Stripe Smart Retries grace); `canceled`/`unpaid`/none → app locked to the billing page. 14-day trial so owners can explore before paying. If Stripe env vars are absent (local dev), billing is bypassed with a console warning. |
| 5   | Technician role                    | Separate `technician` enum value, identical permissions to `estimator`                                                                                                                                                                                                                                                                                              | Spec says permissions are identical so far; keeping the distinct label costs nothing and preserves future divergence + correct UI labeling.                                                                                                                                                                                                |
| 6   | French panes / per-pane pricing UX | Each button has `pricingUnit: 'flat'                                                                                                                                                                                                                                                                                                                                | 'per_unit'`. Tapping any button increments its count by 1; the itemized list has +/− steppers and direct count entry for bulk adjustment (e.g., type 14 for 14 French panes). Line total = price × count either way — `per_unit` is a labeling/semantics distinction ("$1.00/pane").                                                       |
| 7   | Default sheet layout               | Recovered from the old app's `scripts/default_pricing.js` and screenshots                                                                                                                                                                                                                                                                                           | Special: Skylight $18, French $1/pane (per_unit), Setup $22.50; High: Small $5 / Medium $6 / Large $7; Mid: $4/$5/$6; Ground: $3/$4/$5.50. Setup fee auto-attach ON, minimum $0, estimator mode grand-total.                                                                                                                               |

Money is stored as **integer cents** everywhere. All derived pricing math lives in pure functions in `src/lib/pricing/` with full Vitest coverage of spec §4.6.

---

## File Structure

```
src/
  lib/
    server/
      db/
        index.ts            # Neon + Drizzle client
        schema.ts           # all tables (below)
      auth.ts               # Better Auth instance (drizzle adapter)
      billing.ts            # Stripe client, checkout/portal session helpers
      guard.ts              # requireUser/requireAdmin/requireActiveSubscription helpers
      provision.ts          # default price sheet + workflow template for new businesses
      geocode.ts            # Nominatim forward geocoding
    pricing/
      engine.ts             # computeEvaluation(), redactForViewer() — pure
      engine.test.ts
    routing/
      optimize.ts           # haversine, nearestNeighbor, twoOpt, optimizeRoute() — pure
      optimize.test.ts
    components/             # shared UI (Button grid, Modal, RoleBadge, etc.)
  routes/
    +page.svelte            # marketing landing page (prerendered)
    login/ signup/ invite/[token]/
    api/auth/[...all]/      # Better Auth handler
    api/stripe/webhook/
    app/                    # authenticated shell (+layout.server.ts guards)
      +page.svelte          # dashboard / "next appointment"
      sheets/  sheets/[id]/ sheets/[id]/edit/
      evaluate/[sheetId]/   # the core tap tool
      evaluations/ evaluations/[id]/
      customers/ customers/[id]/
      tasks/ tasks/[id]/  runs/
      map/
      team/                 # users + invites (admin)
      workflows/            # workflow template editor (admin)
      settings/             # business info (for future invoicing)
      billing/
```

## Data Model (Drizzle, all FKs cascade within tenant)

- `businesses` — id, name, contact fields (email/phone/address — pre-captured for future invoicing), stripeCustomerId, stripeSubscriptionId, subscriptionStatus, trialEndsAt, timestamps.
- `users` (Better Auth) + additional fields: `businessId`, `role ∈ {admin, estimator, technician}`. Plus Better Auth's `sessions`, `accounts`, `verifications` tables.
- `invitations` — token, businessId, role, email (optional), expiresAt, acceptedAt.
- `priceSheets` — businessId, name, setupFeeEnabled, setupFeeCents, estimatorVisibility ∈ {metrics_only, grand_total}, minimumCents, isDefault, archived.
- `priceSheetRows` — priceSheetId, label ("High Level"), position.
- `priceSheetButtons` — rowId (denorm priceSheetId), label, priceCents, pricingUnit ∈ {flat, per_unit}, position.
- `customers` — businessId, name, email, phone, address fields, lat/lng, propertyNotes, animalNotes.
- `workflowTemplates` — businessId, name, isDefault; `workflowSteps` — templateId, label, position.
- `jobs` (estimation tasks) — businessId, customerId, assigneeId, priceSheetId, scheduledDate, fixedTime (nullable time → flexible when null), status ∈ {scheduled, in_progress, completed, canceled}, routeOrder, notes; `jobWorkflowItems` — jobId, label, position, completedAt (snapshot of template at job creation).
- `evaluations` — businessId, priceSheetId, jobId?, customerId?, createdBy, setupFeeAppliedCents, subtotalCents, minimumAppliedFlag, totalCents, status; `evaluationItems` — evaluationId, buttonId?, label/rowLabel snapshot, sizeLabel, unitPriceCents, quantity, lineTotalCents. (Snapshots make evaluations immune to later sheet edits — needed for future invoicing.)

## Task Breakdown

### Task 1: Branch + clean slate

- [ ] `git checkout -b dev` from main; `git rm` old static files (index/new-quote/pricing/review.html, scripts/, styles/, click.wav, .eslintrc.js); keep favicon.ico, README, SPEC, INTERVIEW, docs/, readme/images (historical reference). Commit "chore: clear 2021 static app for 2026 overhaul".

### Task 2: Scaffold

- [ ] `npx sv create` (TS, vitest, tailwind, drizzle/neon, adapter-vercel) in a temp dir, merge into repo root. `.env.example` with DATABASE*URL, BETTER_AUTH_SECRET, STRIPE*\* , PUBLIC_APP_URL. Verify `npm run build` + `npm test` pass. Commit.

### Task 3: Schema + Neon

- [ ] Write `schema.ts` per data model. Create Neon project (MCP), set `.env` DATABASE_URL, `drizzle-kit push`. Verify tables exist. Commit.

### Task 4: Auth

- [ ] Better Auth instance with drizzle adapter + additionalFields (businessId, role). Signup flow: create business → create user(admin) → provision defaults (Task 5's provision.ts) → redirect /app. Invite flow: /app/team generates `/invite/[token]`; visiting it signs up into that business+role. `guard.ts` helpers; `/app/+layout.server.ts` enforces session. Tests for guard logic. Commit.

### Task 5: Pricing engine (TDD — write tests first)

- [ ] `engine.ts`: `computeEvaluation(sheet, items)` → {subtotal, setupFeeApplied, minimumApplied, total}; `redactForViewer(result, role, sheetVisibility)` → strips unit/line prices (grand_total) or all dollars (metrics_only); admins always full. Tests: every checkbox in spec §4.6 incl. "$12 button → $150 displayed", "metrics-only → no dollar fields present". Commit.

### Task 6: Price sheets

- [ ] `provision.ts` creates the founder default sheet (values above) + default workflow template ("Call customer before arrival"). CRUD pages: list, create, edit (rows/buttons grid editor, toggles, minimum, visibility). Server actions validate admin role. Commit.

### Task 7: Evaluation capture

- [ ] `/app/evaluate/[sheetId]`: mobile-first tap grid grouped by row; running pane count + (visibility-permitting) total; itemized list with steppers; attach to customer/job; save via server action that recomputes pricing server-side and persists snapshots. Estimator UIs never receive price data they shouldn't (redaction happens in `+page.server.ts`, not CSS). Evaluations list + detail with role-correct rendering. Commit.

### Task 8: Customers

- [ ] CRUD with address; geocode on save (best-effort); prominent animal notes field rendered as a warning chip wherever the customer appears on field screens. Commit.

### Task 9: Jobs/runs + workflows

- [ ] Workflow template editor (admin). Job create: customer, assignee, sheet, date, optional fixed time, notes; snapshot workflow steps. Estimator "today" view: ordered stops, next appointment card, check-off workflow items, jump into evaluation. Commit.

### Task 10: Routing + map

- [ ] `optimize.ts` (TDD): haversine; nearest-neighbor seed; 2-opt improvement; fixed-time jobs as ordered anchors, flexible jobs slotted between. `/app/map`: Leaflet, OSM tiles, numbered markers, polyline, "optimize order" action persists routeOrder. Commit.

### Task 11: Billing

- [ ] Stripe: checkout session ($5/mo price, 14-day trial), billing portal, webhook (checkout.session.completed, customer.subscription.updated/deleted) updating business.subscriptionStatus. Gating in `/app/+layout.server.ts` per Decision 4. Banner component for past_due/trial. Commit.

### Task 12: Landing page

- [ ] Prerendered marketing page: hero, problem/solution (pricing-IP protection angle), feature sections, $5/mo pricing card, CTAs. Use frontend-design skill. Commit.

### Task 13: Verify + PR

- [ ] `npm test`, `npm run check`, `npm run build` all green. Rewrite README (stack, setup, env vars, deploy notes). Push dev, PR → main with create-pr skill.

## Self-Review Notes

- Spec coverage: §4.6 → Tasks 5–7; §5.6 → Tasks 8–10; §6 → Task 11; §2.2 → Task 12; §3 → Task 4; future-invoicing data capture (§8) → business contact fields (Task 3) + evaluation snapshots (Task 7).
- Per-sheet setup fee auto-attach handled in engine (Task 5) so it applies "without user action" everywhere evaluations are computed.
- Animals-on-property is first-class: dedicated column + warning chip on job cards/map popups (Tasks 8–9).
