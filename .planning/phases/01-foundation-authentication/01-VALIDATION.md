---
phase: 1
slug: foundation-authentication
status: draft
nyquist_compliant: true
wave_0_complete: false
created: 2026-03-24
---

# Phase 1 — Validation Strategy

> Per-phase validation contract for feedback sampling during execution.

---

## Test Infrastructure

| Property | Value |
|----------|-------|
| **Framework** | Vitest (installed in Wave 0) |
| **Config file** | `vitest.config.ts` (Wave 0 creates) |
| **Quick run command** | `npx vitest run --reporter=verbose` |
| **Full suite command** | `npm run build && npx vitest run` |
| **Estimated runtime** | ~15 seconds |

---

## Sampling Rate

- **After every task commit:** Run `npx vitest run --reporter=verbose`
- **After every plan wave:** Run `npm run build && npx vitest run`
- **Before `/gsd:verify-work`:** Full suite must be green
- **Max feedback latency:** 15 seconds

---

## Per-Task Verification Map

| Task ID | Plan | Wave | Requirement | Test Type | Automated Command | File Exists | Status |
|---------|------|------|-------------|-----------|-------------------|-------------|--------|
| 01-01-01 | 01 | 1 | FOUND-01 | smoke | `npm run build` | N/A (build) | ⬜ pending |
| 01-01-01 | 01 | 1 | FOUND-03 | integration | `npx drizzle-kit push --dry-run` | N/A (CLI) | ⬜ pending |
| 01-02-01 | 02 | 2 | AUTH-02, AUTH-03 | integration | `npx vitest run src/__tests__/auth.test.ts -t "google"` | ❌ W0 | ⬜ pending |
| 01-02-02 | 02 | 2 | AUTH-01, AUTH-04 | integration | `npx vitest run src/__tests__/auth.test.ts -t "email"` | ❌ W0 | ⬜ pending |
| 01-03-01 | 03 | 2 | FOUND-04 | integration | `npx vitest run src/__tests__/ai-test.test.ts` | ❌ W0 | ⬜ pending |
| 01-04-01 | 04 | 3 | UI-01 | manual-only | Manual browser resize | -- | ⬜ pending |
| 01-04-02 | 04 | 3 | FOUND-02 | unit | `npx vitest run src/__tests__/upload.test.ts` | ❌ W0 | ⬜ pending |

*Status: ⬜ pending · ✅ green · ❌ red · ⚠️ flaky*

---

## Wave 0 Requirements

- [ ] Install vitest: `npm install -D vitest @vitejs/plugin-react`
- [ ] Create `vitest.config.ts` with Next.js path aliases
- [ ] `src/__tests__/auth.test.ts` — covers AUTH-01, AUTH-02, AUTH-03, AUTH-04
- [ ] `src/__tests__/upload.test.ts` — covers FOUND-02
- [ ] `src/__tests__/ai-test.test.ts` — covers FOUND-04

---

## Manual-Only Verifications

| Behavior | Requirement | Why Manual | Test Instructions |
|----------|-------------|------------|-------------------|
| Pages render at mobile/tablet/desktop widths | UI-01 | Requires visual browser verification | Resize browser to 375px, 768px, 1280px and verify layout adjusts |

---

## Validation Sign-Off

- [x] All tasks have `<automated>` verify or Wave 0 dependencies
- [x] Sampling continuity: no 3 consecutive tasks without automated verify
- [x] Wave 0 covers all MISSING references
- [x] No watch-mode flags
- [x] Feedback latency < 15s
- [x] `nyquist_compliant: true` set in frontmatter

**Approval:** pending
