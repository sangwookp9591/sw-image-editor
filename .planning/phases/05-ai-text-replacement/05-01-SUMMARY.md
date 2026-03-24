---
phase: 05-ai-text-replacement
plan: 01
subsystem: ai
tags: [ocr, google-cloud-vision, gemini, ai-sdk, translation, text-detection]

requires:
  - phase: 04-ai-image-editing
    provides: "Server action patterns (requireAuth, uploadToS3), fal.ai provider setup"
provides:
  - "Google Cloud Vision OCR wrapper (callVisionOCR, parseTextAnnotations, TextRegion type)"
  - "Text style extraction utilities (extractTextStyle, extractDominantColor, createMaskFromBbox)"
  - "detectText server action for OCR text detection"
  - "translateText server action for Gemini-powered translation"
  - "Google AI provider export for @ai-sdk/google"
affects: [05-02-text-replacement-pipeline, 05-03-text-replace-ui]

tech-stack:
  added: ["@ai-sdk/google"]
  patterns: ["Google Cloud Vision REST API (no SDK)", "AI SDK generateText for translation", "Histogram-based dominant color extraction"]

key-files:
  created:
    - src/lib/ai/ocr.ts
    - src/lib/ai/text-style.ts
  modified:
    - src/lib/ai/providers.ts
    - src/app/actions/ai-image.ts

key-decisions:
  - "Used Google Cloud Vision REST API via fetch instead of @google-cloud/vision SDK (118+ transitive deps avoided)"
  - "Used Gemini 2.5 Flash for translation via @ai-sdk/google generateText"
  - "Set TEXT_DETECTION confidence default to 1.0 since per-word confidence not returned by TEXT_DETECTION feature"

patterns-established:
  - "Cloud Vision REST: direct fetch to vision.googleapis.com with API key, no SDK"
  - "Style extraction: bbox vertex distance for fontSize, atan2 for angle, histogram for dominant color"
  - "Mask generation: offscreen canvas with black bg + white padded rect from bbox vertices"

requirements-completed: [TEXT-01, TEXT-03, TEXT-05]

duration: 2min
completed: 2026-03-24
---

# Phase 5 Plan 1: OCR + Style Extraction + Translation Backend Summary

**Google Cloud Vision OCR wrapper with bounding box style extraction and Gemini translation server actions via @ai-sdk/google**

## Performance

- **Duration:** 2 min
- **Started:** 2026-03-24T10:33:15Z
- **Completed:** 2026-03-24T10:35:38Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments
- OCR wrapper parses Google Cloud Vision TEXT_DETECTION responses into typed TextRegion[] with normalized vertices and bounding boxes
- Style extraction computes fontSize, color, angle from bounding box geometry with histogram-based dominant color sampling
- Mask generation creates B/W PNG from bounding box with configurable padding for inpainting
- detectText and translateText server actions follow existing auth + error handling patterns

## Task Commits

Each task was committed atomically:

1. **Task 1: Install @ai-sdk/google and create OCR + style extraction libraries** - `17a5da1` (feat)
2. **Task 2: Add detectText and translateText server actions** - `9a1e1c9` (feat)

## Files Created/Modified
- `src/lib/ai/ocr.ts` - Google Cloud Vision REST API wrapper, TextRegion/VisionAnnotation types, response parsing
- `src/lib/ai/text-style.ts` - TextStyle type, extractTextStyle, extractDominantColor, createMaskFromBbox
- `src/lib/ai/providers.ts` - Added google provider export from @ai-sdk/google
- `src/app/actions/ai-image.ts` - Added detectText and translateText server actions

## Decisions Made
- Used Google Cloud Vision REST API via fetch instead of @google-cloud/vision SDK to avoid 118+ transitive dependencies
- Used Gemini 2.5 Flash model for translation (user decision D-20)
- Set default confidence to 1.0 for TEXT_DETECTION since per-word confidence is not returned by this feature type
- Language hints set to ["ko", "en", "ja", "zh"] for mixed CJK/English marketing images

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered
None

## User Setup Required

External services require manual configuration:
- `GOOGLE_CLOUD_VISION_API_KEY` - Google Cloud Console -> APIs & Services -> Credentials -> Create API Key, then enable Cloud Vision API
- `GOOGLE_GENERATIVE_AI_API_KEY` - Google AI Studio (aistudio.google.com) -> Get API Key

## Known Stubs

None - all functions are fully implemented with real API integrations.

## Next Phase Readiness
- OCR detection and translation backend ready for Plan 02 (replacement pipeline)
- TextRegion type and style extraction utilities ready for Plan 03 (UI controls)
- createMaskFromBbox ready for inpainting step in replacement pipeline

---
## Self-Check: PASSED

All files exist, all commits verified.

---
*Phase: 05-ai-text-replacement*
*Completed: 2026-03-24*
