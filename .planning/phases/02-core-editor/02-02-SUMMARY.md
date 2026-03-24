---
phase: 02-core-editor
plan: 02
subsystem: ui
tags: [fabric.js, crop, canvas, zustand, sns-presets, aspect-ratio]

# Dependency graph
requires:
  - phase: 02-core-editor/01
    provides: Canvas shell, Fabric.js integration, editor store with undo/redo, tool sidebar
provides:
  - Crop overlay with dark mask and draggable handles
  - Crop math utilities (aspect ratio constraint, bounds clamping, pixel coordinate conversion)
  - 6 aspect ratio presets (Free, 1:1, 4:5, 9:16, 16:9, 1.91:1)
  - 6 SNS platform presets (IG Story/Post, FB Post, YT Thumbnail, TikTok, Twitter/X)
  - Apply crop with undo support via canvas state push
affects: [02-core-editor/03, 02-core-editor/04]

# Tech tracking
tech-stack:
  added: []
  patterns: [fabric-object-tagging-for-ui-overlays, crop-pixel-coordinate-conversion, aspect-ratio-constraint-math]

key-files:
  created:
    - src/components/editor/crop-overlay.tsx
    - src/components/editor/sns-presets.tsx
    - src/components/editor/lib/crop-utils.ts
    - src/components/editor/lib/crop-utils.test.ts
    - src/components/editor/lib/presets.test.ts
  modified:
    - src/components/editor/properties-panel.tsx
    - src/components/editor/canvas.tsx
    - src/components/editor/hooks/use-fabric.ts

key-decisions:
  - "Used Fabric.js object tagging (CROP_TAG) to distinguish UI overlay objects from content objects"
  - "Filtered crop overlay objects from undo stack sync events to prevent UI state pollution"
  - "Used 4 dark mask rects around crop region instead of clipPath for visual overlay per D-10"

patterns-established:
  - "Fabric.js object tagging: custom property on objects for identification and filtering"
  - "Crop math as pure functions: constrainToAspectRatio, clampCropRegion, getCropPixelCoords -- unit-testable"
  - "useCropActions hook: separates crop business logic from UI rendering for reuse across components"

requirements-completed: [EDIT-03, UI-02]

# Metrics
duration: 5min
completed: 2026-03-24
---

# Phase 02 Plan 02: Crop Tool Summary

**Crop tool with dark mask overlay, 6 aspect ratio presets, 6 SNS platform presets, and pixel-accurate cropping with undo support**

## Performance

- **Duration:** 5 min
- **Started:** 2026-03-24T02:56:48Z
- **Completed:** 2026-03-24T03:01:52Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments
- Crop math utilities with full TDD test coverage (22 tests passing)
- Visual crop overlay with dark mask and corner handles on Fabric.js canvas
- 6 crop ratio presets and 6 SNS platform presets in properties panel
- Apply crop creates pixel-accurate cropped image, pushes to undo stack
- Crop overlay objects excluded from undo stack to prevent state pollution

## Task Commits

Each task was committed atomically:

1. **Task 1: Crop math utilities and SNS preset tests** - `93a83b2` (test)
2. **Task 2: Crop overlay component, SNS preset selector, and properties panel integration** - `f2472ec` (feat)

## Files Created/Modified
- `src/components/editor/lib/crop-utils.ts` - constrainToAspectRatio, clampCropRegion, getCropPixelCoords
- `src/components/editor/lib/crop-utils.test.ts` - 12 unit tests for crop math
- `src/components/editor/lib/presets.test.ts` - 10 unit tests for preset data integrity
- `src/components/editor/crop-overlay.tsx` - CropOverlay component + useCropActions hook
- `src/components/editor/sns-presets.tsx` - CropRatioSelector + SnsPresetSelector components
- `src/components/editor/properties-panel.tsx` - Integrated crop controls, ratio selector, SNS presets, Apply/Cancel buttons
- `src/components/editor/canvas.tsx` - Added CropOverlay to canvas
- `src/components/editor/hooks/use-fabric.ts` - Filter crop overlay objects from undo sync

## Decisions Made
- Used Fabric.js object tagging (custom `__crop_overlay__` property) to distinguish UI overlay objects from content -- enables filtering in event handlers
- Filtered crop overlay object events from store sync to prevent undo stack pollution
- Used 4 dark mask Rects around crop region (per D-10 decision) rather than clipPath approach
- Cast Fabric.js objects through `unknown` for custom property access to satisfy strict TypeScript

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript strict cast error for Fabric.js object tagging**
- **Found during:** Task 2 (build verification)
- **Issue:** Direct cast from Fabric.js Rect to `Record<string, unknown>` fails TypeScript strict mode
- **Fix:** Used double cast through `unknown` (`as unknown as Record<string, unknown>`)
- **Files modified:** src/components/editor/crop-overlay.tsx, src/components/editor/hooks/use-fabric.ts
- **Verification:** Build passes
- **Committed in:** f2472ec (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (1 bug fix)
**Impact on plan:** Minor TypeScript strictness fix. No scope creep.

## Issues Encountered
- Properties panel was concurrently modified by parallel agent (02-03 resize plan) -- adapted to merged state with fabricRef already lifted to EditorShell

## Known Stubs
None -- all crop functionality is fully wired.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Crop tool complete with all ratio and SNS presets
- Ready for export modal (Plan 04) and further editor features
- Undo/redo works with crop operations via Zundo temporal middleware

## Self-Check: PASSED

All 6 created files verified present. Both task commits (93a83b2, f2472ec) verified in git log.

---
*Phase: 02-core-editor*
*Completed: 2026-03-24*
