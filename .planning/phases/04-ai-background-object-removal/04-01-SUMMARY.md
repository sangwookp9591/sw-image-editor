---
phase: 04-ai-background-object-removal
plan: 01
subsystem: ai
tags: [fal-ai, ai-sdk, generateImage, server-actions, zustand, s3]

requires:
  - phase: 01-foundation
    provides: auth, s3, cdn, ai providers
  - phase: 02-canvas-editing
    provides: editor store, editor shell
provides:
  - removeBackground server action (fal-ai/bria/background/remove)
  - removeObject server action (fal-ai/object-removal)
  - generateBackground server action (fal-ai/flux/dev)
  - isProcessing and bgRemoved editor store state
  - AiProcessingOverlay component
  - bg-remove and object-eraser ActiveTool types
affects: [04-02-background-removal-ui, 04-03-object-eraser-tool, 04-04-background-generation]

tech-stack:
  added: []
  patterns: [AI server action pattern with auth + generateImage + S3 upload + CDN URL return]

key-files:
  created:
    - src/app/actions/ai-image.ts
    - src/components/editor/ai-processing-overlay.tsx
  modified:
    - src/components/editor/hooks/use-editor-store.ts
    - src/components/editor/editor-shell.tsx
    - next.config.ts

key-decisions:
  - "Used cast for aspectRatio param to satisfy generateImage template literal type"
  - "Used experimental.serverActions.bodySizeLimit (not serverActionsBodySizeLimit) for Next.js 16 config"

patterns-established:
  - "AI server action pattern: requireAuth() -> decode base64 -> generateImage() -> uploadToS3() -> return CDN URL"
  - "Shared uploadToS3 helper within ai-image.ts for consistent S3 key prefix and upload"

requirements-completed: [BG-01, BG-03, OBJ-02, UI-03]

duration: 3min
completed: 2026-03-24
---

# Phase 04 Plan 01: AI Server Actions and Infrastructure Summary

**Three fal.ai server actions (bg removal, object removal, bg generation) with editor store AI state and processing overlay**

## Performance

- **Duration:** 3 min
- **Started:** 2026-03-24T09:43:59Z
- **Completed:** 2026-03-24T09:47:00Z
- **Tasks:** 2
- **Files modified:** 5

## Accomplishments
- Created three AI server actions using AI SDK generateImage with fal.ai provider
- Extended editor store with isProcessing, bgRemoved state and bg-remove/object-eraser tool types
- Built AI processing overlay with spinner, cancel button, and estimated time display
- Configured 10mb server action body size limit for large base64 images

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AI server actions and extend editor store** - `d250f8f` (feat)
2. **Task 2: Create AI processing overlay component** - `2f8a60c` (feat)

## Files Created/Modified
- `src/app/actions/ai-image.ts` - Three AI server actions (removeBackground, removeObject, generateBackground)
- `src/components/editor/ai-processing-overlay.tsx` - Full-canvas loading overlay with spinner and cancel
- `src/components/editor/hooks/use-editor-store.ts` - Extended with isProcessing, bgRemoved, new tool types
- `src/components/editor/editor-shell.tsx` - Wired AiProcessingOverlay into editor layout
- `next.config.ts` - Added 10mb server actions body size limit

## Decisions Made
- Used `experimental.serverActions.bodySizeLimit` (nested object) instead of flat `serverActionsBodySizeLimit` per Next.js 16 type contract
- Cast aspectRatio string to template literal type `${number}:${number}` to satisfy generateImage type

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed Next.js config property name**
- **Found during:** Task 1 (next.config.ts update)
- **Issue:** Plan specified `serverActionsBodySizeLimit` but Next.js 16 uses nested `serverActions.bodySizeLimit`
- **Fix:** Changed to `experimental: { serverActions: { bodySizeLimit: "10mb" } }`
- **Files modified:** next.config.ts
- **Verification:** tsc --noEmit passes
- **Committed in:** d250f8f (Task 1 commit)

**2. [Rule 1 - Bug] Fixed aspectRatio type mismatch**
- **Found during:** Task 1 (generateBackground action)
- **Issue:** String type not assignable to template literal `${number}:${number}` expected by generateImage
- **Fix:** Added type cast `as \`${number}:${number}\``
- **Files modified:** src/app/actions/ai-image.ts
- **Verification:** tsc --noEmit passes
- **Committed in:** d250f8f (Task 1 commit)

---

**Total deviations:** 2 auto-fixed (2 bugs)
**Impact on plan:** Both auto-fixes necessary for TypeScript compilation. No scope creep.

## Issues Encountered
None beyond the type errors fixed above.

## User Setup Required
None - uses existing FAL_API_KEY and AWS S3 configuration from Phase 01.

## Next Phase Readiness
- All three server actions ready for UI wiring in Plan 02 (background) and Plan 03 (object eraser)
- Editor store extended with isProcessing state for overlay control
- AiProcessingOverlay accepts onCancel prop for future cancel handler wiring

---
*Phase: 04-ai-background-object-removal*
*Completed: 2026-03-24*
