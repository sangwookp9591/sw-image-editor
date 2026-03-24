---
phase: 04-ai-background-object-removal
verified: 2026-03-24T10:30:00Z
status: passed
score: 13/13 must-haves verified
re_verification: false
human_verification:
  - test: "Background removal end-to-end: upload image, click Remove Background, confirm transparent result"
    expected: "Background becomes transparent, loading overlay appears during processing, undo restores original"
    why_human: "Requires live fal.ai API call and visual inspection of canvas result"
  - test: "Background replacement: after removal, click color swatch and gradient preset"
    expected: "Solid color appears behind subject; gradient replaces previous bg without stacking"
    why_human: "Canvas compositing result requires visual verification"
  - test: "AI background generation: type prompt, click Generate"
    expected: "AI-generated background appears behind subject, loading overlay shown during API call"
    why_human: "Requires live fal.ai flux/dev call and visual result inspection"
  - test: "Object eraser: paint red strokes, click Apply"
    expected: "Painted area removed seamlessly by AI, mask cleared, undo available, loading overlay shown"
    why_human: "Requires live fal.ai object-removal call and visual canvas result"
  - test: "Undo after any AI operation"
    expected: "Ctrl+Z restores canvas to state before AI operation"
    why_human: "Requires interactive browser testing of undo stack behavior"
---

# Phase 04: AI Background & Object Removal Verification Report

**Phase Goal:** Users can remove image backgrounds with one click, replace backgrounds with solid colors, gradients, or AI-generated scenes, and erase unwanted objects by painting over them
**Verified:** 2026-03-24T10:30:00Z
**Status:** passed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | `removeBackground` server action accepts base64, calls fal.ai, uploads to S3, returns CDN URL | VERIFIED | `src/app/actions/ai-image.ts` L37-58: full implementation with `fal.image("fal-ai/bria/background/remove")`, `PutObjectCommand`, `getCdnUrl` |
| 2 | `removeObject` server action accepts base64 image + base64 mask, calls fal.ai object-removal, returns CDN URL | VERIFIED | `src/app/actions/ai-image.ts` L60-84: uses `fal.image("fal-ai/object-removal")` with both image and mask buffers |
| 3 | `generateBackground` server action accepts text prompt, calls fal.ai flux/dev, returns CDN URL | VERIFIED | `src/app/actions/ai-image.ts` L86-104: uses `fal.image("fal-ai/flux/dev")`, uploads jpg, returns CDN URL |
| 4 | `isProcessing` store state exists and blocks tool interaction when true | VERIFIED | `use-editor-store.ts` L20-21: `isProcessing: boolean` and `setIsProcessing` defined; excluded from `partialize` (UI state only) |
| 5 | AI processing overlay renders spinner and cancel button when isProcessing is true | VERIFIED | `ai-processing-overlay.tsx` L18: `if (!isProcessing) return null`; L21-37: full overlay with `Loader2`, cancel button, `pointer-events-auto` |
| 6 | User clicks Remove Background and image background becomes transparent | VERIFIED | `use-bg-removal.ts` L53-99: `handleRemoveBg` calls `removeBackground`, clears canvas, adds result image, sets `setBgRemoved(true)` |
| 7 | User can replace transparent background with a solid color | VERIFIED | `use-bg-removal.ts` L101-124: `handleReplaceColor` creates `fabric.Rect` with given fill, tagged `BG_LAYER_TAG`, inserted at index 0 |
| 8 | User can replace transparent background with a gradient preset | VERIFIED | `use-bg-removal.ts` L126-160: `handleReplaceGradient` creates `fabric.Gradient` on Rect, tagged `BG_LAYER_TAG`, inserted at index 0 |
| 9 | User can type a prompt and get an AI-generated background composited behind the subject | VERIFIED | `use-bg-removal.ts` L162-205: `handleGenerateBg` calls `generateBackground`, loads result as FabricImage tagged `BG_LAYER_TAG`, inserted at index 0 |
| 10 | Original image is preserved in undo stack before any background operation | VERIFIED | `use-bg-removal.ts` L89: `setCanvasJson(JSON.stringify(canvas.toJSON()))` called after successful remove; same pattern in all handlers |
| 11 | User can paint a red semi-transparent mask on the canvas | VERIFIED | `use-object-eraser.ts` L22-25: `PencilBrush` with `brush.color = "rgba(255, 0, 0, 0.5)"` |
| 12 | User clicks Apply and the painted area is removed by AI, replaced with seamless fill | VERIFIED | `use-object-eraser.ts` L48-155: `handleApply` exports original + B/W mask, calls `removeObject`, composites result back to canvas |
| 13 | Mask brush strokes do NOT pollute the undo stack | VERIFIED | `use-fabric.ts` L68-75: `syncToStore` filters objects where `target[MASK_TAG_KEY]` is true before pushing to undo |

**Score:** 13/13 truths verified

### Required Artifacts

| Artifact | Expected | Exists | Substantive | Wired | Status |
|----------|----------|--------|-------------|-------|--------|
| `src/app/actions/ai-image.ts` | Three AI server actions | Yes | Yes (104 lines, 3 exports) | Yes — imported in `use-bg-removal.ts` and `use-object-eraser.ts` | VERIFIED |
| `src/components/editor/ai-processing-overlay.tsx` | Full-canvas loading overlay | Yes | Yes (39 lines, conditional render) | Yes — imported and rendered in `editor-shell.tsx` L13, L59 | VERIFIED |
| `src/components/editor/hooks/use-editor-store.ts` | Extended with isProcessing, bgRemoved, expanded ActiveTool | Yes | Yes — `ActiveTool` union includes `"bg-remove"` and `"object-eraser"`, `isProcessing`/`bgRemoved` present | Yes — used throughout AI hooks | VERIFIED |
| `src/components/editor/hooks/use-bg-removal.ts` | Background removal and replacement logic | Yes | Yes (215 lines, 4 handlers) | Yes — imported in `bg-replace-panel.tsx` | VERIFIED |
| `src/components/editor/bg-replace-panel.tsx` | Background replacement controls | Yes | Yes (155 lines, color swatches, gradient presets, AI prompt) | Yes — imported and rendered in `properties-panel.tsx` L103-105 | VERIFIED |
| `src/components/editor/tool-sidebar.tsx` | Updated sidebar with AI tools | Yes | Yes — `AI_TOOLS` array with `bg-remove` and `object-eraser`, separator rendered | Yes — rendered in `editor-shell.tsx` | VERIFIED |
| `src/components/editor/properties-panel.tsx` | Panel with bg-remove and object-eraser sections | Yes | Yes — L103-109: both conditional blocks present | Yes — rendered in `editor-shell.tsx` | VERIFIED |
| `src/components/editor/hooks/use-object-eraser.ts` | Brush mode, mask export, apply/cancel logic | Yes | Yes (188 lines, full implementation) | Yes — imported in `object-eraser-panel.tsx` | VERIFIED |
| `src/components/editor/object-eraser-panel.tsx` | Brush size slider, Apply/Cancel buttons | Yes | Yes (77 lines, Slider, auto-activates brush on mount) | Yes — imported and rendered in `properties-panel.tsx` L107-109 | VERIFIED |
| `next.config.ts` | 10mb server actions body limit | Yes | Yes — `experimental.serverActions.bodySizeLimit: "10mb"` | N/A (config) | VERIFIED |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/actions/ai-image.ts` | `src/lib/ai/providers.ts` | `import { fal }` | WIRED | `ai-image.ts` L8: `import { fal } from "@/lib/ai/providers"` |
| `src/app/actions/ai-image.ts` | `src/lib/s3.ts` | `PutObjectCommand` | WIRED | `ai-image.ts` L5: `import { PutObjectCommand }`, L26-34: `uploadToS3` calls `s3Client.send(new PutObjectCommand(...))` |
| `src/components/editor/ai-processing-overlay.tsx` | `use-editor-store.ts` | `isProcessing` selector | WIRED | `ai-processing-overlay.tsx` L16: `const isProcessing = useEditorStore((s) => s.isProcessing)` |
| `use-bg-removal.ts` | `src/app/actions/ai-image.ts` | `removeBackground`, `generateBackground` | WIRED | `use-bg-removal.ts` L8: `import { removeBackground, generateBackground }`, both called in handlers |
| `use-bg-removal.ts` | `use-editor-store.ts` | `setIsProcessing`, `setBgRemoved` | WIRED | `use-bg-removal.ts` L48-50: both selectors destructured and called in handlers |
| `properties-panel.tsx` | `bg-replace-panel.tsx` | `BgReplacePanel` when `activeTool === "bg-remove"` | WIRED | `properties-panel.tsx` L12, L103-105 |
| `use-object-eraser.ts` | `src/app/actions/ai-image.ts` | `removeObject` | WIRED | `use-object-eraser.ts` L7: `import { removeObject }`, called L125 |
| `use-object-eraser.ts` | `use-editor-store.ts` | `setIsProcessing`, `setCanvasJson` | WIRED | `use-object-eraser.ts` L52-53: `useEditorStore.getState()` pattern used |
| `use-fabric.ts` | `__mask__` constant | `MASK_TAG_KEY` local constant in syncToStore | WIRED (with note) | `use-fabric.ts` L69: inlines `"__mask__"` as local constant rather than importing from `use-object-eraser.ts`; functionally equivalent, same string value |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|--------------|--------|-------------------|--------|
| `ai-processing-overlay.tsx` | `isProcessing` | `useEditorStore` — set by `setIsProcessing(true/false)` in AI hooks | Yes — driven by real async operations | FLOWING |
| `bg-replace-panel.tsx` | `bgRemoved` | `useEditorStore` — set by `setBgRemoved(true)` after `removeBackground` call succeeds | Yes — gated on real fal.ai response | FLOWING |
| `bg-replace-panel.tsx` | `prompt` | Local `useState("")` — populated by user text input | Yes — user-driven | FLOWING |
| `object-eraser-panel.tsx` | `brushSize` | `useState(30)` in `useObjectEraser` — updated by Slider | Yes — slider-driven | FLOWING |

### Behavioral Spot-Checks

Step 7b: TypeScript compilation checked as proxy for behavioral correctness (no runtime server available).

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compilation | `npx tsc --noEmit` | No errors (empty output) | PASS |
| `removeBackground` export exists | grep `removeBackground` in `ai-image.ts` | Found at L37 | PASS |
| `removeObject` export exists | grep `removeObject` in `ai-image.ts` | Found at L60 | PASS |
| `generateBackground` export exists | grep `generateBackground` in `ai-image.ts` | Found at L86 | PASS |
| Correct fal.ai model IDs | grep `fal-ai/bria`, `fal-ai/object-removal`, `fal-ai/flux/dev` | All found in `ai-image.ts` | PASS |
| MASK_TAG filtering active | grep `MASK_TAG_KEY` in `use-fabric.ts` | Found at L69, 73 | PASS |
| AiProcessingOverlay in editor shell | grep `AiProcessingOverlay` in `editor-shell.tsx` | Found at L13, L59 | PASS |

### Requirements Coverage

| Requirement | Source Plan | Description | Status | Evidence |
|-------------|------------|-------------|--------|----------|
| BG-01 | 04-01, 04-02 | 원클릭 배경 제거 (투명 배경) | SATISFIED | `handleRemoveBg` in `use-bg-removal.ts` calls `removeBackground` server action, clears canvas, adds transparent-bg result |
| BG-02 | 04-02 | 제거된 배경을 단색/그라데이션으로 교체 | SATISFIED | `handleReplaceColor` and `handleReplaceGradient` in `use-bg-removal.ts`; 8 color swatches + custom picker + 6 gradient presets in `bg-replace-panel.tsx` |
| BG-03 | 04-01, 04-02 | AI 생성 배경으로 교체 (프롬프트 입력) | SATISFIED | `generateBackground` server action + `handleGenerateBg` hook + AI prompt input in `bg-replace-panel.tsx` |
| OBJ-01 | 04-03 | 브러시로 제거할 영역 선택 | SATISFIED | `PencilBrush` in `useObjectEraser.activateBrush`, brush size slider in `ObjectEraserPanel` |
| OBJ-02 | 04-01, 04-03 | 선택 영역의 객체를 AI로 자연스럽게 제거 (inpainting) | SATISFIED | `removeObject` server action + `handleApply` with B/W offscreen mask export |
| UI-03 | 04-01, 04-03 | AI 처리 중 로딩/진행 상태 표시 | SATISFIED | `AiProcessingOverlay` component renders with spinner when `isProcessing=true`; `pointer-events-auto` blocks canvas interaction |

No orphaned requirements detected — all 6 requirement IDs declared across plans are accounted for and satisfied.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `use-fabric.ts` | 69 | `MASK_TAG_KEY = "__mask__"` inlined locally instead of imported from `use-object-eraser.ts` | Info | No functional impact — both files use the same string literal. A future rename would require updating both files, but current behavior is correct. |
| `ai-processing-overlay.tsx` | 18 | `if (!isProcessing) return null` | Info | Correct conditional render pattern — not a stub; this is the intended guard. |

No blockers or warnings found. The single info-level item is an implementation style choice (inline constant vs. import), not a defect.

### Human Verification Required

All automated structural checks pass. The following require browser testing with live API keys:

#### 1. Background Removal (BG-01)

**Test:** Upload an image with a clear subject and background. Click the "Remove Background" tool in the left sidebar, then click "Remove Background" button in the properties panel.
**Expected:** Loading overlay with spinner appears immediately; background becomes transparent; undo (Ctrl+Z) restores original image.
**Why human:** Requires live fal.ai `fal-ai/bria/background/remove` API call and visual canvas inspection.

#### 2. Background Replacement — Color and Gradient (BG-02)

**Test:** After removing background, click a color swatch, then click a different swatch, then click a gradient preset.
**Expected:** Solid color fills behind subject; changing color replaces previous (no stacking); gradient appears correctly when preset clicked.
**Why human:** Canvas compositing and Fabric.js `insertAt(0, ...)` visual layer order requires visual confirmation.

#### 3. AI Background Generation (BG-03)

**Test:** After removing background, type "sunny beach with palm trees" in the AI Background input and click Generate.
**Expected:** Loading overlay appears; AI-generated background composited behind subject on completion.
**Why human:** Requires live fal.ai `fal-ai/flux/dev` call and visual result inspection.

#### 4. Object Eraser Full Flow (OBJ-01, OBJ-02)

**Test:** Select Object Eraser tool in sidebar. Confirm red brush cursor appears immediately. Paint over an object. Adjust brush size with slider. Click Apply.
**Expected:** Loading overlay appears; object removed seamlessly; canvas updated; undo restores pre-erase state. Test Cancel as well — confirm mask paths cleared without AI call.
**Why human:** Requires live fal.ai `fal-ai/object-removal` call, visual canvas inspection, and undo stack behavioral testing.

#### 5. Loading Overlay Blocks Interaction (UI-03)

**Test:** Trigger any AI operation. While loading overlay is visible, attempt to click canvas objects or toolbar tools.
**Expected:** Canvas and tools are unresponsive; only the overlay Cancel button is interactive.
**Why human:** `pointer-events-auto` on overlay requires interactive browser testing to confirm blocking behavior.

### Gaps Summary

No gaps found. All automated checks pass:

- All 10 artifact files exist with substantive implementations (no stubs, no placeholders)
- All key links are wired (imports confirmed, call sites confirmed)
- Data flows from user actions through hooks to server actions and back to canvas state
- TypeScript compiles cleanly (`npx tsc --noEmit` exits with no errors)
- All 6 requirement IDs (BG-01, BG-02, BG-03, OBJ-01, OBJ-02, UI-03) are satisfied by concrete code

One minor implementation deviation from plan: `use-fabric.ts` inlines `"__mask__"` as a local constant rather than importing `MASK_TAG` from `use-object-eraser.ts`. The plan specified an import, but the implementation achieves identical behavior with no functional impact.

---

_Verified: 2026-03-24T10:30:00Z_
_Verifier: Claude (gsd-verifier)_
