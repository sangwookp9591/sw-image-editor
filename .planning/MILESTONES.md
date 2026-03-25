# Milestones

## v1.0 MVP (Shipped: 2026-03-25)

**Phases completed:** 7 phases, 26 plans, 46 tasks

**Key accomplishments:**

- Next.js 16 project with Drizzle ORM schema (6 tables), Neon HTTP driver, type-safe env validation, and Vitest test framework
- Better Auth with Drizzle adapter, email/password + Google OAuth, Next.js 16 proxy route protection, and login/signup pages
- AI SDK 6 provider abstraction with fal.ai primary and Replicate fallback, operation-to-provider mapping, and connectivity test endpoint
- Responsive sidebar dashboard layout with Vercel Blob presigned image upload, drag-and-drop dropzone, and dual-path DB record persistence
- Fabric.js canvas editor with Zustand/Zundo undo-redo, 3-panel layout, zoom/pan, and clipboard paste at /editor/[imageId]
- Crop tool with dark mask overlay, 6 aspect ratio presets, 6 SNS platform presets, and pixel-accurate cropping with undo support
- Resize tool with aspect-ratio-locked dimension inputs and export modal with PNG/JPG/WebP format selection, quality slider, and resolution multiplier
- Drizzle schema with canvasJson/thumbnailKey on projects, projectId FK on images, Server Actions for save/delete, query helpers, and thumbnail presigned upload endpoint
- Editor save flow with Ctrl+S shortcut, first-save naming dialog, toolbar status indicator, and S3 thumbnail upload
- Responsive project grid with thumbnail cards, relative dates via date-fns, and delete confirmation flow using Dialog
- Project editor route with full Fabric.js canvas restoration via loadFromJSON and undo history reset
- Three fal.ai server actions (bg removal, object removal, bg generation) with editor store AI state and processing overlay
- One-click background removal with color/gradient/AI replacement panel using useBgRemoval hook and BgReplacePanel component
- Brush-based object eraser with PencilBrush mask painting, B/W mask export via offscreen canvas, and fal.ai inpainting via removeObject server action
- Google Cloud Vision OCR wrapper with bounding box style extraction and Gemini translation server actions via @ai-sdk/google
- useTextReplace hook with OCR detect -> inpaint -> IText rendering pipeline and TextOverlayBoxes for visual region feedback
- TextReplacePanel with detect/replace/translate/refine workflow wired into editor sidebar, properties panel, and overlay system
- AI upscaling (2x/4x) via fal-ai/creative-upscaler and style transfer (5 presets with intensity slider) via fal-ai/flux/dev image-to-image
- 1. [Rule 3 - Blocking] Added upscaleImage server action and ActiveTool update
- Style transfer panel with 5 artistic presets (illustration, anime, watercolor, oil painting, pixel art) and intensity slider using fal.ai flux image-to-image
- 1. [Rule 1 - Bug] Fixed Stripe API version mismatch
- 1. [Rule 2 - Missing Functionality] Enhanced existing webhook from 07-01
- 1. [Rule 2 - Missing Critical] Added missing credit costs for upscaleImage and styleTransfer
- Dark mode toggle using next-themes with class strategy, Sun/Moon animated icons in dashboard header and editor toolbar

---
