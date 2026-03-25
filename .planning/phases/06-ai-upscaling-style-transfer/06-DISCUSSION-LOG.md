# Phase 6: AI Upscaling & Style Transfer - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-25
**Phase:** 06-ai-upscaling-style-transfer
**Areas discussed:** Upscale UX flow, Style preset design, Style intensity control, Result canvas handling
**Mode:** --auto (all decisions auto-selected)

---

## Upscale UX Flow

| Option | Description | Selected |
|--------|-------------|----------|
| Replace canvas image at higher resolution | Upscaled result replaces current canvas, undo available | ✓ |
| Show side-by-side comparison | Before/after view before applying | |
| Download only (don't modify canvas) | Export upscaled version without changing editor state | |

**User's choice:** [auto] Replace canvas image at higher resolution
**Notes:** Consistent with background removal pattern (Phase 4). Undo stack preserves original.

---

## Upscale Model Strategy

| Option | Description | Selected |
|--------|-------------|----------|
| Single model with scale parameter | One model handles both 2x and 4x via parameter | ✓ |
| Separate models per scale | Dedicated 2x and 4x models for optimization | |

**User's choice:** [auto] Single model with scale parameter
**Notes:** Simpler implementation, research determines exact model.

---

## Style Preset Design

| Option | Description | Selected |
|--------|-------------|----------|
| Prompt templates with same image-to-image model | Each style as a curated prompt, one model | ✓ |
| Dedicated model per style | Specialized models for each artistic style | |
| LoRA/fine-tuned variants | Base model + style-specific LoRA weights | |

**User's choice:** [auto] Prompt templates with same image-to-image model
**Notes:** Most cost-effective and maintainable. Research determines model and prompt templates.

---

## Style Intensity Control

| Option | Description | Selected |
|--------|-------------|----------|
| 0.0–1.0 strength slider (default 0.7) | Maps to model strength parameter | ✓ |
| Preset levels (Low/Medium/High) | Discrete strength options | |
| No intensity control | Fixed strength per style | |

**User's choice:** [auto] 0.0–1.0 strength slider (default 0.7)
**Notes:** Matches STYL-02 requirement for slider control.

---

## Claude's Discretion

- Exact fal.ai model IDs (research phase)
- Style prompt templates
- Preview thumbnails vs icons for style presets
- Large file size warnings after 4x upscale

## Deferred Ideas

None
