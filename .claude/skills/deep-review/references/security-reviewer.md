# EzEval trust model

## Who the attacker is

1. **A signed-in user of another business** who edits ids in URLs or form posts to reach a different tenant's customers, evaluations, sheets, tasks, or team.
2. **A signed-in estimator or technician** in the same business who tries to learn the pricing model the owner hides from field staff, by reading page data, network payloads, or posting crafted actions.
3. **An anonymous visitor** hitting the auth routes, the invite route, or the Stripe webhook.

The founder's platform-owner account (`requireOwner`) is trusted and reads across tenants by design.

## The trust boundary

- `src/hooks.server.ts` resolves the Better Auth session into `event.locals.user` and `event.locals.session`. Nothing else populates them.
- `src/lib/server/auth.ts` declares `businessId` and `role` with `input: false`, so a sign-up request can't set them. Server code assigns them after Better Auth creates the user (`src/routes/signup/+page.server.ts`, `src/routes/invite/[token]/+page.server.ts`).
- `src/lib/server/guard.ts`: `requireUser` (signed in and attached to a business), `requireAdmin` (per-business admin, else 403), `requireOwner` (platform owner by email, else 404).
- `src/routes/api/stripe/webhook/+server.ts` is the only unauthenticated write path; it trusts an event only after `constructEventAsync` verifies the signature against `STRIPE_WEBHOOK_SECRET`.

## Canonical controls

- **Guard first.** Every `load` and action under `src/routes/app/` calls a guard before it touches data. The `/app` layout `load` does not run for form actions, so each action calls its own guard.
- **Scope by session.** Every query on a table with a `businessId` column (`businesses` by its `id`, `businessTaxes`, `customers`, `evaluations`, `invitations`, `jobs`, `priceSheets`, `user`, `workflowTemplates`) filters by `user.businessId` from the guard's return value. A row id from params or form data is looked up with `and(eq(table.id, id), eq(table.businessId, user.businessId))`, never by id alone. Child tables without the column (`priceSheetRows`, `priceSheetButtons`, `workflowSteps`, `jobWorkflowItems`, `evaluationItems`, `evaluationTaxes`) are reached only through a parent row already checked against the business; a write that takes a child id from the request must confirm that the child's parent belongs to the business.
- **Role from the session.** Admin-only actions call `requireAdmin`; role checks never read a field from the request.
- **Price redaction.** Non-admin loads never include button prices: `src/routes/app/evaluate/[sheetId]/+page.server.ts` spreads price fields only when `isAdmin`. Saved evaluations pass through `redactForViewer` in `src/lib/pricing/engine.ts`, which deletes hidden fields rather than nulling them. A sheet's `estimatorVisibility` is `metrics_only` (quantities only) or `grand_total` (only `totalCents`, which the sheet minimum may floor). The `grand_total` view omits the setup fee, subtotal, and minimum flag, because those would let an estimator back out button prices.
- **Server-side pricing.** The evaluate action receives button ids and quantities, loads the sheet's buttons from the database scoped to the business, and prices them with `computeEvaluation` and `computeTaxes`. A client-sent price is never used.
- **Billing state from Stripe only.** `businesses.subscriptionStatus`, `stripeCustomerId`, and `stripeSubscriptionId` are written only by the verified webhook. No app code writes `comped`; it is set by hand in the database.

## Sanctioned exposures

- `/app/admin` reads every tenant's data, gated by `requireOwner`.
- An admin sees every price in their own business.
- `src/lib/components/Seo.svelte` renders JSON-LD with `{@html}`, escaping `<` after `JSON.stringify`. Today its `jsonLd` prop comes only from constants in the prerendered marketing pages; passing it user or tenant data is a finding.
- The marketing `TapDemo.svelte` shows prices for the public sample sheet.
