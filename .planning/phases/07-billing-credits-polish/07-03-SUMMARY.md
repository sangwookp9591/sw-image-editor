---
phase: 07-billing-credits-polish
plan: 03
subsystem: billing
tags: [credits, usage-dashboard, credit-gating, pricing]
dependency_graph:
  requires: [credit-system, stripe-integration, billing-actions]
  provides: [credit-gated-ai-actions, usage-dashboard]
  affects: [ai-image-actions, sidebar-navigation]
tech_stack:
  added: []
  patterns: [server-component-data-fetching, atomic-credit-check, progress-bar]
key_files:
  created:
    - src/app/(dashboard)/usage/page.tsx
    - src/components/billing/credit-balance.tsx
    - src/components/billing/usage-table.tsx
    - src/components/billing/pricing-cards.tsx
  modified:
    - src/app/actions/ai-image.ts
    - src/lib/credits.ts
    - src/components/layout/sidebar.tsx
decisions:
  - Added upscaleImage and styleTransfer to CREDIT_COSTS (2 credits each) since 07-01 only covered 5 of 7 AI actions
  - Used server component for usage page so credit balance is always fresh on navigation (no client polling needed)
  - Used simple div-based progress bar instead of installing shadcn Progress component
metrics:
  duration: 3min
  completed: "2026-03-25T03:28:00Z"
  tasks_completed: 2
  tasks_total: 2
  files_changed: 7
---

# Phase 7 Plan 03: Credit Gating & Usage Dashboard Summary

All 7 AI actions credit-gated with per-operation costs, usage dashboard at /dashboard/usage with balance card, pricing tiers, and transaction history.

## What Was Built

### Task 1: Credit Gating on All AI Actions
- Extended `CREDIT_COSTS` in `src/lib/credits.ts` to include `upscaleImage` (2 credits) and `styleTransfer` (2 credits)
- Added `checkAndDeductCredits` calls to `upscaleImage` and `styleTransfer` in `src/app/actions/ai-image.ts`
- All 7 AI server actions (removeBackground, removeObject, generateBackground, detectText, translateText, upscaleImage, styleTransfer) now enforce credit checks before execution and deduct after success

### Task 2: Usage Dashboard Page
- **CreditBalance** (`src/components/billing/credit-balance.tsx`): Card with large credit number, progress bar, and plan label
- **PricingCards** (`src/components/billing/pricing-cards.tsx`): Three subscription tiers (Free $0/50 credits, Pro $12/500 credits, Enterprise $39/unlimited) with upgrade buttons, plus credit top-up packs (10/$5, 50/$20, 100/$35) with buy buttons
- **UsageTable** (`src/components/billing/usage-table.tsx`): Transaction history table with date, operation, type, and color-coded credit amounts
- **Usage page** (`src/app/(dashboard)/usage/page.tsx`): Server component fetching live data via `getSubscriptionStatus`, renders all three billing components
- **Sidebar nav**: Added "Usage" link with CreditCard icon to sidebar navigation

## Commits

| Task | Commit | Description |
|------|--------|-------------|
| 1 | 9f07361 | Add credit gating to upscaleImage and styleTransfer actions |
| 2 | a4956a6 | Build usage dashboard with credit balance, pricing cards, and usage table |

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 2 - Missing Critical] Added missing credit costs for upscaleImage and styleTransfer**
- **Found during:** Task 1
- **Issue:** Plan 07-01 only added credit gating for 5 of 7 AI actions. The `upscaleImage` and `styleTransfer` functions (added in Phase 06) had no credit enforcement and no entries in CREDIT_COSTS.
- **Fix:** Added both operations to CREDIT_COSTS (2 credits each) and wired checkAndDeductCredits into both functions.
- **Files modified:** src/lib/credits.ts, src/app/actions/ai-image.ts
- **Commit:** 9f07361

## Known Stubs

None. All components render real data from the database. Stripe price IDs in PricingCards use server action `createCheckoutSession(planId)` which looks up the price from the plans table (seeded during Stripe setup).

## Decisions Made

1. **2 credits for upscale and style transfer**: Aligned with the plan's differentiated pricing (1-3 range). These are moderate-cost operations.
2. **Server-rendered usage page**: No client-side polling needed; credit balance is always current on page navigation.
3. **div-based progress bar**: Used simple styled divs instead of adding a new shadcn component for the credit balance visualization.

## Self-Check: PASSED
