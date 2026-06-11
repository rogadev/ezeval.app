# EzEval

Tap-to-quote SaaS for window cleaning businesses (and similar field-service trades). An estimator
walks the property, taps buttons on a configurable price sheet, and the app builds an itemized
evaluation — with owner-controlled price visibility so field staff can capture quotes without ever
seeing the pricing model behind them.

Built from [`SPEC_2026.md`](./SPEC_2026.md). The implementation plan with all resolved open
decisions lives at
[`docs/superpowers/plans/2026-06-11-ezeval-overhaul.md`](./docs/superpowers/plans/2026-06-11-ezeval-overhaul.md).

## Stack

| Layer     | Choice                                                              |
| --------- | ------------------------------------------------------------------- |
| Framework | SvelteKit 2 (Svelte 5 runes) + TypeScript                           |
| Styling   | Tailwind CSS v4 (design tokens in `src/routes/layout.css`)          |
| Database  | Neon Postgres via Drizzle ORM (`src/lib/server/db/schema.ts`)       |
| Auth      | Better Auth (email/password, invite-link team enrollment)           |
| Payments  | Stripe ($5/month subscription, Checkout + Billing Portal + webhook) |
| Mapping   | Leaflet + OpenStreetMap tiles + Nominatim geocoding (all free)      |
| Hosting   | Vercel (`@sveltejs/adapter-vercel`)                                 |

## Key concepts

- **Multi-tenancy** — every row is scoped by `businessId`; users carry a role
  (`admin` / `estimator` / `technician`).
- **Price sheets** — rows by access level (Special / High / Mid / Ground by default), buttons with
  flat or per-pane pricing, auto-attaching setup fee, minimum quote floor, and a per-sheet
  estimator visibility mode (`metrics_only` or `grand_total`).
- **Anti-leakage** — redaction happens server-side (`src/lib/pricing/engine.ts`): non-admin page
  loads never include price data, the server reprices taps from DB truth on save, and the minimum
  floor masks single-button totals.
- **Jobs & runs** — estimation appointments with fixed-time vs flexible semantics, per-business
  workflow checklists (snapshotted per job), and first-class animals-on-property warnings.
- **Route optimization** — pure TSP heuristics (`src/lib/routing/optimize.ts`): nearest-neighbor +
  2-opt with fixed-time stops as chronological anchors. No paid directions API.

## Development

```sh
npm install
cp .env.example .env   # fill in DATABASE_URL + BETTER_AUTH_SECRET (Stripe optional)
npm run db:push        # sync schema to your Neon database
npm run dev
```

Without Stripe keys the app runs fully unlocked and the billing page explains the unconfigured
state — set `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID`, and `STRIPE_WEBHOOK_SECRET` to enable
subscription gating (14-day trial, then locked to `/app/billing`).

```sh
npm test               # vitest (pricing engine, money parsing, sheet validation, routing)
npm run check          # svelte-check
npm run lint           # prettier + eslint
npm run build          # production build (Vercel packaging runs on Vercel; local uses adapter-auto)
```

## Deploying

Deploys to Vercel. Set the env vars from `.env.example` in the Vercel project, point the Stripe
webhook at `/api/stripe/webhook`, and connect the `ezeval.app` domain. The marketing landing page
at `/` is prerendered; everything under `/app` is server-rendered behind auth.

## History

The original 2021 single-user static tool this replaces is preserved in git history (and its
screenshots in `readme/images/`). Its default price sheet lives on as the sheet every new business
is provisioned with.
