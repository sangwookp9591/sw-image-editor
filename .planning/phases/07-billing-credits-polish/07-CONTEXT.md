# Phase 7: Billing, Credits & Polish - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can subscribe to plans (Free/Pro/Enterprise), purchase additional credits, track their usage on a dashboard, and toggle dark mode. AI features consume credits at differentiated rates and are blocked when credits are exhausted. This is the final phase before public launch.

</domain>

<decisions>
## Implementation Decisions

### Stripe Integration
- **D-01:** Stripe Checkout (redirect mode) for both subscription signup and one-time credit purchases
- **D-02:** Webhook-driven architecture: `/api/stripe/webhook` route handles all Stripe events
- **D-03:** Key events: `checkout.session.completed`, `invoice.paid`, `customer.subscription.updated`, `customer.subscription.deleted`
- **D-04:** Install `stripe` (server SDK) and `@stripe/stripe-js` (client SDK)
- **D-05:** Stripe CLI for local webhook testing: `stripe listen --forward-to localhost:3000/api/stripe/webhook`

### Subscription Tiers
- **D-06:** Three tiers: Free (50 credits/month, $0), Pro (500 credits/month, research determines price), Enterprise (unlimited, research determines price)
- **D-07:** Credits reset monthly on billing cycle date
- **D-08:** Free tier auto-assigned on signup (no Stripe customer needed until upgrade)
- **D-09:** Pro and Enterprise require Stripe Checkout subscription

### Credit System
- **D-10:** Credits consumed per AI operation:
  - Background removal: 1 credit
  - Object removal: 2 credits
  - AI background generation: 2 credits
  - Text detection (OCR): 1 credit
  - Text replacement (inpaint + render): 3 credits
  - Translation: 1 credit
  - Upscale (2x or 4x): 2 credits
  - Style transfer: 2 credits
- **D-11:** Credit check before AI operation — reject with toast if insufficient
- **D-12:** Credit deduction after successful AI operation (not before, to avoid charging on failures)
- **D-13:** One-time credit top-up packages via Stripe Checkout (e.g., 100 credits, 500 credits)
- **D-14:** Top-up credits don't expire (only monthly allocation resets)

### Database Schema
- **D-15:** New tables: `subscriptions` (userId, stripeCustomerId, stripeSubscriptionId, plan, status, currentPeriodEnd), `credit_balances` (userId, monthlyCredits, bonusCredits, resetAt), `credit_transactions` (userId, type, amount, operation, createdAt)
- **D-16:** Drizzle ORM migration for new tables
- **D-17:** Server Actions for credit operations: checkCredits, deductCredits, getCreditBalance

### Usage Dashboard
- **D-18:** New dashboard page at `/dashboard/usage` (or section in existing dashboard)
- **D-19:** Credit balance card: remaining credits / total allocation, visual progress bar
- **D-20:** Current plan display with upgrade/manage subscription button
- **D-21:** Recent usage table: operation type, credits consumed, timestamp (last 30 days)
- **D-22:** Reuse existing dashboard layout and shadcn/ui components (Card, Table, Progress)

### Dark Mode
- **D-23:** next-themes package for theme management
- **D-24:** ThemeProvider wrapping app layout, class strategy with Tailwind `dark:` variant
- **D-25:** Toggle button in dashboard header and editor toolbar
- **D-26:** Persist preference in localStorage (next-themes default behavior)
- **D-27:** All shadcn/ui components already support dark mode via CSS variables — minimal custom work

### AI Credit Enforcement
- **D-28:** Wrap existing AI server actions with credit check middleware
- **D-29:** Before each AI call: check balance → if insufficient, throw error → client shows toast
- **D-30:** After successful AI call: deduct credits → log transaction
- **D-31:** Dashboard credit display updates after each operation

### Claude's Discretion
- Exact subscription pricing ($10/month for Pro, $30/month for Enterprise — research determines)
- Top-up package sizes and prices
- Credit transaction table column design
- Whether to show credits remaining in editor toolbar
- Usage chart type (bar chart vs simple table)
- Stripe product/price IDs (created during setup)

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Core value, constraints
- `.planning/REQUIREMENTS.md` — BILL-01~04, UI-04 requirements

### Auth infrastructure (Phase 1)
- `src/lib/auth.ts` — Better Auth configuration
- `src/lib/auth-client.ts` — Client-side auth hooks
- `src/lib/db/schema.ts` — Current DB schema (users, sessions, accounts, projects, images)
- `src/lib/db/index.ts` — Drizzle DB instance

### Dashboard (Phase 1 + Phase 3)
- `src/app/(dashboard)/` — Dashboard route group layout
- `src/components/dashboard/` — Dashboard components
- `src/components/layout/` — Layout components (header, sidebar)

### AI actions (Phase 4-6)
- `src/app/actions/ai-image.ts` — All AI server actions that need credit wrapping
- `src/lib/ai/providers.ts` — AI provider configuration

### Existing patterns
- `src/app/api/` — API route pattern (auth, upload, ai)
- `drizzle.config.ts` — Drizzle migration config

### Research
- `.planning/research/STACK.md` — Stripe, Better Auth compatibility notes
- `.planning/research/PITFALLS.md` — Billing edge cases

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/db/schema.ts` — Extend with subscription/credit tables
- `src/app/actions/` — Server Action pattern for credit operations
- `src/components/ui/*` — shadcn/ui Card, Table, Progress, Button, Slider
- `src/components/layout/` — Dashboard layout (header, sidebar)
- `src/lib/auth.ts` — Better Auth session for user identification

### Established Patterns
- Server Actions for mutations
- Drizzle ORM for DB operations (drizzle-kit push for dev, generate+migrate for prod)
- Route groups: (auth), (dashboard), (editor)
- Toast notifications via sonner
- requireAuth() pattern in server actions

### Integration Points
- AI server actions: wrap with credit check/deduct middleware
- Dashboard: add usage page/section
- Dashboard header: add dark mode toggle
- Editor toolbar: optionally show credit balance
- New API route: /api/stripe/webhook
- Layout: wrap with ThemeProvider (next-themes)
- Package.json: add stripe, @stripe/stripe-js, next-themes

</code_context>

<specifics>
## Specific Ideas

- Stripe is the designated payment provider per CLAUDE.md tech stack
- Better Auth handles user identity; Stripe handles billing identity (stripeCustomerId linked to userId)
- Dark mode is low-effort since shadcn/ui + Tailwind already supports it via CSS variables
- Credit system should be simple and transparent — users see exactly what each operation costs

</specifics>

<deferred>
## Deferred Ideas

- Email notifications for credit depletion warnings (NOTF-01 — v2)
- In-app notifications for AI processing completion (NOTF-02 — v2)
- Team workspaces with shared credit pools (ADV-04 — v2)

</deferred>

---

*Phase: 07-billing-credits-polish*
*Context gathered: 2026-03-25*
