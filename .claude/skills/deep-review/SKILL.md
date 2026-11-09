---
name: deep-review
description: Deep review of a branch or range in EzEval (SvelteKit 2 on Vercel), sized to what changed. Use when the user says "/deep-review", "review my branch", "review dev before the PR", or "is this ready to merge".
argument-hint: '[ref | a..b | #PR | working] [quick | full] [auto]'
based-on: orc-review@1.22.0
template: 4
template-reviewed: 4
---

# Deep review: EzEval

This is a project profile for orc-pack's `orc-review` skill. Invoke the `orc-review` skill with `$ARGUMENTS (profile: .claude/skills/deep-review/SKILL.md)` and run its workflow with the profile below. Edit only the profile; the workflow lives in `orc-review` and updates with the pack. The pack's generic lanes are the base; **Repo lanes** adds this project's specialists only where the base is thin.

## Stack

- **Framework:** SvelteKit 2 (2.70) with Svelte 5 runes (5.56), playbook `frameworks/sveltekit.md`
- **Platform:** Vercel (`adapter-vercel` 6, Node.js runtime), playbook `platforms/vercel.md`
- **Run locally:** `npm run dev` at `http://localhost:5173` (often lands on 5174 or later when another project holds 5173; read the port Vite prints)

## Checks

| Check     | Command                   | When                                                                                        |
| --------- | ------------------------- | ------------------------------------------------------------------------------------------- |
| install   | `npm ci --prefer-offline` | worktree                                                                                    |
| lint      | `npm run lint`            | always                                                                                      |
| typecheck | `npm run check`           | always                                                                                      |
| test      | `npm test`                | always                                                                                      |
| build     | `npm run build`           | remind: `vite.config.ts`, `package.json`, `src/hooks.server.ts`, `src/routes/**/+layout.ts` |

**Never run:** `npm run format` (rewrites files), `npm run db:push`, `npm run db:migrate`, and `npm run db:generate` (the local `.env` points at the live Neon database), `npm run db:studio`.

## Platform constraints

- **Vercel serverless functions on the Node.js runtime.** No route sets an Edge runtime. In-memory state is per instance and does not survive between requests; nothing may rely on a module-level cache for correctness.
- **Neon over the HTTP driver** (`drizzle-orm/neon-http`, `src/lib/server/db/index.ts`): there are no interactive transactions. A multi-statement write is not atomic, so a change that needs all-or-nothing writes must order them so a partial failure leaves valid data.
- **Schema changes ship by `drizzle-kit push`,** not migrations; there is no `drizzle/` directory. A column rename or drop in `schema.ts` is applied to the live database directly, so it must be safe for the code that is still deployed.
- **Preview deployments share the production `DATABASE_URL`** (per the project's deploy notes; not visible in the repo). Preview runs use test-mode Stripe keys, and Stripe webhooks cannot reach preview URLs.
- **The Stripe webhook is registered at `https://www.ezeval.app/api/stripe/webhook`.** The apex host 308-redirects and Stripe does not follow webhook redirects, so the route path must not move.
- **Billing is optional at runtime:** with `STRIPE_SECRET_KEY` or `STRIPE_PRICE_ID` unset, `billingEnabled()` is false and the app runs fully unlocked. Both states must keep working.
- **Nominatim** (`src/lib/server/geocode.ts`) is a free service with a fair-use limit of about one request a second and a required `User-Agent`; calls must stay best-effort with a timeout.

## Risk map

| Surface          | Paths                                                                                                                                                                                                                                                                                                                                                                                                              | Extra lanes |
| ---------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------- |
| Trust boundary   | `src/hooks.server.ts`, `src/app.d.ts`, `src/lib/server/auth.ts`, `src/lib/server/guard.ts`, `src/lib/server/billing.ts`, `src/lib/pricing/engine.ts`, `src/routes/api/**`, `src/routes/login/**`, `src/routes/signup/**`, `src/routes/logout/**`, `src/routes/invite/**`, `src/routes/app/**/+page.server.ts`, `src/routes/app/**/+layout.server.ts`, `src/lib/components/Seo.svelte`, `src/lib/server/geocode.ts` |             |
| Server           | `src/lib/server/**`, `src/routes/**/+page.server.ts`, `src/routes/**/+layout.server.ts`, `src/routes/**/+server.ts`                                                                                                                                                                                                                                                                                                |             |
| Data             | `src/lib/server/db/schema.ts`, `src/lib/server/db/views.sql`, `src/lib/server/metrics.ts`, `drizzle.config.ts`                                                                                                                                                                                                                                                                                                     |             |
| UI               | `src/lib/components/**`, `src/routes/**/*.svelte`, `src/routes/layout.css`, `src/app.html`                                                                                                                                                                                                                                                                                                                         |             |
| Config and infra | `vite.config.ts`, `svelte.config.js` (none yet), `tsconfig.json`, `eslint.config.js`, `.prettierrc`, `.prettierignore`, `.npmrc`, `package.json`, `vercel.json` (none yet), `.github/workflows/**` (none yet)                                                                                                                                                                                                      |             |

## Repo lanes

None: the generic lanes cover this project. Its two central invariants (tenant isolation and price redaction) reach `security-reviewer` through its Extra focus reference file.

| Lane | Owns | Runs when | Standards |
| ---- | ---- | --------- | --------- |

## Ignore

Paths left out of the diff the reviewers read: `static/**` (binary images and `robots.txt`), `readme/images/**`, `src/lib/assets/*.png`.

## Architecture

- **Server-rendered app with no API layer.** Everything under `/app` is a `+page.server.ts` `load` or form action; the only `+server.ts` routes are the Stripe webhook and the prerendered `sitemap.xml`. `/` and the `(marketing)` and `(legal)` groups are prerendered.
- **Every `/app` server `load` and action starts with `requireUser`, `requireAdmin`, or `requireOwner`** (`src/lib/server/guard.ts`) and filters every query by `user.businessId`. Form actions do not run the layout `load`, so the guard in `app/+layout.server.ts` never protects an action.
- **Domain logic lives in `src/lib/server/`** (provisioning, sheet editing, billing, geocoding, metrics) and **pure logic in `src/lib/pricing/` and `src/lib/routing/`**, which import nothing server-only and are shared with the client.
- **Pricing is computed on the server only, from DB truth** (`src/lib/pricing/engine.ts`). The client tap UI posts metrics (button ids and quantities). The one client-side pricing call is the marketing `TapDemo.svelte`, which prices the public `SAMPLE_SHEET`, never a tenant's sheet.
- **Money is integer cents** (`parseDollarsToCents` in `src/lib/pricing/money.ts`), **tax rates are integer milli-percent**, and taxes apply in parallel on one base, never compounded.
- **Input validation is hand-written,** not a schema library: actions parse `FormData` themselves and return `fail(status, data)` on bad input. The playbook's "validated by the repo's schema library" means these parsers here; adding a schema library is not a fix to suggest per finding.
- **Tests sit beside the code they cover** (`*.test.ts` next to the module) and run in one Vitest `server` project under Node. There are no component or browser tests.
- **Light theme only.** Design tokens are in `src/routes/layout.css` (`ink`, `brand`, `glass`, paper surfaces; Barlow, Barlow Condensed, Spline Sans Mono for numbers). There is no dark mode, so the UI standard's theme-parity rule does not apply.
- **Plain string `href`s are intentional** (the app has no base path); `svelte/no-navigation-without-resolve` is off in `eslint.config.js`.

## Intentional non-issues

- `src/lib/server/guard.ts` `ownerEmail()` falls back to the founder's email when `OWNER_EMAIL` is unset. The platform owner is one fixed person by design, and the fallback grants nothing beyond what that account already holds.
- `requireOwner` answers non-owners with 404, not 403, so the metrics route isn't advertised.
- `src/lib/server/geocode.ts` swallows every error and returns `null`: geocoding is best-effort and a customer stays "unmapped" until edited.
- `src/lib/components/TapDemo.svelte` runs `computeEvaluation` in the browser. It prices only the public sample sheet in `src/lib/pricing/sample-sheet.ts`.
- `src/lib/server/db/views.sql` is applied by hand, not by `drizzle-kit push`; the app does not depend on the views.
- `vite.config.ts` picks `adapter-auto` locally and `adapter-vercel` only when `VERCEL=1`, because the Vercel adapter's symlinks fail on Windows without Developer Mode.
- `src/routes/app/welcome/+page.server.ts` has no guard: it only redirects, reads no data, and the `/app` layout `load` already requires a user.
- `src/lib/vitest-examples/` is the SvelteKit starter's sample test.

## Extra focus

### security-reviewer: tenant isolation and price redaction

Reference: `.claude/skills/deep-review/references/security-reviewer.md`

- Blocker: a `+page.server.ts` `load` or action under `src/routes/app/` that reads or writes tenant data without first calling `requireUser`, `requireAdmin`, or `requireOwner`.
- Blocker: a query on a tenant table that isn't filtered by the session user's `businessId`, or that trusts a `businessId` or `role` from form data, params, or the client.
- Blocker: a non-admin `load` that returns a button price, a line price, or a subtotal the sheet's `estimatorVisibility` hides, or a redaction that sets a hidden field to `null` instead of deleting it.
- Blocker: an action that accepts a price, total, or tax amount from the client instead of repricing from the database.

### quality-reviewer: money and pricing

Paths: `src/lib/pricing/**`, `src/routes/app/evaluate/**`, `src/routes/app/evaluations/**`, `src/routes/app/sheets/**`, `src/routes/app/settings/**`

- Warning: money handled as a float or a dollar string past the input parser; every amount is integer cents, and user input goes through `parseDollarsToCents`.
- Warning: a tax rate stored or computed as a percent or a float instead of integer milli-percent, or taxes compounded instead of applied in parallel on one base.

### architecture-reviewer: schema changes

Paths: `src/lib/server/db/schema.ts`

- Warning: a column rename, drop, or `NOT NULL` without a default. `drizzle-kit push` applies it to the live database the deployed code still reads, so it needs an expand and contract plan in the change.
