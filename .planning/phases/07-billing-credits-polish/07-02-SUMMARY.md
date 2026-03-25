---
phase: 07-billing-credits-polish
plan: 02
subsystem: billing
tags: [stripe, checkout, webhook, credits, subscriptions, billing-portal]
dependency_graph:
  requires: [credit-system, stripe-integration]
  provides: [checkout-api, webhook-handler, billing-portal]
  affects: [subscription-lifecycle, credit-balance]
tech_stack:
  added: []
  patterns: [idempotent-set-credits, bonus-vs-monthly-credits, stripe-billing-portal]
key_files:
  created:
    - src/app/api/stripe/checkout/route.ts
  modified:
    - src/app/api/stripe/webhook/route.ts
decisions:
  - Used API route handler (not server action) for checkout to support both POST (create session) and GET (billing portal)
  - Top-up credits tracked as bonusCredits (non-expiring per D-14) distinct from monthlyCredits
  - Monthly credit resets use idempotent SET (not increment) to prevent double-credit on webhook retry
  - Subscription deletion reverts to free tier with 50 monthlyCredits (D-06, D-08)
metrics:
  duration: 2min
  completed: "2026-03-25T03:26:24Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 2
---

# Phase 7 Plan 02: Stripe Checkout & Webhook Routes Summary

Stripe Checkout session API route for subscription and credit top-up, enhanced webhook with idempotent monthly resets and bonusCredits tracking.

## What Was Built

### Task 1: Stripe Checkout Session API Route
- **POST /api/stripe/checkout**: Creates Stripe Checkout sessions for both subscription signup (`mode: "subscription"`) and one-time credit top-up (`mode: "payment"`)
- **GET /api/stripe/checkout**: Creates Stripe Billing Portal session for self-service subscription management
- Looks up or creates Stripe customer for authenticated user
- Supports both plan ID lookup and direct Stripe Price ID
- Credit pack pricing: 10/$5, 50/$20, 100/$35

### Task 2: Enhanced Stripe Webhook Handler
- **checkout.session.completed**: Handles subscription creation (upserts subscription, sets monthlyCredits) and credit top-up (adds bonusCredits, non-expiring per D-14)
- **invoice.paid**: Monthly credit reset using idempotent SET (not increment) to prevent double-credit on webhook retry
- **customer.subscription.updated**: Updates subscription status and adjusts monthlyCredits on plan change
- **customer.subscription.deleted**: Reverts to free tier with 50 monthlyCredits (D-06, D-08)
- Signature verification using raw body text (req.text(), not req.json())

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 640612b | Create Stripe Checkout session API route with billing portal |
| 2 | 7085815 | Enhance webhook with bonusCredits, monthlyCredits, idempotent resets |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Functionality] Enhanced existing webhook from 07-01**
- **Found during:** Task 2
- **Issue:** 07-01 already created a basic webhook handler, but it lacked bonusCredits/monthlyCredits distinction, idempotent SET for monthly resets, and free tier revert on cancellation
- **Fix:** Rewrote webhook to add bonusCredits tracking for top-ups, idempotent SET for monthly resets, and free tier (50 credits) revert on subscription deletion
- **Files modified:** src/app/api/stripe/webhook/route.ts
- **Commit:** 7085815

## Known Stubs

None. Both checkout and webhook routes are fully functional.

## Decisions Made

1. **API route over server action for checkout**: Used route handler to support both POST (checkout) and GET (billing portal) HTTP methods cleanly
2. **Bonus vs monthly credit distinction**: Top-up credits are tracked as bonusCredits (non-expiring), monthly subscription credits are monthlyCredits (reset each cycle)
3. **Idempotent SET for monthly resets**: Uses SET (not increment) to prevent double-crediting on Stripe webhook retries
4. **Free tier revert**: Subscription cancellation resets balance to 50 credits (free tier allowance)

## Self-Check: PASSED

All 2 created/modified files exist. Both commit hashes (640612b, 7085815) verified in git log.
