---
phase: 05-ai-text-replacement
plan: 02
subsystem: ai
tags: [fabric.js, ocr, text-replacement, inpainting, zustand, itext]

requires:
  - phase: 05-01
    provides: TextRegion type, extractTextStyle, createMaskFromBbox, detectText/translateText/removeObject server actions
provides:
  - Extended editor store with text-replace tool and OCR region state
  - useTextReplace hook orchestrating full OCR -> inpaint -> IText pipeline
  - TextOverlayBoxes component for visual overlay of detected text regions
affects: [05-03-ui-controls]

tech-stack:
  added: []
  patterns: [TEXT_REPLACE_TAG tagging pattern for IText objects, HTML overlay boxes for non-canvas UI feedback]

key-files:
  created:
    - src/components/editor/hooks/use-text-replace.ts
    - src/components/editor/text-overlay-boxes.tsx
  modified:
    - src/components/editor/hooks/use-editor-store.ts

key-decisions:
  - "Used HTML overlay boxes (not Fabric.js objects) for text region highlighting to avoid polluting canvas/undo state"
  - "Used TEXT_REPLACE_TAG custom property tagging (same pattern as CROP_TAG, MASK_TAG) to identify replacement IText objects"
  - "Used client-side pixel sampling from original image for text color extraction before inpainting replaces the text"

patterns-established:
  - "TEXT_REPLACE_TAG pattern: tag IText objects so they can be hidden during export and removed on cancel"
  - "HTML overlay pattern: position absolute divs over canvas using getBoundingClientRect scale factors"

requirements-completed: [TEXT-01, TEXT-02, TEXT-03]

duration: 2min
completed: 2026-03-24
---

# Phase 5 Plan 2: Text Replace Pipeline Summary

**useTextReplace hook with OCR detect -> inpaint -> IText rendering pipeline and TextOverlayBoxes for visual region feedback**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T10:37:42Z
- **Completed:** 2026-03-24T10:40:12Z
- **Tasks:** 2
- **Files modified:** 3

## Accomplishments
- Extended editor store with text-replace ActiveTool, textRegions array, and selectedRegionIndex state
- Created useTextReplace hook providing full pipeline: detect text (OCR), replace text (inpaint + IText), translate and replace, apply (flatten), cancel
- Created TextOverlayBoxes component rendering scaled HTML overlay boxes over canvas with click selection and confidence-based styling

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend editor store and create use-text-replace hook** - `524ec6c` (feat)
2. **Task 2: Create text overlay boxes component for detected regions** - `c90f41a` (feat)

## Files Created/Modified
- `src/components/editor/hooks/use-editor-store.ts` - Added text-replace to ActiveTool, textRegions/selectedRegionIndex state
- `src/components/editor/hooks/use-text-replace.ts` - Core hook: handleDetectText, handleReplaceText, handleTranslateAndReplace, handleApplyText, handleCancelReplace
- `src/components/editor/text-overlay-boxes.tsx` - HTML overlay boxes positioned over canvas for detected text regions

## Decisions Made
- Used HTML overlay boxes instead of Fabric.js objects for text region highlighting to keep canvas state clean and avoid undo pollution
- Used TEXT_REPLACE_TAG custom property tagging (consistent with CROP_TAG, MASK_TAG patterns) to identify replacement IText objects
- Used client-side pixel sampling from original image (before inpaint) for dominant text color extraction, falling back to black
- Auto-fit IText: scale down fontSize proportionally when rendered width exceeds 115% of original bounding box width

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed zustand subscribe API for zoom tracking**
- **Found during:** Task 2 (TextOverlayBoxes component)
- **Issue:** Used 2-argument zustand subscribe(selector, listener) which is not available on temporal stores; zustand v5 subscribe takes a single listener
- **Fix:** Changed to single-argument subscribe with manual previous-value tracking
- **Files modified:** src/components/editor/text-overlay-boxes.tsx
- **Verification:** pnpm exec tsc --noEmit passes
- **Committed in:** c90f41a (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug)
**Impact on plan:** Minor API fix for correctness. No scope creep.

## Issues Encountered
None

## Known Stubs
None - all data flows are wired to server actions and canvas state.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Store extended, hook ready, overlay component ready
- Plan 03 can build UI controls (sidebar panel, text input, translate dropdown) on top of useTextReplace hook and TextOverlayBoxes

## Self-Check: PASSED

All files exist. All commits verified.

---
*Phase: 05-ai-text-replacement*
*Completed: 2026-03-24*
