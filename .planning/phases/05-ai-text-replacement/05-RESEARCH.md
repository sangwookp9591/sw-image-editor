# Phase 5: AI Text Replacement - Research

**Researched:** 2026-03-24
**Domain:** OCR text detection, AI inpainting, text rendering, translation
**Confidence:** MEDIUM (multi-step pipeline has proven patterns; end-to-end model approach is newer but promising)

## Summary

This phase implements the product's core differentiator: detecting text in images via OCR, replacing it with new text while preserving style, and supporting multi-language translation. The research covers three critical areas: (1) OCR provider selection for marketing images with CJK support, (2) the two-step inpaint-then-render pipeline vs end-to-end model alternatives, and (3) translation via Gemini through @ai-sdk/google.

**The key architectural tension is between the locked two-step pipeline (inpaint old text + render new via Fabric.js IText) and emerging end-to-end models (GPT-image-1.5, Gemini 2.5 Flash Image) that can do text replacement in a single pass.** The research recommends implementing the two-step pipeline as decided, but exposing an "AI Replace" mode using GPT-image-1.5 via fal.ai as a quality enhancement option -- this is within Claude's discretion for the pipeline details.

**Primary recommendation:** Use Google Cloud Vision REST API for OCR (best CJK support, $1.50/1000 images), fal.ai inpainting for text removal (already in codebase), Fabric.js IText for new text rendering with style extracted from OCR bounding boxes + pixel sampling, and @ai-sdk/google with Gemini for translation.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions
- D-01: OCR triggered by "Detect Text" button in tool sidebar
- D-02: Detected text regions highlighted as interactive overlay boxes on canvas
- D-03: Each detected region shows: original text, bounding box coordinates, confidence score
- D-04: User clicks a detected region to select it for replacement
- D-05: OCR provider: research determines best option
- D-06: Two-step pipeline: (1) Inpaint/remove old text from image, (2) Render new text on top
- D-07: Step 1 uses fal.ai inpainting (same model as object removal in Phase 4)
- D-08: Step 2 renders new text as Fabric.js Text object positioned at original location
- D-09: Result is composited: inpainted background + new text overlay -> flattened to single image
- D-10: Extract from OCR: font size, color, angle/rotation, bounding box dimensions
- D-11: New text rendered matching: approximate font size, detected color, rotation angle
- D-12: Perspective/distortion matching: best-effort via Fabric.js transform (skewX, skewY, angle)
- D-13: Font family: use closest system font or generic category (serif/sans-serif/monospace)
- D-14: After AI replacement, text appears as editable Fabric.js IText object
- D-15: User can adjust: position (drag), size (handles), color (color picker), font family, content
- D-16: "Apply" button flattens text onto image (commits the edit, undo-able)
- D-17: Properties panel shows refinement controls when text replacement tool is active
- D-18: "Translate" option alongside "Replace" for each detected text region
- D-19: User selects target language from dropdown (Korean, English, Japanese, Chinese, Spanish, French, German)
- D-20: Translation API: Gemini (via AI Gateway or @ai-sdk/google)
- D-21: Translated text goes through same replacement pipeline
- D-22: Reuse AI processing overlay from Phase 4
- D-23: OCR detection and text replacement go through Server Actions
- D-24: Results stored in S3, served via CloudFront

### Claude's Discretion
- Exact OCR model/provider selection (research determines)
- Font matching algorithm details
- OCR confidence threshold for showing/hiding low-confidence detections
- UX for selecting between multiple detected text regions
- Whether to show all detected regions at once or one-by-one

### Deferred Ideas (OUT OF SCOPE)
- Batch text replacement across multiple images -- v2 feature (ADV-01)

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| TEXT-01 | Auto-detect text regions in image (OCR) | Google Cloud Vision TEXT_DETECTION API provides bounding boxes, text content, language detection, confidence. Best CJK support among options researched. |
| TEXT-02 | Replace detected text with new text | Two-step pipeline: fal.ai inpainting to remove old text (reuse removeObject pattern), then Fabric.js IText overlay at original position |
| TEXT-03 | Preserve original font style, color, size, perspective | Bounding box height -> font size estimation; pixel sampling within bbox -> dominant color extraction; vertex angle calculation -> rotation; serif/sans-serif classification from OCR metadata |
| TEXT-04 | Manual fine-tuning controls (position, size, color) | Fabric.js IText object is natively interactive -- drag, resize handles, color property. Properties panel renders controls when text-replace tool active |
| TEXT-05 | Multi-language translation replacement | @ai-sdk/google with Gemini model for context-aware translation. User selected Gemini specifically for natural translations. |

</phase_requirements>

## Standard Stack

### Core (New Dependencies)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @ai-sdk/google | ^3.0.43 | Gemini translation via AI SDK | User decision D-20. Provides `generateText()` with Gemini models for context-aware translation. Integrates with existing AI SDK 6.x setup. |

### Existing (No New Install)

| Library | Version | Purpose | Already In |
|---------|---------|---------|------------|
| ai | ^6.0.137 | AI SDK core (generateText, generateImage) | package.json |
| @ai-sdk/fal | ^2.0.27 | fal.ai inpainting provider | package.json |
| fabric | ^6.9.1 | Canvas + IText rendering | package.json |
| zustand + zundo | ^5.0.12 / ^2.3.0 | Editor state + undo | package.json |

### External APIs (No npm package)

| API | Access Method | Purpose | Why |
|-----|--------------|---------|-----|
| Google Cloud Vision | REST API via fetch | OCR text detection | Direct REST call avoids heavy @google-cloud/vision SDK (118 transitive deps). Simple POST to `vision.googleapis.com/v1/images:annotate?key=API_KEY`. |
| fal.ai inpainting | via @ai-sdk/fal | Remove old text from image | Already used for object removal (Phase 4). Same model: `fal-ai/object-removal` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Google Cloud Vision | Tesseract.js (client-side) | Free, no API key, but significantly worse accuracy on decorative fonts, CJK, and complex backgrounds. Not suitable for marketing images. |
| Google Cloud Vision | fal.ai OCR | fal.ai does not have a dedicated OCR model as of March 2026. |
| Google Cloud Vision REST | @google-cloud/vision npm | Heavy SDK with 118+ transitive deps. REST API with fetch is simpler for a single endpoint (images:annotate). |
| Two-step pipeline | GPT-image-1.5 end-to-end | GPT-image-1.5 via fal.ai can do text replacement in one shot with a prompt like "Replace text X with Y". Higher quality for some cases but less control over font matching, costs $0.04-0.12/image, and user loses manual refinement step. Could be offered as "AI Replace" premium option alongside the pipeline. |
| Two-step pipeline | Gemini 2.5 Flash Image | Similar end-to-end capability at $0.039/image. Good text rendering but CJK quality uncertain. |
| Gemini translation | DeepL API | DeepL is excellent for translation quality but user specifically chose Gemini for "natural translations" and it integrates with existing AI SDK. |

**Installation:**
```bash
pnpm add @ai-sdk/google
```

## Architecture Patterns

### Recommended Project Structure
```
src/
  app/
    actions/
      ai-image.ts          # Add: detectText(), translateText() server actions
  components/
    editor/
      hooks/
        use-editor-store.ts  # Extend: ActiveTool += "text-replace"
        use-text-replace.ts  # NEW: OCR detection, replacement pipeline, state
      tool-sidebar.tsx       # Extend: add text-replace tool button
      properties-panel.tsx   # Extend: TextReplacePanel when active
      text-replace-panel.tsx # NEW: OCR results list, replace/translate controls
      text-overlay-boxes.tsx # NEW: Canvas overlay for detected text regions
  lib/
    ai/
      providers.ts           # Add: google provider for translation
      ocr.ts                 # NEW: Google Cloud Vision REST API wrapper
      text-style.ts          # NEW: Font size, color, angle extraction from OCR data
```

### Pattern 1: OCR Server Action (detectText)

**What:** Server Action that sends image to Google Cloud Vision REST API, returns structured text regions.
**When to use:** When user clicks "Detect Text" button.
**Example:**
```typescript
// src/app/actions/ai-image.ts
export async function detectText(base64Image: string): Promise<{
  regions: TextRegion[];
}> {
  await requireAuth();

  const imageContent = base64Image.includes(",")
    ? base64Image.split(",")[1]
    : base64Image;

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${process.env.GOOGLE_CLOUD_VISION_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [{
          image: { content: imageContent },
          features: [{ type: "TEXT_DETECTION" }],
          imageContext: {
            languageHints: ["ko", "en", "ja", "zh"]
          }
        }]
      }),
    }
  );

  const data = await response.json();
  // Parse textAnnotations into TextRegion[]
  // First annotation is full text, rest are individual words/phrases
  return { regions: parseTextAnnotations(data.responses[0].textAnnotations) };
}
```

### Pattern 2: Style Extraction from OCR Bounding Box

**What:** Estimate font size, color, and rotation from OCR bounding box vertices + original image pixels.
**When to use:** After OCR returns regions, before rendering replacement text.
**Example:**
```typescript
// src/lib/ai/text-style.ts
interface TextStyle {
  fontSize: number;       // estimated from bbox height
  color: string;          // hex color from pixel sampling
  angle: number;          // rotation in degrees from vertex positions
  fontCategory: "serif" | "sans-serif" | "monospace";
  width: number;          // bbox width for text fitting
  height: number;         // bbox height
}

function extractTextStyle(
  vertices: { x: number; y: number }[],
  imageData: ImageData  // from canvas getImageData within bbox
): TextStyle {
  // Font size: bbox height in pixels (approximate)
  const height = Math.sqrt(
    (vertices[3].x - vertices[0].x) ** 2 +
    (vertices[3].y - vertices[0].y) ** 2
  );
  const fontSize = Math.round(height * 0.75); // px to approximate pt

  // Rotation: angle of top edge
  const angle = Math.atan2(
    vertices[1].y - vertices[0].y,
    vertices[1].x - vertices[0].x
  ) * (180 / Math.PI);

  // Color: sample pixels within bbox, find dominant foreground color
  const color = extractDominantColor(imageData);

  return { fontSize, color, angle, fontCategory: "sans-serif", width, height };
}
```

### Pattern 3: Two-Step Replacement Pipeline

**What:** Inpaint old text region, then render new text as Fabric.js IText.
**When to use:** When user confirms text replacement.
**Example:**
```typescript
// In use-text-replace.ts hook
async function replaceText(region: TextRegion, newText: string) {
  const canvas = fabricRef.current;
  if (!canvas) return;

  setIsProcessing(true);

  // Step 1: Create mask from text bounding box (white rect on black bg)
  const maskBase64 = createMaskFromBbox(region.boundingBox, canvas);

  // Step 2: Inpaint (remove old text) -- reuse existing removeObject action
  const base64Image = canvas.toDataURL({ format: "png" });
  const { cdnUrl } = await removeObject(base64Image, maskBase64);

  // Step 3: Load inpainted result onto canvas
  const fabric = await import("fabric");
  const resultImg = await fabric.FabricImage.fromURL(cdnUrl);
  canvas.clear();
  canvas.setDimensions({ width: resultImg.width!, height: resultImg.height! });
  canvas.add(resultImg);

  // Step 4: Add new text as editable IText at original position
  const style = region.extractedStyle;
  const itext = new fabric.IText(newText, {
    left: region.boundingBox.x,
    top: region.boundingBox.y,
    fontSize: style.fontSize,
    fill: style.color,
    angle: style.angle,
    fontFamily: style.fontCategory === "serif" ? "Georgia" : "Arial",
    editable: true,
  });
  canvas.add(itext);
  canvas.setActiveObject(itext);
  canvas.renderAll();

  setIsProcessing(false);
}
```

### Pattern 4: Translation via Gemini

**What:** Context-aware translation using AI SDK generateText with Gemini.
**When to use:** When user selects "Translate" for a detected text region.
**Example:**
```typescript
// src/app/actions/ai-image.ts
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function translateText(
  text: string,
  sourceLang: string,
  targetLang: string,
  context?: string  // surrounding text for context
): Promise<{ translatedText: string }> {
  await requireAuth();

  const { text: result } = await generateText({
    model: google("gemini-2.5-flash"),
    system: `You are a professional translator specializing in marketing and advertising copy.
Translate the given text naturally, preserving tone and intent.
Keep the translation concise to fit similar visual space as the original.
Return ONLY the translated text, nothing else.`,
    prompt: `Translate from ${sourceLang} to ${targetLang}:\n"${text}"${
      context ? `\n\nContext (surrounding text in the image): ${context}` : ""
    }`,
  });

  return { translatedText: result.trim() };
}
```

### Anti-Patterns to Avoid

- **Chaining OCR + inpaint + render in a single Server Action:** The three steps should be separate calls. OCR is fast (~1s), inpainting is slow (~10-30s). Chaining risks timeout. Keep them as separate user-triggered steps.
- **Installing @google-cloud/vision npm package:** 118+ transitive dependencies for a single REST endpoint. Use native fetch instead.
- **Trusting OCR font size directly:** OCR returns bounding box pixels, not CSS/pt font sizes. Must convert using bbox height * ~0.75 ratio, then validate against the actual rendered text width.
- **Hardcoding font families:** Marketing images use custom fonts. Best effort is categorizing as serif/sans-serif/monospace. Do not try to identify exact font names.
- **Skipping language hints in OCR:** Without hints, Google Vision struggles with mixed Korean/English text. Always pass `languageHints: ["ko", "en", "ja", "zh"]`.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| OCR text detection | Custom ML model or Tesseract.js | Google Cloud Vision REST API | Marketing images have decorative fonts, gradients, complex backgrounds. Cloud Vision handles these; Tesseract.js does not. |
| Text inpainting | Custom diffusion model | fal.ai `fal-ai/object-removal` | Already proven in Phase 4. The masked region approach works for text boxes. |
| Translation | Custom translation logic | Gemini via @ai-sdk/google `generateText()` | Context-aware translation with marketing tone preservation. User decision. |
| Color extraction from image region | Complex color clustering | Canvas `getImageData()` + simple dominant color | Sample pixels within OCR bbox, find most frequent non-background color. Simple histogram approach works for text colors. |
| Interactive text editing | Custom text input on canvas | Fabric.js IText | Built-in double-click editing, resize handles, rotation, font properties. Exact use case IText was designed for. |

## Common Pitfalls

### Pitfall 1: OCR Bounding Box Coordinate Mismatch with Canvas
**What goes wrong:** Google Vision returns bounding box coordinates relative to the original image dimensions. The canvas may display the image at a different scale (fitted to viewport). Text overlays appear offset.
**Why it happens:** Canvas dimensions != image dimensions. The image is scaled to fit the editor viewport.
**How to avoid:** Store the original image dimensions alongside OCR results. When rendering overlay boxes, scale bbox coordinates by (canvas display width / original image width). Apply the same scaling when positioning the replacement IText.
**Warning signs:** Overlay boxes appear in wrong positions, especially on large images.

### Pitfall 2: Inpainting Bleeds Beyond Text Region
**What goes wrong:** The mask for text removal is too tight or too loose. Too tight: remnants of old text remain. Too loose: surrounding design elements get removed.
**How to avoid:** Expand the OCR bounding box by ~10-15% padding when creating the inpainting mask. This gives the inpainting model enough context to cleanly remove text without affecting nearby elements.
**Warning signs:** "Ghost" text artifacts after inpainting, or missing design elements adjacent to text.

### Pitfall 3: Font Size Mismatch After Replacement
**What goes wrong:** The replacement text is visibly larger or smaller than the original, breaking the design.
**Why it happens:** Font size estimation from bbox height is approximate. Different fonts have different x-heights for the same point size. Replacement text may have different character count.
**How to avoid:** After placing IText, calculate the ratio of (new text rendered width / original bbox width). If >1.1 or <0.7, auto-adjust fontSize proportionally. Allow manual refinement.
**Warning signs:** Text overflows its original region or looks comically small.

### Pitfall 4: CJK Text Detection Returning Fragmented Results
**What goes wrong:** Korean/Japanese/Chinese text comes back as individual characters instead of words or phrases, making replacement impractical.
**Why it happens:** CJK languages don't use spaces between words. OCR may split at character level.
**How to avoid:** Use `DOCUMENT_TEXT_DETECTION` feature type instead of `TEXT_DETECTION` for CJK-heavy images. This returns paragraph/block-level groupings. Also provide `languageHints`. Post-process: merge annotations that share the same vertical band into logical text groups.
**Warning signs:** Each Korean character appears as a separate detected region.

### Pitfall 5: Translation Length Mismatch
**What goes wrong:** Translated text (especially English -> Korean/Japanese) is significantly longer/shorter than original, breaking the visual layout.
**Why it happens:** Different languages have different character densities. Korean is typically more compact than English for the same meaning.
**How to avoid:** In the translation prompt, instruct Gemini to "keep translation concise to fit similar visual space." After translation, auto-scale fontSize if the rendered width exceeds original bbox width by >15%.
**Warning signs:** Translated text overflows the original text region.

### Pitfall 6: Base64 Image Size Exceeding Server Action Limit
**What goes wrong:** High-resolution marketing images (4000+ px) encoded as base64 exceed the 4.5MB default body size limit.
**Why it happens:** Phase 4 already addressed this with `experimental.serverActions.bodySizeLimit` in next.config, but OCR requires sending the full image.
**How to avoid:** Verify that the existing `bodySizeLimit` setting from Phase 4 is sufficient. For very large images, consider sending a resized version (max 2048px longest side) for OCR detection -- Vision API doesn't need full resolution for text detection. Keep full resolution only for inpainting.
**Warning signs:** 413 errors when detecting text on large images.

## Code Examples

### Google Cloud Vision TEXT_DETECTION Response Structure
```typescript
// Source: https://cloud.google.com/vision/docs/ocr
interface VisionAnnotation {
  description: string;   // detected text
  locale?: string;       // language code (first annotation only)
  boundingPoly: {
    vertices: Array<{
      x?: number;  // 0 is omitted!
      y?: number;  // 0 is omitted!
    }>;
  };
}

// Response shape:
// responses[0].textAnnotations[0] = full text (all detected text concatenated)
// responses[0].textAnnotations[1..n] = individual word/phrase annotations with bounding boxes

// IMPORTANT: vertices with value 0 are OMITTED from the JSON.
// Always default missing x/y to 0:
function normalizeVertex(v: { x?: number; y?: number }) {
  return { x: v.x ?? 0, y: v.y ?? 0 };
}
```

### Dominant Color Extraction from Bounding Box
```typescript
// Client-side: sample pixels within OCR bounding box region
function extractDominantColor(
  canvas: HTMLCanvasElement,
  bbox: { x: number; y: number; width: number; height: number }
): string {
  const ctx = canvas.getContext("2d")!;
  const imageData = ctx.getImageData(bbox.x, bbox.y, bbox.width, bbox.height);
  const pixels = imageData.data;

  // Simple histogram: count colors, skip near-white/near-black (likely background)
  const colorCounts = new Map<string, number>();
  for (let i = 0; i < pixels.length; i += 4) {
    const r = pixels[i], g = pixels[i + 1], b = pixels[i + 2];
    // Skip near-white (background) and near-black (possible artifact)
    const brightness = (r + g + b) / 3;
    if (brightness > 240 || brightness < 15) continue;
    // Quantize to reduce color space
    const qr = Math.round(r / 32) * 32;
    const qg = Math.round(g / 32) * 32;
    const qb = Math.round(b / 32) * 32;
    const key = `${qr},${qg},${qb}`;
    colorCounts.set(key, (colorCounts.get(key) ?? 0) + 1);
  }

  // Find most frequent color
  let maxCount = 0, dominantColor = "0,0,0";
  for (const [color, count] of colorCounts) {
    if (count > maxCount) { maxCount = count; dominantColor = color; }
  }

  const [r, g, b] = dominantColor.split(",").map(Number);
  return `#${r.toString(16).padStart(2, "0")}${g.toString(16).padStart(2, "0")}${b.toString(16).padStart(2, "0")}`;
}
```

### Mask Generation from Bounding Box
```typescript
// Create B/W mask image for inpainting from OCR bounding box
function createMaskFromBbox(
  vertices: Array<{ x: number; y: number }>,
  imageWidth: number,
  imageHeight: number,
  padding: number = 0.1  // 10% expansion
): string {
  const offscreen = document.createElement("canvas");
  offscreen.width = imageWidth;
  offscreen.height = imageHeight;
  const ctx = offscreen.getContext("2d")!;

  // Black background (keep area)
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, imageWidth, imageHeight);

  // Calculate padded bbox
  const xs = vertices.map(v => v.x);
  const ys = vertices.map(v => v.y);
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minY = Math.min(...ys), maxY = Math.max(...ys);
  const padX = (maxX - minX) * padding;
  const padY = (maxY - minY) * padding;

  // White region (replace area) with padding
  ctx.fillStyle = "white";
  ctx.fillRect(
    Math.max(0, minX - padX),
    Math.max(0, minY - padY),
    (maxX - minX) + padX * 2,
    (maxY - minY) + padY * 2
  );

  return offscreen.toDataURL("image/png");
}
```

### Fabric.js IText Creation with Extracted Style
```typescript
// Source: https://fabricjs.com/api/classes/itext/
import { IText } from "fabric";

function createStyledIText(
  text: string,
  style: TextStyle,
  position: { x: number; y: number }
): IText {
  return new IText(text, {
    left: position.x,
    top: position.y,
    fontSize: style.fontSize,
    fill: style.color,
    angle: style.angle,
    fontFamily: style.fontCategory === "serif"
      ? "Georgia, 'Times New Roman', serif"
      : style.fontCategory === "monospace"
        ? "'Courier New', monospace"
        : "Arial, Helvetica, sans-serif",
    editable: true,
    originX: "left",
    originY: "top",
    // For perspective approximation
    skewX: style.skewX ?? 0,
    skewY: style.skewY ?? 0,
  });
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Tesseract.js for all OCR | Cloud Vision / VLM-based OCR | 2024-2025 | Client-side OCR is now only for simple cases. Cloud APIs dominate for quality. |
| Multi-step pipeline only | End-to-end models (GPT-image-1.5, Gemini Flash Image) | Late 2025 | Can do text replacement in a single prompt. Less control but higher quality for simple replacements. |
| DALL-E 2 inpainting | GPT-image-1.5 / Flux Pro Fill | 2025-2026 | Mask-based inpainting is now prompt-guided. The mask is "guidance" not exact shape. |
| DeepL/Google Translate for translation | LLM-based translation (Gemini, GPT) | 2024-2025 | Context-aware, tone-preserving translation. Better for marketing copy than rule-based systems. |

**Deprecated/outdated:**
- Tesseract.js for marketing/design images: accuracy too low for production use on decorative fonts and complex backgrounds
- DALL-E 2: superseded by GPT-image-1.5 for all editing tasks

## Open Questions

1. **DOCUMENT_TEXT_DETECTION vs TEXT_DETECTION for mixed Korean/English**
   - What we know: TEXT_DETECTION works for natural scene text; DOCUMENT_TEXT_DETECTION provides paragraph-level structure
   - What's unclear: Which gives better results for marketing banners with mixed Korean + English text regions
   - Recommendation: Default to TEXT_DETECTION, but try DOCUMENT_TEXT_DETECTION if results are fragmented. Could expose as a toggle or auto-detect based on language.

2. **GPT-image-1.5 end-to-end quality for Korean text rendering**
   - What we know: GPT-image-1.5 has strong text rendering for English and CJK on fal.ai. Costs $0.04-0.12/image.
   - What's unclear: Quality of Korean text rendering specifically in marketing image context
   - Recommendation: Implement the two-step pipeline first (locked decision), then optionally add "AI Replace" using GPT-image-1.5 as a premium option if quality testing shows benefit.

3. **OCR confidence threshold**
   - What we know: Vision API returns confidence per annotation
   - What's unclear: Optimal threshold for marketing images (decorative text often has lower confidence)
   - Recommendation: Start with 0.5 confidence threshold, show all regions but visually dim low-confidence ones. Let user click to include/exclude.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Google Cloud Vision API key | OCR (TEXT-01) | Needs env var | - | Must configure GOOGLE_CLOUD_VISION_API_KEY |
| @ai-sdk/google | Translation (TEXT-05) | Not installed | - | Must `pnpm add @ai-sdk/google` |
| GOOGLE_GENERATIVE_AI_API_KEY | Gemini translation | Needs env var | - | Must configure |
| fal.ai API | Inpainting (TEXT-02) | Available | via @ai-sdk/fal | Already configured |
| Fabric.js | Text rendering (TEXT-03, TEXT-04) | Available | 6.9.1 | Already installed |

**Missing dependencies with no fallback:**
- GOOGLE_CLOUD_VISION_API_KEY env var (required for OCR)
- GOOGLE_GENERATIVE_AI_API_KEY env var (required for Gemini translation)
- @ai-sdk/google package (must install)

**Missing dependencies with fallback:**
- None -- all core dependencies are either available or must be added

## Validation Architecture

### Test Framework
| Property | Value |
|----------|-------|
| Framework | Vitest 4.1.1 |
| Config file | vitest.config.ts |
| Quick run command | `pnpm test` |
| Full suite command | `pnpm test` |

### Phase Requirements -> Test Map
| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| TEXT-01 | OCR detects text regions with bounding boxes | unit | `pnpm vitest run src/lib/ai/ocr.test.ts -x` | Wave 0 |
| TEXT-02 | Replace text via inpaint + render pipeline | integration | Manual (requires AI API) | Manual-only |
| TEXT-03 | Style extraction (font size, color, angle) | unit | `pnpm vitest run src/lib/ai/text-style.test.ts -x` | Wave 0 |
| TEXT-04 | IText creation with extracted style | unit | `pnpm vitest run src/lib/ai/text-style.test.ts -x` | Wave 0 |
| TEXT-05 | Translation via Gemini returns text | unit | `pnpm vitest run src/app/actions/ai-image.test.ts -x` | Wave 0 |

### Sampling Rate
- **Per task commit:** `pnpm test`
- **Per wave merge:** `pnpm test`
- **Phase gate:** Full suite green before `/gsd:verify-work`

### Wave 0 Gaps
- [ ] `src/lib/ai/ocr.test.ts` -- covers TEXT-01: Vision API response parsing, vertex normalization, region grouping
- [ ] `src/lib/ai/text-style.test.ts` -- covers TEXT-03/04: font size estimation, color extraction, angle calculation, IText property generation
- [ ] `src/app/actions/ai-image.test.ts` -- covers TEXT-05: translateText action (mock Gemini response)

## Sources

### Primary (HIGH confidence)
- [Google Cloud Vision API Pricing](https://cloud.google.com/vision/pricing) -- $1.50/1000 units, free tier 1000/month
- [Google Cloud Vision OCR Docs](https://docs.cloud.google.com/vision/docs/ocr) -- TEXT_DETECTION response format, bounding boxes
- [Google Cloud Vision REST API](https://cloud.google.com/vision/docs/reference/rest/v1/images/annotate) -- images:annotate endpoint
- [Google Cloud Vision Language Support](https://docs.cloud.google.com/vision/docs/languages) -- Korean, Japanese, Chinese supported
- [fal.ai GPT-Image 1.5 Edit API](https://fal.ai/models/fal-ai/gpt-image-1.5/edit/api) -- end-to-end editing endpoint
- [Fabric.js IText API](https://fabricjs.com/api/classes/itext/) -- IText constructor properties
- [AI SDK Google Provider](https://ai-sdk.dev/providers/ai-sdk-providers/google-generative-ai) -- @ai-sdk/google usage

### Secondary (MEDIUM confidence)
- [GPT-Image 1.5 on Replicate](https://replicate.com/openai/gpt-image-1.5) -- model capabilities and pricing
- [Gemini 2.5 Flash Image Blog](https://developers.googleblog.com/introducing-gemini-2-5-flash-image/) -- image generation and editing capabilities
- [OpenAI Image Generation Pricing 2026](https://www.aifreeapi.com/en/posts/openai-image-generation-api-pricing) -- $0.04-0.12 per image
- [Google Gemini Image Generation Docs](https://ai.google.dev/gemini-api/docs/image-generation) -- Nano Banana model capabilities

### Tertiary (LOW confidence)
- Font size estimation from bbox height (0.75 ratio) -- derived from general typography knowledge, needs empirical validation
- CJK text fragmentation behavior -- based on general OCR patterns, specific Vision API behavior may vary
- Gemini 2.5 Flash Korean text rendering quality -- no specific benchmarks found

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- Google Cloud Vision is well-documented, @ai-sdk/google is standard, fal.ai already proven
- Architecture: MEDIUM -- Two-step pipeline pattern is sound but style extraction (font size/color from pixels) needs empirical tuning
- Pitfalls: HIGH -- Well-known issues in OCR + inpainting domain, confirmed by multiple sources
- Translation: MEDIUM -- Gemini translation works but quality for marketing-specific Korean copy needs testing

**Research date:** 2026-03-24
**Valid until:** 2026-04-24 (30 days -- stable domain, but GPT-image-1.5 capabilities evolving)
