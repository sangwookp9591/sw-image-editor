---
phase: 07
slug: billing-credits-polish
status: draft
nyquist_compliant: false
wave_0_complete: false
created: 2026-03-25
---

# Phase 07 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Manual verification + TypeScript compiler |
| **Config file** | tsconfig.json |
| **Quick run command** | `npx tsc --noEmit` |
| **Full suite command** | `npx tsc --noEmit && npx next build` |
| **Estimated runtime** | ~30 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx tsc --noEmit`
- **After every plan wave:** Run `npx tsc --noEmit && npx next build`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 30 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 07-01-01 | 01 | 1 | BILL-01 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 07-01-02 | 01 | 1 | BILL-01 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 07-02-01 | 02 | 1 | BILL-02 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 07-02-02 | 02 | 1 | BILL-02, BILL-03 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 07-03-01 | 03 | 2 | BILL-01 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 07-04-01 | 04 | 2 | BILL-04 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |
| 07-05-01 | 05 | 2 | UI-04 | type-check | `npx tsc --noEmit` | ✅ | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

Existing infrastructure covers TypeScript verification. New packages (stripe, @stripe/stripe-js, next-themes) installed in Wave 1.

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Stripe Checkout redirects correctly | BILL-02 | Requires Stripe test mode with real browser | Create Pro subscription via checkout, verify redirect and webhook |
| Credit deduction after AI operation | BILL-01 | Requires running AI model (fal.ai) | Run background removal, verify credit balance decreases |
| Credit exhaustion blocks AI features | BILL-01 | Requires zero-credit state | Set credits to 0, attempt AI operation, verify rejection toast |
| One-time credit top-up | BILL-03 | Requires Stripe test mode | Purchase credits via checkout, verify balance increases |
| Usage dashboard displays correctly | BILL-04 | Visual layout verification | Check credit card, progress bar, transaction table |
| Dark mode toggle works | UI-04 | Visual theme verification | Toggle dark mode, verify all pages render correctly |
| Dark mode persists across refresh | UI-04 | localStorage behavior | Toggle dark mode, refresh page, verify preference retained |

---

## Validation Sign-Off

- [ ] All tasks have `<automated>` verify or Wave 0 dependencies
- [ ] Sampling continuity: no 3 consecutive tasks without automated verify
- [ ] Wave 0 covers all MISSING references
- [ ] No watch-mode flags
- [ ] Feedback latency < 30s
- [ ] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
