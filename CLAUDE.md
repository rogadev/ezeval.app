# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

EzEval is tap-to-quote SaaS for window-cleaning (and similar field-service) trades. An estimator
walks a property, taps buttons on a configurable price sheet, and the app builds an itemized
evaluation — with owner-controlled price visibility so field staff can capture quotes without ever
seeing the pricing model. Full background lives in `README.md`, `SPEC_2026.md`, and the
implementation plan at `docs/superpowers/plans/2026-06-11-ezeval-overhaul.md`.

## Commands

```sh
npm run dev            # vite dev server (http://localhost:5173)
npm run build          # production build
npm run check          # svelte-kit sync + svelte-check (type/Svelte diagnostics)
npm run lint           # prettier --check . && eslint .
npm run format         # prettier --write .
npm test               # vitest, single run
npm run test:unit      # vitest in watch mode
npm run db:push        # drizzle-kit: sync schema.ts straight to the DB (dev workflow)
npm run db:generate    # drizzle-kit: emit a SQL migration
npm run db:migrate     # drizzle-kit: apply migrations
npm run db:studio      # drizzle-kit studio
```

Run a single test file or pattern:

```sh
npx vitest run src/lib/pricing/engine.test.ts
npx vitest run -t "applies the minimum floor"
```

Local setup: `cp .env.example .env`, fill `DATABASE_URL` + `BETTER_AUTH_SECRET`, then `npm run db:push`.
Stripe vars are optional — see Billing below. `engine-strict=true` in `.npmrc` enforces the Node
version, so use the repo's expected Node.

## Architecture

**Stack:** SvelteKit 2 (Svelte 5 **runes**) + TypeScript · Tailwind CSS v4 · Neon Postgres via
Drizzle ORM · Better Auth · Stripe · Leaflet/OSM. There is **no `svelte.config.js`** — SvelteKit is
configured inline in `vite.config.ts`, which also forces runes mode for all non-`node_modules` files
and selects the adapter: `adapter-vercel` only when `VERCEL=1`, otherwise `adapter-auto` (Vercel's
adapter creates symlinks that fail on Windows without Developer Mode).

**Multi-tenancy is the central invariant.** Every domain row is scoped by `businessId`; each user
carries a `role` of `admin` / `estimator` / `technician`. `src/lib/server/guard.ts` is the gate:
`requireUser` (redirects to `/login`, enforces an attached business) and `requireAdmin` (403s
non-admins). Every server `load`/`action` under `/app` starts by calling one of these, then filters
all queries by `user.businessId`. Never trust a `businessId`/`role` from the client.

**Auth** is Better Auth (email/password) with the Drizzle adapter (`src/lib/server/auth.ts`).
`src/hooks.server.ts` resolves the session and populates `event.locals.user` / `event.locals.session`
(typed in `src/app.d.ts`). The tenant fields `businessId` and `role` are declared `input: false` —
they are never client-settable; our own server code assigns them right after Better Auth creates the
user row (`provisionBusinessDefaults`).

**Pricing engine (`src/lib/pricing/engine.ts`) is the security-critical core — read it before
touching anything price-related.** Rules:

- **The server is the only place evaluations are priced.** Client tap UIs work purely on _metrics_
  (button taps + quantities) and POST those; the server reprices from DB truth on save. Non-admin
  page loads never include button prices (see `evaluate/[sheetId]/+page.server.ts` for the redaction
  pattern of conditionally spreading price fields only for admins).
- **Redaction deletes fields, never nulls them** (`redactForViewer`), so a serialized payload to a
  non-admin contains no trace of hidden dollar values. Per-sheet `estimatorVisibility` is
  `metrics_only` or `grand_total`; the floored grand total deliberately masks single-button prices.
- **All money is integer cents.** Parse user input with `parseDollarsToCents` (`money.ts`), which
  rejects sub-cent precision and negatives. **Tax rates are integer milli-percent** (5% = 5000,
  QST 9.975% = 9975) so three-decimal Canadian rates stay exact; taxes apply in parallel on the same
  base, never compounded (`computeTaxes`).

**Other domain modules** (`src/lib/server/`): `provision.ts` seeds every new business with the
founder's default Residential price sheet, a standard workflow template, and a GST tax profile;
`sheets.ts` builds the nested sheet grid and validates edits; `geocode.ts` wraps Nominatim;
`billing.ts` wraps Stripe. `src/lib/routing/optimize.ts` is a pure TSP heuristic
(nearest-neighbor + 2-opt, fixed-time stops as chronological anchors) — no paid directions API.

**Database:** single schema file `src/lib/server/db/schema.ts` (businesses, users/sessions/accounts,
invitations, price sheets/rows/buttons, customers, workflow templates/steps, jobs, evaluations +
items/taxes). `db/index.ts` uses the Neon HTTP driver. Dev iterates with `db:push`; generate
migrations only when needed.

**Billing is optional.** With no `STRIPE_SECRET_KEY`/`STRIPE_PRICE_ID`, `billingEnabled()` is false,
the app runs fully unlocked, and trial/billing UI is hidden. When configured, `app/+layout.server.ts`
calls `accessState()` and locks lapsed businesses to `/app/billing` (only `/app/more` stays reachable
so they can sign out). The Stripe webhook lives at `/api/stripe/webhook`.

**Routing:** `/` is a prerendered marketing page; the `(legal)` group is static; everything under
`/app` is server-rendered behind auth. SvelteKit's `+page.server.ts` `load`/`actions` pattern is used
throughout — there is no separate API layer beyond the Stripe webhook.

## Conventions

- **Design tokens** live in `src/routes/layout.css` (Tailwind v4 `@theme`) — the "High-Vis Trade Kit":
  `ink` (structure), `brand` (amber accent), `glass` (success), paper surfaces; Barlow / Barlow
  Condensed (display) / Spline Sans Mono (all numbers, tabular). Use these tokens, not raw hex.
- **Prettier** (the formatter of record): tabs, single quotes, no trailing comma, `printWidth: 100`,
  with the Svelte and Tailwind plugins. Run `npm run format` before committing.
- ESLint flat config disables `svelte/no-navigation-without-resolve` — the app deploys at the domain
  root, so plain string `href`s are intentional; don't wrap them in `resolve()`.
