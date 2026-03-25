# Phase 6: AI Upscaling & Style Transfer - Context

**Gathered:** 2026-03-25
**Status:** Ready for planning

<domain>
## Phase Boundary

Users can enhance image resolution with AI upscaling (2x and 4x) and convert photos into artistic styles (illustration, anime, watercolor, oil painting, pixel art) with adjustable intensity. This phase adds two new AI tools to the existing editor, following the same Server Action + S3 + CDN pipeline established in Phases 4-5.

</domain>

<decisions>
## Implementation Decisions

### AI Provider & Models
- **D-01:** fal.ai as primary provider for both upscaling and style transfer (already mapped in providers.ts: `upscaling: fal`, `styleTransfer: fal`)
- **D-02:** Single upscaling model with scale parameter (2x or 4x) rather than separate models per scale
- **D-03:** Style transfer via image-to-image model with style-specific prompt templates
- **D-04:** All AI calls through Server Actions following existing pattern (requireAuth → fal.image → uploadToS3 → CDN URL)

### Upscaling UX
- **D-05:** "Upscale" tool in sidebar with 2x and 4x buttons
- **D-06:** One-click operation: select scale → processing overlay → result replaces canvas image
- **D-07:** Upscaled result replaces current canvas image at higher resolution
- **D-08:** Original image preserved in undo stack for reversal
- **D-09:** Show resulting dimensions in a toast or info badge after upscale (e.g., "1024×768 → 2048×1536")

### Style Transfer UX
- **D-10:** "Style Transfer" tool in sidebar activates style selection in properties panel
- **D-11:** 5 preset styles as visual cards/buttons: illustration, anime, watercolor, oil painting, pixel art
- **D-12:** Each style implemented as a prompt template fed to the same image-to-image model
- **D-13:** Intensity slider (0.0–1.0, default 0.7) maps to model's strength parameter — lower = subtle, higher = strong
- **D-14:** "Apply" button triggers processing: canvas image + style prompt + strength → Server Action → result

### Result Handling
- **D-15:** Both upscale and style results replace the canvas image (same pattern as background removal)
- **D-16:** Reuse AI processing overlay from Phase 4 during operations
- **D-17:** Results stored in S3, served via CloudFront (same pipeline as Phases 4-5)
- **D-18:** Undo restores the pre-operation image

### Claude's Discretion
- Exact fal.ai model IDs for upscaling and style transfer (research should determine best available models)
- Style prompt templates (exact wording for each preset)
- Whether to show preview thumbnails for style presets or use icons/illustrations
- Upscale quality settings (if model supports them)
- Whether to warn user about large file sizes after 4x upscale

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

### Project context
- `.planning/PROJECT.md` — Core value, constraints
- `.planning/REQUIREMENTS.md` — UPSC-01, UPSC-02, STYL-01, STYL-02 requirements

### AI infrastructure (Phase 1 + Phase 4)
- `src/lib/ai/providers.ts` — fal.ai provider instance, upscaling/styleTransfer already mapped
- `src/app/actions/ai-image.ts` — Existing AI server actions pattern (removeBackground, removeObject, generateBackground, detectText, translateText)
- `src/components/editor/ai-processing-overlay.tsx` — Reusable AI loading overlay
- `src/lib/s3.ts` — S3 client and BUCKET for storing AI results
- `src/lib/cdn.ts` — getCdnUrl() for CloudFront URLs

### Editor (Phase 2 + Phase 4)
- `src/components/editor/hooks/use-editor-store.ts` — Zustand store with isProcessing, activeTool, setCanvasJson
- `src/components/editor/hooks/use-fabric.ts` — Canvas lifecycle, toDataURL patterns
- `src/components/editor/tool-sidebar.tsx` — Tool sidebar (add Upscale and Style Transfer tools)
- `src/components/editor/properties-panel.tsx` — Properties panel (add upscale controls and style selection)
- `src/components/editor/editor-shell.tsx` — 3-panel layout, fabricRef sharing

### Prior phase patterns
- `src/components/editor/hooks/use-bg-removal.ts` — Pattern: one-click AI → replace canvas image (closest to upscale flow)
- `src/components/editor/bg-replace-panel.tsx` — Pattern: properties panel with options (closest to style selection UI)

### Research
- `.planning/research/STACK.md` — AI SDK 6, fal.ai provider details
- `.planning/research/PITFALLS.md` — AI cost management, serverless timeouts

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- `src/app/actions/ai-image.ts` — Server Action pattern: requireAuth → fal.image() → uploadToS3 → return CDN URL
- `src/components/editor/ai-processing-overlay.tsx` — Full-canvas overlay with spinner during AI ops
- `src/components/editor/hooks/use-bg-removal.ts` — Hook pattern for one-click AI → canvas replacement (reuse for upscale)
- `src/components/editor/bg-replace-panel.tsx` — Panel with options grid (reuse layout for style preset cards)
- `src/components/ui/*` — shadcn/ui Slider, Button, Card, Tabs components

### Established Patterns
- Server Action: canvas → base64 → fal.ai → S3 → CDN URL → canvas
- Tool activation via useEditorStore activeTool
- Properties panel switches content based on activeTool
- AI processing overlay with isProcessing state
- Undo-able canvas state via setCanvasJson

### Integration Points
- Tool sidebar: add "Upscale" and "Style Transfer" tool buttons
- Properties panel: upscale controls (2x/4x buttons) and style selection (preset cards + intensity slider)
- New Server Actions: upscaleImage, transferStyle
- New hooks: use-upscale.ts, use-style-transfer.ts (following use-bg-removal.ts pattern)

</code_context>

<specifics>
## Specific Ideas

No specific requirements — follow established AI tool patterns from Phase 4. Research should determine:
- Best fal.ai upscaling model (Real-ESRGAN, SwinIR, or similar)
- Best fal.ai style transfer / image-to-image model
- Effective prompt templates for each style preset

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 06-ai-upscaling-style-transfer*
*Context gathered: 2026-03-25*
