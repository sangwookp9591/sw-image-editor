# Phase 4: AI Background & Object Removal - Context

**Gathered:** 2026-03-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can remove image backgrounds with one click, replace backgrounds with solid colors, gradients, or AI-generated scenes, and erase unwanted objects by painting over them. Loading indicators show during AI operations.

</domain>

<decisions>
## Implementation Decisions

### AI Provider Selection
- **D-01:** fal.ai as primary AI provider via AI SDK 6 abstraction (already configured in src/lib/ai/providers.ts)
- **D-02:** Background removal: use fal.ai background removal model (RMBG-2.0 or equivalent)
- **D-03:** Object removal (inpainting): use fal.ai inpainting model (LaMa or diffusion-based)
- **D-04:** AI-generated background: use fal.ai image generation model with prompt input
- **D-05:** All AI calls go through Server Actions — never expose API keys to client

### Background Removal UX
- **D-06:** One-click "Remove Background" button in the tool sidebar
- **D-07:** Result replaces current canvas image with transparent background (PNG)
- **D-08:** Original image preserved in undo stack for reversal

### Background Replacement
- **D-09:** After background removal, offer replacement options in properties panel:
  - Solid color picker
  - Gradient presets (linear, 6-8 preset combinations)
  - AI-generated scene via text prompt input
- **D-10:** AI background generation: user types prompt, loading indicator shows, result composited behind subject

### Object Removal (Inpainting)
- **D-11:** "Object Eraser" tool in sidebar activates brush mode
- **D-12:** User paints red semi-transparent mask over area to remove
- **D-13:** "Apply" button sends original image + mask to inpainting API
- **D-14:** Result replaces canvas image, mask is cleared, undo available

### AI Processing Flow
- **D-15:** Canvas image → toDataURL() → base64 → Server Action → fal.ai API → result URL → load onto canvas
- **D-16:** For inpainting: canvas image + mask overlay → both as base64 → Server Action → API
- **D-17:** Server Action uploads result to S3, stores key in DB, returns CDN URL

### Loading States
- **D-18:** Full-canvas overlay with spinner during AI operations
- **D-19:** Disable all tools while AI is processing
- **D-20:** Show estimated time if available from API response
- **D-21:** Cancel button to abort long-running operations (if API supports)

### Claude's Discretion
- Exact AI model IDs (research should determine best available)
- Brush size/opacity for object eraser
- Gradient preset colors
- Error retry strategy for failed AI calls
- Whether to show before/after comparison slider

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Core value, constraints
- `.planning/REQUIREMENTS.md` — BG-01~03, OBJ-01~02, UI-03 requirements

### AI infrastructure (Phase 1)
- `src/lib/ai/providers.ts` — fal.ai + Replicate provider instances
- `src/lib/ai/index.ts` — AI barrel export
- `src/lib/s3.ts` — S3 presigned URL for storing AI results
- `src/lib/cdn.ts` — getCdnUrl() for loading results via CloudFront

### Editor (Phase 2)
- `src/components/editor/hooks/use-fabric.ts` — Canvas lifecycle, toDataURL patterns
- `src/components/editor/hooks/use-editor-store.ts` — Zustand store with undo/redo
- `src/components/editor/editor-shell.tsx` — 3-panel layout integration point
- `src/components/editor/toolbar.tsx` — Toolbar pattern

### Research
- `.planning/research/STACK.md` — AI SDK 6, fal.ai provider details
- `.planning/research/ARCHITECTURE.md` — Blob-to-Blob AI pipeline pattern
- `.planning/research/PITFALLS.md` — AI cost management, serverless timeouts

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/lib/ai/providers.ts` — AI provider instances ready to use
- `src/lib/s3.ts` — createPresignedUploadUrl for storing AI results
- `src/lib/cdn.ts` — getCdnUrl() for CDN-based image loading
- `src/components/editor/hooks/use-editor-store.ts` — setCanvasJson for undo-able state changes
- `src/components/ui/*` — shadcn/ui Dialog, Slider, Button, Tabs

### Established Patterns
- Server Actions for mutations (src/app/actions/)
- Canvas state → Zustand → undo/redo via Zundo
- S3 key storage in DB, CloudFront for delivery
- Tool sidebar + properties panel layout

### Integration Points
- Tool sidebar: add "Remove Background" and "Object Eraser" buttons
- Properties panel: background replacement options (color/gradient/AI prompt)
- Canvas: toDataURL() for sending to AI, loadFromURL for applying results
- New Server Actions: removeBackground, inpaint, generateBackground

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow standard AI image editing patterns. fal.ai models should be selected during research based on quality/cost/speed.

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 04-ai-background-object-removal*
*Context gathered: 2026-03-24*
