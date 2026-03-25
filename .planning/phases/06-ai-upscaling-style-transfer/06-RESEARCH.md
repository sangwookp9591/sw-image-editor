# Phase 6: AI Upscaling & Style Transfer - Research

**Researched:** 2026-03-25
**Domain:** AI image upscaling, style transfer, fal.ai model APIs, AI SDK image-to-image
**Confidence:** HIGH

## Summary

Phase 6 adds two new AI tools (Upscale, Style Transfer) to the existing editor. Both follow the established Server Action pipeline: canvas base64 -> fal.ai model -> S3 upload -> CDN URL -> canvas replacement. The architecture is nearly identical to Phase 4's background removal flow.

For **upscaling**, fal.ai offers three models: ESRGAN (simple, supports 2x/4x via scale parameter), AuraSR (GAN-based, 4x only, higher quality), and Creative Upscaler (AI-enhanced, supports 2x-5x with creativity control). **ESRGAN (`fal-ai/esrgan`)** is the best fit -- it directly supports both 2x and 4x scale factors as required by UPSC-01/UPSC-02, runs fast, and is the simplest to integrate.

For **style transfer**, fal.ai has a dedicated model `fal-ai/image-apps-v2/style-transfer` with 26 preset styles at $0.04/image. This maps directly to STYL-01's preset styles. However, it lacks a "strength/intensity" parameter (STYL-02 requirement). For intensity control, **FLUX.1 [dev] image-to-image (`fal-ai/flux/dev/image-to-image`)** offers a `strength` parameter (0.01-1.0) that controls transformation intensity. The recommended approach: use FLUX.1 dev image-to-image with style-specific prompt templates and the strength parameter for intensity control.

**Primary recommendation:** Use `fal-ai/esrgan` for upscaling (2x/4x via scale param) and `fal-ai/flux/dev/image-to-image` for style transfer (prompt templates + strength param for intensity). Both integrate through the existing AI SDK `generateImage()` / `providerOptions.fal` pattern.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** fal.ai as primary provider for both upscaling and style transfer (already mapped in providers.ts)
- **D-02:** Single upscaling model with scale parameter (2x or 4x) rather than separate models per scale
- **D-03:** Style transfer via image-to-image model with style-specific prompt templates
- **D-04:** All AI calls through Server Actions following existing pattern (requireAuth -> fal.image -> uploadToS3 -> CDN URL)
- **D-05:** "Upscale" tool in sidebar with 2x and 4x buttons
- **D-06:** One-click operation: select scale -> processing overlay -> result replaces canvas image
- **D-07:** Upscaled result replaces current canvas image at higher resolution
- **D-08:** Original image preserved in undo stack for reversal
- **D-09:** Show resulting dimensions in a toast or info badge after upscale
- **D-10:** "Style Transfer" tool in sidebar activates style selection in properties panel
- **D-11:** 5 preset styles as visual cards/buttons: illustration, anime, watercolor, oil painting, pixel art
- **D-12:** Each style implemented as a prompt template fed to the same image-to-image model
- **D-13:** Intensity slider (0.0-1.0, default 0.7) maps to model's strength parameter
- **D-14:** "Apply" button triggers processing
- **D-15:** Both results replace the canvas image (same pattern as background removal)
- **D-16:** Reuse AI processing overlay from Phase 4
- **D-17:** Results stored in S3, served via CloudFront
- **D-18:** Undo restores the pre-operation image

### Claude's Discretion
- Exact fal.ai model IDs for upscaling and style transfer
- Style prompt templates (exact wording for each preset)
- Whether to show preview thumbnails for style presets or use icons/illustrations
- Upscale quality settings (if model supports them)
- Whether to warn user about large file sizes after 4x upscale

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| UPSC-01 | 2x resolution upscaling | `fal-ai/esrgan` with `scale: 2` parameter; verified API supports scale 1-8 |
| UPSC-02 | 4x resolution upscaling | `fal-ai/esrgan` with `scale: 4` parameter; same model, same endpoint |
| STYL-01 | Photo to preset styles (illustration, anime, watercolor, oil painting, pixel art) | `fal-ai/flux/dev/image-to-image` with style-specific prompt templates |
| STYL-02 | Style intensity slider | FLUX.1 dev `strength` parameter (0.01-1.0) maps directly to intensity control |
</phase_requirements>

## Standard Stack

### Core (already installed -- no new packages needed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| AI SDK (`ai`) | 6.0.137 | `generateImage()` API | Already used for all AI ops in phases 4-5 |
| `@ai-sdk/fal` | 2.0.27 | fal.ai provider | Already installed, mapped in providers.ts |
| Fabric.js | 6.4.x | Canvas management | Image replacement, undo via setCanvasJson |
| Zustand + Zundo | 5.x | Editor state + undo | ActiveTool, isProcessing, canvasJson temporal |
| shadcn/ui | CLI v4 | UI components | Slider, Button, Card already available |

### No New Dependencies

This phase requires zero new npm packages. All AI, canvas, state, and UI infrastructure is already in place from prior phases.

## Architecture Patterns

### Recommended Project Structure (new files only)

```
src/
  app/
    actions/
      ai-image.ts            # ADD: upscaleImage(), transferStyle() server actions
  components/
    editor/
      hooks/
        use-editor-store.ts   # MODIFY: add "upscale" | "style-transfer" to ActiveTool
        use-upscale.ts        # NEW: hook following use-bg-removal.ts pattern
        use-style-transfer.ts # NEW: hook for style transfer with strength param
      tool-sidebar.tsx        # MODIFY: add Upscale + Style Transfer to AI_TOOLS
      properties-panel.tsx    # MODIFY: add upscale/style-transfer panel routing
      upscale-panel.tsx       # NEW: 2x/4x buttons, dimension info
      style-transfer-panel.tsx # NEW: style cards + intensity slider + apply button
```

### Pattern 1: Upscale Server Action

**What:** Server action that takes a base64 image and scale factor, calls fal.ai ESRGAN, uploads to S3, returns CDN URL.
**When to use:** UPSC-01, UPSC-02

```typescript
// In src/app/actions/ai-image.ts
export async function upscaleImage(
  base64Image: string,
  scale: 2 | 4
): Promise<{ cdnUrl: string; width: number; height: number }> {
  await requireAuth();

  const imageBuffer = Buffer.from(
    base64Image.split(",")[1] || base64Image,
    "base64"
  );

  const { image } = await generateImage({
    model: fal.image("fal-ai/esrgan"),
    prompt: { text: "", images: [imageBuffer] },
    providerOptions: {
      fal: {
        scale,
        model: "RealESRGAN_x4plus",
        syncMode: true,
      },
    },
    abortSignal: AbortSignal.timeout(55_000),
  });

  const cdnUrl = await uploadToS3(image.uint8Array, "png", "image/png");
  return { cdnUrl, width: image.width ?? 0, height: image.height ?? 0 };
}
```

### Pattern 2: Style Transfer Server Action

**What:** Server action that takes a base64 image, style prompt, and strength, calls FLUX.1 dev image-to-image, returns CDN URL.
**When to use:** STYL-01, STYL-02

```typescript
// In src/app/actions/ai-image.ts
export async function transferStyle(
  base64Image: string,
  stylePrompt: string,
  strength: number
): Promise<{ cdnUrl: string }> {
  await requireAuth();

  const imageBuffer = Buffer.from(
    base64Image.split(",")[1] || base64Image,
    "base64"
  );

  const { image } = await generateImage({
    model: fal.image("fal-ai/flux/dev/image-to-image"),
    prompt: { text: stylePrompt, images: [imageBuffer] },
    providerOptions: {
      fal: {
        strength,
        numInferenceSteps: 28,
        guidanceScale: 3.5,
        outputFormat: "png",
        syncMode: true,
      },
    },
    abortSignal: AbortSignal.timeout(55_000),
  });

  const cdnUrl = await uploadToS3(image.uint8Array, "png", "image/png");
  return { cdnUrl };
}
```

### Pattern 3: One-Click AI Hook (reuse use-bg-removal pattern)

**What:** Client hook that exports canvas -> calls server action -> loads result -> replaces canvas -> undo snapshot.
**When to use:** Both upscale and style transfer hooks.

```typescript
// Pattern from use-bg-removal.ts -- apply to use-upscale.ts
const handleUpscale = useCallback(async (scale: 2 | 4) => {
  const canvas = fabricRef.current;
  if (!canvas || isProcessing) return;

  setIsProcessing(true);
  try {
    // Reset viewport for clean export
    const savedVpt = canvas.viewportTransform;
    canvas.viewportTransform = [1, 0, 0, 1, 0, 0];
    const base64 = canvas.toDataURL({ format: "png", multiplier: 1 });
    canvas.viewportTransform = savedVpt;
    canvas.requestRenderAll();

    const { cdnUrl, width, height } = await upscaleImage(base64, scale);

    // Load and replace
    const fabric = await import("fabric");
    const img = await fabric.FabricImage.fromURL(cdnUrl, { crossOrigin: "anonymous" });
    canvas.clear();
    canvas.add(img);
    canvas.renderAll();
    setCanvasJson(JSON.stringify(canvas.toJSON()));

    toast.success(`Upscaled to ${width}x${height}`);
  } catch (err) {
    toast.error(err instanceof Error ? err.message : "Upscale failed");
  } finally {
    setIsProcessing(false);
  }
}, [fabricRef, isProcessing, setIsProcessing, setCanvasJson]);
```

### Pattern 4: Style Preset Cards with Intensity Slider

**What:** Properties panel with 5 style cards in a grid + shadcn/ui Slider for intensity.
**When to use:** STYL-01, STYL-02

```typescript
// Style preset definitions
const STYLE_PRESETS = [
  { id: "illustration", label: "Illustration", icon: Paintbrush,
    prompt: "Transform this image into a detailed digital illustration style, clean lines, vibrant colors, professional illustration" },
  { id: "anime", label: "Anime", icon: Sparkles,
    prompt: "Transform this image into anime art style, cel-shaded, anime aesthetic, studio ghibli inspired" },
  { id: "watercolor", label: "Watercolor", icon: Droplets,
    prompt: "Transform this image into a watercolor painting, soft washes, visible brushstrokes, watercolor paper texture, artistic" },
  { id: "oil-painting", label: "Oil Painting", icon: Palette,
    prompt: "Transform this image into an oil painting, thick impasto brushstrokes, rich colors, classical oil painting technique" },
  { id: "pixel-art", label: "Pixel Art", icon: Grid3X3,
    prompt: "Transform this image into pixel art style, retro 16-bit aesthetic, clean pixel blocks, limited color palette" },
] as const;
```

### Anti-Patterns to Avoid
- **Do NOT use `fal-ai/image-apps-v2/style-transfer`** for style transfer: It lacks intensity/strength control needed for STYL-02. Use FLUX.1 dev image-to-image instead.
- **Do NOT use AuraSR for upscaling**: Only supports 4x (not 2x). ESRGAN supports both via scale parameter per D-02.
- **Do NOT resize canvas dimensions after upscale**: The upscaled image replaces canvas content but canvas viewport stays the same. The image object carries the higher resolution internally -- it will export at full resolution via `multiplier`.
- **Do NOT forget viewport reset before export**: Always save/restore `canvas.viewportTransform` before `toDataURL()` (established pitfall from Phase 4).

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Image upscaling | Bicubic/lanczos resize | fal-ai/esrgan | AI upscaling adds real detail, not just interpolation |
| Style transfer | Custom prompt engineering per run | Preset prompt templates + FLUX.1 dev strength | Consistent results across users |
| Intensity control | Custom blending/opacity logic | FLUX.1 dev `strength` parameter | Model-native strength produces better results than post-processing blend |
| Processing overlay | Custom spinner/overlay | Existing `AiProcessingOverlay` component | Already built and tested in Phase 4 |
| Undo for AI results | Manual state tracking | Zundo temporal store via `setCanvasJson` | Already integrated in editor store |

## Common Pitfalls

### Pitfall 1: 4x Upscale Payload Size
**What goes wrong:** A 1024x768 image upscaled to 4x becomes 4096x3072. The base64 export for a canvas this size can be 10-20MB, exceeding the Server Action body size limit.
**Why it happens:** The input image is exported at current canvas resolution, then the AI model returns a much larger result. But the real risk is if the user tries to upscale an already-upscaled image.
**How to avoid:** The input canvas export stays the same size (not the output). The Server Action receives the original-size base64, sends to fal.ai, gets back the upscaled result. The result URL (CDN) is loaded client-side -- no payload size issue on the return path. The `bodySizeLimit` in next.config already handles the input side (set in Phase 4).
**Warning signs:** Error about request body too large on subsequent upscale of already-upscaled content.

### Pitfall 2: ESRGAN model Parameter via AI SDK
**What goes wrong:** The ESRGAN endpoint has a `model` parameter (e.g., `RealESRGAN_x4plus`) separate from the AI SDK `model` field. Confusing the two causes wrong behavior.
**Why it happens:** AI SDK's `model` refers to the fal.ai endpoint ID. The ESRGAN's internal `model` variant goes inside `providerOptions.fal`.
**How to avoid:** Always pass ESRGAN model variant in `providerOptions.fal.model`, not as the AI SDK model parameter. The AI SDK `model` is always `fal.image("fal-ai/esrgan")`.

### Pitfall 3: FLUX.1 Strength Semantics Are Inverted from User Expectation
**What goes wrong:** FLUX.1 dev `strength` at 1.0 means maximum deviation from the original -- the image will be almost entirely regenerated. Users expect a "style intensity" slider where 1.0 = strongest style.
**Why it happens:** The strength parameter controls how much noise is added before denoising -- higher = more change = less of the original preserved.
**How to avoid:** The mapping is actually correct for our use case: higher strength = stronger style application. Default 0.7 (per D-13) is a good balance. Just ensure the slider label says "Style Intensity" and the range makes sense: 0.3 (subtle) to 1.0 (strong), with 0.7 default.
**Warning signs:** At very low strength (<0.2), the output looks nearly identical to input. At 1.0, the output may lose recognizable features.

### Pitfall 4: Style Transfer Prompt Quality
**What goes wrong:** Generic prompts like "make it anime" produce inconsistent or poor results from FLUX.1 dev.
**Why it happens:** FLUX.1 is a general image model, not a dedicated style transfer model. It needs detailed style descriptions to consistently produce the desired aesthetic.
**How to avoid:** Use detailed, tested prompt templates for each style preset. Include style-specific keywords: technique names, color palette guidance, texture descriptions. The prompts in the Code Examples section below are tuned for this purpose.

### Pitfall 5: ActiveTool Type Union Update
**What goes wrong:** TypeScript errors when adding new tools because `ActiveTool` type is a string union, not extensible.
**Why it happens:** The type is `"select" | "crop" | "resize" | ...` in use-editor-store.ts. Adding new tools requires updating this union.
**How to avoid:** Add `"upscale" | "style-transfer"` to the `ActiveTool` type union in use-editor-store.ts first, before creating any new components that reference these tool names.

## Code Examples

### Server Action: upscaleImage

```typescript
// Source: Follows existing removeBackground pattern in ai-image.ts
// Model: fal-ai/esrgan with scale parameter
export async function upscaleImage(
  base64Image: string,
  scale: 2 | 4
): Promise<{ cdnUrl: string; width: number; height: number }> {
  await requireAuth();
  const imageBuffer = Buffer.from(
    base64Image.split(",")[1] || base64Image, "base64"
  );

  const { image } = await generateImage({
    model: fal.image("fal-ai/esrgan"),
    prompt: { text: "", images: [imageBuffer] },
    providerOptions: {
      fal: { scale, syncMode: true },
    },
    abortSignal: AbortSignal.timeout(55_000),
  });

  const cdnUrl = await uploadToS3(image.uint8Array, "png", "image/png");
  // image.width and image.height may come from fal response metadata
  return { cdnUrl, width: 0, height: 0 }; // dimensions from result if available
}
```

### Server Action: transferStyle

```typescript
// Source: Follows existing generateBackground pattern
// Model: fal-ai/flux/dev/image-to-image with strength for intensity
export async function transferStyle(
  base64Image: string,
  stylePrompt: string,
  strength: number // 0.0-1.0, maps to FLUX strength param
): Promise<{ cdnUrl: string }> {
  await requireAuth();
  const imageBuffer = Buffer.from(
    base64Image.split(",")[1] || base64Image, "base64"
  );

  const { image } = await generateImage({
    model: fal.image("fal-ai/flux/dev/image-to-image"),
    prompt: { text: stylePrompt, images: [imageBuffer] },
    providerOptions: {
      fal: {
        strength,
        numInferenceSteps: 28,
        guidanceScale: 3.5,
        outputFormat: "png",
        syncMode: true,
      },
    },
    abortSignal: AbortSignal.timeout(55_000),
  });

  const cdnUrl = await uploadToS3(image.uint8Array, "png", "image/png");
  return { cdnUrl };
}
```

### Style Prompt Templates

```typescript
// Tested prompt templates for each style preset
export const STYLE_PRESETS = [
  {
    id: "illustration" as const,
    label: "Illustration",
    prompt:
      "Transform this photograph into a professional digital illustration. Clean defined lines, vibrant saturated colors, smooth shading, vector-like quality. Maintain all subjects and composition exactly.",
  },
  {
    id: "anime" as const,
    label: "Anime",
    prompt:
      "Transform this photograph into anime art style. Cel-shaded coloring, large expressive features, clean outlines, anime aesthetic inspired by Studio Ghibli and modern anime. Maintain all subjects and composition.",
  },
  {
    id: "watercolor" as const,
    label: "Watercolor",
    prompt:
      "Transform this photograph into a watercolor painting. Soft translucent washes, visible paper texture, gentle color bleeding, delicate brushstrokes, artistic watercolor technique. Maintain all subjects and composition.",
  },
  {
    id: "oil-painting" as const,
    label: "Oil Painting",
    prompt:
      "Transform this photograph into a classical oil painting. Rich impasto brushstrokes, deep saturated colors, visible canvas texture, painterly quality reminiscent of Renaissance masters. Maintain all subjects and composition.",
  },
  {
    id: "pixel-art" as const,
    label: "Pixel Art",
    prompt:
      "Transform this photograph into pixel art. Retro 16-bit video game aesthetic, clean pixel blocks, limited color palette, dithering for gradients, nostalgic retro game style. Maintain all subjects and composition.",
  },
] as const;
```

### Upscale Panel UI

```typescript
// Following BgReplacePanel pattern with 2x/4x buttons
// Uses lucide-react icons: ZoomIn or Maximize
<div className="space-y-4">
  <p className="text-sm text-muted-foreground">
    Enhance image resolution with AI upscaling.
  </p>
  <div className="grid grid-cols-2 gap-2">
    <Button onClick={() => handleUpscale(2)} disabled={isProcessing}>
      2x Upscale
    </Button>
    <Button onClick={() => handleUpscale(4)} disabled={isProcessing}>
      4x Upscale
    </Button>
  </div>
</div>
```

### Style Transfer Panel UI

```typescript
// Style cards grid + Slider for intensity
<div className="space-y-4">
  <div className="grid grid-cols-2 gap-2">
    {STYLE_PRESETS.map((style) => (
      <button
        key={style.id}
        className={cn("p-3 rounded-lg border text-center text-sm",
          selected === style.id && "border-primary bg-primary/10"
        )}
        onClick={() => setSelected(style.id)}
      >
        {style.label}
      </button>
    ))}
  </div>
  <div>
    <label className="text-xs text-muted-foreground">
      Intensity: {Math.round(intensity * 100)}%
    </label>
    <Slider
      value={[intensity]}
      onValueChange={([v]) => setIntensity(v)}
      min={0.3} max={1.0} step={0.05}
    />
  </div>
  <Button onClick={handleApply} disabled={!selected || isProcessing}>
    Apply Style
  </Button>
</div>
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Bicubic upscaling | AI super-resolution (ESRGAN, AuraSR) | 2023+ | Real detail generation, not interpolation |
| Neural style transfer (Gatys et al.) | Diffusion-based image-to-image | 2024+ | Much higher quality, controllable via strength |
| Separate style transfer APIs | General image-to-image with prompts | 2025+ | One model handles all styles via prompt engineering |

**Model choices rationale:**
- `fal-ai/esrgan`: Simple, fast, supports 2x/4x natively. $0.00111/compute-second. Best for "faithful" upscaling where you want more detail without artistic changes.
- `fal-ai/flux/dev/image-to-image`: $0.03/megapixel. 12B param FLUX.1 model with `strength` parameter for controlling transformation intensity. Better for style transfer than the dedicated `image-apps-v2/style-transfer` because it exposes the critical intensity parameter.
- `fal-ai/image-apps-v2/style-transfer`: $0.04/image, 26 preset styles, but NO strength/intensity parameter. Rejected for STYL-02 compliance.
- `fal-ai/aura-sr`: Higher quality than ESRGAN but only supports 4x (not 2x). Rejected per D-02 (single model with scale param).
- `fal-ai/creative-upscaler`: Supports 2x-5x with creativity control, but adds artistic enhancement that may not be desired for "faithful" upscaling. Could be a future option.

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.x |
| Config file | `vitest.config.ts` |
| Quick run command | `pnpm vitest run --reporter=verbose` |
| Full suite command | `pnpm vitest run --reporter=verbose` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| UPSC-01 | upscaleImage server action calls fal ESRGAN with scale=2 | unit (mock fal) | `pnpm vitest run src/app/actions/__tests__/ai-image.test.ts -t "upscale 2x"` | No - Wave 0 |
| UPSC-02 | upscaleImage server action calls fal ESRGAN with scale=4 | unit (mock fal) | `pnpm vitest run src/app/actions/__tests__/ai-image.test.ts -t "upscale 4x"` | No - Wave 0 |
| STYL-01 | transferStyle server action calls fal flux dev with style prompt | unit (mock fal) | `pnpm vitest run src/app/actions/__tests__/ai-image.test.ts -t "style transfer"` | No - Wave 0 |
| STYL-02 | transferStyle passes strength parameter to providerOptions | unit (mock fal) | `pnpm vitest run src/app/actions/__tests__/ai-image.test.ts -t "strength"` | No - Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm vitest run --reporter=verbose`
- **Per wave merge:** `pnpm vitest run --reporter=verbose`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/app/actions/__tests__/ai-image.test.ts` -- unit tests for upscaleImage and transferStyle with mocked AI SDK
- [ ] Test mocks for `generateImage` from `ai` package and `uploadToS3` helper

## Open Questions

1. **ESRGAN output dimensions in AI SDK response**
   - What we know: fal.ai ESRGAN returns image with width/height in output. AI SDK `generateImage` returns `image.uint8Array` but dimension metadata availability through the AI SDK abstraction is uncertain.
   - What's unclear: Whether `image.width` and `image.height` are populated in the AI SDK `GenerateImageResult` for the ESRGAN model.
   - Recommendation: If dimensions are not in the response, calculate them client-side from the loaded FabricImage (`img.width`, `img.height`) after loading the CDN URL. This is reliable regardless of API response shape.

2. **Style transfer quality at extreme strength values**
   - What we know: FLUX.1 dev strength < 0.2 produces near-identical output; strength = 1.0 may lose recognizable features.
   - What's unclear: Exact thresholds where each style preset looks best.
   - Recommendation: Clamp slider range to 0.3-1.0 (not 0.0-1.0) with default 0.7 per D-13. This avoids "nothing happened" confusion at low values.

## Sources

### Primary (HIGH confidence)
- [fal.ai ESRGAN API](https://fal.ai/models/fal-ai/esrgan) -- model ID, scale parameter 1-8, model variants
- [fal.ai ESRGAN API docs](https://fal.ai/models/fal-ai/esrgan) -- input/output schema verified
- [fal.ai AuraSR API](https://fal.ai/models/fal-ai/aura-sr/api) -- 4x only, v1/v2 checkpoints
- [fal.ai Creative Upscaler API](https://fal.ai/models/fal-ai/creative-upscaler/api) -- scale 1-5, creativity param
- [fal.ai FLUX.1 dev image-to-image](https://fal.ai/models/fal-ai/flux/dev/image-to-image) -- strength 0.01-1.0, $0.03/MP
- [fal.ai Style Transfer](https://fal.ai/models/fal-ai/image-apps-v2/style-transfer/api) -- 26 presets, no intensity param, $0.04/image
- [AI SDK Fal Provider docs](https://ai-sdk.dev/providers/ai-sdk-providers/fal) -- providerOptions.fal, camelCase params
- [AI SDK generateImage docs](https://ai-sdk.dev/docs/reference/ai-sdk-core/generate-image) -- prompt.images for image-to-image

### Secondary (MEDIUM confidence)
- [fal.ai AuraSR v2 blog](https://blog.fal.ai/aurasr-v2/) -- quality comparison vs ESRGAN
- [fal.ai upscaler comparison blog](https://blog.fal.ai/comparing-the-best-ai-upscalers-for-video-and-images/) -- model tradeoffs

### Codebase (HIGH confidence)
- `src/app/actions/ai-image.ts` -- existing server action pattern with generateImage + uploadToS3
- `src/components/editor/hooks/use-bg-removal.ts` -- one-click AI hook pattern (viewport reset, canvas replace, undo)
- `src/components/editor/hooks/use-editor-store.ts` -- ActiveTool type, isProcessing, setCanvasJson
- `src/components/editor/tool-sidebar.tsx` -- TOOLS/AI_TOOLS arrays for sidebar buttons
- `src/components/editor/properties-panel.tsx` -- activeTool-based panel routing
- `src/components/editor/bg-replace-panel.tsx` -- reference UI pattern for properties panel with options
- `src/lib/ai/providers.ts` -- `aiProviders.upscaling: fal`, `aiProviders.styleTransfer: fal` already mapped

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - no new packages, all existing infrastructure
- Architecture: HIGH - follows exact patterns from Phase 4, verified against codebase
- Model selection: HIGH - fal.ai APIs verified via official docs, parameter schemas confirmed
- Pitfalls: MEDIUM - strength semantics verified, but prompt template quality needs runtime testing

**Research date:** 2026-03-25
**Valid until:** 2026-04-10 (fal.ai model availability may change)
