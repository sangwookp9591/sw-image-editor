---
phase: 05-ai-text-replacement
verified: 2026-03-24T11:00:00Z
status: human_needed
score: 10/10 must-haves verified
human_verification:
  - test: "End-to-end text detection flow"
    expected: "Clicking 'Detect Text' calls Google Cloud Vision, returns colored bounding boxes overlaid on the canvas"
    why_human: "Requires live API key (GOOGLE_CLOUD_VISION_API_KEY) and a running browser session to observe canvas overlay"
  - test: "Text replacement with style preservation"
    expected: "Selecting a region, typing new text, and clicking Replace removes old text via inpainting and places an IText with matching font size, color, and rotation angle"
    why_human: "Requires FAL_API_KEY for inpainting, live canvas, and visual inspection of style match quality"
  - test: "Translate & Replace flow"
    expected: "Selecting a target language and clicking 'Translate & Replace' calls Gemini, translates the original region text, and places it at the original position"
    why_human: "Requires GOOGLE_GENERATIVE_AI_API_KEY and a running app; translation correctness cannot be verified statically"
  - test: "Refinement controls live-update the IText"
    expected: "Changing font family, font size, or color in RefinementControls immediately updates the Fabric.js IText on the canvas without a round-trip"
    why_human: "Canvas live-update behavior requires interactive browser testing"
  - test: "Apply flattens text onto image"
    expected: "Clicking Apply exports the canvas with IText rendered in, clears the IText object, and the result is committed to undo history"
    why_human: "Requires visual confirmation that IText is gone and image pixels reflect the text"
---

# Phase 5: AI Text Replacement Verification Report

**Phase Goal:** Users can detect text within images, select detected text regions, and replace them with new text while the AI preserves the original font style, color, size, and perspective
**Verified:** 2026-03-24T11:00:00Z
**Status:** human_needed
**Re-verification:** No — initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | detectText server action sends image to Google Cloud Vision and returns structured TextRegion[] with bounding boxes, text, confidence | ✓ VERIFIED | `src/app/actions/ai-image.ts` lines 111-131: calls `callVisionOCR` then `parseTextAnnotations`, returns `{ regions }`. Auth-gated with `requireAuth()`. |
| 2 | translateText server action sends text to Gemini and returns translated string | ✓ VERIFIED | `src/app/actions/ai-image.ts` lines 133-157: calls `generateText({ model: google("gemini-2.5-flash") ... })`, returns `{ translatedText: result.text.trim() }`. |
| 3 | extractTextStyle computes fontSize, color, angle, fontCategory from OCR bounding box vertices and pixel data | ✓ VERIFIED | `src/lib/ai/text-style.ts`: height via vertex distance * 0.75 → fontSize, atan2 for angle, histogram for color from ImageData, defaults "sans-serif". |
| 4 | OCR response parsing handles missing x/y vertices (defaults to 0) and skips the first full-text annotation | ✓ VERIFIED | `src/lib/ai/ocr.ts` `normalizeVertex` uses `?? 0`; `parseTextAnnotations` does `annotations.slice(1)`. |
| 5 | User can click Detect Text and see highlighted bounding boxes over detected text regions on canvas | ✓ VERIFIED | `TextOverlayBoxes` renders absolute-positioned divs scaled to canvas CSS dimensions. Gated on `activeTool === "text-replace" && textRegions.length > 0`. `handleDetectText` in hook calls `detectText` and sets `textRegions` in store. |
| 6 | User can select a detected text region and type new text that replaces the original via inpaint+render pipeline | ✓ VERIFIED | `handleReplaceText` in `use-text-replace.ts`: hides tagged IText, exports canvas, calls `createMaskFromBbox`, calls `removeObject`, loads CDN result, creates `fabric.IText` with extracted style. |
| 7 | Replacement text is rendered as Fabric.js IText matching original font size, color, and rotation angle | ✓ VERIFIED | IText created with `fontSize: style.fontSize`, `fill: textColor` (extracted via `extractDominantColor`), `angle: style.angle`, `skewX/skewY` from `extractTextStyle`. Auto-fit scales down if rendered width > 115% of bbox. |
| 8 | User can click Text Replace tool in sidebar and see the text replacement panel | ✓ VERIFIED | `tool-sidebar.tsx` line 23: `{ id: "text-replace", label: "Text Replace", icon: Type }` in AI_TOOLS array. `properties-panel.tsx` line 112-113: renders `<TextReplacePanel fabricRef={fabricRef} />` when `activeTool === "text-replace"`. |
| 9 | User can adjust position, size, color, and font of the replacement IText via refinement controls | ✓ VERIFIED | `RefinementControls` sub-component in `text-replace-panel.tsx`: font family dropdown (6 options), font size stepper + number input, color native input — all call `applyToCanvas` which sets property on active Fabric IText and calls `canvas.renderAll()`. |
| 10 | User can select a target language and click Translate to auto-translate and replace text | ✓ VERIFIED | `handleTranslateAndReplace` in `use-text-replace.ts`: calls `translateText(region.text, targetLang)` then delegates to `handleReplaceText` with the translated string. Language dropdown (ko/en/ja/zh/es/fr/de) in Section B of panel. |

**Score:** 10/10 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `src/lib/ai/ocr.ts` | Google Cloud Vision REST API wrapper, TextRegion type, response parsing | ✓ VERIFIED | Exports: `TextRegion`, `VisionAnnotation`, `normalizeVertex`, `parseTextAnnotations`, `callVisionOCR`. 127 lines, fully implemented. |
| `src/lib/ai/text-style.ts` | Style extraction from OCR bounding boxes + pixel sampling | ✓ VERIFIED | Exports: `TextStyle`, `extractTextStyle`, `extractDominantColor`, `createMaskFromBbox`. 147 lines, all functions implemented. |
| `src/app/actions/ai-image.ts` | detectText and translateText server actions | ✓ VERIFIED | Both functions exported, auth-gated, real API calls wired. |
| `src/lib/ai/providers.ts` | Google AI provider for translation | ✓ VERIFIED | `createGoogleGenerativeAI` imported from `@ai-sdk/google`, exported as `google`, added to `aiProviders.translation`. |
| `src/components/editor/hooks/use-editor-store.ts` | text-replace in ActiveTool union, textRegions state, selectedRegionIndex state | ✓ VERIFIED | `ActiveTool` includes `"text-replace"`. `textRegions: TextRegion[]` and `selectedRegionIndex: number | null` with setters present. |
| `src/components/editor/hooks/use-text-replace.ts` | OCR detection trigger, text replacement pipeline, translation trigger, region selection | ✓ VERIFIED | Exports `useTextReplace` with all 5 callbacks. Exports `TEXT_REPLACE_TAG` constant. 279 lines, fully implemented. |
| `src/components/editor/text-overlay-boxes.tsx` | Visual overlay rectangles on canvas for detected OCR text regions | ✓ VERIFIED | Exports `TextOverlayBoxes`. Reads `textRegions`/`selectedRegionIndex` from store, scales to canvas CSS dimensions, click sets `selectedRegionIndex`. |
| `src/components/editor/text-replace-panel.tsx` | Full text replacement UI | ✓ VERIFIED | Exports `TextReplacePanel`. Three-section state machine: Section A (detect), B (browse/replace/translate), C (refinement). 397 lines. |
| `src/components/editor/tool-sidebar.tsx` | Text Replace tool button in AI tools section | ✓ VERIFIED | `{ id: "text-replace", label: "Text Replace", icon: Type }` in AI_TOOLS array. |
| `src/components/editor/properties-panel.tsx` | TextReplacePanel rendered when activeTool is text-replace | ✓ VERIFIED | Line 13 imports `TextReplacePanel`, line 112-113 renders it conditionally. |
| `src/components/editor/editor-shell.tsx` | TextOverlayBoxes integrated into editor layout | ✓ VERIFIED | Line 14 imports `TextOverlayBoxes`, line 60 renders it in canvas container. |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| `src/app/actions/ai-image.ts` | `src/lib/ai/ocr.ts` | `detectText` imports `callVisionOCR` | ✓ WIRED | Import present, `callVisionOCR(imageContent)` called on line 122, result passed to `parseTextAnnotations`. |
| `src/app/actions/ai-image.ts` | `@ai-sdk/google` | `translateText` uses `generateText` with google provider | ✓ WIRED | `google("gemini-2.5-flash")` passed as model to `generateText`, result consumed as `result.text.trim()`. |
| `src/components/editor/hooks/use-text-replace.ts` | `src/app/actions/ai-image.ts` | imports `detectText`, `removeObject`, `translateText` | ✓ WIRED | Line 7: `import { detectText, removeObject, translateText } from "@/app/actions/ai-image"`. All three called in their respective handlers. |
| `src/components/editor/hooks/use-text-replace.ts` | `src/lib/ai/text-style.ts` | imports `extractTextStyle`, `createMaskFromBbox` | ✓ WIRED | Line 8: `import { extractTextStyle, createMaskFromBbox } from "@/lib/ai/text-style"`. Both called in `handleReplaceText`. |
| `src/components/editor/text-overlay-boxes.tsx` | `src/components/editor/hooks/use-editor-store.ts` | reads `textRegions` and `selectedRegionIndex` from store | ✓ WIRED | Lines 19-22: subscribes to `textRegions`, `selectedRegionIndex`, `setSelectedRegionIndex`, `activeTool`. Rendered boxes use store values directly. |
| `src/components/editor/text-replace-panel.tsx` | `src/components/editor/hooks/use-text-replace.ts` | imports `useTextReplace` hook for all actions | ✓ WIRED | Line 16: `import { useTextReplace, TEXT_REPLACE_TAG } from "./hooks/use-text-replace"`. Hook called on line 51, all 5 callbacks used in JSX. |
| `src/components/editor/properties-panel.tsx` | `src/components/editor/text-replace-panel.tsx` | renders TextReplacePanel when activeTool is text-replace | ✓ WIRED | Import line 13, conditional render lines 112-113. |
| `src/components/editor/tool-sidebar.tsx` | `src/components/editor/hooks/use-editor-store.ts` | text-replace tool sets activeTool | ✓ WIRED | `"text-replace"` in AI_TOOLS array which maps to `setActiveTool`. |

### Data-Flow Trace (Level 4)

| Artifact | Data Variable | Source | Produces Real Data | Status |
|----------|---------------|--------|-------------------|--------|
| `text-overlay-boxes.tsx` | `textRegions` | `useEditorStore` → populated by `handleDetectText` → `detectText` server action → Google Cloud Vision API | Yes — real OCR API call via REST fetch | ✓ FLOWING |
| `text-replace-panel.tsx` (Section B) | `textRegions`, `selectedRegionIndex` | Same store, same source | Yes | ✓ FLOWING |
| `use-text-replace.ts` `handleReplaceText` | `cdnUrl` | `removeObject` server action → fal.ai inpainting API → CDN upload | Yes — real inpainting result | ✓ FLOWING |
| `use-text-replace.ts` `handleReplaceText` | `textColor` | Canvas `getImageData` on original bbox area → `extractDominantColor` histogram | Yes — pixel sampling from actual image | ✓ FLOWING |
| `use-text-replace.ts` `handleTranslateAndReplace` | `translatedText` | `translateText` server action → Gemini 2.5 Flash via `generateText` | Yes — real LLM response consumed | ✓ FLOWING |

### Behavioral Spot-Checks

| Behavior | Command | Result | Status |
|----------|---------|--------|--------|
| TypeScript compiles without errors | `pnpm exec tsc --noEmit` | No output (zero errors) | ✓ PASS |
| `detectText` exported from ai-image.ts | `grep "export.*detectText" src/app/actions/ai-image.ts` | Line 111: `export async function detectText` | ✓ PASS |
| `translateText` exported from ai-image.ts | `grep "export.*translateText" src/app/actions/ai-image.ts` | Line 133: `export async function translateText` | ✓ PASS |
| `useTextReplace` exported from hook | File read | Line 13: `export function useTextReplace` | ✓ PASS |
| `TextOverlayBoxes` exported from component | File read | Line 14: `export function TextOverlayBoxes` | ✓ PASS |
| `TextReplacePanel` exported from component | File read | Line 42: `export function TextReplacePanel` | ✓ PASS |
| `google` provider exported | File read | `providers.ts` line 13: `export const google = createGoogleGenerativeAI(...)` | ✓ PASS |
| `createMaskFromBbox` uses real canvas drawing | File read | Lines 118-146: `document.createElement("canvas")`, black fill, white rect, `toDataURL` | ✓ PASS |

### Requirements Coverage

| Requirement | Source Plan(s) | Description | Status | Evidence |
|-------------|---------------|-------------|--------|----------|
| TEXT-01 | 05-01, 05-02, 05-03 | 이미지에서 텍스트 영역 자동 감지 (OCR) | ✓ SATISFIED | `detectText` server action calls Google Cloud Vision REST API → `parseTextAnnotations` → `TextRegion[]`; `handleDetectText` wires this to canvas export + store; `TextOverlayBoxes` renders detected regions |
| TEXT-02 | 05-02, 05-03 | 감지된 텍스트를 선택하여 새 텍스트로 교체 | ✓ SATISFIED | `handleReplaceText` pipeline: select region → mask → inpaint → load result → `fabric.IText` at original position; `TextReplacePanel` Section B provides the UI |
| TEXT-03 | 05-01, 05-02 | 교체 시 원본 폰트 스타일, 색상, 크기, 원근감 유지 | ✓ SATISFIED | `extractTextStyle` computes fontSize (vertex distance × 0.75), angle (atan2), color (extractDominantColor histogram from original image before inpaint); IText created with these values |
| TEXT-04 | 05-03 | 교체 결과 수동 미세 조정 컨트롤 (위치, 크기, 색상) | ✓ SATISFIED | `RefinementControls` sub-component: font family dropdown, font size stepper, native color picker — all call `applyToCanvas` which sets on active IText and re-renders; drag repositioning via Fabric.js native controls |
| TEXT-05 | 05-01, 05-03 | 다국어 텍스트 자동 번역 교체 (DeepL/Google Translate 연동) | ✓ SATISFIED | `translateText` server action uses Gemini 2.5 Flash via `@ai-sdk/google`; `handleTranslateAndReplace` chains translation → replacement; UI provides 7-language dropdown (ko/en/ja/zh/es/fr/de) |

All 5 TEXT requirements satisfied. No orphaned requirements detected.

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| `text-replace-panel.tsx` | 135, 160 | `placeholder=` attribute | ℹ Info | HTML input placeholder attributes — not code stubs. No impact. |

No blocker or warning anti-patterns found across any phase files.

### Human Verification Required

All automated checks pass. The following items require a running application with valid API keys to verify:

#### 1. End-to-End Text Detection

**Test:** Open the editor with an image containing visible text. Click the Text Replace tool in the sidebar, then click "Detect Text".
**Expected:** Loading overlay appears while processing. Colored bounding boxes appear over each detected text region, with a label showing truncated text. Green for normal confidence, yellow/dimmed for low confidence.
**Why human:** Requires `GOOGLE_CLOUD_VISION_API_KEY` in `.env.local` and a running browser session to observe canvas overlay rendering.

#### 2. Text Replacement with Style Preservation

**Test:** After detecting text, click a region, type replacement text in the input, click "Replace".
**Expected:** The original text is visually removed (inpainting smooths the background), and a new IText object appears at the same position with approximately matching font size, color, and rotation. The toast reads "Text replaced — adjust position/style, then click Apply to commit".
**Why human:** Requires `FAL_API_KEY` for inpainting. Style match quality (color accuracy, size match) is a visual judgment that cannot be verified statically.

#### 3. Translate & Replace Flow

**Test:** After detecting text, select a region with readable source text, choose a target language from the dropdown, click "Translate & Replace".
**Expected:** A "Translating text..." toast appears, then the translated text is placed at the original position with style preserved. Toast confirms replacement.
**Why human:** Requires `GOOGLE_GENERATIVE_AI_API_KEY`. Translation correctness is semantic and requires human judgment.

#### 4. Refinement Controls Live-Update Canvas

**Test:** After a replacement is placed (Section C active), change the font family, adjust font size with +/- buttons, and pick a new color.
**Expected:** Each change immediately updates the IText on canvas without any loading state. The color picker reflects the selected color on the text.
**Why human:** Fabric.js canvas live-update behavior requires interactive browser testing to confirm.

#### 5. Apply Flattens and Commits to Undo History

**Test:** After placing replacement text, click "Apply".
**Expected:** The IText disappears from the object stack, the text is "burned into" the image pixels, and the change is committed to undo history (Ctrl+Z should restore the pre-apply state).
**Why human:** Requires visual confirmation that the IText object is gone and the image contains the text as pixels. Undo behavior requires interactive testing.

### Gaps Summary

No gaps found. All 10 must-have truths are VERIFIED, all 11 required artifacts pass all four levels (exists, substantive, wired, data-flowing), all 8 key links are WIRED, all 5 TEXT requirements are satisfied, TypeScript compiles with zero errors, and no blocker anti-patterns were detected.

The only outstanding items are the 5 human verification checks listed above — these require a running application with valid API keys and cannot be verified statically. All code paths are correctly wired to real API integrations, not stubs.

---

_Verified: 2026-03-24T11:00:00Z_
_Verifier: Claude (gsd-verifier)_
