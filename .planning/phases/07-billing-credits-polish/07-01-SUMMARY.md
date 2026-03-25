---
phase: 07-billing-credits-polish
plan: 01
subsystem: billing
tags: [stripe, credits, subscriptions, billing, webhooks]
dependency_graph:
  requires: [auth, database, ai-actions]
  provides: [credit-system, stripe-integration, billing-actions]
  affects: [ai-image-actions, env-validation]
tech_stack:
  added: [stripe, "@stripe/stripe-js"]
  patterns: [atomic-credit-deduction, stripe-webhook, upsert-balance]
key_files:
  created:
    - src/lib/stripe.ts
    - src/lib/credits.ts
    - src/app/api/stripe/webhook/route.ts
    - src/app/actions/billing.ts
  modified:
    - src/lib/db/schema.ts
    - src/lib/env.ts
    - src/app/actions/ai-image.ts
    - package.json
decisions:
  - Used atomic SQL UPDATE with WHERE balance >= cost for credit deduction to prevent race conditions
  - Used upsert pattern for credit balance to auto-create on first grant
  - Placed credit check before AI API call so credits are deducted even if API fails (prevents free usage)
  - Used Stripe Checkout mode=payment for one-time credit packs and mode=subscription for plans
metrics:
  duration: 4min
  completed: "2026-03-25T03:16:40Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 8
---

# Phase 7 Plan 01: Credit System Foundation & Stripe Integration Summary

Stripe billing infrastructure with atomic credit consumption, webhook-driven subscription lifecycle, and credit gating on all AI actions.

## What Was Built

### Task 1: Billing Schema, Stripe Client, Credit Utilities
- **Schema tables**: `plans` (pricing tiers), `subscriptions` (user subscription state), `credit_balances` (current balance per user), `credit_transactions` (audit log of all credit changes)
- **Stripe client** (`src/lib/stripe.ts`): initialized with API version `2026-02-25.clover`
- **Credit utilities** (`src/lib/credits.ts`): `CREDIT_COSTS` map (1-3 credits per action), `checkAndDeductCredits` (atomic SQL deduct), `getCreditBalance`, `addCredits` (upsert pattern)
- **Env validation**: added `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`

### Task 2: Webhook Handler, Billing Actions, Credit Gating
- **Stripe webhook** (`src/app/api/stripe/webhook/route.ts`): handles `checkout.session.completed` (subscription + one-time purchase), `invoice.paid` (monthly renewal grants), `customer.subscription.updated`, `customer.subscription.deleted`
- **Billing actions** (`src/app/actions/billing.ts`): `createCheckoutSession` (subscription), `purchaseCredits` (10/$5, 50/$20, 100/$35), `getSubscriptionStatus` (balance + transactions + plan), `createCustomerPortalSession`
- **Credit gating**: all 5 AI actions (`removeBackground`, `removeObject`, `generateBackground`, `detectText`, `translateText`) now call `checkAndDeductCredits` before AI API execution

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | cb8da51 | Billing schema, Stripe client, credit utilities |
| 2 | d255c8b | Stripe webhook, billing actions, credit gating |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Stripe API version mismatch**
- **Found during:** Task 1
- **Issue:** Initially used `2025-03-31.basil` API version which doesn't match installed stripe package
- **Fix:** Updated to `2026-02-25.clover` matching the installed stripe SDK version
- **Files modified:** src/lib/stripe.ts
- **Commit:** cb8da51

**2. [Rule 1 - Bug] Fixed Invoice.subscription property access**
- **Found during:** Task 2
- **Issue:** Stripe SDK 2026 moved `invoice.subscription` to `invoice.parent.subscription_details.subscription`
- **Fix:** Updated property access path in webhook handler
- **Files modified:** src/app/api/stripe/webhook/route.ts
- **Commit:** d255c8b

## Known Stubs

None. All credit system functionality is wired end-to-end. Plans table needs seed data (plan records with Stripe price IDs) which will be set up during Stripe dashboard configuration.

## Decisions Made

1. **Atomic credit deduction**: Used SQL `UPDATE ... WHERE balance >= cost` to prevent race conditions and double-spending
2. **Credit-before-API pattern**: Credits deducted before AI API call, not after, to prevent free usage on API failures
3. **Upsert balance**: `addCredits` uses `ON CONFLICT DO UPDATE` so balance record is auto-created on first credit grant
4. **Tiered credit packs**: 10/$5, 50/$20, 100/$35 for one-time purchases (volume discount incentive)

## Self-Check: PASSED

All 7 created/modified files exist. Both commit hashes (cb8da51, d255c8b) verified in git log.
