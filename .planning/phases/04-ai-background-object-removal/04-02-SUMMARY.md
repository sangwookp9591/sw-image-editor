---
phase: 04-ai-background-object-removal
plan: 02
subsystem: ui
tags: [fabric.js, background-removal, ai-generation, canvas, react-hooks]

requires:
  - phase: 04-ai-background-object-removal-01
    provides: "Server actions (removeBackground, generateBackground) and editor store AI state (isProcessing, bgRemoved)"
provides:
  - "useBgRemoval hook with remove/replace/generate handlers"
  - "BgReplacePanel component with color, gradient, AI replacement UI"
  - "Sidebar bg-remove and object-eraser tool entries"
  - "Properties panel bg-remove tool section"
affects: [04-ai-background-object-removal-03, 04-ai-background-object-removal-04]

tech-stack:
  added: []
  patterns: ["BG_LAYER_TAG object tagging for background layer management", "viewport reset before canvas export", "dynamic fabric import in hooks"]

key-files:
  created:
    - src/components/editor/hooks/use-bg-removal.ts
    - src/components/editor/bg-replace-panel.tsx
  modified:
    - src/components/editor/tool-sidebar.tsx
    - src/components/editor/properties-panel.tsx

key-decisions:
  - "Used BG_LAYER_TAG custom property on fabric objects to track/replace background layers without accumulation"
  - "Used insertAt(0, obj) to place background layers behind subject content"
  - "Used approximateAspectRatio helper to match canvas dimensions to nearest standard ratio for AI generation"

patterns-established:
  - "BG_LAYER_TAG pattern: tag background replacement objects for easy find/remove"
  - "Viewport reset pattern: save/restore viewportTransform before canvas.toDataURL for correct export"

requirements-completed: [BG-01, BG-02, BG-03]

duration: 3min
completed: 2026-03-24
---

# Phase 04 Plan 02: Background Removal & Replacement UI Summary

**One-click background removal with color/gradient/AI replacement panel using useBgRemoval hook and BgReplacePanel component**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T09:48:11Z
- **Completed:** 2026-03-24T09:51:12Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- useBgRemoval hook with four handlers: remove background, replace with solid color, replace with gradient, generate AI background
- BgReplacePanel with 8 color swatches + custom picker, 6 gradient presets, and AI prompt input
- Sidebar updated with bg-remove and object-eraser tools separated from core tools
- Properties panel wired to show BgReplacePanel when bg-remove tool is active

## Task Commits

Each task was committed atomically:

1. **Task 1: Create useBgRemoval hook and add sidebar tool** - `29523fb` (feat)
2. **Task 2: Create BgReplacePanel and wire into properties panel** - `863c90d` (feat)

## Files Created/Modified
- `src/components/editor/hooks/use-bg-removal.ts` - Hook with handleRemoveBg, handleReplaceColor, handleReplaceGradient, handleGenerateBg
- `src/components/editor/bg-replace-panel.tsx` - Background replacement UI with color swatches, gradient presets, AI prompt
- `src/components/editor/tool-sidebar.tsx` - Added bg-remove and object-eraser tools with separator
- `src/components/editor/properties-panel.tsx` - Added BgReplacePanel rendering for bg-remove tool

## Decisions Made
- Used BG_LAYER_TAG custom property tagging (consistent with CROP_TAG pattern from Phase 02) to prevent background layer accumulation
- Used insertAt(0, obj) for Fabric.js v6 API (index-first parameter order) to place backgrounds behind subject
- Used approximateAspectRatio helper to map canvas dimensions to nearest standard ratio for AI generation quality

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Fabric.js v6 insertAt argument order**
- **Found during:** Task 1 (useBgRemoval hook)
- **Issue:** Plan specified `canvas.insertAt(0, rect)` but initial implementation had reversed args; Fabric.js v6 signature is `insertAt(index: number, ...objects: FabricObject[])`
- **Fix:** Corrected all three insertAt calls to use index-first parameter order
- **Verification:** TypeScript compilation passes cleanly
- **Committed in:** 29523fb (Task 1 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor parameter order fix. No scope creep.

## Issues Encountered
- Parallel executor for plan 04-03 had already modified properties-panel.tsx adding ObjectEraserPanel import; resolved by reading current file state before editing

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Background removal and replacement UI complete
- Object eraser panel (plan 04-03) can share the same sidebar/properties panel structure
- AI processing overlay (plan 04-04) will provide visual feedback during isProcessing state

---
*Phase: 04-ai-background-object-removal*
*Completed: 2026-03-24*
