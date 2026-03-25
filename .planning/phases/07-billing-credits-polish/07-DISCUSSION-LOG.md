# Phase 7: Billing, Credits & Polish - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 07-billing-credits-polish
**Areas discussed:** Stripe integration, Credit pricing, Subscription tiers, Dark mode, Usage dashboard
**Mode:** --auto (all decisions auto-selected)

---

## Stripe Integration Pattern

| Option | Description | Selected |
|--------|-------------|----------|
| Stripe Checkout (redirect) | Redirect to Stripe-hosted page for payments | ✓ |
| Stripe Elements (embedded) | Embed payment form directly in app | |
| Stripe Pricing Table | Pre-built pricing table component | |

**User's choice:** [auto] Stripe Checkout (redirect)
**Notes:** Simplest integration, handles PCI compliance automatically. Webhook-driven for all state changes.

---

## Credit Pricing Model

| Option | Description | Selected |
|--------|-------------|----------|
| Fixed credits per operation | Each AI feature has a set credit cost | ✓ |
| Variable credits by input size | Cost scales with image dimensions | |
| Flat rate per operation type | All AI ops cost the same | |

**User's choice:** [auto] Fixed credits per operation
**Notes:** Transparent, predictable for users. Range: 1-3 credits per operation.

---

## Subscription Tiers

| Option | Description | Selected |
|--------|-------------|----------|
| Free 50 / Pro 500 / Enterprise unlimited | Three tiers with monthly credit allocation | ✓ |
| Free 20 / Pro 200 / Enterprise 2000 | Lower allocations, all capped | |
| Pay-as-you-go only | No subscriptions, just credit purchases | |

**User's choice:** [auto] Free 50 / Pro 500 / Enterprise unlimited
**Notes:** Standard SaaS tiering. Free tier allows meaningful trial usage.

---

## Dark Mode Approach

| Option | Description | Selected |
|--------|-------------|----------|
| next-themes + Tailwind dark: variant | Standard Next.js dark mode with CSS variables | ✓ |
| CSS-only toggle | Manual CSS custom properties without library | |
| Styled-components ThemeProvider | Component-level theming | |

**User's choice:** [auto] next-themes + Tailwind dark: variant
**Notes:** shadcn/ui already supports dark mode. Minimal custom work needed.

---

## Usage Dashboard Layout

| Option | Description | Selected |
|--------|-------------|----------|
| Credit card + usage table | Balance overview card + recent transactions table | ✓ |
| Full analytics dashboard | Charts, graphs, detailed breakdowns | |
| Minimal inline display | Credits shown in sidebar only | |

**User's choice:** [auto] Credit card + usage table
**Notes:** Clean, informative without over-engineering. Uses existing shadcn/ui components.

---

## Claude's Discretion

- Exact subscription pricing
- Top-up package sizes
- Usage chart type
- Credit display in editor toolbar

## Deferred Ideas

- Email notifications for credit depletion (v2)
- In-app notifications (v2)
- Team workspaces with shared credits (v2)
