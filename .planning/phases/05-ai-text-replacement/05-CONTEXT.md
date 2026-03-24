# Phase 5: AI Text Replacement - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can detect text within images via OCR, select detected text regions, and replace them with new text while preserving the original font style, color, size, and perspective. Manual fine-tuning controls available. Automatic translation replacement for multi-language support.

</domain>

<decisions>
## Implementation Decisions

### OCR Text Detection
- **D-01:** OCR triggered by "Detect Text" button in tool sidebar
- **D-02:** Detected text regions highlighted as interactive overlay boxes on canvas
- **D-03:** Each detected region shows: original text, bounding box coordinates, confidence score
- **D-04:** User clicks a detected region to select it for replacement
- **D-05:** OCR provider: research should determine best option (Google Cloud Vision, fal.ai OCR, or Tesseract.js for client-side)

### Text Replacement Pipeline
- **D-06:** Two-step pipeline: (1) Inpaint/remove old text from image, (2) Render new text on top
- **D-07:** Step 1 uses fal.ai inpainting (same model as object removal in Phase 4)
- **D-08:** Step 2 renders new text as Fabric.js Text object positioned at original location
- **D-09:** Result is composited: inpainted background + new text overlay → flattened to single image

### Style Preservation
- **D-10:** Extract from OCR: font size, color, angle/rotation, bounding box dimensions
- **D-11:** New text rendered matching: approximate font size, detected color, rotation angle
- **D-12:** Perspective/distortion matching: best-effort via Fabric.js transform (skewX, skewY, angle)
- **D-13:** Font family: use closest system font or generic category (serif/sans-serif/monospace)

### Manual Refinement Controls
- **D-14:** After AI replacement, text appears as editable Fabric.js IText object
- **D-15:** User can adjust: position (drag), size (handles), color (color picker), font family, content
- **D-16:** "Apply" button flattens text onto image (commits the edit, undo-able)
- **D-17:** Properties panel shows refinement controls when text replacement tool is active

### Translation Integration
- **D-18:** "Translate" option alongside "Replace" for each detected text region
- **D-19:** User selects target language from dropdown (Korean, English, Japanese, Chinese, Spanish, French, German)
- **D-20:** Translation API: research determines best (DeepL preferred for quality, Google Translate as fallback)
- **D-21:** Translated text goes through same replacement pipeline (inpaint → render)

### AI Processing
- **D-22:** Reuse AI processing overlay from Phase 4
- **D-23:** OCR detection and text replacement go through Server Actions (same pattern as Phase 4)
- **D-24:** Results stored in S3, served via CloudFront (same pattern)

### Claude's Discretion
- Exact OCR model/provider selection (research determines)
- Translation API selection (research determines)
- Font matching algorithm details
- OCR confidence threshold for showing/hiding low-confidence detections
- UX for selecting between multiple detected text regions
- Whether to show all detected regions at once or one-by-one

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Core value: text replacement with style preservation
- `.planning/REQUIREMENTS.md` — TEXT-01~05 requirements

### AI infrastructure (Phase 1 + Phase 4)
- `src/lib/ai/providers.ts` — fal.ai + Replicate providers
- `src/app/actions/ai-image.ts` — Existing AI server actions (removeBackground, removeObject, generateBackground)
- `src/components/editor/ai-processing-overlay.tsx` — Reusable AI loading overlay
- `src/lib/s3.ts` — S3 presigned URL helper
- `src/lib/cdn.ts` — getCdnUrl() for CloudFront URLs

### Editor (Phase 2 + Phase 4)
- `src/components/editor/hooks/use-editor-store.ts` — Zustand store with isProcessing, activeTool
- `src/components/editor/hooks/use-fabric.ts` — Canvas lifecycle
- `src/components/editor/tool-sidebar.tsx` — Tool sidebar (add text replacement tool)
- `src/components/editor/properties-panel.tsx` — Properties panel (add text replacement controls)

### Research
- `.planning/research/FEATURES.md` — Text replacement as core differentiator, OCR pipeline description
- `.planning/research/PITFALLS.md` — Text replacement quality ~80%, need manual refinement controls

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/actions/ai-image.ts` — Server Action pattern for AI calls (extend with OCR + translate actions)
- `src/components/editor/ai-processing-overlay.tsx` — Loading overlay during AI ops
- `src/components/editor/hooks/use-object-eraser.ts` — Pattern for brush/mask → inpainting (similar pipeline)
- `src/components/editor/hooks/use-bg-removal.ts` — Pattern for AI result → canvas integration
- `src/components/editor/properties-panel.tsx` — Conditional panel rendering per active tool

### Established Patterns
- Server Action: canvas → base64 → fal.ai → S3 → CDN URL → canvas
- Tool activation via useEditorStore activeTool
- Properties panel switches content based on activeTool
- MASK_TAG/BG_LAYER_TAG pattern for filtering undo stack

### Integration Points
- Tool sidebar: add "Text Replace" tool button
- Properties panel: OCR results + replacement input + refinement controls + translate
- New Server Actions: detectText (OCR), translateText
- Fabric.js IText objects for editable text overlay

</code_context>

<specifics>
## Specific Ideas

This is the product's core differentiator. Quality of text replacement (style preservation, natural look) is critical. Research should focus on:
- Best OCR model for marketing images (decorative fonts, varied backgrounds)
- Whether end-to-end models (GPT-image, Gemini) can handle text replacement better than multi-step pipeline
- Korean/CJK text handling quality

</specifics>

<deferred>
## Deferred Ideas

- Batch text replacement across multiple images — v2 feature (ADV-01)

</deferred>

---

*Phase: 05-ai-text-replacement*
*Context gathered: 2026-03-24*
